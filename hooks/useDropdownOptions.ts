'use client';

import { useQuery } from '@tanstack/react-query';
import {
  fetchDropdownOptions,
  fetchCategories,
  fetchCountries,
  fetchCities,
  type FetchDropdownOptionsParams,
} from '@/lib/api/dropdownOptions';
import { DropdownOption } from '@/components/DynamicSearch/types';

// Query keys factory
export const dropdownKeys = {
  all: ['dropdownOptions'] as const,
  list: (url: string) => [...dropdownKeys.all, url] as const,
};

// Generic hook - reusable for any dropdown endpoint
export function useDropdownOptions(
  params: FetchDropdownOptionsParams,
  options?: { enabled?: boolean }
) {
  return useQuery<DropdownOption[], Error>({
    queryKey: dropdownKeys.list(params.url),
    queryFn: () => fetchDropdownOptions(params),
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });
}

// Specific hooks for known endpoints
export function useCategories(options?: { enabled?: boolean }) {
  return useQuery<DropdownOption[], Error>({
    queryKey: dropdownKeys.list('/api/categories'),
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });
}

export function useCountries(options?: { enabled?: boolean }) {
  return useQuery<DropdownOption[], Error>({
    queryKey: dropdownKeys.list('/api/countries'),
    queryFn: fetchCountries,
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });
}

export function useCities(options?: { enabled?: boolean }) {
  return useQuery<DropdownOption[], Error>({
    queryKey: dropdownKeys.list('/api/cities'),
    queryFn: fetchCities,
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });
}
