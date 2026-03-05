using CommonFields.API.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace CommonFields.API.Services;

/// <summary>
/// Singleton cache for enabled audit fields. Uses IServiceScopeFactory so it can
/// query the DB without depending on a Scoped AppDbContext, which would create a
/// circular dependency through AuditInterceptor.
/// </summary>
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

    private static string CacheKey(string tableName) => $"audit_enabled_{tableName}";
}
