using CommonFields.API.DTOs;
using CommonFields.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace CommonFields.API.Controllers;

[ApiController]
[Route("api/products")]
public class ProductsController(IProductService service) : ControllerBase
{
    // GET /api/products?page=0&pageSize=25&sortField=id&sortOrder=asc&...
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] SearchRequest request)
    {
        var result = await service.SearchAsync(request);
        return Ok(result);
    }

    // POST /api/products/search
    [HttpPost("search")]
    public async Task<IActionResult> Search([FromBody] SearchRequest request)
    {
        var result = await service.SearchAsync(request);
        return Ok(result);
    }

    // POST /api/products/all
    [HttpPost("all")]
    public async Task<IActionResult> All([FromBody] AllProductsRequest request)
    {
        var result = await service.GetAllAsync(request);
        return Ok(result);
    }

    // GET /api/products/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var product = await service.GetByIdAsync(id);
        if (product is null) return NotFound(new { message = "Product not found" });
        return Ok(product);
    }

    // POST /api/products
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProductRequest request)
    {
        if (string.IsNullOrEmpty(request.Name)     ||
            string.IsNullOrEmpty(request.Category) ||
            string.IsNullOrEmpty(request.Status))
            return BadRequest(new { message = "Missing required fields: name, category, status, price" });

        var created = await service.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    // PUT /api/products/{id}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateProductRequest request)
    {
        var updated = await service.UpdateAsync(id, request);
        if (updated is null) return NotFound(new { message = "Product not found" });
        return Ok(updated);
    }

    // DELETE /api/products/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await service.DeleteAsync(id);
        if (!deleted) return NotFound(new { message = "Product not found" });
        return NoContent();
    }
}
