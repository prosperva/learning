'use client';

import { useMemo } from 'react';
import { FieldConfig } from '@/components/DynamicSearch/types';
import { useCategories, useCountries, useCities } from '@/hooks/useDropdownOptions';

/**
 * Hook that returns the search field configuration for the demo page.
 * Uses React Query to load API-driven dropdown options.
 */
export function useDemoSearchFields() {
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: countries = [], isLoading: countriesLoading } = useCountries();
  const { data: cities = [], isLoading: citiesLoading } = useCities();

  const isLoading = categoriesLoading || countriesLoading || citiesLoading;

  const searchFields: FieldConfig[] = useMemo(
    () => [
      {
        name: 'productName',
        label: 'Product Name',
        type: 'text' as const,
        placeholder: 'Enter product name...',
        helperText: 'Search by product name',
        tooltip:
          'Enter the name or partial name of the product you are looking for',
        requiredForEdit: true,
      },
      {
        name: 'category',
        label: 'Category',
        type: 'dropdown' as const,
        options: [{ label: '-- Any --' }, ...categories],
        helperText: 'Select a category (loaded from API)',
        requiredForEdit: true,
      },
      {
        name: 'inStock',
        label: 'In Stock Only',
        type: 'checkbox' as const,
        defaultValue: false,
      },
      {
        name: 'condition',
        label: 'Condition',
        type: 'radio' as const,
        options: [
          { label: 'New', value: 'new' },
          { label: 'Used', value: 'used' },
          { label: 'Refurbished', value: 'refurbished' },
        ],
        helperText: 'Product condition',
        requiredForEdit: true,
      },
      {
        name: 'shippingFrom',
        label: 'Ships From',
        type: 'multiselect' as const,
        options: countries,
        helperText: 'Select one or more countries',
        defaultValue: [],
        tooltip:
          'Filter products that ship from specific countries. You can select multiple countries.',
      },
      {
        name: 'price',
        label: 'Price',
        type: 'number' as const,
        placeholder: 'Enter price...',
        helperText: 'Product price in USD',
        requiredForEdit: true,
      },
      {
        name: 'dateAdded',
        label: 'Date Added After',
        type: 'date' as const,
        helperText: 'Products added after this date',
      },
      {
        name: 'brand',
        label: 'Brand',
        type: 'dropdown' as const,
        options: [
          { label: '-- Any --' },
          { label: 'Apple', value: 'apple' },
          { label: 'Samsung', value: 'samsung' },
          { label: 'Sony', value: 'sony' },
          { label: 'LG', value: 'lg' },
          { label: 'Dell', value: 'dell' },
          { label: 'HP', value: 'hp' },
        ],
        helperText: 'Select brand (static options)',
      },
      {
        name: 'freeShipping',
        label: 'Free Shipping',
        type: 'checkbox' as const,
        defaultValue: false,
      },
      {
        name: 'rating',
        label: 'Minimum Rating',
        type: 'dropdown' as const,
        options: [
          { label: '-- Any --' },
          { label: '5 Stars', value: '5' },
          { label: '4 Stars & Up', value: '4' },
          { label: '3 Stars & Up', value: '3' },
          { label: '2 Stars & Up', value: '2' },
          { label: '1 Star & Up', value: '1' },
        ],
      },
      {
        name: 'city',
        label: 'City',
        type: 'dropdown' as const,
        options: [{ label: '-- Any --' }, ...cities],
        helperText: 'Select a city (loaded from API)',
        tooltip:
          'City options are loaded from the API with custom field mapping',
      },
      {
        name: 'country',
        label: 'Country (Modal Single Select)',
        type: 'modal-select' as const,
        options: [
          { label: 'United States', value: 'us' },
          { label: 'Canada', value: 'ca' },
          { label: 'United Kingdom', value: 'uk' },
          { label: 'Germany', value: 'de' },
          { label: 'France', value: 'fr' },
          { label: 'Japan', value: 'jp' },
          { label: 'Australia', value: 'au' },
          { label: 'Brazil', value: 'br' },
          { label: 'India', value: 'in' },
          { label: 'China', value: 'cn' },
          { label: 'Mexico', value: 'mx' },
          { label: 'Spain', value: 'es' },
          { label: 'Italy', value: 'it' },
          { label: 'South Korea', value: 'kr' },
          { label: 'Netherlands', value: 'nl' },
        ],
        helperText: 'Single selection with modal dialog',
        tooltip: 'Opens a modal with searchable list for single selection',
      },
      {
        name: 'languages',
        label: 'Languages (Modal Multi-Select)',
        type: 'modal-select' as const,
        allowMultiple: true,
        options: [
          { label: 'English', value: 'en' },
          { label: 'Spanish', value: 'es' },
          { label: 'French', value: 'fr' },
          { label: 'German', value: 'de' },
          { label: 'Chinese', value: 'zh' },
          { label: 'Japanese', value: 'ja' },
          { label: 'Korean', value: 'ko' },
          { label: 'Arabic', value: 'ar' },
          { label: 'Portuguese', value: 'pt' },
          { label: 'Russian', value: 'ru' },
          { label: 'Italian', value: 'it' },
          { label: 'Dutch', value: 'nl' },
        ],
        defaultValue: [],
        helperText: 'Select multiple languages using checkboxes',
        tooltip: 'Multi-select mode with checkboxes in modal dialog',
      },
      {
        name: 'farmName',
        label: 'Farm Name',
        type: 'text' as const,
        placeholder: 'Enter farm name...',
      },
      {
        name: 'animalType',
        label: 'Animal Type',
        type: 'dropdown' as const,
        options: [
          { label: '-- Any --' },
          { label: 'Cattle', value: 'cattle' },
          { label: 'Sheep', value: 'sheep' },
          { label: 'Pigs', value: 'pigs' },
          { label: 'Chickens', value: 'chickens' },
          { label: 'Goats', value: 'goats' },
        ],
      },
      // Pill fields at the end to prevent layout shifts when expanded
      {
        name: 'specificPrices',
        label: 'Specific Prices',
        type: 'pill' as const,
        pillType: 'number' as const,
        allowRanges: true,
        placeholder: 'Enter prices or ranges (e.g., 100-150, 178, 190)',
        helperText:
          'Add individual prices or ranges. Press Enter to add each value.',
        defaultValue: [],
        tooltip:
          'You can enter individual prices (e.g., 99, 149) or ranges (e.g., 100-150) which will be expanded to include all values in between',
      },
      {
        name: 'keywords',
        label: 'Keywords',
        type: 'pill' as const,
        pillType: 'text' as const,
        allowRanges: false,
        placeholder: 'Enter keywords and press Enter',
        helperText: 'Add keywords one by one or comma-separated',
        defaultValue: [],
      },
      {
        name: 'productIds',
        label: 'Product IDs',
        type: 'pill' as const,
        pillType: 'number' as const,
        allowRanges: true,
        placeholder: 'Enter product IDs (e.g., 1-5, 10, 15-20)',
        helperText: 'Support ranges like 1-5 which expands to 1,2,3,4,5',
        defaultValue: [],
      },
    ],
    [categories, countries, cities]
  );

  const accordionField: FieldConfig = useMemo(
    () => ({
      name: 'shippingInfo',
      label: 'Shipping Information',
      type: 'accordion' as const,
      defaultExpanded: false,
      helperText: 'Additional shipping details',
      fields: [
        {
          name: 'warehouse',
          label: 'Primary Warehouse Location',
          type: 'text' as const,
          placeholder: 'Enter warehouse location...',
        },
        {
          name: 'alternateWarehouse',
          label: 'Alternate Warehouse',
          type: 'text' as const,
          placeholder: 'Enter alternate location...',
          copyFromField: 'warehouse',
          copyButtonText: 'Copy from Primary Warehouse',
        },
        {
          name: 'estimatedShipping',
          label: 'Est. Shipping Days',
          type: 'number' as const,
          defaultValue: 3,
        },
        {
          name: 'specialInstructions',
          label: 'Special Shipping Instructions',
          type: 'richtext' as const,
          placeholder:
            'Enter any special shipping instructions here...',
          helperText:
            'Use the rich text editor to format shipping notes, delivery requirements, or handling instructions',
          tooltip:
            'This field supports formatting like bold, italic, lists, and quotes for clear shipping instructions',
        },
      ],
    }),
    []
  );

  return {
    searchFields,
    accordionField,
    isLoading,
  };
}
