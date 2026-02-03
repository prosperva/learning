'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  fetchProducts,
  fetchAllProducts,
  fetchProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  type ProductsQueryParams,
  type AllProductsQueryParams,
  type CreateProductInput,
  type UpdateProductInput,
  type Product,
  type ProductsResponse,
} from '@/lib/api/products';

// Query keys factory for consistent key management
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (params: ProductsQueryParams) => [...productKeys.lists(), params] as const,
  allRows: (params: AllProductsQueryParams) => [...productKeys.lists(), 'all', params] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: number) => [...productKeys.details(), id] as const,
};

// Hook for fetching products list with pagination, sorting, and filtering
export function useProducts(
  params: ProductsQueryParams,
  options?: { enabled?: boolean }
) {
  return useQuery<ProductsResponse, Error>({
    queryKey: productKeys.list(params),
    queryFn: () => fetchProducts(params),
    placeholderData: keepPreviousData, // Keep showing previous data while loading new page
    structuralSharing: false, // Ensure new data references on each fetch
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: options?.enabled ?? true,
  });
}

// Hook for fetching ALL products (no pagination) - for report view and exports
// Uses separate /api/products/all endpoint
export function useAllProducts(
  params: AllProductsQueryParams,
  options?: { enabled?: boolean }
) {
  return useQuery<ProductsResponse, Error>({
    queryKey: productKeys.allRows(params),
    queryFn: () => fetchAllProducts(params),
    enabled: options?.enabled ?? true,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Hook for fetching a single product
export function useProduct(id: number, options?: { enabled?: boolean }) {
  return useQuery<Product, Error>({
    queryKey: productKeys.detail(id),
    queryFn: () => fetchProduct(id),
    enabled: options?.enabled ?? !isNaN(id),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Hook for creating a product
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation<Product, Error, CreateProductInput>({
    mutationFn: createProduct,
    onSuccess: () => {
      // Invalidate all product lists to refetch with new product
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

// Hook for updating a product
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation<Product, Error, { id: number; data: UpdateProductInput }>({
    mutationFn: ({ id, data }) => updateProduct(id, data),
    onSuccess: (updatedProduct) => {
      // Update the specific product in cache
      queryClient.setQueryData(productKeys.detail(updatedProduct.id), updatedProduct);
      // Invalidate all product lists to refetch with updated data
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

// Hook for deleting a product
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: deleteProduct,
    onSuccess: (_, deletedId) => {
      // Remove the specific product from cache
      queryClient.removeQueries({ queryKey: productKeys.detail(deletedId) });
      // Invalidate all product lists to refetch without deleted product
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

// Hook for prefetching a product (useful for hover prefetch)
export function usePrefetchProduct() {
  const queryClient = useQueryClient();

  return (id: number) => {
    queryClient.prefetchQuery({
      queryKey: productKeys.detail(id),
      queryFn: () => fetchProduct(id),
      staleTime: 1 * 60 * 1000,
    });
  };
}

// Re-export types for convenience
export type { Product, ProductsQueryParams, AllProductsQueryParams, ProductsResponse, CreateProductInput, UpdateProductInput };
