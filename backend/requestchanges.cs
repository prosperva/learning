public class AuditInterceptor : SaveChangesInterceptor
    {
        private readonly ICurrentRequestResource _requestResource;
        private readonly TimeProvider _timeProvider;
        private readonly IServiceProvider _serviceProvider;
        private readonly IResourcesRepository _codesRepository;

        public AuditInterceptor(ICurrentRequestResource requestResource,
            UserResourceDbContext userContext,
            IResourcesRepository resourcesRepository,
            AuditConfigCache<CodesAuditLogDbContext> auditConfigCache,
            CodesAuditLogDbContext db,
            TimeProvider? timeProvider = null , 
            IServiceProvider serviceProvider = null
            
            )
        {
            _timeProvider = timeProvider ?? TimeProvider.System;
            _serviceProvider = serviceProvider;
            _requestResource = requestResource;
            _codesRepository = resourcesRepository;
        }

        public override InterceptionResult<int> SavingChanges(
            DbContextEventData eventData,
            InterceptionResult<int> result)
        {
            // var context = eventData.Context;
            // if (context is null)
            //     return base.SavingChanges(eventData, result);

            // var auditLogs = BuildAuditLogs(context);

            // if (auditLogs.Count > 0)
            //     context.AddRange(auditLogs);

            return base.SavingChanges(eventData, result);
        }

        public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(
            DbContextEventData eventData,
            InterceptionResult<int> result,
            CancellationToken cancellationToken = default)
        {
            var context = eventData.Context;
            if (context is null)
                return await base.SavingChangesAsync(eventData, result, cancellationToken);

            // var auditLogs = BuildAuditLogs(context);
            using var scope = _serviceProvider.CreateScope();
            var auditLogs = await BuildAuditLogs(eventData.Context);

            if (auditLogs.Count > 0)
            {
                //if we have one dbcontext, we do not need below
                var auditContext = scope.ServiceProvider.GetRequiredService<CodesAuditLogDbContext>();
                await auditContext.CodesAuditLog.AddRangeAsync(auditLogs, cancellationToken);
                await auditContext.SaveChangesAsync(cancellationToken);
            }

            return await base.SavingChangesAsync(eventData, result, cancellationToken);
        }

        private async Task<List<CodesAuditLog>> BuildAuditLogs(DbContext context)
        {
            var resourceId = _requestResource.ResourceId;
            var resourceEmail = await _codesRepository.GetCodesResourceByIdAsync((int)resourceId);
            
            var now = _timeProvider.GetUtcNow().UtcDateTime;
            var auditLogs = new List<CodesAuditLog>();

            foreach (var entry in context.ChangeTracker.Entries()
                        .Where(e => e.State is EntityState.Added
                                            or EntityState.Modified
                                            or EntityState.Deleted))
            {
                if (entry.Entity is not IAuditableEntity auditable)
                    continue;

                if (entry.State == EntityState.Added)
                {
                    auditable.CreatedBy = resourceId;
                    auditable.CreatedDate = now;
                }
                else if (entry.State == EntityState.Modified)
                {
                    auditable.ModifiedBy = resourceId;
                    auditable.ModifiedDate = now;
                }

                var entityType = entry.Entity.GetType();
                var tableAttr = entityType.GetCustomAttribute<TableAttribute>();
                var tableName = tableAttr?.Name ?? entityType.Name;
                var operation = entry.State.ToString();
                var changes = new Dictionary<string, AuditChange>();

                foreach (var prop in entry.Properties)
                {
                    if (prop.Metadata.IsPrimaryKey())
                        continue;

                    switch (entry.State)
                    {
                        case EntityState.Added:
                            changes[prop.Metadata.Name] = new AuditChange(
                                Old: null,
                                New: prop.CurrentValue?.ToString()
                            );
                            break;

                        case EntityState.Deleted:
                            changes[prop.Metadata.Name] = new AuditChange(
                                Old: prop.OriginalValue?.ToString(),
                                New: null
                            );
                            break;

                        case EntityState.Modified:
                            var oldVal = prop.OriginalValue?.ToString();
                            var newVal = prop.CurrentValue?.ToString();

                            if (oldVal == newVal)
                                continue;

                            changes[prop.Metadata.Name] = new AuditChange(
                                Old: oldVal,
                                New: newVal
                            );
                            break;
                    }
                }

                if (entry.State == EntityState.Modified && changes.Count == 0)
                    continue;

                var pk = entry.Metadata.FindPrimaryKey();
                var kProp = pk?.Properties.FirstOrDefault();
                var recordId = entry.Property(kProp!.Name).CurrentValue as int?;

                auditLogs.Add(new CodesAuditLog
                {
                    TableName = tableName,
                    RecordId = recordId ?? 0,
                    Operation = operation,
                    ModifiedBy = resourceId ?? 0,
                    ModifiedByEmail = resourceEmail?.User.Email,
                    ModifiedDate = now,
                    Changes = JsonSerializer.Serialize(changes)
                });
            }

            return auditLogs;
        }
    }
