namespace CommonFields.API.Models;

public class SavedSearch : AuditableEntity
{
    public Guid   Id          { get; set; } = Guid.NewGuid();
    public string Name        { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Context     { get; set; } = string.Empty; // e.g. "products"
    public string Visibility  { get; set; } = "user";       // "user" | "global"
    public string Params      { get; set; } = "{}";         // JSON blob
}
