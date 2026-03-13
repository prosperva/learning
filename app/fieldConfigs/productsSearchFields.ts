'use client';

import { useMemo } from 'react';
import { FieldConfig } from '@/components/DynamicSearch/types';
import { useCities } from '@/hooks/useDropdownOptions';

/**
 * Hook that returns the search field configuration for the Products page.
 * Uses React Query to load API-driven dropdown options.
 */
export function useProductsSearchFields() {
  const { data: cities = [], isLoading: citiesLoading } = useCities();

  const searchFields: FieldConfig[] = useMemo(
    () => [
      {
        name: 'search',
        label: 'Product Name',
        type: 'text' as const,
        placeholder: 'Enter product name...',
        helperText: 'Search by product name or description',
        tooltip:
          'Enter the name or partial name of the product you are looking for',
      },
      {
        name: 'category',
        label: 'Category',
        type: 'dropdown' as const,
        options: [
          { label: 'Electronics', value: 'electronics' },
          { label: 'Clothing', value: 'clothing' },
          { label: 'Home & Garden', value: 'home' },
          { label: 'Sports', value: 'sports' },
        ],
        helperText: 'Select a category',
      },
      {
        name: 'status',
        label: 'Status',
        type: 'dropdown' as const,
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
          { label: 'Discontinued', value: 'discontinued' },
        ],
        helperText: 'Product status',
      },
      {
        name: 'priceRange',
        label: 'Price Range',
        type: 'dropdown' as const,
        options: [
          { label: '$0 - $50', value: '0-50' },
          { label: '$50 - $100', value: '50-100' },
          { label: '$100 - $500', value: '100-500' },
          { label: '$500+', value: '500-1000' },
        ],
        helperText: 'Filter by price range',
      },
      {
        name: 'city',
        label: 'City',
        type: 'modal-select' as const,
        apiUrl: '/api/cities',
        apiLabelField: 'name',
        apiValueField: 'id',
        helperText: 'Select a city (loaded from API)',
        tooltip: 'City options are loaded from the API',
        columns: [
          { field: 'id', headerName: 'Code', width: 80 },
          { field: 'name', headerName: 'City', flex: 1 },
          { field: 'country', headerName: 'Country', width: 120 },
        ],
      },
      {
        name: 'dateFrom',
        label: 'Created From',
        type: 'date' as const,
        helperText: 'Products created after this date',
      },
      {
        name: 'dateTo',
        label: 'Created To',
        type: 'date' as const,
        helperText: 'Products created before this date',
      },
      {
        name: 'stockRange',
        label: 'Stock Levels',
        type: 'pill' as const,
        pillType: 'number' as const,
        allowRanges: true,
        placeholder: 'Enter stock levels (e.g., 0-50, 100-200)',
        helperText: 'Filter by stock ranges',
        defaultValue: [],
      },
    ],
    [cities]
  );

  return {
    searchFields,
    isLoading: citiesLoading,
  };
}

// Keep static export for backward compatibility
export const productsSearchFields: FieldConfig[] = [
  {
    name: 'search',
    label: 'Product Name',
    type: 'text',
    placeholder: 'Enter product name...',
    helperText: 'Search by product name or description',
    tooltip:
      'Enter the name or partial name of the product you are looking for',
  },
  {
    name: 'category',
    label: 'Category',
    type: 'dropdown',
    options: [
      { label: 'Electronics', value: 'electronics' },
      { label: 'Clothing', value: 'clothing' },
      { label: 'Home & Garden', value: 'home' },
      { label: 'Sports', value: 'sports' },
    ],
    helperText: 'Select a category',
  },
  {
    name: 'status',
    label: 'Status',
    type: 'dropdown',
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
      { label: 'Discontinued', value: 'discontinued' },
    ],
    helperText: 'Product status',
  },
  {
    name: 'priceRange',
    label: 'Price Range',
    type: 'dropdown',
    options: [
      { label: '$0 - $50', value: '0-50' },
      { label: '$50 - $100', value: '50-100' },
      { label: '$100 - $500', value: '100-500' },
      { label: '$500+', value: '500-1000' },
    ],
    helperText: 'Filter by price range',
  },
  {
    name: 'dateFrom',
    label: 'Created From',
    type: 'date',
    helperText: 'Products created after this date',
  },
  {
    name: 'dateTo',
    label: 'Created To',
    type: 'date',
    helperText: 'Products created before this date',
  },
  {
    name: 'stockRange',
    label: 'Stock Levels',
    type: 'pill',
    pillType: 'number',
    allowRanges: true,
    placeholder: 'Enter stock levels (e.g., 0-50, 100-200)',
    helperText: 'Filter by stock ranges',
    defaultValue: [],
  },
];
