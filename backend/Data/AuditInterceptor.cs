using System.Text.Json;
using CommonFields.API.Models;
using CommonFields.API.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace CommonFields.API.Data;

public class AuditInterceptor(ICurrentUserService currentUserService) : SaveChangesInterceptor
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

        var auditEntries = new List<AuditLog>();

        foreach (var entry in context.ChangeTracker.Entries<IAuditableEntity>())
        {
            // Stamp audit fields
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

            // Capture field changes for audit log
            if (entry.State is EntityState.Added or EntityState.Modified or EntityState.Deleted)
            {
                var tableName = entry.Metadata.GetTableName() ?? entry.Entity.GetType().Name;
                var recordId  = entry.Properties
                    .FirstOrDefault(p => p.Metadata.IsPrimaryKey())?.CurrentValue?.ToString() ?? "?";

                var changes = new Dictionary<string, object>();

                foreach (var prop in entry.Properties)
                {
                    if (prop.Metadata.IsPrimaryKey()) continue;

                    var original = entry.State == EntityState.Added ? null : prop.OriginalValue?.ToString();
                    var current  = entry.State == EntityState.Deleted ? null : prop.CurrentValue?.ToString();

                    if (original == current) continue;

                    changes[prop.Metadata.Name] = new { old = original, @new = current };
                }

                if (changes.Count > 0 || entry.State == EntityState.Deleted)
                {
                    auditEntries.Add(new AuditLog
                    {
                        TableName = tableName,
                        RecordId  = recordId,
                        Operation = entry.State switch
                        {
                            EntityState.Added    => "Added",
                            EntityState.Deleted  => "Deleted",
                            _                    => "Modified",
                        },
                        ChangedBy = user,
                        ChangedAt = now,
                        Changes   = JsonSerializer.Serialize(changes, _json),
                    });
                }
            }
        }

        var interceptionResult = await base.SavingChangesAsync(eventData, result, cancellationToken);

        // Write audit logs after the main save so we have the generated PK for new entities
        if (auditEntries.Count > 0)
        {
            // Re-resolve record IDs for Added entries (PK now generated)
            foreach (var (entry, log) in context.ChangeTracker
                .Entries<IAuditableEntity>()
                .Zip(auditEntries.Where(a => a.Operation == "Added")))
            {
                log.RecordId = entry.Properties
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
