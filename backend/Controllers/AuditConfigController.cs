using CommonFields.API.DTOs;
using CommonFields.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace CommonFields.API.Controllers;

[ApiController]
[Route("api/audit/config")]
public class AuditConfigController(IAuditConfigService service) : ControllerBase
{
    /// <summary>Returns all auditable tables and their per-field config, auto-discovered from the EF model.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var tables = await service.GetAllTablesAsync();
        return Ok(tables);
    }

    /// <summary>Enables/disables a field and optionally sets its display name.</summary>
    [HttpPut("{tableName}/{fieldName}")]
    public async Task<IActionResult> Upsert(
        string tableName, string fieldName, [FromBody] UpdateAuditFieldRequest request)
    {
        var result = await service.UpsertAsync(
            tableName, fieldName, request.IsEnabled, request.DisplayName);
        return Ok(result);
    }

    /// <summary>Batch-upserts all changed fields for a table in one request.</summary>
    [HttpPut("{tableName}")]
    public async Task<IActionResult> BatchUpsert(
        string tableName, [FromBody] List<BatchUpdateAuditFieldItem> items)
    {
        var result = await service.BatchUpsertAsync(tableName, items);
        return Ok(result);
    }
}
