/**
 * Saved Searches API Service
 *
 * This service connects to .NET backend endpoints for managing saved searches.
 * Configure the API_BASE_URL in your environment or update it below.
 */

import { SavedSearch, SearchVisibility } from '@/components/DynamicSearch/types';

// Configure your .NET API base URL here or use environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// Saved searches endpoint - update this to match your .NET API
const SAVED_SEARCHES_ENDPOINT = `${API_BASE_URL}/api/savedsearches`;

// ============================================================================
// Types matching typical .NET API response format
// ============================================================================

// Request DTOs (what we send to .NET)
export interface CreateSavedSearchRequest {
  name: string;
  description?: string;
  context: string;  // e.g., 'products', 'orders', 'customers'
  visibility: SearchVisibility;
  params: Record<string, any>;  // The search parameters as JSON
}

export interface UpdateSavedSearchRequest {
  name?: string;
  description?: string;
  visibility?: SearchVisibility;
  params?: Record<string, any>;
}

// Response DTOs (what .NET returns)
export interface SavedSearchResponse {
  id: string;
  name: string;
  description?: string;
  context: string;
  visibility: SearchVisibility;
  params: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
  createdByName?: string;
}

// API response wrapper (common .NET pattern)
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

// Request body for searching/fetching saved searches (POST body, not URL params)
export interface SavedSearchQueryRequest {
  context?: string;       // Filter by context (e.g., 'products')
  visibility?: SearchVisibility; // Filter by specific visibility ('user' or 'global')
  createdBy?: string;     // Filter by user who created the search
  includeGlobal?: boolean; // When true, includes global searches along with user's searches
  userId?: string;        // Current user ID - used for visibility filtering
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch saved searches from .NET API using POST with JSON body
 *
 * Visibility logic:
 * - visibility: 'user' → only user's private searches
 * - visibility: 'global' → only global/shared searches
 * - includeGlobal: true → user's searches + all global searches (most common use case)
 * - No filters → all searches the user has access to
 *
 * The .NET backend should implement the following logic:
 * 1. If visibility='user': return searches WHERE createdBy = currentUser AND visibility = 'user'
 * 2. If visibility='global': return searches WHERE visibility = 'global'
 * 3. If includeGlobal=true: return searches WHERE (createdBy = currentUser) OR (visibility = 'global')
 */
export async function fetchSavedSearches(
  params: SavedSearchQueryRequest = {}
): Promise<SavedSearch[]> {
  const response = await fetch(`${SAVED_SEARCHES_ENDPOINT}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for authentication
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Failed to fetch saved searches: ${response.statusText}`);
  }

  const result = await response.json();

  // Handle both array response and wrapped response { data: [...] }
  const searches: SavedSearchResponse[] = Array.isArray(result) ? result : (result.data || []);

  // Map .NET response to frontend SavedSearch type
  return searches.map(mapResponseToSavedSearch);
}

/**
 * Fetch a single saved search by ID
 */
export async function fetchSavedSearch(id: string): Promise<SavedSearch> {
  const response = await fetch(`${SAVED_SEARCHES_ENDPOINT}/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Saved search not found');
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Failed to fetch saved search: ${response.statusText}`);
  }

  const result = await response.json();
  const search: SavedSearchResponse = result.data || result;

  return mapResponseToSavedSearch(search);
}

/**
 * Create a new saved search
 */
export async function createSavedSearch(
  input: CreateSavedSearchRequest
): Promise<SavedSearch> {
  const response = await fetch(SAVED_SEARCHES_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create saved search');
  }

  const result = await response.json();
  const search: SavedSearchResponse = result.data || result;

  return mapResponseToSavedSearch(search);
}

/**
 * Update an existing saved search
 */
export async function updateSavedSearch(
  id: string,
  input: UpdateSavedSearchRequest
): Promise<SavedSearch> {
  const response = await fetch(`${SAVED_SEARCHES_ENDPOINT}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to update saved search');
  }

  const result = await response.json();
  const search: SavedSearchResponse = result.data || result;

  return mapResponseToSavedSearch(search);
}

/**
 * Rename a saved search
 */
export async function renameSavedSearch(
  id: string,
  newName: string
): Promise<SavedSearch> {
  return updateSavedSearch(id, { name: newName });
}

/**
 * Change visibility of a saved search
 */
export async function changeSearchVisibility(
  id: string,
  visibility: SearchVisibility
): Promise<SavedSearch> {
  return updateSavedSearch(id, { visibility });
}

/**
 * Delete a saved search
 */
export async function deleteSavedSearch(id: string): Promise<void> {
  const response = await fetch(`${SAVED_SEARCHES_ENDPOINT}/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to delete saved search');
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Map .NET API response to frontend SavedSearch type
 */
function mapResponseToSavedSearch(response: SavedSearchResponse): SavedSearch {
  return {
    id: response.id,
    name: response.name,
    description: response.description,
    context: response.context,
    visibility: response.visibility,
    params: response.params,
    createdAt: response.createdAt,
    createdBy: response.createdBy,
  };
}

// Re-export types for convenience
export type { SavedSearch, SearchVisibility };

// Alias for backwards compatibility
export type SavedSearchQueryParams = SavedSearchQueryRequest;
