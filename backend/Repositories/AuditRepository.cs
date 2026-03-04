using CommonFields.API.Data;
using CommonFields.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CommonFields.API.Repositories;

public class AuditRepository(AppDbContext db) : IAuditRepository
{
    public async Task<(IEnumerable<AuditLog> Items, int Total)> GetPagedAsync(
        string tableName, string recordId, int page, int pageSize)
    {
        var query = db.AuditLogs
            .Where(a => a.TableName == tableName && a.RecordId == recordId)
            .OrderByDescending(a => a.ChangedAt);

        var total = await query.CountAsync();
        var items = await query
            .Skip(page * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, total);
    }
}
