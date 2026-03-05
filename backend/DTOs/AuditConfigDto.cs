namespace CommonFields.API.DTOs;

public class AuditFieldConfigDto
{
    public string FieldName   { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;  // resolved: DisplayName ?? FieldName
    public bool   IsEnabled   { get; set; }
}

public class AuditTableDto
{
    public string                           TableName { get; set; } = string.Empty;
    public IEnumerable<AuditFieldConfigDto> Fields    { get; set; } = [];
}

public class UpdateAuditFieldRequest
{
    public bool    IsEnabled   { get; set; }
    public string? DisplayName { get; set; }
}

public class BatchUpdateAuditFieldItem
{
    public string  FieldName   { get; set; } = string.Empty;
    public bool    IsEnabled   { get; set; }
    public string? DisplayName { get; set; }
}
