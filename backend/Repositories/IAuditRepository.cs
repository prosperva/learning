using CommonFields.API.Models;

namespace CommonFields.API.Repositories;

public interface IAuditRepository
{
    Task<(IEnumerable<AuditLog> Items, int Total)> GetPagedAsync(
        string tableName, string recordId, int page, int pageSize);
}
