import { FieldConfig } from '@/components/DynamicSearch/types';

/**
 * Search field configuration for the Products page.
 * All options are static - no API calls needed.
 */
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
