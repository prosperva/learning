using CommonFields.API.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Collections.Concurrent;

namespace CommonFields.API.Services;

public class AuditConfigCache(IServiceScopeFactory scopeFactory)
{
    private readonly ConcurrentDictionary<string, (HashSet<string> Fields, DateTime ExpiresAt)> _cache = new();

    public async Task<HashSet<string>> GetEnabledFieldsAsync(string tableName)
    {
        if (_cache.TryGetValue(tableName, out var entry) && entry.ExpiresAt > DateTime.UtcNow)
            return entry.Fields;

        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var enabled = await db.AuditFieldConfigs
            .Where(c => c.TableName == tableName && c.IsEnabled)
            .Select(c => c.FieldName)
            .ToListAsync();

        var fields = enabled.ToHashSet();
        _cache[tableName] = (fields, DateTime.UtcNow.AddSeconds(60));
        return fields;
    }

    public void Invalidate(string tableName) => _cache.TryRemove(tableName, out _);
}


CREATE TABLE AuditLogs (
    Id        INT IDENTITY(1,1) PRIMARY KEY,
    TableName NVARCHAR(128) NOT NULL,
    RecordId  NVARCHAR(128) NOT NULL,
    Operation NVARCHAR(20)  NOT NULL,
    ChangedBy NVARCHAR(256) NOT NULL,
    ChangedAt DATETIME2    NOT NULL,
    Changes   NVARCHAR(MAX) NOT NULL DEFAULT '{}'
);

CREATE INDEX IX_AuditLogs_Table_Record
    ON AuditLogs (TableName, RecordId, ChangedAt DESC);

CREATE TABLE AuditFieldConfigs (
    Id          INT IDENTITY(1,1) PRIMARY KEY,
    TableName   NVARCHAR(128) NOT NULL,
    FieldName   NVARCHAR(128) NOT NULL,
    IsEnabled   BIT           NOT NULL DEFAULT 0,
    DisplayName NVARCHAR(256) NULL,
    CONSTRAINT UQ_AuditFieldConfigs_Table_Field UNIQUE (TableName, FieldName)
);

CREATE TABLE AuditRouteConfigs (
    Id        INT IDENTITY(1,1) PRIMARY KEY,
    Route     NVARCHAR(128) NOT NULL,
    TableName NVARCHAR(256) NOT NULL,
    CONSTRAINT UQ_AuditRouteConfigs_Route UNIQUE (Route)
);