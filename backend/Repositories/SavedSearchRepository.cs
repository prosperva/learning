using CommonFields.API.Data;
using CommonFields.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CommonFields.API.Repositories;

public class SavedSearchRepository(AppDbContext db) : ISavedSearchRepository
{
    public async Task<IEnumerable<SavedSearch>> QueryAsync(string currentUser, string? context = null)
    {
        var q = db.SavedSearches
            .Where(s => s.CreatedBy == currentUser || s.Visibility == "global");

        if (!string.IsNullOrEmpty(context))
            q = q.Where(s => s.Context == context);

        return await q.OrderByDescending(s => s.CreatedAt).ToListAsync();
    }

    public Task<SavedSearch?> GetByIdAsync(Guid id) =>
        db.SavedSearches.FirstOrDefaultAsync(s => s.Id == id);

    public async Task<SavedSearch> AddAsync(SavedSearch entity)
    {
        db.SavedSearches.Add(entity);
        await db.SaveChangesAsync();
        return entity;
    }

    public async Task<SavedSearch> UpdateAsync(SavedSearch entity)
    {
        db.SavedSearches.Update(entity);
        await db.SaveChangesAsync();
        return entity;
    }

    public async Task DeleteAsync(SavedSearch entity)
    {
        db.SavedSearches.Remove(entity);
        await db.SaveChangesAsync();
    }
}
