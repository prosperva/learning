using System.Text.Json;
using CommonFields.API.DTOs;
using CommonFields.API.Models;
using CommonFields.API.Repositories;

namespace CommonFields.API.Services;

public class SavedSearchService(ISavedSearchRepository repo) : ISavedSearchService
{
    public async Task<IEnumerable<SavedSearchDto>> QueryAsync(SavedSearchQueryRequest request)
    {
        var results = await repo.QueryAsync(request.CurrentUser, request.Context);
        return results.Select(ToDto);
    }

    public async Task<SavedSearchDto?> GetByIdAsync(Guid id)
    {
        var entity = await repo.GetByIdAsync(id);
        return entity is null ? null : ToDto(entity);
    }

    public async Task<SavedSearchDto> CreateAsync(CreateSavedSearchRequest request)
    {
        var entity = new SavedSearch
        {
            Id          = Guid.NewGuid(),
            Name        = request.Name,
            Description = request.Description,
            Context     = request.Context,
            Visibility  = request.Visibility,
            Params      = request.Params,
            CreatedBy   = request.CreatedBy,
        };

        var saved = await repo.AddAsync(entity);
        return ToDto(saved);
    }

    public async Task<SavedSearchDto?> UpdateAsync(UpdateSavedSearchRequest request)
    {
        var entity = await repo.GetByIdAsync(request.Id);
        if (entity is null) return null;

        if (request.Name       is not null) entity.Name       = request.Name;
        if (request.Visibility is not null) entity.Visibility = request.Visibility;

        var updated = await repo.UpdateAsync(entity);
        return ToDto(updated);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var entity = await repo.GetByIdAsync(id);
        if (entity is null) return false;
        await repo.DeleteAsync(entity);
        return true;
    }

    private static SavedSearchDto ToDto(SavedSearch s) => new()
    {
        Id          = s.Id,
        Name        = s.Name,
        Description = s.Description,
        Context     = s.Context,
        Visibility  = s.Visibility,
        Params      = JsonSerializer.Deserialize<JsonElement>(s.Params),
        CreatedAt   = s.CreatedAt,
        UpdatedAt   = s.ModifiedAt,
        CreatedBy   = s.CreatedBy ?? string.Empty,
    };
}
