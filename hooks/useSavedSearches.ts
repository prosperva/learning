'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSavedSearches,
  fetchSavedSearch,
  createSavedSearch,
  updateSavedSearch,
  deleteSavedSearch,
  type SavedSearchQueryParams,
  type CreateSavedSearchRequest,
  type UpdateSavedSearchRequest,
  type SavedSearch,
  type SearchVisibility,
} from '@/lib/api/savedSearches';

export const savedSearchKeys = {
  all: ['savedSearches'] as const,
  lists: () => [...savedSearchKeys.all, 'list'] as const,
  list: (params: SavedSearchQueryParams) => [...savedSearchKeys.lists(), params] as const,
  details: () => [...savedSearchKeys.all, 'detail'] as const,
  detail: (id: string) => [...savedSearchKeys.details(), id] as const,
};

export function useSavedSearches(params: SavedSearchQueryParams = {}, options?: { enabled?: boolean }) {
  return useQuery<SavedSearch[], Error>({
    queryKey: savedSearchKeys.list(params),
    queryFn: () => fetchSavedSearches(params),
    enabled: options?.enabled ?? true,
  });
}

export function useSavedSearch(id: string, options?: { enabled?: boolean }) {
  return useQuery<SavedSearch, Error>({
    queryKey: savedSearchKeys.detail(id),
    queryFn: () => fetchSavedSearch(id),
    enabled: (options?.enabled ?? true) && !!id,
  });
}

export function useCreateSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation<SavedSearch, Error, CreateSavedSearchRequest>({
    mutationFn: createSavedSearch,
    onSuccess: (newSearch) => {
      queryClient.invalidateQueries({ queryKey: savedSearchKeys.lists() });
      queryClient.setQueryData(savedSearchKeys.detail(newSearch.id), newSearch);
    },
  });
}

export function useUpdateSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation<SavedSearch, Error, UpdateSavedSearchRequest>({
    mutationFn: updateSavedSearch,
    onSuccess: (updatedSearch) => {
      queryClient.setQueryData(savedSearchKeys.detail(updatedSearch.id), updatedSearch);
      queryClient.invalidateQueries({ queryKey: savedSearchKeys.lists() });
    },
  });
}

export function useDeleteSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteSavedSearch,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: savedSearchKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: savedSearchKeys.lists() });
    },
  });
}

export type { SavedSearch, SearchVisibility, SavedSearchQueryParams, CreateSavedSearchRequest, UpdateSavedSearchRequest };
