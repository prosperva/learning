import { SavedSearch, SearchVisibility } from '@/components/DynamicSearch/types';

const SAVED_SEARCHES_ENDPOINT = '/api/savedsearches';

// ── Request types ─────────────────────────────────────────────────────────────

export interface CreateSavedSearchRequest {
  name: string;
  context: string;
  visibility: SearchVisibility;
  params: Record<string, any>;
  createdBy: string;
}

export interface UpdateSavedSearchRequest {
  id: string;
  name?: string;
  visibility?: SearchVisibility;
}

export interface SavedSearchQueryParams {
  context?: string;
  user?: string;
}

// ── Response type ─────────────────────────────────────────────────────────────

interface SavedSearchResponse {
  id: string;
  name: string;
  context: string;
  visibility: SearchVisibility;
  params: Record<string, any>;
  createdAt: string;
  createdBy: string;
}

// ── API functions ─────────────────────────────────────────────────────────────

export async function fetchSavedSearches(params: SavedSearchQueryParams = {}): Promise<SavedSearch[]> {
  const query = new URLSearchParams();
  if (params.context) query.set('context', params.context);
  if (params.user) query.set('user', params.user);
  const response = await fetch(`${SAVED_SEARCHES_ENDPOINT}?${query}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Failed to fetch saved searches: ${response.statusText}`);
  }

  const result = await response.json();
  const searches: SavedSearchResponse[] = Array.isArray(result) ? result : (result.data || []);
  return searches.map(mapResponseToSavedSearch);
}

export async function fetchSavedSearch(id: string): Promise<SavedSearch> {
  const response = await fetch(`${SAVED_SEARCHES_ENDPOINT}/${id}`, {
    credentials: 'include',
  });

  if (!response.ok) throw new Error('Saved search not found');

  const result = await response.json();
  return mapResponseToSavedSearch(result.data || result);
}

export async function createSavedSearch(input: CreateSavedSearchRequest): Promise<SavedSearch> {
  const response = await fetch(SAVED_SEARCHES_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ ...input, params: JSON.stringify(input.params) }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create saved search');
  }

  const result = await response.json();
  return mapResponseToSavedSearch(result.data || result);
}

export async function updateSavedSearch(input: UpdateSavedSearchRequest): Promise<SavedSearch> {
  const response = await fetch(SAVED_SEARCHES_ENDPOINT, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to update saved search');
  }

  const result = await response.json();
  return mapResponseToSavedSearch(result.data || result);
}

export async function deleteSavedSearch(id: string): Promise<void> {
  const response = await fetch(`${SAVED_SEARCHES_ENDPOINT}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to delete saved search');
  }
}

// ── Helper ────────────────────────────────────────────────────────────────────

function mapResponseToSavedSearch(response: SavedSearchResponse): SavedSearch {
  return {
    id: response.id,
    name: response.name,
    context: response.context,
    visibility: response.visibility,
    params: typeof response.params === 'string' ? JSON.parse(response.params) : response.params,
    createdAt: response.createdAt,
    createdBy: response.createdBy,
  };
}

export type { SavedSearch, SearchVisibility };
