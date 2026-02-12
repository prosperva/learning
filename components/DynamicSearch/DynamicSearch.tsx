'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Dialog,
  DialogTitle,
  SxProps,
  Theme,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Divider,
  Alert,
  Collapse,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Autocomplete,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  BookmarkBorder as BookmarkBorderIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Public as PublicIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { DynamicSearchProps, SavedSearch, SearchVisibility, ModalPosition, ViewMode, FormMode, ReportOption } from './types';
import { FieldRenderer } from './FieldRenderer';
import { SearchableDropdown } from './SearchableDropdown';

// Helper function to get dialog positioning styles
const getDialogStyles = (position: ModalPosition = 'center'): SxProps<Theme> => {
  const positions: Record<ModalPosition, SxProps<Theme>> = {
    center: {
      '& .MuiDialog-container': {
        alignItems: 'center',
        justifyContent: 'center',
      },
    },
    top: {
      '& .MuiDialog-container': {
        alignItems: 'flex-start',
        justifyContent: 'center',
        pt: 4,
      },
    },
    bottom: {
      '& .MuiDialog-container': {
        alignItems: 'flex-end',
        justifyContent: 'center',
        pb: 4,
      },
    },
    left: {
      '& .MuiDialog-container': {
        alignItems: 'center',
        justifyContent: 'flex-start',
        pl: 4,
      },
    },
    right: {
      '& .MuiDialog-container': {
        alignItems: 'center',
        justifyContent: 'flex-end',
        pr: 4,
      },
    },
    'top-left': {
      '& .MuiDialog-container': {
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        pt: 4,
        pl: 4,
      },
    },
    'top-right': {
      '& .MuiDialog-container': {
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        pt: 4,
        pr: 4,
      },
    },
    'bottom-left': {
      '& .MuiDialog-container': {
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
        pb: 4,
        pl: 4,
      },
    },
    'bottom-right': {
      '& .MuiDialog-container': {
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        pb: 4,
        pr: 4,
      },
    },
  };

  return positions[position];
};

export const DynamicSearch: React.FC<DynamicSearchProps> = ({
  fields,
  onSearch,
  onSave,
  onLoad,
  onDelete,
  onRename,
  onChangeVisibility,
  savedSearches = [],
  enableSaveSearch = true,
  searchButtonText = 'Search',
  resetButtonText = 'Reset',
  onReset,
  currentUser = 'current_user',
  searchContext,
  allowCrossContext = false,
  isAdmin = false,
  columnLayout = 'auto',
  initialValues,
  modalPosition = 'center',
  enableViewMode = false,
  defaultViewMode = 'grid',
  availableViewModes = ['grid', 'report'],
  onViewModeChange,
  reportOptions,
  customFields,
  formMode = 'search',
  defaultExpanded = true,
  searchTitle = 'Advanced Search',
}) => {
  const [formValues, setFormValues] = useState<Record<string, any>>(() => {
    const values: Record<string, any> = {};
    fields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        values[field.name] = field.defaultValue;
      }
    });
    // Override with initialValues if provided
    return { ...values, ...(initialValues || {}) };
  });

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [searchToRename, setSearchToRename] = useState<SavedSearch | null>(null);
  const [searchToPreview, setSearchToPreview] = useState<SavedSearch | null>(null);
  const [searchToDelete, setSearchToDelete] = useState<SavedSearch | null>(null);
  const [newSearchName, setNewSearchName] = useState('');
  const [newSearchVisibility, setNewSearchVisibility] = useState<SearchVisibility>('user');
  const [searchName, setSearchName] = useState('');
  const [searchDescription, setSearchDescription] = useState('');
  const [searchVisibility, setSearchVisibility] = useState<SearchVisibility>('user');
  const [searchExpanded, setSearchExpanded] = useState(defaultExpanded);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [selectedViewMode, setSelectedViewMode] = useState<ViewMode>(defaultViewMode);

  // Update form values when initialValues changes (e.g., when editing different rows)
  useEffect(() => {
    if (initialValues) {
      const values: Record<string, any> = {};
      fields.forEach((field) => {
        if (field.defaultValue !== undefined) {
          values[field.name] = field.defaultValue;
        }
      });
      setFormValues({ ...values, ...initialValues });
      // Clear validation errors when loading new initial values
      setValidationErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues]);

  // Filter searches based on context
  const filteredSearches = savedSearches.filter(search => {
    if (allowCrossContext) return true;
    if (!searchContext) return true;
    return search.context === searchContext;
  });

  // Get the number of columns to display based on columnLayout prop
  // columnLayout=1 → 1 column (full width)
  // columnLayout=2 → 2 columns (half width each)
  // columnLayout=3 → 3 columns (third width each)
  // columnLayout=4 → 4 columns (quarter width each)
  // columnLayout='auto' → calculated based on field count
  const getNumColumns = (): number => {
    if (columnLayout !== 'auto') {
      return columnLayout as number;
    }
    // Auto mode: calculate based on field count
    const fieldCount = fields.length;
    if (fieldCount <= 3) return 1;
    if (fieldCount <= 6) return 2;
    if (fieldCount <= 9) return 3;
    return 4;
  };

  // Check if user can delete a search
  const canDeleteSearch = (search: SavedSearch) => {
    if (isAdmin) return true;
    if (search.createdBy === currentUser) return true;
    return false;
  };

  // Flatten grouped fields for API submission
  const flattenValues = (values: Record<string, any>) => {
    const flattened: Record<string, any> = {};

    fields.forEach((field) => {
      if (field.type === 'group' && field.fields) {
        // For grouped fields, extract each sub-field value
        const groupValue = values[field.name] || {};
        field.fields.forEach((subField) => {
          flattened[subField.name] = groupValue[subField.name];
        });
      } else {
        // For regular fields, keep as-is
        flattened[field.name] = values[field.name];
      }
    });

    return flattened;
  };

  const handleFieldChange = (name: string, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear validation error for this field when user changes it
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Helper function to determine if field is required based on form mode
  const isFieldRequired = (field: any): boolean => {
    // If field has generic 'required', it's always required
    if (field.required) return true;

    // Check mode-specific required flags
    if (formMode === 'edit' && field.requiredForEdit) return true;
    if (formMode === 'search' && field.requiredForSearch) return true;

    return false;
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Recursively validate all fields
    const validateField = (field: any): void => {
      if (field.type === 'group' && field.fields) {
        // Validate grouped fields
        field.fields.forEach(validateField);
      } else if (isFieldRequired(field)) {
        const value = formValues[field.name];

        // Check if value is empty
        if (value === undefined || value === null || value === '') {
          errors[field.name] = `${field.label} is required`;
        } else if (Array.isArray(value) && value.length === 0) {
          errors[field.name] = `${field.label} is required`;
        } else if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) {
          errors[field.name] = `${field.label} is required`;
        }
      }
    };

    fields.forEach(validateField);
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSearch = () => {
    // Validate form before submitting
    if (!validateForm()) {
      return;
    }

    const flattenedValues = flattenValues(formValues);
    onSearch(flattenedValues, selectedViewMode);
    setSearchExpanded(false);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setSelectedViewMode(mode);
    if (onViewModeChange) {
      onViewModeChange(mode);
    }
  };

  const handleReset = () => {
    // If onReset callback is provided, call it (e.g., to close a dialog)
    if (onReset) {
      onReset();
      return;
    }

    // Otherwise, perform default reset behavior
    const resetValues: Record<string, any> = {};
    fields.forEach((field) => {
      if (field.type === 'group' && field.fields) {
        // For grouped fields, reset each sub-field
        const groupReset: Record<string, any> = {};
        field.fields.forEach((subField) => {
          if (subField.defaultValue !== undefined) {
            groupReset[subField.name] = subField.defaultValue;
          } else {
            groupReset[subField.name] = subField.type === 'checkbox' ? false : '';
          }
        });
        resetValues[field.name] = groupReset;
      } else {
        if (field.defaultValue !== undefined) {
          resetValues[field.name] = field.defaultValue;
        } else {
          resetValues[field.name] = field.type === 'checkbox' ? false : '';
        }
      }
    });
    setFormValues(resetValues);
  };

  const handleSaveSearch = () => {
    if (searchName.trim() && onSave) {
      const savedSearch: SavedSearch = {
        id: Date.now().toString(),
        name: searchName,
        params: formValues,
        createdAt: new Date().toISOString(),
        visibility: searchVisibility,
        createdBy: currentUser,
        context: searchContext,
        description: searchDescription.trim() || undefined,
      };
      onSave(savedSearch);
      setSaveDialogOpen(false);
      setSearchName('');
      setSearchDescription('');
      setSearchVisibility('user');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleOpenPreview = (search: SavedSearch) => {
    setSearchToPreview(search);
    setPreviewDialogOpen(true);
  };

  const handleApplySearch = () => {
    if (searchToPreview) {
      setFormValues(searchToPreview.params);
      if (onLoad) {
        onLoad(searchToPreview.id);
      }
      setPreviewDialogOpen(false);
      setSearchToPreview(null);
    }
  };

  // Format value for display in preview
  const formatPreviewValue = (value: any, fieldName: string): string => {
    if (value === undefined || value === null || value === '') {
      return '(empty)';
    }

    // Find the field config
    const findField = (name: string): any => {
      for (const field of fields) {
        if (field.name === name) return field;
        if (field.type === 'group' && field.fields) {
          const subField = field.fields.find(f => f.name === name);
          if (subField) return subField;
        }
      }
      return null;
    };

    const field = findField(fieldName);

    // Handle arrays (pills, multiselect)
    if (Array.isArray(value)) {
      if (value.length === 0) return '(empty)';
      return value.join(', ');
    }

    // Handle booleans
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    // Handle dropdown/select - try to find label
    if (field && field.options) {
      const option = field.options.find((opt: any) => opt.value === value);
      if (option) return option.label;
    }

    // Handle objects (grouped fields)
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }

    return String(value);
  };

  // Get field label by name
  const getFieldLabel = (fieldName: string): string => {
    for (const field of fields) {
      if (field.name === fieldName) return field.label;
      if (field.type === 'group' && field.fields) {
        const subField = field.fields.find(f => f.name === fieldName);
        if (subField) return subField.label;
      }
    }
    return fieldName;
  };

  const handleOpenDelete = (search: SavedSearch, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setSearchToDelete(search);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (searchToDelete && onDelete) {
      onDelete(searchToDelete.id);
      setDeleteDialogOpen(false);
      setSearchToDelete(null);
    }
  };

  const handleOpenRename = (search: SavedSearch, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent chip onClick from triggering
    setSearchToRename(search);
    setNewSearchName(search.name);
    setNewSearchVisibility(search.visibility);
    setRenameDialogOpen(true);
  };

  const handleRenameSearch = () => {
    if (searchToRename && newSearchName.trim()) {
      // Handle name change
      if (newSearchName.trim() !== searchToRename.name && onRename) {
        onRename(searchToRename.id, newSearchName.trim());
      }

      // Handle visibility change
      if (newSearchVisibility !== searchToRename.visibility && onChangeVisibility) {
        onChangeVisibility(searchToRename.id, newSearchVisibility);
      }

      setRenameDialogOpen(false);
      setSearchToRename(null);
      setNewSearchName('');
      setNewSearchVisibility('user');
    }
  };

  const handleToggleVisibility = (searchId: string, currentVisibility: SearchVisibility) => {
    if (onChangeVisibility) {
      const newVisibility: SearchVisibility = currentVisibility === 'user' ? 'global' : 'user';
      onChangeVisibility(searchId, newVisibility);
    }
  };

  return (
    <Box>
      {/* Saved Searches Dropdown at the top */}
      {enableSaveSearch && filteredSearches.length > 0 && (
        <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
          <Autocomplete
            options={filteredSearches}
            getOptionLabel={(option) => option.name}
            onChange={(_, newValue) => {
              if (newValue) {
                handleOpenPreview(newValue);
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Load Saved Search"
                placeholder="Select a saved search..."
                variant="outlined"
                slotProps={{
                  input: {
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <BookmarkBorderIcon color="primary" sx={{ ml: 1, mr: -0.5 }} />
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  },
                }}
              />
            )}
            renderOption={(props, option) => {
              const { key, ...optionProps } = props as any;
              return (
                <ListItem
                  key={key}
                  {...optionProps}
                  secondaryAction={
                    canDeleteSearch(option) ? (
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenRename(option, e);
                          }}
                          title="Edit search"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDelete(option, e);
                          }}
                          title="Delete search"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ) : undefined
                  }
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {option.visibility === 'global' ? (
                      <PublicIcon color="primary" fontSize="small" />
                    ) : (
                      <PersonIcon color="action" fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={option.name}
                    secondary={option.description || `${option.visibility === 'global' ? 'Global' : 'Personal'} search`}
                  />
                </ListItem>
              );
            }}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            fullWidth
          />
        </Paper>
      )}

      <Paper elevation={formMode === 'edit' ? 0 : 3} sx={{ p: formMode === 'edit' ? 0 : 3, mb: 2 }}>
        {formMode !== 'edit' && (
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
            onClick={() => setSearchExpanded(!searchExpanded)}
            sx={{ cursor: 'pointer', userSelect: 'none' }}
          >
            <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SearchIcon color="primary" />
              {searchTitle}
            </Typography>
            <IconButton component="span" tabIndex={-1}>
              {searchExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        )}

        <Collapse in={formMode === 'edit' || searchExpanded}>
          <Collapse in={saveSuccess}>
            <Alert severity="success" sx={{ mb: 2 }}>
              Search saved successfully!
            </Alert>
          </Collapse>

          {Object.keys(validationErrors).length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Please fill in all required fields before submitting.
            </Alert>
          )}

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 3,
              '& > *': {
                // Calculate width based on number of columns with gap consideration
                // For 1 col: 100%, 2 cols: ~48%, 3 cols: ~31%, 4 cols: ~23%
                flexBasis: `calc(${100 / getNumColumns()}% - ${((getNumColumns() - 1) * 24) / getNumColumns()}px)`,
                flexGrow: 0,
                flexShrink: 0,
                boxSizing: 'border-box',
                // Override any external min-width styles
                minWidth: '0 !important',
                maxWidth: '100%',
              },
              // Override any nested form elements that might have forced min-width
              '& .MuiFormControl-root, & .MuiAutocomplete-root, & .MuiTextField-root': {
                minWidth: 'unset !important',
              },
              // Responsive overrides
              '@media (max-width: 900px)': {
                '& > *': {
                  flexBasis: getNumColumns() === 1 ? '100%' : 'calc(50% - 12px)',
                },
              },
              '@media (max-width: 600px)': {
                '& > *': {
                  flexBasis: '100%',
                },
              },
            }}
          >
            {fields.map((field) => (
              <Box key={field.name}>
                <FieldRenderer
                  field={field}
                  value={formValues[field.name]}
                  onChange={handleFieldChange}
                  error={validationErrors[field.name]}
                  allValues={formValues}
                  allFields={fields}
                  formMode={formMode}
                />
              </Box>
            ))}

            {/* Custom fields - developer has full control */}
            {customFields && customFields(formValues, handleFieldChange)}
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Output Format Selector - inside search form */}
          {enableViewMode && (
            <Box mb={2}>
              <SearchableDropdown
                label="Output Format"
                value={selectedViewMode}
                onChange={(newValue) => handleViewModeChange(newValue as ViewMode)}
                options={
                  reportOptions
                    ? reportOptions.map(option => ({
                        label: option.label,
                        value: option.id,
                      }))
                    : availableViewModes.map(mode => ({
                        label: mode === 'grid' ? 'Search Results' : 'Report',
                        value: mode,
                      }))
                }
              />
            </Box>
          )}

          <Box display="flex" gap={2} flexWrap="wrap">
            <Button
              variant="contained"
              color="primary"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              size="large"
            >
              {searchButtonText}
            </Button>

            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleReset}
              size="large"
            >
              {resetButtonText}
            </Button>

            {enableSaveSearch && (
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<SaveIcon />}
                onClick={() => setSaveDialogOpen(true)}
                size="large"
              >
                Save Search
              </Button>
            )}
          </Box>
        </Collapse>
      </Paper>

      {/* Save Search Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="sm" fullWidth sx={getDialogStyles(modalPosition)}>
        <DialogTitle>
          Save Search Parameters
          {searchContext && (
            <Chip
              label={`Context: ${searchContext}`}
              size="small"
              color="info"
              variant="outlined"
              sx={{ ml: 2 }}
            />
          )}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Search Name"
            fullWidth
            variant="outlined"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="e.g., My Custom Search"
            sx={{ mt: 2 }}
            required
          />

          <TextField
            margin="dense"
            label="Description (Optional)"
            fullWidth
            variant="outlined"
            value={searchDescription}
            onChange={(e) => setSearchDescription(e.target.value)}
            placeholder="Brief description of this search..."
            multiline
            rows={2}
            sx={{ mt: 2, mb: 3 }}
          />

          <FormControl component="fieldset">
            <FormLabel component="legend">Search Visibility</FormLabel>
            <RadioGroup
              value={searchVisibility}
              onChange={(e) => setSearchVisibility(e.target.value as SearchVisibility)}
            >
              <FormControlLabel
                value="user"
                control={<Radio />}
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <PersonIcon fontSize="small" />
                    <Box>
                      <Typography variant="body2">User Search</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Only visible to you
                      </Typography>
                    </Box>
                  </Box>
                }
              />
              <FormControlLabel
                value="global"
                control={<Radio />}
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <PublicIcon fontSize="small" />
                    <Box>
                      <Typography variant="body2">Global Search</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Visible to all users
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveSearch}
            variant="contained"
            disabled={!searchName.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rename Search Dialog */}
      <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)} maxWidth="sm" fullWidth sx={getDialogStyles(modalPosition)}>
        <DialogTitle>Edit Saved Search</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Search Name"
            fullWidth
            variant="outlined"
            value={newSearchName}
            onChange={(e) => setNewSearchName(e.target.value)}
            placeholder="Enter search name"
            sx={{ mt: 2 }}
            required
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newSearchName.trim()) {
                handleRenameSearch();
              }
            }}
          />

          <FormControl component="fieldset" sx={{ mt: 3 }}>
            <FormLabel component="legend">Visibility</FormLabel>
            <RadioGroup
              value={newSearchVisibility}
              onChange={(e) => setNewSearchVisibility(e.target.value as SearchVisibility)}
            >
              <FormControlLabel
                value="user"
                control={<Radio />}
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <PersonIcon fontSize="small" />
                    <Box>
                      <Typography variant="body2">User Search</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Only visible to you
                      </Typography>
                    </Box>
                  </Box>
                }
              />
              <FormControlLabel
                value="global"
                control={<Radio />}
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <PublicIcon fontSize="small" />
                    <Box>
                      <Typography variant="body2">Global Search</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Visible to all users
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRenameSearch}
            variant="contained"
            disabled={
              !newSearchName.trim() ||
              (newSearchName === searchToRename?.name && newSearchVisibility === searchToRename?.visibility)
            }
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth sx={getDialogStyles(modalPosition)}>
        <DialogTitle>Delete Saved Search?</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete the saved search <strong>&quot;{searchToDelete?.name}&quot;</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Search Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
        sx={getDialogStyles(modalPosition)}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <SearchIcon color="primary" />
            Preview Saved Search
          </Box>
        </DialogTitle>
        <DialogContent>
          {searchToPreview && (
            <Box>
              {/* Search Metadata */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {searchToPreview.name}
                </Typography>
                {searchToPreview.description && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {searchToPreview.description}
                  </Typography>
                )}
                <Box display="flex" gap={1} alignItems="center" flexWrap="wrap" sx={{ mt: 1 }}>
                  <Chip
                    size="small"
                    icon={searchToPreview.visibility === 'global' ? <PublicIcon /> : <PersonIcon />}
                    label={searchToPreview.visibility === 'global' ? 'Global' : 'User'}
                    color={searchToPreview.visibility === 'global' ? 'primary' : 'default'}
                    onClick={
                      canDeleteSearch(searchToPreview) && onChangeVisibility
                        ? () => handleToggleVisibility(searchToPreview.id, searchToPreview.visibility)
                        : undefined
                    }
                    sx={
                      canDeleteSearch(searchToPreview) && onChangeVisibility
                        ? { cursor: 'pointer' }
                        : undefined
                    }
                  />
                  {canDeleteSearch(searchToPreview) && onChangeVisibility && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      Click to toggle visibility
                    </Typography>
                  )}
                  {searchToPreview.createdAt && (
                    <Typography variant="caption" color="text.secondary">
                      Created: {new Date(searchToPreview.createdAt).toLocaleDateString()}
                    </Typography>
                  )}
                </Box>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Search Parameters */}
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Search Parameters
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                <Table size="small">
                  <TableBody>
                    {Object.entries(searchToPreview.params).map(([key, value]) => {
                      // Skip empty values
                      if (value === '' || value === null || value === undefined) return null;
                      if (Array.isArray(value) && value.length === 0) return null;
                      if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) return null;

                      return (
                        <TableRow key={key}>
                          <TableCell component="th" scope="row" sx={{ fontWeight: 'medium', width: '40%' }}>
                            {getFieldLabel(key)}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'pre-wrap' }}>
                            {formatPreviewValue(value, key)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {Object.values(searchToPreview.params).every(v =>
                v === '' || v === null || v === undefined ||
                (Array.isArray(v) && v.length === 0) ||
                (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0)
              ) && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  This saved search has no active filters.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleApplySearch}
            variant="contained"
            color="primary"
            startIcon={<SearchIcon />}
          >
            Apply Search
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};
