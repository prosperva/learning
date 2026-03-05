using CommonFields.API.Data;
using Microsoft.EntityFrameworkCore;

namespace CommonFields.API.Services;

/// <summary>
/// Singleton that builds a routeKey → tableName map once at startup from EF model metadata.
/// Lets the audit API accept case-insensitive URL segments without per-request DB or LINQ work.
/// </summary>
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
            .ToDictionary(
                t => t!.ToLowerInvariant(),
                t => t!,
                StringComparer.OrdinalIgnoreCase);
    }

    /// <summary>Returns the actual table name for the given route key, or null if not found.</summary>
    public string? GetTableName(string routeKey) =>
        _map.TryGetValue(routeKey, out var tableName) ? tableName : null;
}
