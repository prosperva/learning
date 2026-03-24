public async Task<IEnumerable<AuditTableDto>> GetAllTablesAsync()
{
    var savedConfigs = await db.Set<AuditFieldConfig>().AsNoTracking().ToListAsync();
    var configLookup = savedConfigs.ToDictionary(c => (c.TableName, c.FieldName));

    var allTables  = await GetSchemaValuesAsync("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME");
    var result     = new List<AuditTableDto>();

    foreach (var tableName in allTables.Where(t => !ExcludedTables.Contains(t)))
    {
        var columns = await GetSchemaValuesAsync(
            $"SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '{tableName}' ORDER BY ORDINAL_POSITION");

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

private async Task<List<string>> GetSchemaValuesAsync(string sql)
{
    var conn    = db.Database.GetDbConnection();
    var results = new List<string>();

    await conn.OpenAsync();
    try
    {
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = sql;
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            if (!reader.IsDBNull(0))
                results.Add(reader.GetString(0));
    }
    finally
    {
        await conn.CloseAsync();
    }

    return results;
}
