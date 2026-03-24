public class AuditInterceptor : SaveChangesInterceptor
{
    private readonly ICurrentRequestResource _requestResource;
    private readonly TimeProvider _timeProvider;
    private readonly IServiceProvider _serviceProvider;
    private readonly IResourcesRepository _codesRepository;
    private readonly AuditConfigCache<CodesAuditLogDbContext> _auditConfigCache;

    public AuditInterceptor(
        ICurrentRequestResource requestResource,
        IResourcesRepository resourcesRepository,
        AuditConfigCache<CodesAuditLogDbContext> auditConfigCache,
        IServiceProvider serviceProvider,
        TimeProvider? timeProvider = null)
    {
        _timeProvider      = timeProvider ?? TimeProvider.System;
        _serviceProvider   = serviceProvider;
        _requestResource   = requestResource;
        _codesRepository   = resourcesRepository;
        _auditConfigCache  = auditConfigCache;
    }

    public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        var context = eventData.Context;
        if (context is null)
            return await base.SavingChangesAsync(eventData, result, cancellationToken);

        var (auditLogs, pendingAdded) = await BuildAuditLogsAsync(context);

        // Save main changes first so DB generates PKs for Added entities
        var interceptionResult = await base.SavingChangesAsync(eventData, result, cancellationToken);

        if (auditLogs.Count > 0)
        {
            // Re-resolve PKs for Added entries now that DB has generated them
            foreach (var (entity, log) in pendingAdded)
            {
                log.RecordId = context.Entry(entity).Properties
                    .FirstOrDefault(p => p.Metadata.IsPrimaryKey())?.CurrentValue as int? ?? log.RecordId;
            }

            using var scope = _serviceProvider.CreateScope();
            var auditContext = scope.ServiceProvider.GetRequiredService<CodesAuditLogDbContext>();
            await auditContext.CodesAuditLog.AddRangeAsync(auditLogs, cancellationToken);
            await auditContext.SaveChangesAsync(cancellationToken);
        }

        return interceptionResult;
    }

    private async Task<(List<CodesAuditLog> Logs, List<(object Entity, CodesAuditLog Log)> PendingAdded)>
        BuildAuditLogsAsync(DbContext context)
    {
        var resourceId    = _requestResource.ResourceId;
        var resourceEmail = await _codesRepository.GetCodesResourceByIdAsync((int)resourceId);
        var now           = _timeProvider.GetUtcNow().UtcDateTime;

        var auditLogs    = new List<CodesAuditLog>();
        var pendingAdded = new List<(object Entity, CodesAuditLog Log)>();

        foreach (var entry in context.ChangeTracker.Entries()
            .Where(e => e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted))
        {
            if (entry.Entity is not IAuditableEntity auditable)
                continue;

            if (entry.State == EntityState.Added)
            {
                auditable.CreatedBy   = resourceId;
                auditable.CreatedDate = now;
            }
            else if (entry.State == EntityState.Modified)
            {
                auditable.ModifiedBy   = resourceId;
                auditable.ModifiedDate = now;
            }

            var entityType = entry.Entity.GetType();
            var tableAttr  = entityType.GetCustomAttribute<TableAttribute>();
            var tableName  = tableAttr?.Name ?? entityType.Name;

            // Only audit tables that have at least one enabled field
            var enabledFields = await _auditConfigCache.GetEnabledFieldsAsync(tableName);
            if (enabledFields.Count == 0) continue;

            var changes = new Dictionary<string, AuditChange>();

            foreach (var prop in entry.Properties)
            {
                if (prop.Metadata.IsPrimaryKey()) continue;
                if (!enabledFields.Contains(prop.Metadata.Name)) continue;

                switch (entry.State)
                {
                    case EntityState.Added:
                        changes[prop.Metadata.Name] = new AuditChange(null, prop.CurrentValue?.ToString());
                        break;

                    case EntityState.Deleted:
                        changes[prop.Metadata.Name] = new AuditChange(prop.OriginalValue?.ToString(), null);
                        break;

                    case EntityState.Modified:
                        var oldVal = prop.OriginalValue?.ToString();
                        var newVal = prop.CurrentValue?.ToString();
                        if (oldVal == newVal) continue;
                        changes[prop.Metadata.Name] = new AuditChange(oldVal, newVal);
                        break;
                }
            }

            if (changes.Count == 0 && entry.State != EntityState.Deleted) continue;

            var pk       = entry.Metadata.FindPrimaryKey();
            var kProp    = pk?.Properties.FirstOrDefault();
            var recordId = entry.Property(kProp!.Name).CurrentValue as int?;

            var log = new CodesAuditLog
            {
                TableName       = tableName,
                RecordId        = recordId ?? 0,
                Operation       = entry.State.ToString(),
                ModifiedBy      = resourceId ?? 0,
                ModifiedByEmail = resourceEmail?.User.Email,
                ModifiedDate    = now,
                Changes         = JsonSerializer.Serialize(changes),
            };

            auditLogs.Add(log);
            if (entry.State == EntityState.Added)
                pendingAdded.Add((entry.Entity, log));
        }

        return (auditLogs, pendingAdded);
    }
}
