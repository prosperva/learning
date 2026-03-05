using CommonFields.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace CommonFields.API.Controllers;

[ApiController]
[Route("api/audit")]
public class AuditController(IAuditService service, AuditEntityRegistry registry) : ControllerBase
{
    // GET /api/audit/{entityKey}/{recordId}?page=0&pageSize=500
    // entityKey is case-insensitive — resolved to the actual table name via AuditEntityRegistry.
    [HttpGet("{entityKey}/{recordId}")]
    public async Task<IActionResult> Get(
        string entityKey,
        string recordId,
        [FromQuery] int page     = 0,
        [FromQuery] int pageSize = 500)
    {
        var tableName = registry.GetTableName(entityKey);

        if (tableName is null)
            return NotFound(new { message = $"Unknown entity: {entityKey}" });

        var result = await service.GetPagedAsync(tableName, recordId, page, pageSize);
        return Ok(result);
    }
}
