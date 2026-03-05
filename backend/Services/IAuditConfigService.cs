using CommonFields.API.DTOs;

namespace CommonFields.API.Services;

public interface IAuditConfigService
{
    /// <summary>Auto-discovers all auditable tables+fields from the EF model and merges with saved config.</summary>
    Task<IEnumerable<AuditTableDto>> GetAllTablesAsync();

    /// <summary>Creates or updates the enabled/displayName config for a single field.</summary>
    Task<AuditFieldConfigDto> UpsertAsync(string tableName, string fieldName, bool isEnabled, string? displayName);

    /// <summary>Batch-upserts multiple fields for a table in a single DB save.</summary>
    Task<IEnumerable<AuditFieldConfigDto>> BatchUpsertAsync(string tableName, IEnumerable<BatchUpdateAuditFieldItem> items);
}
