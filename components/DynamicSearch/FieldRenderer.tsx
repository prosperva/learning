'use client';

import React, { useEffect, useState } from 'react';
import {
  TextField,
  FormControl,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormLabel,
  FormHelperText,
  Chip,
  Box,
  CircularProgress,
  Button,
  Stack,
  Autocomplete,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from '@mui/material';
import {
  HelpOutline as HelpIcon,
  ExpandMore as ExpandMoreIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { FieldConfig, DropdownOption, FormMode } from './types';
import { PillField } from './PillField';
import { ModalSelectField } from './ModalSelectField';

interface FieldRendererProps {
  field: FieldConfig;
  value: any;
  onChange: (name: string, value: any) => void;
  error?: string;
  allValues?: Record<string, any>; // All form values for field copying
  allFields?: FieldConfig[]; // All field configs to lookup labels
  formMode?: FormMode; // Form mode: 'search' or 'edit' (default: 'search')
}

// Helper component to render label with optional tooltip
const LabelWithTooltip: React.FC<{ label: string; tooltip?: string }> = ({ label, tooltip }) => {
  if (!tooltip) return <>{label}</>;

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
      {label}
      <Tooltip title={tooltip} arrow placement="top" enterDelay={200} leaveDelay={200}>
        <Box
          component="span"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            ml: 0.5,
            cursor: 'help',
            color: 'action.active',
          }}
        >
          <HelpIcon fontSize="small" sx={{ fontSize: '1rem' }} />
        </Box>
      </Tooltip>
    </Box>
  );
};

// Wrapper component to ensure consistent width and styling across projects
// Uses defensive CSS to override any external styles that might affect layout
const FieldWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box
    sx={{
      width: '100%',
      // Override any external min-width that might be forced on form fields
      '& .MuiFormControl-root': {
        minWidth: 'unset',
        width: '100%',
      },
      '& .MuiAutocomplete-root': {
        minWidth: 'unset',
        width: '100%',
      },
      '& .MuiTextField-root': {
        minWidth: 'unset',
        width: '100%',
      },
      '& .MuiInputBase-root': {
        minWidth: 'unset',
      },
    }}
  >
    {children}
  </Box>
);

export const FieldRenderer: React.FC<FieldRendererProps> = ({ field, value, onChange, error, allValues = {}, allFields = [], formMode = 'search' }) => {
  const [options, setOptions] = useState<DropdownOption[]>(field.options || []);
  const [loading, setLoading] = useState(false);

  // Sync options when field.options prop changes (e.g. from React Query)
  useEffect(() => {
    if (field.options) {
      setOptions(field.options);
    }
  }, [field.options]);

  // Determine if field is required based on form mode
  const isRequired = field.required ||
    (formMode === 'edit' && field.requiredForEdit) ||
    (formMode === 'search' && field.requiredForSearch);

  // Determine if field is disabled based on form mode
  const isDisabled = field.disabled ||
    (formMode === 'edit' && field.disabledInEdit) ||
    (formMode === 'search' && field.disabledInSearch);

  // Helper to find a field by name (recursively search through groups/accordions)
  const findFieldByName = (name: string, fields: FieldConfig[]): FieldConfig | null => {
    for (const f of fields) {
      if (f.name === name) return f;
      if (f.fields) {
        const found = findFieldByName(name, f.fields);
        if (found) return found;
      }
    }
    return null;
  };

  // Handle copying value from another field
  const handleCopyFromField = () => {
    if (field.copyFromField && allValues[field.copyFromField] !== undefined) {
      onChange(field.name, allValues[field.copyFromField]);
    }
  };

  // Fetch options from API - must be defined before useEffect that calls it
  const fetchOptions = async () => {
    if (!field.apiUrl) return;

    setLoading(true);
    try {
      const response = await fetch(field.apiUrl, {
        credentials: 'include', // Include cookies for authentication
      });
      const responseData = await response.json();

      // Handle both array responses and { data: [...] } wrapped responses
      const data = Array.isArray(responseData) ? responseData : (responseData.data || responseData);

      if (!Array.isArray(data)) {
        console.error(`Invalid API response for ${field.name}: expected array`);
        setOptions([]);
        return;
      }

      // Map API response to DropdownOption format
      const labelField = field.apiLabelField || 'label';
      const valueField = field.apiValueField || 'value';

      const mappedOptions: DropdownOption[] = data.map((item: any) => ({
        label: item[labelField],
        value: item[valueField],
      }));

      setOptions(mappedOptions);
    } catch (error) {
      console.error(`Error fetching options for ${field.name}:`, error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch options when apiUrl is provided and no static options exist
  useEffect(() => {
    if (field.apiUrl && !field.options) {
      fetchOptions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field.apiUrl]);

  const handleChange = (newValue: any) => {
    onChange(field.name, newValue);
  };

  // Render copy button if field has copyFromField configured
  const renderCopyButton = () => {
    if (!field.copyFromField) return null;

    const sourceField = findFieldByName(field.copyFromField, allFields);
    const sourceValue = allValues[field.copyFromField];
    const buttonText = field.copyButtonText || `Copy from ${sourceField?.label || field.copyFromField}`;

    return (
      <Button
        size="small"
        startIcon={<ContentCopyIcon />}
        onClick={handleCopyFromField}
        disabled={!sourceValue}
        variant="outlined"
        sx={{ mt: 1 }}
      >
        {buttonText}
      </Button>
    );
  };

  if (loading) {
    return (
      <FieldWrapper>
        <Box display="flex" alignItems="center" gap={1}>
          <CircularProgress size={20} />
          <span>Loading {field.label}...</span>
        </Box>
      </FieldWrapper>
    );
  }

  switch (field.type) {
    case 'text':
      return (
        <FieldWrapper>
          <TextField
            fullWidth
            size="small"
            label={<LabelWithTooltip label={field.label} tooltip={field.tooltip} />}
            name={field.name}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            helperText={error || field.helperText}
            required={isRequired}
            disabled={isDisabled}
            variant="outlined"
            error={!!error}
          />
          {renderCopyButton()}
        </FieldWrapper>
      );

    case 'number':
      return (
        <FieldWrapper>
          <TextField
            fullWidth
            size="small"
            type="number"
            label={<LabelWithTooltip label={field.label} tooltip={field.tooltip} />}
            name={field.name}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            helperText={error || field.helperText}
            required={isRequired}
            disabled={isDisabled}
            variant="outlined"
            error={!!error}
          />
        </FieldWrapper>
      );

    case 'date':
      return (
        <FieldWrapper>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label={<LabelWithTooltip label={field.label} tooltip={field.tooltip} />}
              value={value ? dayjs(value) : null}
              onChange={(newValue: Dayjs | null) => {
                handleChange(newValue ? newValue.format('YYYY-MM-DD') : '');
              }}
              disabled={isDisabled}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                  required: isRequired,
                  helperText: error || field.helperText,
                  variant: 'outlined',
                  error: !!error,
                },
              }}
            />
          </LocalizationProvider>
        </FieldWrapper>
      );

    case 'dropdown':
      const selectedOption = options.find((opt) => opt.value !== undefined && opt.value === value)
        || (!value && value !== 0 ? options.find((opt) => opt.value === undefined) ?? null : null);

      return (
        <FieldWrapper>
          <Autocomplete
            size="small"
            options={options}
            value={selectedOption}
            onChange={(_, newValue) => {
              handleChange(!newValue || newValue.value === undefined ? '' : newValue.value);
            }}
            disabled={isDisabled}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, val) => {
              if (option.value === undefined && val.value === undefined) return true;
              return option.value === val.value;
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={<LabelWithTooltip label={field.label} tooltip={field.tooltip} />}
                required={isRequired}
                helperText={error || field.helperText}
                variant="outlined"
                error={!!error}
              />
            )}
            fullWidth
          />
        </FieldWrapper>
      );

    case 'multiselect':
      // Give valueless options (like "-- Any --") a sentinel value so MUI Autocomplete renders them
      const CLEAR_VALUE = '__clear__' as const;
      const multiselectOptions = options.map(opt =>
        opt.value === undefined ? { ...opt, value: CLEAR_VALUE } : opt
      );
      const clearOption = multiselectOptions.find(opt => opt.value === CLEAR_VALUE);
      const valuedOptions = multiselectOptions.filter(opt => opt.value !== CLEAR_VALUE);
      const allOptionValues = valuedOptions.map(opt => opt.value);
      const allSelected = value?.length === valuedOptions.length;

      // Show "-- Any --" chip when value is empty, otherwise show real selections
      const selectedOptions = clearOption && (!value || value.length === 0)
        ? [clearOption]
        : valuedOptions.filter((opt) => (value || []).includes(opt.value));

      const handleSelectAll = () => {
        handleChange(allOptionValues);
      };

      const handleClearAll = () => {
        handleChange([]);
      };

      return (
        <FieldWrapper>
          <Box sx={{ width: '100%' }}>
            <Autocomplete
              multiple
              size="small"
              options={multiselectOptions}
              value={selectedOptions}
              onChange={(_, newValue) => {
                const hasClear = newValue.some(opt => opt.value === CLEAR_VALUE);
                if (hasClear && value && value.length > 0) {
                  // User clicked "-- Any --" while real options were selected → clear all
                  handleChange([]);
                } else {
                  // Selecting/deselecting real options (filter out the clear option)
                  handleChange(newValue.filter(opt => opt.value !== CLEAR_VALUE).map(opt => opt.value));
                }
              }}
              disabled={isDisabled}
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, val) => {
                if (option.value === undefined && val.value === undefined) return true;
                return option.value === val.value;
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={<LabelWithTooltip label={field.label} tooltip={field.tooltip} />}
                  required={isRequired}
                  helperText={error || field.helperText}
                  variant="outlined"
                  error={!!error}
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
              fullWidth
            />
            <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }} alignItems="center">
              <Button
                size="small"
                onClick={handleSelectAll}
                disabled={isDisabled || allSelected}
                variant="outlined"
              >
                Select All
              </Button>
              <Button
                size="small"
                onClick={handleClearAll}
                disabled={isDisabled || !value || value.length === 0}
                variant="outlined"
              >
                Clear All
              </Button>
              {value && value.length > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {value.length} {value.length === 1 ? 'item' : 'items'} selected
                </Typography>
              )}
            </Stack>
          </Box>
        </FieldWrapper>
      );

    case 'checkbox':
      return (
        <FieldWrapper>
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'rgba(0, 0, 0, 0.23)',
              borderRadius: 1,
              px: 1,
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              '&:hover': { borderColor: 'text.primary' },
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={value || false}
                  onChange={(e) => handleChange(e.target.checked)}
                  name={field.name}
                  disabled={isDisabled}
                />
              }
              label={<LabelWithTooltip label={field.label} tooltip={field.tooltip} />}
              sx={{ m: 0 }}
            />
          </Box>
          {(error || field.helperText) && (
            <FormHelperText error={!!error} sx={{ mx: 1.75 }}>{error || field.helperText}</FormHelperText>
          )}
        </FieldWrapper>
      );

    case 'radio':
      return (
        <FieldWrapper>
          <FormControl component="fieldset" required={isRequired} error={!!error} disabled={isDisabled} sx={{ width: '100%' }}>
            <FormLabel component="legend" sx={{ fontSize: '0.85rem' }}>
              <LabelWithTooltip label={field.label} tooltip={field.tooltip} />
            </FormLabel>
            <RadioGroup
              name={field.name}
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              row
            >
              {options.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio size="small" />}
                  label={option.label}
                  sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
                />
              ))}
            </RadioGroup>
            {(error || field.helperText) && (
              <FormHelperText>{error || field.helperText}</FormHelperText>
            )}
          </FormControl>
        </FieldWrapper>
      );

    case 'pill':
      return (
        <FieldWrapper>
          <PillField
            label={field.label}
            name={field.name}
            value={value || []}
            onChange={onChange}
            placeholder={field.placeholder}
            helperText={field.helperText}
            required={isRequired}
            disabled={isDisabled}
            pillType={field.pillType}
            allowRanges={field.allowRanges}
            tooltip={field.tooltip}
            error={error}
          />
        </FieldWrapper>
      );

    case 'group':
      return (
        <FieldWrapper>
          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5, width: '100%' }}>
            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <FormLabel component="legend" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                <LabelWithTooltip label={field.label} tooltip={field.tooltip} />
              </FormLabel>
            </Box>
            {field.helperText && (
              <FormHelperText sx={{ mt: -0.5, mb: 1 }}>{field.helperText}</FormHelperText>
            )}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: (field.fields?.length || 0) > 1 ? 'repeat(2, 1fr)' : '1fr',
                },
                gap: 2,
                alignItems: 'start',
              }}
            >
              {field.fields?.map((subField) => (
                <FieldRenderer
                  key={subField.name}
                  field={subField}
                  value={value?.[subField.name]}
                  onChange={(name, val) => {
                    const newValue = { ...(value || {}), [name]: val };
                    onChange(field.name, newValue);
                  }}
                  allValues={{ ...allValues, ...(value || {}) }}
                  allFields={allFields}
                  formMode={formMode}
                />
              ))}
            </Box>
          </Box>
        </FieldWrapper>
      );

    case 'accordion':
      return (
        <FieldWrapper>
          <Accordion defaultExpanded={field.defaultExpanded ?? false} sx={{ width: '100%' }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                bgcolor: 'action.hover',
                '&:hover': { bgcolor: 'action.selected' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <FormLabel component="legend" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                  <LabelWithTooltip label={field.label} tooltip={field.tooltip} />
                </FormLabel>
                {field.helperText && (
                  <FormHelperText sx={{ ml: 'auto', fontSize: '0.75rem' }}>
                    {field.helperText}
                  </FormHelperText>
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 1.5 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: (field.fields?.length || 0) > 1 ? 'repeat(2, 1fr)' : '1fr',
                  },
                  gap: 2,
                  alignItems: 'start',
                }}
              >
                {field.fields?.map((subField) => (
                  <FieldRenderer
                    key={subField.name}
                    field={subField}
                    value={value?.[subField.name]}
                    onChange={(name, val) => {
                      const newValue = { ...(value || {}), [name]: val };
                      onChange(field.name, newValue);
                    }}
                    allValues={{ ...allValues, ...(value || {}) }}
                    allFields={allFields}
                    formMode={formMode}
                  />
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        </FieldWrapper>
      );

    case 'modal-select':
      // DEBUG: remove after fixing
      console.log(`[FieldRenderer ${field.name}] field.options:`, field.options, 'local options:', options);
      return (
        <FieldWrapper>
          <ModalSelectField
            label={field.label}
            name={field.name}
            value={field.allowMultiple ? (value || []) : (value || '')}
            onChange={onChange}
            options={field.options}
            apiUrl={field.apiUrl}
            apiLabelField={field.apiLabelField}
            apiValueField={field.apiValueField}
            placeholder={field.placeholder}
            helperText={field.helperText}
            required={isRequired}
            disabled={isDisabled}
            tooltip={field.tooltip}
            allowMultiple={field.allowMultiple}
            error={error}
          />
        </FieldWrapper>
      );

    case 'richtext': {
      const { RichTextEditor } = require('./RichTextEditor');
      const labelText = isRequired ? `${field.label} *` : field.label;
      return (
        <FieldWrapper>
          <RichTextEditor
            value={value || ''}
            onChange={(html: string) => onChange(field.name, html)}
            placeholder={field.placeholder}
            disabled={isDisabled}
            label={labelText}
            helperText={field.helperText}
          />
        </FieldWrapper>
      );
    }

    default:
      return null;
  }
};
