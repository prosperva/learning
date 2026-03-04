using CommonFields.API.DTOs;
using CommonFields.API.Models;

namespace CommonFields.API.Repositories;

public interface IProductRepository
{
    Task<(IEnumerable<Product> Items, int Total)> SearchAsync(SearchRequest request);
    Task<IEnumerable<Product>> GetAllAsync(AllProductsRequest request);
    Task<Product?> GetByIdAsync(int id);
    Task<Product> CreateAsync(Product product);
    Task<Product> UpdateAsync(Product product);
    Task DeleteAsync(Product product);
}
