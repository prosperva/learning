using System.Text.Json;

namespace CommonFields.API.DTOs;

public class SavedSearchDto
{
    public Guid                    Id          { get; set; }
    public string                  Name        { get; set; } = string.Empty;
    public string?                 Description { get; set; }
    public string                  Context     { get; set; } = string.Empty;
    public string                  Visibility  { get; set; } = "user";
    public JsonElement             Params      { get; set; }
    public DateTime                CreatedAt   { get; set; }
    public DateTime?               UpdatedAt   { get; set; }
    public string                  CreatedBy   { get; set; } = string.Empty;
}

public class CreateSavedSearchRequest
{
    public string                  Name        { get; set; } = string.Empty;
    public string?                 Description { get; set; }
    public string                  Context     { get; set; } = string.Empty;
    public string                  Visibility  { get; set; } = "user";
    public JsonElement             Params      { get; set; }
}

public class UpdateSavedSearchRequest
{
    public Guid    Id         { get; set; }
    public string? Name       { get; set; }
    public string? Visibility { get; set; }
}

public class SavedSearchQueryRequest
{
    public string? Context     { get; set; }
    public string  CurrentUser { get; set; } = string.Empty;
}
