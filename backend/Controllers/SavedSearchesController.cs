using CommonFields.API.DTOs;
using CommonFields.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace CommonFields.API.Controllers;

[ApiController]
[Route("api/savedsearches")]
public class SavedSearchesController(ISavedSearchService service) : ControllerBase
{
    // GET /api/savedsearches?context=products&user=prosper@app.com
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? context, [FromQuery] string? user)
    {
        var results = await service.QueryAsync(new SavedSearchQueryRequest { Context = context, CurrentUser = user ?? string.Empty });
        return Ok(results);
    }

    // GET /api/savedsearches/{id}
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var dto = await service.GetByIdAsync(id);
        return dto is null ? NotFound() : Ok(dto);
    }

    // POST /api/savedsearches
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSavedSearchRequest request)
    {
        var dto = await service.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }

    // PUT /api/savedsearches
    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateSavedSearchRequest request)
    {
        var dto = await service.UpdateAsync(request);
        return dto is null ? NotFound() : Ok(dto);
    }

    // DELETE /api/savedsearches/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await service.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
