using System.Text.Json;
using CommonFields.API.Models;
using CommonFields.API.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace CommonFields.API.Data;

public class AuditInterceptor(
    ICurrentUserService currentUserService,
    AuditConfigCache auditConfigCache) : SaveChangesInterceptor
{
    private static readonly JsonSerializerOptions _json = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    // Re-entrancy guard: prevent audit SaveChanges from triggering another audit pass
    private bool _isSaving;

    public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        if (_isSaving || eventData.Context is null)
            return await base.SavingChangesAsync(eventData, result, cancellationToken);

        var context = eventData.Context;
        var user    = currentUserService.GetCurrentUser();
        var now     = DateTime.UtcNow;

        var auditEntries  = new List<AuditLog>();
        var pendingAdded  = new List<(object Entity, AuditLog Log)>();

        // ── Step 1: Stamp CreatedBy/ModifiedBy on auditable entities ─────────────
        foreach (var entry in context.ChangeTracker.Entries<IAuditableEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedBy = user;
                entry.Entity.CreatedAt = now;
            }

            if (entry.State is EntityState.Added or EntityState.Modified)
            {
                entry.Entity.ModifiedBy = user;
                entry.Entity.ModifiedAt = now;
            }
        }

        // ── Step 2: Capture audit logs for ALL entities (when fields are enabled) ─
        foreach (var entry in context.ChangeTracker.Entries()
            .Where(e => e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted))
        {
            var clrType = entry.Entity.GetType();
            if (clrType == typeof(AuditLog) || clrType == typeof(AuditFieldConfig)) continue;

            var tableName    = entry.Metadata.GetTableName() ?? clrType.Name;
            var enabledFields = await auditConfigCache.GetEnabledFieldsAsync(tableName);
            if (enabledFields.Count == 0) continue;

            var recordId = entry.Properties
                .FirstOrDefault(p => p.Metadata.IsPrimaryKey())?.CurrentValue?.ToString() ?? "?";

            var changes = new Dictionary<string, object>();

            foreach (var prop in entry.Properties)
            {
                if (prop.Metadata.IsPrimaryKey()) continue;
                if (!enabledFields.Contains(prop.Metadata.Name)) continue;

                var original = entry.State == EntityState.Added ? null : prop.OriginalValue?.ToString();
                var current  = entry.State == EntityState.Deleted ? null : prop.CurrentValue?.ToString();

                if (original == current) continue;

                changes[prop.Metadata.Name] = new { old = original, @new = current };
            }

            if (changes.Count > 0 || entry.State == EntityState.Deleted)
            {
                var log = new AuditLog
                {
                    TableName = tableName,
                    RecordId  = recordId,
                    Operation = entry.State switch
                    {
                        EntityState.Added   => "Added",
                        EntityState.Deleted => "Deleted",
                        _                   => "Modified",
                    },
                    ChangedBy = user,
                    ChangedAt = now,
                    Changes   = JsonSerializer.Serialize(changes, _json),
                };
                auditEntries.Add(log);
                if (entry.State == EntityState.Added)
                    pendingAdded.Add((entry.Entity, log));
            }
        }

        var interceptionResult = await base.SavingChangesAsync(eventData, result, cancellationToken);

        if (auditEntries.Count > 0)
        {
            // Re-resolve PKs for Added entries now that DB has generated them.
            foreach (var (entity, log) in pendingAdded)
            {
                log.RecordId = context.Entry(entity).Properties
                    .FirstOrDefault(p => p.Metadata.IsPrimaryKey())?.CurrentValue?.ToString() ?? log.RecordId;
            }

            context.Set<AuditLog>().AddRange(auditEntries);
            _isSaving = true;
            try   { await context.SaveChangesAsync(cancellationToken); }
            finally { _isSaving = false; }
        }

        return interceptionResult;
    }
}
