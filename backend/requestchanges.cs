public interface IAuditRouteConfigRepository
{
    Task<IEnumerable<AuditRouteConfig>> GetAllAsync();
    Task<AuditRouteConfig> CreateAsync(AuditRouteConfig body);
    Task<AuditRouteConfig?> UpdateAsync(int id, AuditRouteConfig body);
    Task<bool> DeleteAsync(int id);
}

public class AuditRouteConfigRepository(AuditDbContext db, AuditEntityRegistry registry) : IAuditRouteConfigRepository
{
    public async Task<IEnumerable<AuditRouteConfig>> GetAllAsync() =>
        await db.Set<AuditRouteConfig>().AsNoTracking().OrderBy(r => r.Route).ToListAsync();

    public async Task<AuditRouteConfig> CreateAsync(AuditRouteConfig body)
    {
        var entry = new AuditRouteConfig { Route = body.Route.Trim(), TableName = body.TableName.Trim() };
        db.Set<AuditRouteConfig>().Add(entry);
        await db.SaveChangesAsync();
        registry.Reload();
        return entry;
    }

    public async Task<AuditRouteConfig?> UpdateAsync(int id, AuditRouteConfig body)
    {
        var entry = await db.Set<AuditRouteConfig>().FindAsync(id);
        if (entry is null) return null;
        entry.Route     = body.Route.Trim();
        entry.TableName = body.TableName.Trim();
        await db.SaveChangesAsync();
        registry.Reload();
        return entry;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entry = await db.Set<AuditRouteConfig>().FindAsync(id);
        if (entry is null) return false;
        db.Set<AuditRouteConfig>().Remove(entry);
        await db.SaveChangesAsync();
        registry.Reload();
        return true;
    }
}



[ApiController]
[Route("api/audit/route-config")]
public class AuditRouteConfigController(IAuditRouteConfigRepository repo) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await repo.GetAllAsync());

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AuditRouteConfig body) =>
        CreatedAtAction(nameof(GetAll), await repo.CreateAsync(body));

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] AuditRouteConfig body)
    {
        var result = await repo.UpdateAsync(id, body);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) =>
        await repo.DeleteAsync(id) ? NoContent() : NotFound();
}
