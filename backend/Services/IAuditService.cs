using CommonFields.API.DTOs;

namespace CommonFields.API.Services;

public interface IAuditService
{
    Task<PagedResult<AuditLogDto>> GetPagedAsync(string tableName, string recordId, int page, int pageSize);
}
