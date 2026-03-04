using CommonFields.API.Data;
using CommonFields.API.DTOs;
using CommonFields.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CommonFields.API.Repositories;

public class ProductRepository(AppDbContext db) : IProductRepository
{
    public async Task<(IEnumerable<Product> Items, int Total)> SearchAsync(SearchRequest req)
    {
        var query = BuildFilteredQuery(db.Products, req.Search, req.Category, req.Status, req.PriceRange, req.DateFrom, req.DateTo);
        query = ApplySort(query, req.SortField, req.SortOrder);

        var total = await query.CountAsync();
        var items = await query
            .Skip(req.Page * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync();

        return (items, total);
    }

    public async Task<IEnumerable<Product>> GetAllAsync(AllProductsRequest req)
    {
        var query = BuildFilteredQuery(db.Products, req.Search, req.Category, req.Status, req.PriceRange, req.DateFrom, req.DateTo);
        query = ApplySort(query, req.SortField, req.SortOrder);
        return await query.ToListAsync();
    }

    public Task<Product?> GetByIdAsync(int id) =>
        db.Products.FirstOrDefaultAsync(p => p.Id == id);

    public async Task<Product> CreateAsync(Product product)
    {
        db.Products.Add(product);
        await db.SaveChangesAsync();
        return product;
    }

    public async Task<Product> UpdateAsync(Product product)
    {
        db.Products.Update(product);
        await db.SaveChangesAsync();
        return product;
    }

    public async Task DeleteAsync(Product product)
    {
        db.Products.Remove(product);
        await db.SaveChangesAsync();
    }

    // --- helpers ---

    private static IQueryable<Product> BuildFilteredQuery(
        IQueryable<Product> query,
        string? search, string? category, string? status,
        string? priceRange, string? dateFrom, string? dateTo)
    {
        if (!string.IsNullOrEmpty(search))
            query = query.Where(p =>
                p.Name.Contains(search) || p.Description.Contains(search));

        if (!string.IsNullOrEmpty(category))
            query = query.Where(p => p.Category == category);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(p => p.Status == status);

        if (!string.IsNullOrEmpty(priceRange))
        {
            var parts = priceRange.Split('-');
            if (parts.Length == 2)
            {
                if (decimal.TryParse(parts[0], out var min))
                    query = query.Where(p => p.Price >= min);
                if (decimal.TryParse(parts[1], out var max))
                    query = query.Where(p => p.Price <= max);
            }
        }

        if (DateTime.TryParse(dateFrom, out var from))
            query = query.Where(p => p.CreatedAt >= from);

        if (DateTime.TryParse(dateTo, out var to))
            query = query.Where(p => p.CreatedAt <= to);

        return query;
    }

    private static IQueryable<Product> ApplySort(IQueryable<Product> query, string field, string order)
    {
        bool asc = order.Equals("asc", StringComparison.OrdinalIgnoreCase);
        return field.ToLower() switch
        {
            "name"      => asc ? query.OrderBy(p => p.Name)      : query.OrderByDescending(p => p.Name),
            "category"  => asc ? query.OrderBy(p => p.Category)  : query.OrderByDescending(p => p.Category),
            "status"    => asc ? query.OrderBy(p => p.Status)    : query.OrderByDescending(p => p.Status),
            "price"     => asc ? query.OrderBy(p => p.Price)     : query.OrderByDescending(p => p.Price),
            "stock"     => asc ? query.OrderBy(p => p.Stock)     : query.OrderByDescending(p => p.Stock),
            "createdat" => asc ? query.OrderBy(p => p.CreatedAt) : query.OrderByDescending(p => p.CreatedAt),
            _           => asc ? query.OrderBy(p => p.Id)        : query.OrderByDescending(p => p.Id),
        };
    }
}
