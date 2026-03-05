namespace CommonFields.API.Models;

public class AuditFieldConfig
{
    public int     Id          { get; set; }
    public string  TableName   { get; set; } = string.Empty;
    public string  FieldName   { get; set; } = string.Empty;
    public bool    IsEnabled   { get; set; } = false;
    public string? DisplayName { get; set; }   // null → UI falls back to FieldName
}
