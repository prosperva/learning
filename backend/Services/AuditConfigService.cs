using CommonFields.API.Data;
using CommonFields.API.DTOs;
using CommonFields.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CommonFields.API.Services;

public class AuditConfigService(AppDbContext db, AuditConfigCache configCache) : IAuditConfigService
{
    // Fields stamped by the interceptor — exclude from admin config UI.
    private static readonly HashSet<string> AuditMetaFields =
        ["CreatedBy", "CreatedAt", "ModifiedBy", "ModifiedAt"];

    // Entity types that should not appear as configurable tables.
    private static readonly HashSet<Type> ExcludedTypes =
        [typeof(AuditLog), typeof(AuditFieldConfig)];

    public async Task<IEnumerable<AuditTableDto>> GetAllTablesAsync()
    {
        var savedConfigs = await db.AuditFieldConfigs.ToListAsync();
        var configLookup = savedConfigs.ToDictionary(c => (c.TableName, c.FieldName));

        var entityTypes = db.Model.GetEntityTypes()
            .Where(e => e.GetTableName() != null)          // only table-mapped entities
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
        var fieldNames = itemList.Select(i => i.FieldName).ToHashSet();

        var existing = await db.AuditFieldConfigs
            .Where(c => c.TableName == tableName && fieldNames.Contains(c.FieldName))
            .ToListAsync();
        var lookup = existing.ToDictionary(c => c.FieldName);

        foreach (var item in itemList)
        {
            if (!lookup.TryGetValue(item.FieldName, out var row))
            {
                row = new AuditFieldConfig { TableName = tableName, FieldName = item.FieldName };
                db.AuditFieldConfigs.Add(row);
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
        var existing = await db.AuditFieldConfigs
            .FirstOrDefaultAsync(c => c.TableName == tableName && c.FieldName == fieldName);

        if (existing is null)
        {
            existing = new AuditFieldConfig { TableName = tableName, FieldName = fieldName };
            db.AuditFieldConfigs.Add(existing);
        }

        existing.IsEnabled   = isEnabled;
        existing.DisplayName = string.IsNullOrWhiteSpace(displayName) ? null : displayName;

        await db.SaveChangesAsync();

        // Invalidate cache so the interceptor picks up changes immediately.
        configCache.Invalidate(tableName);

        return new AuditFieldConfigDto
        {
            FieldName   = fieldName,
            DisplayName = existing.DisplayName ?? fieldName,
            IsEnabled   = existing.IsEnabled,
        };
    }
}
