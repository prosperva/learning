'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSavedSearches,
  fetchSavedSearch,
  createSavedSearch,
  updateSavedSearch,
  renameSavedSearch,
  changeSearchVisibility,
  deleteSavedSearch,
  type SavedSearchQueryParams,
  type CreateSavedSearchRequest,
  type UpdateSavedSearchRequest,
  type SavedSearch,
  type SearchVisibility,
} from '@/lib/api/savedSearches';

// ============================================================================
// Query Keys Factory
// ============================================================================

export const savedSearchKeys = {
  all: ['savedSearches'] as const,
  lists: () => [...savedSearchKeys.all, 'list'] as const,
  list: (params: SavedSearchQueryParams) => [...savedSearchKeys.lists(), params] as const,
  details: () => [...savedSearchKeys.all, 'detail'] as const,
  detail: (id: string) => [...savedSearchKeys.details(), id] as const,
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook for fetching saved searches
 *
 * @param params - Query parameters (context, visibility, etc.)
 * @param options - React Query options
 *
 * @example
 * ```tsx
 * const { data: savedSearches, isLoading } = useSavedSearches({
 *   context: 'products',
 *   includeGlobal: true,
 * });
 * ```
 */
export function useSavedSearches(
  params: SavedSearchQueryParams = {},
  options?: { enabled?: boolean }
) {
  return useQuery<SavedSearch[], Error>({
    queryKey: savedSearchKeys.list(params),
    queryFn: () => fetchSavedSearches(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook for fetching a single saved search by ID
 */
export function useSavedSearch(
  id: string,
  options?: { enabled?: boolean }
) {
  return useQuery<SavedSearch, Error>({
    queryKey: savedSearchKeys.detail(id),
    queryFn: () => fetchSavedSearch(id),
    enabled: (options?.enabled ?? true) && !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for creating a new saved search
 *
 * @example
 * ```tsx
 * const createMutation = useCreateSavedSearch();
 *
 * const handleSave = (search: SavedSearch) => {
 *   createMutation.mutate({
 *     name: search.name,
 *     context: 'products',
 *     visibility: search.visibility,
 *     params: search.params,
 *   });
 * };
 * ```
 */
export function useCreateSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation<SavedSearch, Error, CreateSavedSearchRequest>({
    mutationFn: createSavedSearch,
    onSuccess: (newSearch) => {
      // Invalidate all saved search lists to refetch
      queryClient.invalidateQueries({ queryKey: savedSearchKeys.lists() });

      // Optionally set the new search in cache
      queryClient.setQueryData(savedSearchKeys.detail(newSearch.id), newSearch);
    },
  });
}

/**
 * Hook for updating a saved search
 */
export function useUpdateSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation<SavedSearch, Error, { id: string; data: UpdateSavedSearchRequest }>({
    mutationFn: ({ id, data }) => updateSavedSearch(id, data),
    onSuccess: (updatedSearch) => {
      // Update the specific search in cache
      queryClient.setQueryData(savedSearchKeys.detail(updatedSearch.id), updatedSearch);
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: savedSearchKeys.lists() });
    },
  });
}

/**
 * Hook for renaming a saved search
 *
 * @example
 * ```tsx
 * const renameMutation = useRenameSavedSearch();
 *
 * const handleRename = (searchId: string, newName: string) => {
 *   renameMutation.mutate({ id: searchId, name: newName });
 * };
 * ```
 */
export function useRenameSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation<SavedSearch, Error, { id: string; name: string }>({
    mutationFn: ({ id, name }) => renameSavedSearch(id, name),
    onSuccess: (updatedSearch) => {
      queryClient.setQueryData(savedSearchKeys.detail(updatedSearch.id), updatedSearch);
      queryClient.invalidateQueries({ queryKey: savedSearchKeys.lists() });
    },
  });
}

/**
 * Hook for changing saved search visibility
 *
 * @example
 * ```tsx
 * const visibilityMutation = useChangeSearchVisibility();
 *
 * const handleChangeVisibility = (searchId: string, visibility: SearchVisibility) => {
 *   visibilityMutation.mutate({ id: searchId, visibility });
 * };
 * ```
 */
export function useChangeSearchVisibility() {
  const queryClient = useQueryClient();

  return useMutation<SavedSearch, Error, { id: string; visibility: SearchVisibility }>({
    mutationFn: ({ id, visibility }) => changeSearchVisibility(id, visibility),
    onSuccess: (updatedSearch) => {
      queryClient.setQueryData(savedSearchKeys.detail(updatedSearch.id), updatedSearch);
      queryClient.invalidateQueries({ queryKey: savedSearchKeys.lists() });
    },
  });
}

/**
 * Hook for deleting a saved search
 *
 * @example
 * ```tsx
 * const deleteMutation = useDeleteSavedSearch();
 *
 * const handleDelete = (searchId: string) => {
 *   deleteMutation.mutate(searchId);
 * };
 * ```
 */
export function useDeleteSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteSavedSearch,
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: savedSearchKeys.detail(deletedId) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: savedSearchKeys.lists() });
    },
  });
}

// Re-export types for convenience
export type {
  SavedSearch,
  SearchVisibility,
  SavedSearchQueryParams,
  CreateSavedSearchRequest,
  UpdateSavedSearchRequest,
};
