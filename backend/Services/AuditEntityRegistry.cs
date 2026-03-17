using CommonFields.API.Data;
using Microsoft.EntityFrameworkCore;

namespace CommonFields.API.Services;

/// <summary>
/// Singleton that maps routeKey → tableName for the audit API.
/// Seeded at startup from (1) EF model metadata and (2) the AuditRouteConfigs table.
/// Call Reload() after mutating AuditRouteConfigs to pick up changes without a restart.
/// </summary>
public class AuditEntityRegistry
{
    private readonly IServiceScopeFactory _scopeFactory;
    private Dictionary<string, string> _map;
    private readonly object _lock = new();

    public AuditEntityRegistry(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
        _map = BuildMap(scopeFactory);
    }

    public string? GetTableName(string routeKey) =>
        _map.TryGetValue(routeKey, out var name) ? name : null;

    /// <summary>Refreshes DB-configured routes. Call after any AuditRouteConfig mutation.</summary>
    public void Reload()
    {
        lock (_lock)
        {
            _map = BuildMap(_scopeFactory);
        }
    }

    private static Dictionary<string, string> BuildMap(IServiceScopeFactory scopeFactory)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // Start with EF-discovered tables (case-insensitive key)
        var map = db.Model.GetEntityTypes()
            .Select(e => e.GetTableName())
            .Where(t => t != null)
            .ToDictionary(
                t => t!.ToLowerInvariant(),
                t => t!,
                StringComparer.OrdinalIgnoreCase);

        // Overlay DB-configured custom routes (these win over auto-discovery)
        foreach (var r in db.AuditRouteConfigs.AsNoTracking())
            map[r.Route] = r.TableName;

        return map;
    }
}
