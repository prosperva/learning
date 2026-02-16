// Product types
export interface Product {
  id: number;
  name: string;
  category: string;
  status: 'active' | 'inactive' | 'discontinued';
  price: number;
  stock: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsQueryParams {
  page: number;
  pageSize: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  category?: string;
  status?: string;
  priceRange?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Params for fetching all products (no pagination fields)
export type AllProductsQueryParams = Omit<ProductsQueryParams, 'page' | 'pageSize'>;

export interface ProductsResponse {
  data: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateProductInput {
  name: string;
  category: string;
  status: 'active' | 'inactive' | 'discontinued';
  price: number;
  stock: number;
  description?: string;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {}

// API client functions
const API_BASE = '/api/products';

// Paginated search - for grid view
export async function fetchProducts(params: ProductsQueryParams): Promise<ProductsResponse> {
  const response = await fetch(`${API_BASE}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Include cookies for authentication
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.statusText}`);
  }

  return response.json();
}

// Fetch ALL products without pagination - for reports and exports
export async function fetchAllProducts(params: AllProductsQueryParams): Promise<ProductsResponse> {
  const response = await fetch(`${API_BASE}/all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Include cookies for authentication
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch all products: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchProduct(id: number): Promise<Product> {
  const response = await fetch(`${API_BASE}/${id}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Product not found');
    }
    throw new Error(`Failed to fetch product: ${response.statusText}`);
  }

  return response.json();
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create product');
  }

  return response.json();
}

export async function updateProduct(id: number, input: UpdateProductInput): Promise<Product> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to update product');
  }

  return response.json();
}

export async function deleteProduct(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to delete product');
  }
}

// Attachment types
export interface Attachment {
  id: string;
  productId: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  url: string;
}

export interface AttachmentsResponse {
  attachments: Attachment[];
}

// Attachment API client functions
const ATTACHMENTS_URL = (productId: number) => `${API_BASE}/${productId}/attachments`;

export async function fetchAttachments(productId: number): Promise<AttachmentsResponse> {
  const response = await fetch(ATTACHMENTS_URL(productId), {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch attachments: ${response.statusText}`);
  }

  return response.json();
}

export async function uploadAttachment(
  productId: number,
  file: File
): Promise<{ attachment: Attachment }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(ATTACHMENTS_URL(productId), {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to upload attachment');
  }

  return response.json();
}

export async function deleteAttachment(
  productId: number,
  attachmentId: string
): Promise<void> {
  const response = await fetch(`${ATTACHMENTS_URL(productId)}/${attachmentId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to delete attachment');
  }
}
