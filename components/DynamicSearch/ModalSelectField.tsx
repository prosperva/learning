'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  TextField,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  InputAdornment,
  Stack,
  Tooltip,
  IconButton,
  CircularProgress,
  Checkbox,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  HelpOutline as HelpIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridPagination } from '@mui/x-data-grid';
import { DropdownOption } from './types';

interface ModalSelectFieldProps {
  label: string;
  name: string;
  value: string | number | (string | number)[];
  onChange: (name: string, value: string | number | (string | number)[]) => void;
  options?: DropdownOption[];
  apiUrl?: string;
  apiLabelField?: string;
  apiValueField?: string;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  tooltip?: string;
  allowMultiple?: boolean;
  error?: string;
  // Grid mode: when provided, shows a DataGrid with full row details instead of a simple list
  columns?: GridColDef[];
}

export const ModalSelectField: React.FC<ModalSelectFieldProps> = ({
  label,
  name,
  value,
  onChange,
  options: staticOptions,
  apiUrl,
  apiLabelField,
  apiValueField,
  placeholder,
  helperText,
  required,
  disabled = false,
  tooltip,
  allowMultiple = false,
  error,
  columns,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [selectedValue, setSelectedValue] = useState<string | number | (string | number)[]>(
    allowMultiple ? (Array.isArray(value) ? value : []) : (value || '')
  );
  const [apiOptions, setApiOptions] = useState<DropdownOption[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [gridSelection, setGridSelection] = useState<(string | number)[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Prefer staticOptions (from parent/React Query) when provided, otherwise use internal API fetch
  const options = staticOptions !== undefined ? staticOptions : apiOptions;

  // Sync selectedValue with value prop when it changes
  useEffect(() => {
    if (allowMultiple) {
      setSelectedValue(Array.isArray(value) ? value : []);
    } else {
      setSelectedValue(value || '');
    }
  }, [value, allowMultiple]);

  // Only fetch from API when no staticOptions prop is provided and apiUrl is set
  useEffect(() => {
    if (apiUrl && staticOptions === undefined && !hasLoadedOnce) {
      fetchOptions();
    }
  }, [apiUrl, staticOptions, hasLoadedOnce]);

  const fetchOptions = async () => {
    if (!apiUrl) return;

    setLoading(true);
    try {
      const response = await fetch(apiUrl, { credentials: 'include' });
      const responseData = await response.json();

      // Handle both array responses and { data: [...] } wrapped responses
      const data = Array.isArray(responseData) ? responseData : (responseData.data || responseData);

      if (!Array.isArray(data)) {
        console.error(`Invalid API response for ${name}: expected array`);
        setApiOptions([]);
        return;
      }

      // Map API response to DropdownOption format
      const labelField = apiLabelField || 'label';
      const valueField = apiValueField || 'value';

      const mappedOptions: DropdownOption[] = data.map((item: any) => ({
        label: item[labelField],
        value: item[valueField],
      }));

      setApiOptions(mappedOptions);
      setRawRows(data);
      setHasLoadedOnce(true);
    } catch (error) {
      console.error(`Error fetching options for ${name}:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Get display text for selected value(s)
  const displayText = useMemo(() => {
    if (allowMultiple && Array.isArray(value)) {
      if (value.length === 0) return '';
      const labels = value
        .map(v => options.find(opt => opt.value === v)?.label)
        .filter(Boolean);
      return labels.join(', ');
    }
    const selectedOption = options.find((opt) => opt.value === value);
    return selectedOption ? selectedOption.label : '';
  }, [value, options, allowMultiple]);

  // Filter options: exclude valueless entries (e.g. "-- Any --") and apply search text
  const filteredOptions = useMemo(() => {
    const selectable = options.filter((opt) => opt.value !== undefined);
    if (!filterText.trim()) return selectable;
    const searchLower = filterText.toLowerCase();
    return selectable.filter((opt) =>
      opt.label.toLowerCase().includes(searchLower)
    );
  }, [filterText, options]);

  const handleOpenModal = () => {
    // selectedValue is already synced via useEffect, no need to set it again
    setFilterText('');
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setFilterText('');
  };

  const handleSelectOption = (optionValue: string | number) => {
    if (allowMultiple) {
      setSelectedValue(prev => {
        const currentValues = Array.isArray(prev) ? prev : [];
        // Toggle selection
        if (currentValues.includes(optionValue)) {
          return currentValues.filter(v => v !== optionValue);
        } else {
          return [...currentValues, optionValue];
        }
      });
    } else {
      setSelectedValue(optionValue);
    }
  };

  const handleDone = () => {
    onChange(name, selectedValue);
    handleCloseModal();
  };

  const handleClear = () => {
    if (allowMultiple) {
      onChange(name, []);
    } else {
      onChange(name, '');
    }
  };

  const isSelected = (optionValue: string | number): boolean => {
    if (allowMultiple && Array.isArray(selectedValue)) {
      return selectedValue.includes(optionValue);
    }
    return selectedValue === optionValue;
  };

  const labelWithTooltip = tooltip ? (
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
  ) : (
    label
  );

  return (
    <Box>
      <TextField
        fullWidth
        size="small"
        label={labelWithTooltip}
        value={displayText}
        placeholder={placeholder || 'Click Select to choose...'}
        helperText={error || helperText}
        required={required}
        variant="outlined"
        disabled={disabled}
        error={!!error}
        slotProps={{
          input: {
            readOnly: true,
          },
        }}
      />

      <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={handleOpenModal}
          size="small"
          disabled={disabled}
        >
          Select
        </Button>
        {((allowMultiple && Array.isArray(value) && value.length > 0) || (!allowMultiple && value)) && (
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleClear}
            size="small"
            startIcon={<ClearIcon />}
            disabled={disabled}
          >
            Clear
          </Button>
        )}
      </Stack>

      {/* Modal Dialog */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth={columns ? 'md' : 'sm'}
        fullWidth
        slotProps={{
          paper: {
            sx: { height: '65vh' },
          },
        }}
      >
        <DialogTitle>{label}</DialogTitle>
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Filter Input */}
          <Box sx={{ p: 1.5, pb: 1, position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Filter options..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              autoFocus
              disabled={loading}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: filterText && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setFilterText('')}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          {columns ? (
            /* Grid Mode */
            <Box sx={{ flex: 1, px: 1.5, pb: 1, minHeight: 0 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress size={40} />
                </Box>
              ) : (
                <DataGrid
                  rows={rawRows.filter(row => {
                    if (!filterText.trim()) return true;
                    const search = filterText.toLowerCase();
                    return Object.values(row).some(v =>
                      String(v ?? '').toLowerCase().includes(search)
                    );
                  })}
                  columns={columns}
                  getRowId={(row) => row[apiValueField || 'id']}
                  rowSelectionModel={gridSelection}
                  onRowSelectionModelChange={(model) => {
                    const ids = (model as any)?.ids
                      ? Array.from((model as any).ids)
                      : Array.isArray(model) ? model : [];
                    setGridSelection(ids as (string | number)[]);
                  }}
                  pageSizeOptions={[25, 50, 100]}
                  initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
                  density="compact"
                  disableMultipleRowSelection={!allowMultiple}
                  sx={{ border: 'none' }}
                  slots={{
                    footer: () => (
                      <Box>
                        <Box sx={{ px: 1.5, pt: 1, display: 'flex', gap: 1 }}>
                          <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            disabled={gridSelection.length === 0}
                            onClick={() => {
                              const ids = gridSelection;
                              onChange(name, allowMultiple ? ids : ids[0]);
                              handleCloseModal();
                            }}
                          >
                            Select
                          </Button>
                          <Button fullWidth onClick={handleCloseModal}>Cancel</Button>
                        </Box>
                        <GridPagination />
                      </Box>
                    ),
                  }}
                />
              )}
            </Box>
          ) : (
            /* List Mode */
            <List sx={{ pt: 0 }}>
              {loading ? (
                <ListItem>
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', py: 4 }}>
                    <CircularProgress size={40} />
                  </Box>
                </ListItem>
              ) : filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <ListItem key={option.value} disablePadding>
                    <ListItemButton
                      selected={isSelected(option.value!)}
                      onClick={() => handleSelectOption(option.value!)}
                    >
                      {allowMultiple && (
                        <Checkbox
                          edge="start"
                          checked={isSelected(option.value!)}
                          tabIndex={-1}
                          disableRipple
                          sx={{ mr: 1 }}
                        />
                      )}
                      <ListItemText primary={option.label} />
                    </ListItemButton>
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText
                    primary="No options found"
                    secondary="Try adjusting your filter"
                    sx={{ textAlign: 'center', color: 'text.secondary' }}
                  />
                </ListItem>
              )}
            </List>
          )}
        </DialogContent>
        {!columns && (
          <DialogActions sx={{ flexDirection: 'column', gap: 1, p: 2 }}>
            <Button
              onClick={handleDone}
              variant="contained"
              fullWidth
              disabled={
                loading ||
                (allowMultiple
                  ? Array.isArray(selectedValue) && selectedValue.length === 0
                  : !selectedValue
                )
              }
            >
              Done
            </Button>
            <Button onClick={handleCloseModal} fullWidth>Cancel</Button>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
};
