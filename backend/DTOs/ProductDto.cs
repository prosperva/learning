namespace CommonFields.API.DTOs;

public class ProductDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateProductRequest
{
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Status { get; set; } = "active";
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public string Description { get; set; } = string.Empty;
}

public class UpdateProductRequest
{
    public string? Name { get; set; }
    public string? Category { get; set; }
    public string? Status { get; set; }
    public decimal? Price { get; set; }
    public int? Stock { get; set; }
    public string? Description { get; set; }
}
