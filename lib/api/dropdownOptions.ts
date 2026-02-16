import { DropdownOption } from '@/components/DynamicSearch/types';

export interface FetchDropdownOptionsParams {
  url: string;
  labelField?: string;
  valueField?: string;
  extraFields?: string[];
}

export async function fetchDropdownOptions({
  url,
  labelField = 'label',
  valueField = 'value',
  extraFields,
}: FetchDropdownOptionsParams): Promise<DropdownOption[]> {
  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch options from ${url}: ${response.statusText}`);
  }

  const responseData = await response.json();

  // Handle both array and { data: [...] } wrapped responses
  const data = Array.isArray(responseData)
    ? responseData
    : responseData.data || responseData;

  if (!Array.isArray(data)) {
    throw new Error(`Invalid response from ${url}: expected array`);
  }

  return data.map((item: any) => ({
    label: item[labelField],
    value: item[valueField],
    ...(extraFields && {
      extra: extraFields.reduce((acc, field) => {
        acc[field] = item[field];
        return acc;
      }, {} as Record<string, any>),
    }),
  }));
}

// Specific fetchers for known endpoints
export const fetchCategories = () =>
  fetchDropdownOptions({ url: '/api/categories' });

export const fetchCountries = () =>
  fetchDropdownOptions({ url: '/api/countries' });

export const fetchCities = () =>
  fetchDropdownOptions({ url: '/api/cities', labelField: 'name', valueField: 'id' });
