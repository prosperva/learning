using AutoMapper;
using CommonFields.API.DTOs;
using CommonFields.API.Repositories;

namespace CommonFields.API.Services;

public class AuditService(IAuditRepository repo, IMapper mapper) : IAuditService
{
    public async Task<PagedResult<AuditLogDto>> GetPagedAsync(
        string tableName, string recordId, int page, int pageSize)
    {
        var (items, total) = await repo.GetPagedAsync(tableName, recordId, page, pageSize);
        return PagedResult<AuditLogDto>.Create(
            mapper.Map<IEnumerable<AuditLogDto>>(items), total, page, pageSize);
    }
}
