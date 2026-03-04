using CommonFields.API.Models;

namespace CommonFields.API.Repositories;

public interface ISavedSearchRepository
{
    Task<IEnumerable<SavedSearch>> QueryAsync(string? context, string? visibility, string? createdBy, bool includeGlobal, string currentUser);
    Task<SavedSearch?> GetByIdAsync(Guid id);
    Task<SavedSearch>  AddAsync(SavedSearch entity);
    Task<SavedSearch>  UpdateAsync(SavedSearch entity);
    Task               DeleteAsync(SavedSearch entity);
}
