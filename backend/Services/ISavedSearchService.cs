using CommonFields.API.DTOs;

namespace CommonFields.API.Services;

public interface ISavedSearchService
{
    Task<IEnumerable<SavedSearchDto>> QueryAsync(SavedSearchQueryRequest request);
    Task<SavedSearchDto?>             GetByIdAsync(Guid id);
    Task<SavedSearchDto>              CreateAsync(CreateSavedSearchRequest request);
    Task<SavedSearchDto?>             UpdateAsync(UpdateSavedSearchRequest request);
    Task<bool>                        DeleteAsync(Guid id);
}
