# CommonFields — Change Notes

## Removing `tableName` from `AuditHistoryCompact`

The `tableName` prop was removed from `AuditHistoryCompact`. The component no longer needs to know the DB table name directly.

### What changed
- `AuditHistoryCompact` now accepts `entityKey` (optional override) instead of `tableName`
- The backend `AuditController` resolves any case-insensitive entity key → actual table name via `AuditEntityRegistry`
- `AuditEntityRegistry` is a singleton built at startup from EF model metadata — O(1) lookup at request time, no DB hit

### Call site
```tsx
// Before
<AuditHistoryCompact tableName="Products" recordId={id} />

// After — entity key inferred from URL path segment by default
<AuditHistoryCompact recordId={id} />

// Override when URL segment doesn't match the table name
<AuditHistoryCompact entityKey="products" recordId={id} />
```

### Steps to add audit history to a new page
1. Import the component:
   ```tsx
   import AuditHistoryCompact from '@/components/History/AuditHistoryCompact';
   ```
2. Render it with the record ID:
   ```tsx
   <AuditHistoryCompact recordId={id} />
   ```
3. If the page URL segment doesn't match the table name (e.g. page is at `/inventory/edit/1` but table is `Products`), pass `entityKey` explicitly:
   ```tsx
   <AuditHistoryCompact entityKey="products" recordId={id} />
   ```
4. That's it — no other wiring needed.

---

## Migrating an existing project from the old audit history component

If you have a project already using an older version of `AuditHistoryCompact` that takes `tableName`, follow these steps to upgrade.

### Backend — what needs to be added

1. **`AuditEntityRegistry`** (`backend/Services/AuditEntityRegistry.cs`) — new singleton that maps route keys to table names at startup:
   ```csharp
   public class AuditEntityRegistry
   {
       private readonly Dictionary<string, string> _map;

       public AuditEntityRegistry(IServiceScopeFactory scopeFactory)
       {
           using var scope = scopeFactory.CreateScope();
           var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
           _map = db.Model.GetEntityTypes()
               .Select(e => e.GetTableName())
               .Where(t => t != null)
               .ToDictionary(t => t!.ToLowerInvariant(), t => t!, StringComparer.OrdinalIgnoreCase);
       }

       public string? GetTableName(string routeKey) =>
           _map.TryGetValue(routeKey, out var t) ? t : null;
   }
   ```

2. **Register it** in `Program.cs`:
   ```csharp
   builder.Services.AddSingleton<AuditEntityRegistry>();
   ```

3. **Update `AuditController`** to inject `AuditEntityRegistry` instead of resolving the table name inline:
   ```csharp
   public class AuditController(IAuditService service, AuditEntityRegistry registry) : ControllerBase
   {
       [HttpGet("{entityKey}/{recordId}")]
       public async Task<IActionResult> Get(string entityKey, string recordId,
           [FromQuery] int page = 0, [FromQuery] int pageSize = 500)
       {
           var tableName = registry.GetTableName(entityKey);
           if (tableName is null) return NotFound(new { message = $"Unknown entity: {entityKey}" });
           var result = await service.GetPagedAsync(tableName, recordId, page, pageSize);
           return Ok(result);
       }
   }
   ```

### Frontend — what needs to be updated

4. **`lib/api/auditLogs.ts`** — rename `tableName` → `entityKey` in `AuditLogsParams` and the fetch URL:
   ```ts
   export interface AuditLogsParams {
     entityKey: string;   // was: tableName
     recordId: string | number;
   }

   export async function fetchAuditLogs(params: AuditLogsParams) {
     const { entityKey, recordId, page = 0, pageSize = 500 } = params;
     return fetch(`/api/audit/${entityKey}/${recordId}?page=${page}&pageSize=${pageSize}`);
   }
   ```

5. **`AuditHistoryCompact`** — remove `tableName` from props, add optional `entityKey`:
   ```tsx
   interface Props {
     recordId: string | number;
     entityKey?: string;  // pass explicitly when URL segment doesn't match table
     title?: string;
   }

   export default function AuditHistoryCompact({ recordId, entityKey: entityKeyProp, title = "Change History" }: Props) {
     const pathname = usePathname();
     const entityKey = entityKeyProp ?? pathname.split('/')[1];
     // rest unchanged
   }
   ```

6. **Update all call sites** — remove `tableName`, add `entityKey` only if the URL segment doesn't match:
   ```tsx
   // Old
   <AuditHistoryCompact tableName="Products" recordId={id} />

   // New — URL is /products/edit/1, segment matches, no prop needed
   <AuditHistoryCompact recordId={id} />

   // New — URL is /inventory/edit/1 but table is Products, override needed
   <AuditHistoryCompact entityKey="products" recordId={id} />
   ```

7. **Next.js proxy** — rename the route folder from `[tableName]` to `[entityKey]` if desired (optional, the proxy just passes the segment through):
   ```
   app/api/audit/[entityKey]/[recordId]/route.ts
   ```

---

## Adding a new entity to the audit interceptor

The interceptor automatically picks up any entity registered in EF Core. No code changes are needed in most cases.

### Steps

1. **Create the model** in `backend/Models/`:
   ```csharp
   public class Invoice  // example
   {
       public int    Id     { get; set; }
       public string Number { get; set; } = string.Empty;
       public decimal Total { get; set; }
   }
   ```

2. **Register it in `AppDbContext`**:
   ```csharp
   public DbSet<Invoice> Invoices => Set<Invoice>();
   ```

3. **Rebuild** — the interceptor will now see `Invoices` in `context.ChangeTracker.Entries()` automatically.

4. **Enable fields via admin UI** at `/admin/audit-config` — `Invoices` will appear with all its fields, all disabled by default. Toggle whichever fields you want audited.

### If you also want auto-stamping (CreatedBy / ModifiedAt)

Extend `AuditableEntity` instead of a plain class:
```csharp
public class Invoice : AuditableEntity
{
    public int     Id     { get; set; }
    public string  Number { get; set; } = string.Empty;
    public decimal Total  { get; set; }
}
```

This gives you `CreatedBy`, `CreatedAt`, `ModifiedBy`, `ModifiedAt` columns populated automatically on every save. Audit logging of field changes is still controlled separately by the admin config.

### Nothing to do in
- `AuditInterceptor` — no changes needed
- `AuditEntityRegistry` — rebuilds from EF model at next app startup
- `AuditConfigCache` — picks up new table on first save after startup

---

## Migrating an existing project from the old AuditInterceptor

The old interceptor audited all `IAuditableEntity` fields unconditionally in a single loop. The new version:
- Separates stamping and capture into two independent loops
- Gates capture on per-field admin config (`AuditConfigCache`)
- Audits **any** entity type, not just `IAuditableEntity`
- Fixes PK re-resolution for Added entities using object references instead of Zip

### Step 1 — Add `AuditFieldConfig` model

`backend/Models/AuditFieldConfig.cs`:
```csharp
public class AuditFieldConfig
{
    public int     Id          { get; set; }
    public string  TableName   { get; set; } = string.Empty;
    public string  FieldName   { get; set; } = string.Empty;
    public bool    IsEnabled   { get; set; } = false;
    public string? DisplayName { get; set; }
}
```

### Step 2 — Register it in `AppDbContext`

```csharp
public DbSet<AuditFieldConfig> AuditFieldConfigs => Set<AuditFieldConfig>();

// In OnModelCreating:
builder.Entity<AuditFieldConfig>()
    .HasIndex(c => new { c.TableName, c.FieldName })
    .IsUnique();
```

If using `EnsureCreated` (no migrations), add this idempotent block to your startup SQL:
```sql
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'AuditFieldConfigs')
BEGIN
    CREATE TABLE AuditFieldConfigs (
        Id          INT IDENTITY(1,1) PRIMARY KEY,
        TableName   NVARCHAR(128) NOT NULL,
        FieldName   NVARCHAR(128) NOT NULL,
        IsEnabled   BIT NOT NULL DEFAULT 0,
        DisplayName NVARCHAR(256) NULL,
        CONSTRAINT UQ_AuditFieldConfigs_Table_Field UNIQUE (TableName, FieldName)
    );
END
```

### Step 3 — Add `AuditConfigCache`

`backend/Services/AuditConfigCache.cs`:
```csharp
public class AuditConfigCache(IServiceScopeFactory scopeFactory, IMemoryCache cache)
{
    public async Task<HashSet<string>> GetEnabledFieldsAsync(string tableName)
    {
        return await cache.GetOrCreateAsync(CacheKey(tableName), async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(60);
            await using var scope = scopeFactory.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var enabled = await db.AuditFieldConfigs
                .Where(c => c.TableName == tableName && c.IsEnabled)
                .Select(c => c.FieldName)
                .ToListAsync();
            return enabled.ToHashSet();
        }) ?? [];
    }

    public void Invalidate(string tableName) => cache.Remove(CacheKey(tableName));
    private static string CacheKey(string t) => $"audit_enabled_{t}";
}
```

### Step 4 — Update `AuditInterceptor`

Replace the single combined loop with two separate loops and fix PK re-resolution:

```csharp
public class AuditInterceptor(
    ICurrentUserService currentUserService,
    AuditConfigCache auditConfigCache) : SaveChangesInterceptor
{
    private bool _isSaving;

    public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData, InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        if (_isSaving || eventData.Context is null)
            return await base.SavingChangesAsync(eventData, result, cancellationToken);

        var context = eventData.Context;
        var user = currentUserService.GetCurrentUser();
        var now  = DateTime.UtcNow;

        // ── Loop 1: Stamp IAuditableEntity only ──────────────────────────────
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

        // ── Loop 2: Capture audit logs for ALL entities ───────────────────────
        var auditEntries  = new List<AuditLog>();
        var pendingAdded  = new List<(object Entity, AuditLog Log)>();

        foreach (var entry in context.ChangeTracker.Entries()
            .Where(e => e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted))
        {
            var clrType = entry.Entity.GetType();
            if (clrType == typeof(AuditLog) || clrType == typeof(AuditFieldConfig)) continue;

            var tableName     = entry.Metadata.GetTableName() ?? clrType.Name;
            var enabledFields = await auditConfigCache.GetEnabledFieldsAsync(tableName);
            if (enabledFields.Count == 0) continue;

            var recordId = entry.Properties
                .FirstOrDefault(p => p.Metadata.IsPrimaryKey())?.CurrentValue?.ToString() ?? "?";

            var changes = new Dictionary<string, object>();
            foreach (var prop in entry.Properties)
            {
                if (prop.Metadata.IsPrimaryKey()) continue;
                if (!enabledFields.Contains(prop.Metadata.Name)) continue;
                var old = entry.State == EntityState.Added   ? null : prop.OriginalValue?.ToString();
                var cur = entry.State == EntityState.Deleted ? null : prop.CurrentValue?.ToString();
                if (old == cur) continue;
                changes[prop.Metadata.Name] = new { old, @new = cur };
            }

            if (changes.Count == 0 && entry.State != EntityState.Deleted) continue;

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

        var interceptionResult = await base.SavingChangesAsync(eventData, result, cancellationToken);

        if (auditEntries.Count > 0)
        {
            // Re-resolve PKs for Added entries using object references (PKs generated by DB above)
            foreach (var (entity, log) in pendingAdded)
                log.RecordId = context.Entry(entity).Properties
                    .FirstOrDefault(p => p.Metadata.IsPrimaryKey())?.CurrentValue?.ToString() ?? log.RecordId;

            context.Set<AuditLog>().AddRange(auditEntries);
            _isSaving = true;
            try   { await context.SaveChangesAsync(cancellationToken); }
            finally { _isSaving = false; }
        }

        return interceptionResult;
    }
}
```

### Step 5 — Register new services in `Program.cs`

```csharp
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<AuditConfigCache>();
```

### Step 6 — Rebuild and verify

```bash
docker compose up --build -d

# Should return all tables with all fields disabled
curl http://localhost:5001/api/audit/config

# Enable a field, then edit a record and confirm only that field appears in the log
curl -X PUT http://localhost:5001/api/audit/config/Products \
  -H "Content-Type: application/json" \
  -d '[{"fieldName":"Price","isEnabled":true,"displayName":"Unit Price"}]'
```

### Key differences from old version

| | Old | New |
|---|---|---|
| Entities audited | `IAuditableEntity` only | All EF entities |
| Field filtering | None — all fields | Admin config via `AuditConfigCache` |
| Default behaviour | Audit everything | Audit nothing until enabled |
| PK re-resolution | `.Zip()` — fragile | Object reference lookup — reliable |
| Stamp loop | Combined with capture | Separate, `IAuditableEntity` only |
