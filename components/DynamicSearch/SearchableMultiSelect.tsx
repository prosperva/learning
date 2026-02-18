'use client';

import React, { useState, useEffect } from 'react';
import {
  TextField,
  CircularProgress,
  Chip,
  Autocomplete,
  Stack,
  Button,
} from '@mui/material';

export interface DropdownOption {
  label: string;
  value?: string | number; // Optional - if missing, selecting this option clears the field
}

export interface SearchableMultiSelectProps {
  label: string;
  value: (string | number)[];
  onChange: (values: (string | number)[]) => void;
  options?: DropdownOption[];
  apiUrl?: string;
  apiLabelField?: string; // Field name for label in API response (default: 'label')
  apiValueField?: string; // Field name for value in API response (default: 'value')
  placeholder?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  showSelectAllButtons?: boolean; // Show "Select All" and "Clear All" buttons (default: true)
  loading?: boolean; // Allow parent to control loading state
  onLoadOptions?: (options: DropdownOption[]) => void; // Callback when options are loaded from API
}

/**
 * SearchableMultiSelect - Standalone multi-select dropdown with built-in search/filter
 *
 * Features:
 * - Type to search/filter options
 * - Select multiple values
 * - Displays selected values as chips
 * - "Select All" and "Clear All" buttons
 * - Works with static options or API-driven data
 * - Custom field mapping for non-standard APIs
 * - Loading states
 * - Error handling
 *
 * @example
 * // Static options
 * <SearchableMultiSelect
 *   label="Tags"
 *   value={tags}
 *   onChange={setTags}
 *   options={[
 *     { label: 'React', value: 'react' },
 *     { label: 'TypeScript', value: 'typescript' },
 *   ]}
 * />
 *
 * @example
 * // API-driven
 * <SearchableMultiSelect
 *   label="Countries"
 *   value={selectedCountries}
 *   onChange={setSelectedCountries}
 *   apiUrl="/api/countries"
 * />
 */
export const SearchableMultiSelect: React.FC<SearchableMultiSelectProps> = ({
  label,
  value,
  onChange,
  options: staticOptions,
  apiUrl,
  apiLabelField = 'label',
  apiValueField = 'value',
  placeholder,
  helperText,
  error,
  required = false,
  disabled = false,
  fullWidth = true,
  showSelectAllButtons = true,
  loading: externalLoading,
  onLoadOptions,
}) => {
  const [options, setOptions] = useState<DropdownOption[]>(staticOptions || []);
  const [internalLoading, setInternalLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Use external loading if provided, otherwise use internal
  const isLoading = externalLoading !== undefined ? externalLoading : internalLoading;

  useEffect(() => {
    // If static options are provided, use them
    if (staticOptions) {
      setOptions(staticOptions);
      return;
    }

    // If API URL is provided, fetch options
    if (apiUrl) {
      fetchOptions();
    }
  }, [apiUrl, staticOptions]);

  const fetchOptions = async () => {
    if (!apiUrl) return;

    setInternalLoading(true);
    setApiError(null);

    try {
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Map API response to DropdownOption format
      const mappedOptions: DropdownOption[] = data.map((item: any) => ({
        label: item[apiLabelField],
        value: item[apiValueField],
      }));

      setOptions(mappedOptions);

      // Notify parent if callback provided
      if (onLoadOptions) {
        onLoadOptions(mappedOptions);
      }
    } catch (err) {
      console.error(`Error fetching options for ${label}:`, err);
      setApiError(err instanceof Error ? err.message : 'Failed to load options');
      setOptions([]);
    } finally {
      setInternalLoading(false);
    }
  };

  // Filter out valueless options (like "-- Any --") for selection tracking
  const valuedOptions = options.filter((opt) => opt.value !== undefined);

  // Find selected option objects
  const selectedOptions = valuedOptions.filter((opt) => value.includes(opt.value!));

  const handleSelectAll = () => {
    onChange(valuedOptions.map(opt => opt.value!));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const allSelected = value.length === valuedOptions.length && valuedOptions.length > 0;

  return (
    <>
      <Autocomplete
        multiple
        options={options}
        value={selectedOptions}
        onChange={(_, newValue) => {
          const hasValueless = newValue.some(opt => opt.value === undefined);
          onChange(hasValueless ? [] : newValue.map((opt) => opt.value!));
        }}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, value) => {
          if (option.value === undefined && value.value === undefined) return true;
          return option.value === value.value;
        }}
        disabled={disabled || isLoading}
        loading={isLoading}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            required={required}
            helperText={error || apiError || helperText}
            error={!!error || !!apiError}
            variant="outlined"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip
              {...getTagProps({ index })}
              key={option.value ?? option.label}
              label={option.label}
              size="small"
            />
          ))
        }
        fullWidth={fullWidth}
      />

      {showSelectAllButtons && options.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button
            size="small"
            onClick={handleSelectAll}
            disabled={allSelected || disabled || isLoading}
            variant="outlined"
          >
            Select All
          </Button>
          <Button
            size="small"
            onClick={handleClearAll}
            disabled={value.length === 0 || disabled || isLoading}
            variant="outlined"
          >
            Clear All
          </Button>
        </Stack>
      )}
    </>
  );
};
