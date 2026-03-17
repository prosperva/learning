namespace CommonFields.API.Models;

public class AuditRouteConfig
{
    public int    Id        { get; set; }
    public string Route     { get; set; } = string.Empty;  // URL key,  e.g. "orders"
    public string TableName { get; set; } = string.Empty;  // DB table, e.g. "Orders"
}
