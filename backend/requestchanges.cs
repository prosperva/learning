private static readonly List<string> ExcludedTables =
    new() { "AuditLogs", "AuditFieldConfigs", "AuditRouteConfigs" };

public async Task<IEnumerable<AuditTableDto>> GetAllTablesAsync()
{
    var savedConfigs = await db.Set<AuditFieldConfig>().AsNoTracking().ToListAsync();
    var configLookup = savedConfigs.ToDictionary(c => (c.TableName, c.FieldName));

    // Single query — all tables + columns at once
    var allColumns = await GetAllColumnsAsync();

    return allColumns
        .Where(g => !ExcludedTables.Contains(g.Key))
        .Select(g =>
        {
            var fields = g.Value
                .Where(col => !AuditMetaFields.Contains(col))
                .Select(col =>
                {
                    configLookup.TryGetValue((g.Key, col), out var saved);
                    return new AuditFieldConfigDto
                    {
                        FieldName   = col,
                        DisplayName = saved?.DisplayName ?? col,
                        IsEnabled   = saved?.IsEnabled ?? false,
                    };
                }).ToList();

            return new AuditTableDto { TableName = g.Key, Fields = fields };
        });
}

private async Task<Dictionary<string, List<string>>> GetAllColumnsAsync()
{
    var result = new Dictionary<string, List<string>>();
    var conn   = db.Database.GetDbConnection();

    await conn.OpenAsync();
    try
    {
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            SELECT TABLE_NAME, COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_CATALOG = DB_NAME()
            ORDER BY TABLE_NAME, ORDINAL_POSITION";

        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            if (reader.IsDBNull(0) || reader.IsDBNull(1)) continue;
            var table  = reader.GetString(0);
            var column = reader.GetString(1);
            if (!result.ContainsKey(table))
                result[table] = new List<string>();
            result[table].Add(column);
        }
    }
    finally
    {
        await conn.CloseAsync();
    }

    return result;
}
