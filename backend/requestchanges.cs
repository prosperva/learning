private static readonly List<string> ExcludedTables =
    new() { "AuditLogs", "AuditFieldConfigs", "AuditRouteConfigs" };

public async Task<IEnumerable<AuditTableDto>> GetAllTablesAsync()
{
    var savedConfigs = await db.Set<AuditFieldConfig>().AsNoTracking().ToListAsync();
    var configLookup = savedConfigs.ToDictionary(c => (c.TableName, c.FieldName));

    var allTables = await db.Database
        .SqlQuery<string>($"SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME")
        .ToListAsync();

    var result = new List<AuditTableDto>();

    foreach (var tableName in allTables.Where(t => !ExcludedTables.Contains(t)))
    {
        var columns = await db.Database
            .SqlQuery<string>($"SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = {tableName} ORDER BY ORDINAL_POSITION")
            .ToListAsync();

        var fields = columns
            .Where(col => !AuditMetaFields.Contains(col))
            .Select(col =>
            {
                configLookup.TryGetValue((tableName, col), out var saved);
                return new AuditFieldConfigDto
                {
                    FieldName   = col,
                    DisplayName = saved?.DisplayName ?? col,
                    IsEnabled   = saved?.IsEnabled ?? false,
                };
            });

        result.Add(new AuditTableDto { TableName = tableName, Fields = fields.ToList() });
    }

    return result;
}
