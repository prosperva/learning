using CommonFields.API.Data;
using CommonFields.API.Models;
using CommonFields.API.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CommonFields.API.Controllers;

[ApiController]
[Route("api/audit/route-config")]
public class AuditRouteConfigController(AppDbContext db, AuditEntityRegistry registry) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await db.AuditRouteConfigs.AsNoTracking().OrderBy(r => r.Route).ToListAsync());

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AuditRouteConfig body)
    {
        var entry = new AuditRouteConfig { Route = body.Route.Trim(), TableName = body.TableName.Trim() };
        db.AuditRouteConfigs.Add(entry);
        await db.SaveChangesAsync();
        registry.Reload();
        return CreatedAtAction(nameof(GetAll), new { id = entry.Id }, entry);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] AuditRouteConfig body)
    {
        var entry = await db.AuditRouteConfigs.FindAsync(id);
        if (entry is null) return NotFound();

        entry.Route     = body.Route.Trim();
        entry.TableName = body.TableName.Trim();
        await db.SaveChangesAsync();
        registry.Reload();a
        return Ok(entry);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entry = await db.AuditRouteConfigs.FindAsync(id);
        if (entry is null) return NotFound();

        db.AuditRouteConfigs.Remove(entry);
        await db.SaveChangesAsync();
        registry.Reload();
        return NoContent();
    }
}
