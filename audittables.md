using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace YourAuditLibrary.Services;

public class AuditConfigService<TContext>(TContext db, AuditConfigCache<TContext> configCache) : IAuditConfigService
    where TContext : DbContext
{
    private static readonly List<string> AuditMetaFields =
        new() { "CreatedBy", "CreatedAt", "ModifiedBy", "ModifiedAt" };

    private static readonly List<Type> ExcludedTypes =
        new() { typeof(AuditLog), typeof(AuditFieldConfig) };

    public async Task<IEnumerable<AuditTableDto>> GetAllTablesAsync()
    {
        var savedConfigs = await db.Set<AuditFieldConfig>().ToListAsync();
        var configLookup = savedConfigs.ToDictionary(c => (c.TableName, c.FieldName));

        var entityTypes = db.Model.GetEntityTypes()
            .Where(e => e.GetTableName() != null)
            .Where(e => !ExcludedTypes.Contains(e.ClrType));

        return entityTypes.Select(entityType =>
        {
            var tableName = entityType.GetTableName() ?? entityType.ClrType.Name;

            var fields = entityType.GetProperties()
                .Where(p => !p.IsPrimaryKey() && !AuditMetaFields.Contains(p.Name))
                .Select(p =>
                {
                    configLookup.TryGetValue((tableName, p.Name), out var saved);
                    return new AuditFieldConfigDto
                    {
                        FieldName   = p.Name,
                        DisplayName = saved?.DisplayName ?? p.Name,
                        IsEnabled   = saved?.IsEnabled ?? false,
                    };
                });

            return new AuditTableDto { TableName = tableName, Fields = fields };
        });
    }

    public async Task<IEnumerable<AuditFieldConfigDto>> BatchUpsertAsync(
        string tableName, IEnumerable<BatchUpdateAuditFieldItem> items)
    {
        var itemList = items.ToList();
        var fieldNames = itemList.Select(i => i.FieldName).ToList();

        var existing = await db.Set<AuditFieldConfig>()
            .Where(c => c.TableName == tableName && fieldNames.Contains(c.FieldName))
            .ToListAsync();
        var lookup = existing.ToDictionary(c => c.FieldName);

        foreach (var item in itemList)
        {
            if (!lookup.TryGetValue(item.FieldName, out var row))
            {
                row = new AuditFieldConfig { TableName = tableName, FieldName = item.FieldName };
                db.Set<AuditFieldConfig>().Add(row);
                lookup[item.FieldName] = row;
            }
            row.IsEnabled   = item.IsEnabled;
            row.DisplayName = string.IsNullOrWhiteSpace(item.DisplayName) ? null : item.DisplayName;
        }

        await db.SaveChangesAsync();
        configCache.Invalidate(tableName);

        return itemList.Select(item => new AuditFieldConfigDto
        {
            FieldName   = item.FieldName,
            DisplayName = lookup[item.FieldName].DisplayName ?? item.FieldName,
            IsEnabled   = item.IsEnabled,
        });
    }

    public async Task<AuditFieldConfigDto> UpsertAsync(
        string tableName, string fieldName, bool isEnabled, string? displayName)
    {
        var existing = await db.Set<AuditFieldConfig>()
            .FirstOrDefaultAsync(c => c.TableName == tableName && c.FieldName == fieldName);

        if (existing is null)
        {
            existing = new AuditFieldConfig { TableName = tableName, FieldName = fieldName };
            db.Set<AuditFieldConfig>().Add(existing);
        }

        existing.IsEnabled   = isEnabled;
        existing.DisplayName = string.IsNullOrWhiteSpace(displayName) ? null : displayName;

        await db.SaveChangesAsync();
        configCache.Invalidate(tableName);

        return new AuditFieldConfigDto
        {
            FieldName   = fieldName,
            DisplayName = existing.DisplayName ?? fieldName,
            IsEnabled   = existing.IsEnabled,
        };
    }
}
