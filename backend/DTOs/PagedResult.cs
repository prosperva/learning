namespace CommonFields.API.DTOs;

public class PagedResult<T>
{
    public IEnumerable<T> Data { get; set; } = Enumerable.Empty<T>();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }

    public static PagedResult<T> Create(IEnumerable<T> items, int total, int page, int pageSize) => new()
    {
        Data = items,
        Total = total,
        Page = page,
        PageSize = pageSize,
        TotalPages = pageSize > 0 ? (int)Math.Ceiling(total / (double)pageSize) : 1,
    };
}
