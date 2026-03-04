using CommonFields.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace CommonFields.API.Controllers;

[ApiController]
[Route("api/audit")]
public class AuditController(IAuditService service) : ControllerBase
{
    // GET /api/audit/{tableName}/{recordId}?page=0&pageSize=500
    [HttpGet("{tableName}/{recordId}")]
    public async Task<IActionResult> Get(
        string tableName,
        string recordId,
        [FromQuery] int page     = 0,
        [FromQuery] int pageSize = 500)
    {
        var result = await service.GetPagedAsync(tableName, recordId, page, pageSize);
        return Ok(result);
    }
}
