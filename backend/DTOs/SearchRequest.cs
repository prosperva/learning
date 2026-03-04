namespace CommonFields.API.DTOs;

public class SearchRequest
{
    public int Page { get; set; } = 0;
    public int PageSize { get; set; } = 25;
    public string SortField { get; set; } = "id";
    public string SortOrder { get; set; } = "asc";
    public string? Search { get; set; }
    public string? Category { get; set; }
    public string? Status { get; set; }
    public string? PriceRange { get; set; }
    public string? DateFrom { get; set; }
    public string? DateTo { get; set; }
}

public class AllProductsRequest
{
    public string SortField { get; set; } = "id";
    public string SortOrder { get; set; } = "asc";
    public string? Search { get; set; }
    public string? Category { get; set; }
    public string? Status { get; set; }
    public string? PriceRange { get; set; }
    public string? DateFrom { get; set; }
    public string? DateTo { get; set; }
}
