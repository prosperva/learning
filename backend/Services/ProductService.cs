using AutoMapper;
using CommonFields.API.DTOs;
using CommonFields.API.Models;
using CommonFields.API.Repositories;

namespace CommonFields.API.Services;

public class ProductService(IProductRepository repo, IMapper mapper) : IProductService
{
    public async Task<PagedResult<ProductDto>> SearchAsync(SearchRequest request)
    {
        var (items, total) = await repo.SearchAsync(request);
        return PagedResult<ProductDto>.Create(mapper.Map<IEnumerable<ProductDto>>(items), total, request.Page, request.PageSize);
    }

    public async Task<PagedResult<ProductDto>> GetAllAsync(AllProductsRequest request)
    {
        var items = await repo.GetAllAsync(request);
        var list = mapper.Map<IEnumerable<ProductDto>>(items).ToList();
        return PagedResult<ProductDto>.Create(list, list.Count, 0, list.Count);
    }

    public async Task<ProductDto?> GetByIdAsync(int id)
    {
        var product = await repo.GetByIdAsync(id);
        return product is null ? null : mapper.Map<ProductDto>(product);
    }

    public async Task<ProductDto> CreateAsync(CreateProductRequest request)
    {
        var product = new Product
        {
            Name        = request.Name,
            Category    = request.Category,
            Status      = request.Status,
            Price       = request.Price,
            Stock       = request.Stock,
            Description = request.Description,
        };

        var created = await repo.CreateAsync(product);
        return mapper.Map<ProductDto>(created);
    }

    public async Task<ProductDto?> UpdateAsync(int id, UpdateProductRequest request)
    {
        var product = await repo.GetByIdAsync(id);
        if (product is null) return null;

        if (request.Name        is not null) product.Name        = request.Name;
        if (request.Category    is not null) product.Category    = request.Category;
        if (request.Status      is not null) product.Status      = request.Status;
        if (request.Price       is not null) product.Price       = request.Price.Value;
        if (request.Stock       is not null) product.Stock       = request.Stock.Value;
        if (request.Description is not null) product.Description = request.Description;

        var updated = await repo.UpdateAsync(product);
        return mapper.Map<ProductDto>(updated);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var product = await repo.GetByIdAsync(id);
        if (product is null) return false;
        await repo.DeleteAsync(product);
        return true;
    }
}
