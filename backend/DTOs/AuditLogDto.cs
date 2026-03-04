namespace CommonFields.API.DTOs;

public class AuditChangeDto
{
    public string? Old { get; set; }
    public string? New { get; set; }
}

public class AuditLogDto
{
    public int Id { get; set; }
    public string TableName { get; set; } = string.Empty;
    public string RecordId { get; set; } = string.Empty;
    public string Operation { get; set; } = string.Empty;
    public string ModifiedBy { get; set; } = string.Empty;
    public DateTime ModifiedDate { get; set; }
    public Dictionary<string, AuditChangeDto> Changes { get; set; } = new();
}
