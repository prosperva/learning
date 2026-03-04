using CommonFields.API.DTOs;

namespace CommonFields.API.Services;

public interface IProductService
{
    Task<PagedResult<ProductDto>> SearchAsync(SearchRequest request);
    Task<PagedResult<ProductDto>> GetAllAsync(AllProductsRequest request);
    Task<ProductDto?> GetByIdAsync(int id);
    Task<ProductDto> CreateAsync(CreateProductRequest request);
    Task<ProductDto?> UpdateAsync(int id, UpdateProductRequest request);
    Task<bool> DeleteAsync(int id);
}
