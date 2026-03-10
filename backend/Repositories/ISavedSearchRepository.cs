using CommonFields.API.Models;

namespace CommonFields.API.Repositories;

public interface ISavedSearchRepository
{
    Task<IEnumerable<SavedSearch>> QueryAsync(string currentUser, string? context = null);
    Task<SavedSearch?> GetByIdAsync(Guid id);
    Task<SavedSearch>  AddAsync(SavedSearch entity);
    Task<SavedSearch>  UpdateAsync(SavedSearch entity);
    Task               DeleteAsync(SavedSearch entity);
}
