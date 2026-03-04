using CommonFields.API.Data;
using CommonFields.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CommonFields.API.Repositories;

public class SavedSearchRepository(AppDbContext db) : ISavedSearchRepository
{
    public async Task<IEnumerable<SavedSearch>> QueryAsync(
        string? context, string? visibility, string? createdBy,
        bool includeGlobal, string currentUser)
    {
        var q = db.SavedSearches.AsQueryable();

        if (!string.IsNullOrEmpty(context))
            q = q.Where(s => s.Context == context);

        if (!string.IsNullOrEmpty(visibility))
        {
            q = q.Where(s => s.Visibility == visibility);
        }
        else if (includeGlobal)
        {
            // user's own searches + all global searches
            q = q.Where(s => s.CreatedBy == currentUser || s.Visibility == "global");
        }
        else if (!string.IsNullOrEmpty(createdBy))
        {
            q = q.Where(s => s.CreatedBy == createdBy);
        }
        else
        {
            q = q.Where(s => s.CreatedBy == currentUser);
        }

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
