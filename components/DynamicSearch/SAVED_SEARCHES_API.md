# Saved Searches API Integration

This document explains how to integrate the DynamicSearch component with a .NET backend for saved searches.

## Overview

The saved searches feature allows users to save their search parameters and reload them later. The implementation uses:

- **API Service**: `lib/api/savedSearches.ts` - Functions to call .NET endpoints
- **React Query Hook**: `hooks/useSavedSearches.ts` - React Query hooks for data fetching and mutations

## Visibility Logic (User vs Global)

Saved searches have two visibility types:
- **`user`**: Private to the user who created it
- **`global`**: Shared/visible to all users

**Authorization Rules:**
- A user can only **update/delete** searches they created (regardless of visibility)
- A user can **view** their own searches + all global searches
- Creating a `global` search makes it visible to everyone, but only the creator can modify/delete it

The frontend typically requests searches with `includeGlobal: true` to show:
1. All searches created by the current user (both `user` and `global` visibility)
2. All `global` searches created by other users

Your .NET backend should implement this logic in the search endpoint.

---

## .NET API Endpoints Required

Your .NET backend should implement these endpoints:

### POST /api/savedsearches/search

Fetch saved searches with filters (using POST body instead of query params).

**Request Body:**
```json
{
  "context": "products",
  "visibility": "user",
  "createdBy": "user@example.com",
  "includeGlobal": true,
  "userId": "current-user@example.com"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `context` | string | Filter by context (e.g., 'products', 'orders') |
| `visibility` | string | Filter by specific visibility ('user' or 'global') |
| `createdBy` | string | Filter by user ID/email |
| `includeGlobal` | boolean | When true, includes user's searches + all global searches |
| `userId` | string | Current user ID - used for visibility filtering |

**Backend Logic for `includeGlobal`:**
```csharp
// When includeGlobal = true:
// Return searches where (createdBy == currentUser) OR (visibility == "global")

// When visibility = "user":
// Return searches where createdBy == currentUser AND visibility == "user"

// When visibility = "global":
// Return searches where visibility == "global"
```

**Response:**
```json
[
  {
    "id": "guid-or-string-id",
    "name": "My Search",
    "description": "Optional description",
    "context": "products",
    "visibility": "user",
    "params": { "category": "electronics", "status": "active" },
    "createdAt": "2024-01-15T10:30:00Z",
    "createdBy": "user@example.com",
    "createdByName": "John Doe"
  }
]
```

### GET /api/savedsearches

Fetch all saved searches (simpler alternative to POST /search).

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `context` | string | Filter by context (e.g., 'products', 'orders') |
| `userId` | string | Current user ID - required for visibility filtering |

**Example:** `GET /api/savedsearches?context=products&userId=user@example.com`

**Response:** Same array format as POST /search endpoint.

### GET /api/savedsearches/{id}

Fetch a single saved search by ID.

**Response:**
```json
{
  "id": "guid-or-string-id",
  "name": "My Search",
  "description": "Optional description",
  "context": "products",
  "visibility": "user",
  "params": { "category": "electronics", "status": "active" },
  "createdAt": "2024-01-15T10:30:00Z",
  "createdBy": "user@example.com"
}
```

### POST /api/savedsearches

Create a new saved search.

**Request Body:**
```json
{
  "name": "My Search",
  "description": "Optional description",
  "context": "products",
  "visibility": "user",
  "params": { "category": "electronics", "status": "active" }
}
```

**Response:** Returns the created saved search object.

### PUT /api/savedsearches/{id}

Update an existing saved search.

**Authorization:** User can only update searches they created.

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "visibility": "global",
  "params": { "category": "clothing" }
}
```

**Response:** Returns the updated saved search object.

### DELETE /api/savedsearches/{id}

Delete a saved search.

**Authorization:** User can only delete searches they created (regardless of visibility).

**Response:** 204 No Content or 200 OK

---

## .NET Example Implementation

### Entity Model

```csharp
public class SavedSearch
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Context { get; set; } = string.Empty;
    public string Visibility { get; set; } = "user"; // "user" or "global"
    public string Params { get; set; } = "{}"; // JSON string
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
}
```

### Controller

```csharp
[ApiController]
[Route("api/[controller]")]
public class SavedSearchesController : ControllerBase
{
    private readonly ISavedSearchService _service;

    public SavedSearchesController(ISavedSearchService service)
    {
        _service = service;
    }

    // POST /api/savedsearches/search - Search with JSON body (no query params)
    [HttpPost("search")]
    public async Task<IActionResult> Search([FromBody] SearchSavedSearchesDto dto)
    {
        // userId comes from the frontend request body
        var result = await _service.SearchAsync(
            dto.Context,
            dto.Visibility,
            dto.CreatedBy,
            dto.IncludeGlobal ?? true,
            dto.UserId);

        return Ok(result);
    }

    // GET /api/savedsearches - Get all saved searches (alternative to POST search)
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? context, [FromQuery] string? userId)
    {
        var result = await _service.SearchAsync(
            context,
            null,    // visibility
            null,    // createdBy
            true,    // includeGlobal
            userId);

        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    // POST /api/savedsearches - Create new saved search
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSavedSearchDto dto)
    {
        var userId = User.Identity?.Name;
        var result = await _service.CreateAsync(dto, userId);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    // User can only update searches they created
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSavedSearchDto dto)
    {
        var userId = User.Identity?.Name;
        var existing = await _service.GetByIdAsync(id);

        if (existing == null) return NotFound();
        if (existing.CreatedBy != userId) return Forbid(); // Only creator can update

        var result = await _service.UpdateAsync(id, dto);
        return Ok(result);
    }

    // User can only delete searches they created (regardless of visibility)
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = User.Identity?.Name;
        var existing = await _service.GetByIdAsync(id);

        if (existing == null) return NotFound();
        if (existing.CreatedBy != userId) return Forbid(); // Only creator can delete

        await _service.DeleteAsync(id);
        return NoContent();
    }
}
```

### DTOs

```csharp
// Request DTO for searching saved searches (POST body)
public class SearchSavedSearchesDto
{
    public string? Context { get; set; }
    public string? Visibility { get; set; }  // "user" or "global"
    public string? CreatedBy { get; set; }
    public bool? IncludeGlobal { get; set; } // Include global searches with user's searches
    public string? UserId { get; set; }      // Current user ID from frontend
}

public class CreateSavedSearchDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Context { get; set; } = string.Empty;
    public string Visibility { get; set; } = "user";
    public Dictionary<string, object> Params { get; set; } = new();
}

public class UpdateSavedSearchDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Visibility { get; set; }
    public Dictionary<string, object>? Params { get; set; }
}

public class SavedSearchResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Context { get; set; } = string.Empty;
    public string Visibility { get; set; } = string.Empty;
    public Dictionary<string, object> Params { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
}
```

### Service Implementation (Visibility Logic)

```csharp
public async Task<List<SavedSearchResponseDto>> SearchAsync(
    string? context,
    string? visibility,
    string? createdBy,
    bool includeGlobal,
    string? userId)  // userId comes from frontend request
{
    var query = _context.SavedSearches.AsQueryable();

    // Filter by context if provided
    if (!string.IsNullOrEmpty(context))
    {
        query = query.Where(s => s.Context == context);
    }

    // Handle visibility filtering
    if (!string.IsNullOrEmpty(visibility))
    {
        // Specific visibility requested
        query = query.Where(s => s.Visibility == visibility);

        // If requesting user searches, also filter by current user
        if (visibility == "user" && !string.IsNullOrEmpty(userId))
        {
            query = query.Where(s => s.CreatedBy == userId);
        }
    }
    else if (includeGlobal && !string.IsNullOrEmpty(userId))
    {
        // Include user's own searches + all global searches
        query = query.Where(s =>
            s.CreatedBy == userId ||
            s.Visibility == "global");
    }
    else if (!string.IsNullOrEmpty(createdBy))
    {
        // Filter by specific user
        query = query.Where(s => s.CreatedBy == createdBy);
    }

    // Return all matching searches ordered by creation date
    var searches = await query
        .OrderByDescending(s => s.CreatedAt)
        .Select(s => new SavedSearchResponseDto
        {
            Id = s.Id,
            Name = s.Name,
            Description = s.Description,
            Context = s.Context,
            Visibility = s.Visibility,
            Params = JsonSerializer.Deserialize<Dictionary<string, object>>(s.Params),
            CreatedAt = s.CreatedAt,
            UpdatedAt = s.UpdatedAt,
            CreatedBy = s.CreatedBy
        })
        .ToListAsync();

    return searches;
}
```

---

## Frontend Integration

### 1. Configure API Base URL

Set your .NET API URL in `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-api.example.com
```

Or update `lib/api/savedSearches.ts` directly:

```typescript
const API_BASE_URL = 'https://your-api.example.com';
```

### 2. Use in Your Page Component

```tsx
import {
  useSavedSearches,
  useCreateSavedSearch,
  useRenameSavedSearch,
  useChangeSearchVisibility,
  useDeleteSavedSearch,
} from '@/hooks/useSavedSearches';

export default function ProductsPage() {
  // Fetch saved searches for this context
  const { data: savedSearches = [], isLoading } = useSavedSearches({
    context: 'products',
    includeGlobal: true,
  });

  // Mutations for CRUD operations
  const createMutation = useCreateSavedSearch();
  const renameMutation = useRenameSavedSearch();
  const visibilityMutation = useChangeSearchVisibility();
  const deleteMutation = useDeleteSavedSearch();

  // Handlers
  const handleSaveSearch = (search: SavedSearch) => {
    createMutation.mutate({
      name: search.name,
      description: search.description,
      context: 'products',
      visibility: search.visibility,
      params: search.params,
    });
  };

  const handleDeleteSearch = (searchId: string) => {
    deleteMutation.mutate(searchId);
  };

  const handleRenameSearch = (searchId: string, newName: string) => {
    renameMutation.mutate({ id: searchId, name: newName });
  };

  const handleChangeVisibility = (searchId: string, visibility: 'user' | 'global') => {
    visibilityMutation.mutate({ id: searchId, visibility });
  };

  return (
    <DynamicSearch
      fields={searchFields}
      onSearch={handleSearch}
      savedSearches={savedSearches}
      enableSaveSearch={true}
      onSave={handleSaveSearch}
      onDelete={handleDeleteSearch}
      onRename={handleRenameSearch}
      onChangeVisibility={handleChangeVisibility}
      currentUser="user@example.com"
      searchContext="products"
    />
  );
}
```

### 3. Handle Loading and Error States

```tsx
const { data: savedSearches = [], isLoading, isError, error } = useSavedSearches({
  context: 'products',
});

// Show loading state
if (isLoading) {
  return <CircularProgress />;
}

// Show error
if (isError) {
  return <Alert severity="error">Failed to load saved searches: {error.message}</Alert>;
}

// Handle mutation states
const handleSaveSearch = (search: SavedSearch) => {
  createMutation.mutate(
    { name: search.name, context: 'products', visibility: search.visibility, params: search.params },
    {
      onSuccess: () => {
        // Show success notification
        alert('Search saved successfully!');
      },
      onError: (error) => {
        // Show error notification
        alert(`Failed to save search: ${error.message}`);
      },
    }
  );
};
```

---

## CORS Configuration

If your .NET API is on a different domain, configure CORS:

```csharp
// Program.cs
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "https://your-frontend.com")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ...

app.UseCors("AllowFrontend");
```

---

## Authentication

The API service includes `credentials: 'include'` for cookie-based authentication. If you're using JWT tokens, modify the fetch calls in `lib/api/savedSearches.ts`:

```typescript
const response = await fetch(url, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAccessToken()}`, // Add your token logic
  },
});
```
