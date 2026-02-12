'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { LockService } from '@/lib/lockService';
import {
  Container,
  Typography,
  Box,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Grid,
  TextField,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from '@mui/material';
import {
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Description as CsvIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { DynamicSearch, FieldConfig, SavedSearch, ViewMode, ReportFormat } from '@/components/DynamicSearch';

// Mock data for demonstration
const mockProducts = [
  { id: 1, productName: 'Wireless Mouse', category: 'electronics', condition: 'new', inStock: true, price: 25, country: 'us', readOnly: false },
  { id: 2, productName: 'Gaming Keyboard', category: 'electronics', condition: 'new', inStock: true, price: 89, country: 'ca', readOnly: true },
  { id: 3, productName: 'Office Chair', category: 'home-garden', condition: 'refurbished', inStock: false, price: 199, country: 'uk', readOnly: false },
  { id: 4, productName: 'Standing Desk', category: 'home-garden', condition: 'new', inStock: true, price: 450, country: 'us', readOnly: false },
  { id: 5, productName: 'USB-C Cable', category: 'electronics', condition: 'new', inStock: true, price: 12, country: 'cn', readOnly: true },
];

/**
 * Recursively disable all fields including nested fields in accordion/group types
 * @param fields - Array of field configurations
 * @returns New array with all fields disabled
 */
const disableAllFields = (fields: FieldConfig[]): FieldConfig[] => {
  return fields.map(field => ({
    ...field,
    disabled: true,
    // Recursively disable nested fields if they exist
    fields: field.fields ? disableAllFields(field.fields) : undefined,
  }));
};

export default function Home() {
  // ========================================
  // CONFIGURATION OPTIONS
  // ========================================
  const enableExport = true; // Set to false to hide export/download functionality
  const enableEditView = true; // Set to false to hide View/Edit buttons in grid

  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [gridData, setGridData] = useState(mockProducts);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit'>('edit'); // Track if dialog is for viewing or editing
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [downloadMenuAnchor, setDownloadMenuAnchor] = useState<null | HTMLElement>(null);
  const [columnSelectorOpen, setColumnSelectorOpen] = useState(false);

  // Track locked rows: { rowId: { lockedBy: string, lockedAt: Date } }
  const [lockedRows, setLockedRows] = useState<Record<number, { lockedBy: string; lockedAt: Date }>>({});
  const currentUser = 'user@example.com'; // In production, get from auth context

  // Handler functions need to be defined before columns
  const handleViewRow = (row: any) => {
    setSelectedRow(row);
    setDialogMode('view');
    setEditDialogOpen(true);
  };

  const handleEditRow = async (row: any) => {
    // Check if row is read-only
    if (row.readOnly) {
      alert('This record is read-only and cannot be edited.');
      return;
    }

    // Check if row is locked by another user (from local state first for instant feedback)
    const lock = lockedRows[row.id];
    if (lock && lock.lockedBy !== currentUser) {
      alert(`This record is currently being edited by ${lock.lockedBy}.\nPlease try again later.`);
      return;
    }

    // Try to acquire lock from database
    const lockResult = await LockService.acquireLock('products', row.id.toString(), currentUser);

    if (!lockResult.success) {
      alert(`This record is currently being edited by ${lockResult.lockedBy}.\nPlease try again later.`);
      return;
    }

    // Update local state
    setLockedRows(prev => ({
      ...prev,
      [row.id]: { lockedBy: currentUser, lockedAt: new Date() }
    }));

    setSelectedRow(row);
    setDialogMode('edit');
    setEditDialogOpen(true);
  };

  // Define columns for the data grid
  const baseColumns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'productName', headerName: 'Product Name', width: 200 },
    { field: 'category', headerName: 'Category', width: 130 },
    { field: 'condition', headerName: 'Condition', width: 130 },
    { field: 'inStock', headerName: 'In Stock', width: 100, type: 'boolean' },
    { field: 'price', headerName: 'Price ($)', width: 100, type: 'number' },
    { field: 'country', headerName: 'Country', width: 100 },
  ];

  // Conditionally add Actions column if enableEditView is true
  const columns: GridColDef[] = enableEditView
    ? [
        ...baseColumns,
        {
          field: 'actions',
          headerName: 'Actions',
          width: 280,
          sortable: false,
          filterable: false,
          renderCell: (params) => {
            const lock = lockedRows[params.row.id];
            const isLockedByOther = lock && lock.lockedBy !== currentUser;
            const isLockedByMe = lock && lock.lockedBy === currentUser;

            return (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
                {isLockedByOther && (
                  <Chip
                    icon={<LockIcon />}
                    label={`Locked by ${lock.lockedBy.split('@')[0]}`}
                    size="small"
                    color="warning"
                    sx={{ fontSize: '0.7rem' }}
                  />
                )}
                {isLockedByMe && (
                  <Chip
                    icon={<LockIcon />}
                    label="Editing"
                    size="small"
                    color="info"
                    sx={{ fontSize: '0.7rem' }}
                  />
                )}
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ViewIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewRow(params.row);
                  }}
                >
                  View
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<EditIcon />}
                  disabled={params.row.readOnly || isLockedByOther} // Disable if read-only or locked by another user
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditRow(params.row);
                  }}
                  title={
                    params.row.readOnly
                      ? 'This record is read-only'
                      : isLockedByOther
                      ? `Locked by ${lock.lockedBy}`
                      : 'Edit this record'
                  }
                >
                  Edit
                </Button>
              </Box>
            );
          },
        },
      ]
    : baseColumns;

  // Derive available columns from grid definition (exclude 'id' and 'actions')
  const availableColumns = useMemo(
    () =>
      columns
        .filter((col) => col.field !== 'id' && col.field !== 'actions')
        .map((col) => ({
          id: col.field,
          label: col.headerName || col.field,
          selected: true,
        })),
    []
  );

  const [selectedColumns, setSelectedColumns] = useState(availableColumns);

  // Define the search fields configuration (all optional for searching)
  // Note: Pill fields are placed at the end to prevent layout shifts when expanded
  const searchFields: FieldConfig[] = [
    {
      name: 'productName',
      label: 'Product Name',
      type: 'text',
      placeholder: 'Enter product name...',
      helperText: 'Search by product name',
      tooltip: 'Enter the name or partial name of the product you are looking for',
      requiredForEdit: true, // Required when editing, optional when searching
    },
    {
      name: 'category',
      label: 'Category',
      type: 'dropdown',
      apiUrl: '/api/categories',
      helperText: 'Select a category (loaded from API)',
      requiredForEdit: true, // Required when editing, optional when searching
    },
    {
      name: 'inStock',
      label: 'In Stock Only',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'condition',
      label: 'Condition',
      type: 'radio',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Used', value: 'used' },
        { label: 'Refurbished', value: 'refurbished' },
      ],
      helperText: 'Product condition',
      requiredForEdit: true, // Required when editing, optional when searching
    },
    {
      name: 'shippingFrom',
      label: 'Ships From',
      type: 'multiselect',
      apiUrl: '/api/countries',
      helperText: 'Select one or more countries',
      defaultValue: [],
      tooltip: 'Filter products that ship from specific countries. You can select multiple countries.',
    },
    {
      name: 'price',
      label: 'Price',
      type: 'number',
      placeholder: 'Enter price...',
      helperText: 'Product price in USD',
      requiredForEdit: true, // Required when editing, optional when searching
    },
    {
      name: 'dateAdded',
      label: 'Date Added After',
      type: 'date',
      helperText: 'Products added after this date',
    },
    {
      name: 'brand',
      label: 'Brand',
      type: 'dropdown',
      options: [
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
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'rating',
      label: 'Minimum Rating',
      type: 'dropdown',
      options: [
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
      type: 'dropdown',
      apiUrl: '/api/cities',
      apiLabelField: 'name', // API uses 'name' instead of 'label'
      apiValueField: 'id',   // API uses 'id' instead of 'value'
      helperText: 'Select a city (uses custom field mapping)',
      tooltip: 'This dropdown demonstrates custom API field mapping - the API returns {id, name} instead of {value, label}',
    },
    {
      name: 'country',
      label: 'Country (Modal Single Select)',
      type: 'modal-select',
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
      type: 'modal-select',
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
      name: 'farmInfo',
      label: 'Farm Information',
      type: 'group',
      helperText: 'Multiple fields grouped under one label',
      tooltip: 'This group demonstrates how to organize related fields together while keeping them as separate API parameters',
      fields: [
        {
          name: 'farmName',
          label: 'Farm Name',
          type: 'text',
          placeholder: 'Enter farm name...',
        },
        {
          name: 'animalType',
          label: 'Animal Type',
          type: 'dropdown',
          options: [
            { label: 'Cattle', value: 'cattle' },
            { label: 'Sheep', value: 'sheep' },
            { label: 'Pigs', value: 'pigs' },
            { label: 'Chickens', value: 'chickens' },
            { label: 'Goats', value: 'goats' },
          ],
        },
      ],
    },
    // Pill fields at the end to prevent layout shifts when they expand
    {
      name: 'specificPrices',
      label: 'Specific Prices',
      type: 'pill',
      pillType: 'number',
      allowRanges: true,
      placeholder: 'Enter prices or ranges (e.g., 100-150, 178, 190)',
      helperText: 'Add individual prices or ranges. Press Enter to add each value.',
      defaultValue: [],
      tooltip: 'You can enter individual prices (e.g., 99, 149) or ranges (e.g., 100-150) which will be expanded to include all values in between',
    },
    {
      name: 'keywords',
      label: 'Keywords',
      type: 'pill',
      pillType: 'text',
      allowRanges: false,
      placeholder: 'Enter keywords and press Enter',
      helperText: 'Add keywords one by one or comma-separated',
      defaultValue: [],
    },
    {
      name: 'productIds',
      label: 'Product IDs',
      type: 'pill',
      pillType: 'number',
      allowRanges: true,
      placeholder: 'Enter product IDs (e.g., 1-5, 10, 15-20)',
      helperText: 'Support ranges like 1-5 which expands to 1,2,3,4,5',
      defaultValue: [],
    },
  ];

  // Add accordion section for advanced options (demonstrating accordion + field copying)
  const accordionField: FieldConfig = {
    name: 'shippingInfo',
    label: 'Shipping Information',
    type: 'accordion',
    defaultExpanded: false,
    helperText: 'Additional shipping details',
    fields: [
      {
        name: 'warehouse',
        label: 'Primary Warehouse Location',
        type: 'text',
        placeholder: 'Enter warehouse location...',
      },
      {
        name: 'alternateWarehouse',
        label: 'Alternate Warehouse',
        type: 'text',
        placeholder: 'Enter alternate location...',
        copyFromField: 'warehouse',
        copyButtonText: 'Copy from Primary Warehouse',
      },
      {
        name: 'estimatedShipping',
        label: 'Est. Shipping Days',
        type: 'number',
        defaultValue: 3,
      },
      {
        name: 'specialInstructions',
        label: 'Special Shipping Instructions',
        type: 'richtext',
        placeholder: 'Enter any special shipping instructions here...',
        helperText: 'Use the rich text editor to format shipping notes, delivery requirements, or handling instructions',
        tooltip: 'This field supports formatting like bold, italic, lists, and quotes for clear shipping instructions',
      },
    ],
  };

  // For search: include accordion with shipping info
  const searchFieldsWithAccordion = [...searchFields, accordionField];

  // For edit: use search fields only (no accordion)
  const editFields = searchFields;

  /**
   * Fetch search results from API
   * @param searchParams - The search parameters
   * @param paginated - Whether to use pagination (true for grid, false for report)
   */
  const fetchSearchResults = async (searchParams: Record<string, any>, paginated: boolean) => {
    try {
      // In production, this would call your actual API endpoint
      // const response = await fetch('/api/products/search', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     ...searchParams,
      //     pagination: paginated,
      //   }),
      // });
      //
      // if (!response.ok) {
      //   throw new Error('Failed to fetch search results');
      // }
      //
      // const data = await response.json();
      // return data.results || [];

      // For demo purposes, simulate API call with local filtering
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay

      let filtered = [...gridData];

      if (searchParams.productName) {
        filtered = filtered.filter(item =>
          item.productName.toLowerCase().includes(searchParams.productName.toLowerCase())
        );
      }

      if (searchParams.category) {
        filtered = filtered.filter(item => item.category === searchParams.category);
      }

      if (searchParams.condition) {
        filtered = filtered.filter(item => item.condition === searchParams.condition);
      }

      if (searchParams.inStock) {
        filtered = filtered.filter(item => item.inStock === true);
      }

      if (searchParams.price) {
        filtered = filtered.filter(item => item.price <= Number(searchParams.price));
      }

      if (searchParams.country) {
        filtered = filtered.filter(item => item.country === searchParams.country);
      }

      // In production, the API would handle pagination
      // For demo, we return all data regardless of pagination parameter
      console.log('API call with pagination:', paginated);

      return filtered;
    } catch (error) {
      console.error('Error fetching search results:', error);
      return [];
    }
  };

  const handleSearch = async (params: Record<string, any>, selectedViewMode?: ViewMode) => {
    console.log('Search Parameters:', params);
    console.log('Selected View Mode:', selectedViewMode);

    // Determine if pagination should be used based on view mode
    const usePagination = selectedViewMode === 'grid';

    // Fetch results from API with appropriate pagination parameter
    const results = await fetchSearchResults(params, usePagination);

    setSearchResults(results);
    setHasSearched(true);
  };

  const handleEditSave = (editedData: Record<string, any>) => {
    console.log('Saving edited data:', editedData);
    // Update the grid data
    setGridData((prev) =>
      prev.map((item) => (item.id === selectedRow.id ? { ...item, ...editedData } : item))
    );

    // Also update searchResults if present
    if (hasSearched) {
      setSearchResults((prev) =>
        prev.map((item) => (item.id === selectedRow.id ? { ...item, ...editedData } : item))
      );
    }

    handleEditCancel(); // This will release the lock and close dialog
  };

  const handleEditCancel = async () => {
    // Release lock when closing dialog
    if (selectedRow) {
      // Release lock in database
      await LockService.releaseLock('products', selectedRow.id.toString(), currentUser);

      // Update local state
      setLockedRows(prev => {
        const newLocks = { ...prev };
        delete newLocks[selectedRow.id];
        return newLocks;
      });
    }
    setEditDialogOpen(false);
    setSelectedRow(null);
  };

  // Sync locks from database on mount and periodically
  useEffect(() => {
    const syncLocks = async () => {
      const locks = await LockService.getTableLocks('products');
      const lockMap: Record<number, { lockedBy: string; lockedAt: Date }> = {};

      locks.forEach(lock => {
        lockMap[Number(lock.rowId)] = {
          lockedBy: lock.lockedBy,
          lockedAt: new Date(lock.lockedAt)
        };
      });

      setLockedRows(lockMap);
    };

    // Initial sync
    syncLocks();

    // Sync every 10 seconds to get updates from other users
    const interval = setInterval(syncLocks, 10000);

    return () => clearInterval(interval);
  }, []);

  // Heartbeat to keep lock alive while editing
  useEffect(() => {
    if (!editDialogOpen || !selectedRow || selectedRow.readOnly) return;

    const heartbeat = setInterval(async () => {
      await LockService.refreshLock('products', selectedRow.id.toString(), currentUser);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(heartbeat);
  }, [editDialogOpen, selectedRow, currentUser]);

  const handleSaveSearch = (search: SavedSearch) => {
    setSavedSearches((prev) => [...prev, search]);
    console.log('Saved Search:', search);
  };

  const handleLoadSearch = (searchId: string) => {
    const loaded = savedSearches.find((s) => s.id === searchId);
    console.log('Loaded Search:', loaded);
  };

  const handleDeleteSearch = (searchId: string) => {
    setSavedSearches((prev) => prev.filter((s) => s.id !== searchId));
    console.log('Deleted Search ID:', searchId);
  };

  const handleRenameSearch = (searchId: string, newName: string) => {
    setSavedSearches((prev) =>
      prev.map((s) => (s.id === searchId ? { ...s, name: newName } : s))
    );
    console.log('Renamed Search ID:', searchId, 'to:', newName);
  };

  const handleChangeVisibility = (searchId: string, visibility: 'user' | 'global') => {
    setSavedSearches((prev) =>
      prev.map((s) => (s.id === searchId ? { ...s, visibility } : s))
    );
    console.log('Changed Search ID:', searchId, 'visibility to:', visibility);
  };

  // Render functions for different view modes
  const renderGridView = () => (
    <div style={{ height: 400, width: '100%' }}>
      <DataGrid
        rows={searchResults}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 5 },
          },
        }}
        pageSizeOptions={[5, 10]}
      />
    </div>
  );

  // Column selection handlers
  const handleToggleColumn = (columnId: string) => {
    setSelectedColumns(prev =>
      prev.map(col =>
        col.id === columnId ? { ...col, selected: !col.selected } : col
      )
    );
  };

  const handleSelectAllColumns = () => {
    setSelectedColumns(prev => prev.map(col => ({ ...col, selected: true })));
  };

  const handleDeselectAllColumns = () => {
    setSelectedColumns(prev => prev.map(col => ({ ...col, selected: false })));
  };

  const handleDownloadReport = async (format: ReportFormat) => {
    setDownloadMenuAnchor(null);

    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `product-report-${timestamp}`;

    // Get only selected columns
    const activeColumns = selectedColumns.filter(col => col.selected);

    if (activeColumns.length === 0) {
      alert('Please select at least one column to export');
      return;
    }

    try {
      switch (format) {
        case 'pdf': {
          // Dynamic import to reduce bundle size
          const jsPDFModule = await import('jspdf');
          const jsPDF = jsPDFModule.default;
          const autoTable = (await import('jspdf-autotable')).default;

          const doc = new jsPDF();

          // Add title
          doc.setFontSize(18);
          doc.text('Product Search Report', 14, 20);

          // Add date
          doc.setFontSize(10);
          doc.setTextColor(100);
          doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
          doc.text(`Total Results: ${searchResults.length}`, 14, 34);

          // Reset text color
          doc.setTextColor(0);

          // Generate table with selected columns only
          const headers = activeColumns.map(col => col.label);
          const body = searchResults.map(product =>
            activeColumns.map(col => {
              const value = product[col.id];
              if (col.id === 'inStock') return value ? 'Yes' : 'No';
              if (col.id === 'price') return `$${value}`;
              if (col.id === 'country') return value.toUpperCase();
              return value;
            })
          );

          autoTable(doc, {
            startY: 42,
            head: [headers],
            body: body,
            styles: {
              fontSize: 10,
              cellPadding: 3,
            },
            headStyles: {
              fillColor: [63, 81, 181], // Primary color
              textColor: 255,
              fontStyle: 'bold',
            },
            alternateRowStyles: {
              fillColor: [245, 245, 245],
            },
            margin: { top: 42 },
          });

          doc.save(`${fileName}.pdf`);
          break;
        }

        case 'excel': {
          // Dynamic import to reduce bundle size
          const XLSX = await import('xlsx');

          // Prepare data with selected columns only
          const worksheet = XLSX.utils.json_to_sheet(
            searchResults.map(product => {
              const row: any = {};
              activeColumns.forEach(col => {
                const value = product[col.id];
                let formattedValue = value;
                if (col.id === 'inStock') formattedValue = value ? 'Yes' : 'No';
                else if (col.id === 'price') formattedValue = value;
                else if (col.id === 'country') formattedValue = value.toUpperCase();
                row[col.label] = formattedValue;
              });
              return row;
            })
          );

          // Set column widths dynamically
          const columnWidths = activeColumns.map(() => ({ wch: 20 }));
          worksheet['!cols'] = columnWidths;

          // Create workbook and add worksheet
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

          // Add metadata
          workbook.Props = {
            Title: 'Product Search Report',
            Subject: 'Search Results',
            Author: 'Dynamic Search Component',
            CreatedDate: new Date(),
          };

          // Save file
          XLSX.writeFile(workbook, `${fileName}.xlsx`);
          break;
        }

        case 'csv': {
          // Generate CSV with selected columns only
          const headers = activeColumns.map(col => col.label);
          const csvRows = [
            headers.join(','),
            ...searchResults.map(product =>
              activeColumns.map(col => {
                const value = product[col.id];
                let formattedValue = value;
                if (col.id === 'inStock') formattedValue = value ? 'Yes' : 'No';
                else if (col.id === 'price') formattedValue = value;
                else if (col.id === 'country') formattedValue = value.toUpperCase();
                else if (col.id === 'productName') formattedValue = `"${value}"`;
                return formattedValue;
              }).join(',')
            ),
          ];
          const csvContent = csvRows.join('\n');
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', `${fileName}.csv`);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          break;
        }
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      alert(`Failed to download ${format.toUpperCase()} report. Please try again.`);
    }
  };

  const renderReportView = () => {
    const activeColumns = selectedColumns.filter(col => col.selected);

    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Product Search Report ({searchResults.length} results)
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => setColumnSelectorOpen(true)}
            >
              Select Columns
            </Button>
            {enableExport && (
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={(e) => setDownloadMenuAnchor(e.currentTarget)}
              >
                Download Report
              </Button>
            )}
          </Box>
          {enableExport && (
            <Menu
              anchorEl={downloadMenuAnchor}
              open={Boolean(downloadMenuAnchor)}
              onClose={() => setDownloadMenuAnchor(null)}
            >
              <MenuItem onClick={() => handleDownloadReport('pdf')}>
                <ListItemIcon>
                  <PdfIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Download as PDF</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleDownloadReport('excel')}>
                <ListItemIcon>
                  <ExcelIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Download as Excel</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleDownloadReport('csv')}>
                <ListItemIcon>
                  <CsvIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Download as CSV</ListItemText>
              </MenuItem>
            </Menu>
          )}
        </Box>
        <TableContainer component={Paper} variant="outlined">
          <Table sx={{ minWidth: 650 }} aria-label="product report table">
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                {activeColumns.map((col) => (
                  <TableCell
                    key={col.id}
                    sx={{ color: 'white', fontWeight: 'bold' }}
                    align={col.id === 'price' ? 'right' : 'left'}
                  >
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {searchResults.map((product) => (
                <TableRow
                  key={product.id}
                  sx={{
                    '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                    '&:hover': { bgcolor: 'action.selected' },
                  }}
                >
                  {activeColumns.map((col) => {
                    const value = product[col.id];
                    return (
                      <TableCell
                        key={col.id}
                        align={col.id === 'price' ? 'right' : 'left'}
                      >
                        {col.id === 'category' ? (
                          <Chip label={value} size="small" color="primary" variant="outlined" />
                        ) : col.id === 'condition' ? (
                          <Chip label={value} size="small" />
                        ) : col.id === 'inStock' ? (
                          <Chip
                            label={value ? 'Yes' : 'No'}
                            size="small"
                            color={value ? 'success' : 'error'}
                            variant="outlined"
                          />
                        ) : col.id === 'price' ? (
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            ${value}
                          </Typography>
                        ) : col.id === 'country' ? (
                          value.toUpperCase()
                        ) : (
                          value
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };


  const renderResults = () => {
    if (!hasSearched) {
      return (
        <Alert severity="info">
          Fill out the search form above and click "Search" to see results.
        </Alert>
      );
    }

    if (searchResults.length === 0) {
      return (
        <Alert severity="warning">
          No products found matching your search criteria. Try adjusting your filters.
        </Alert>
      );
    }

    switch (viewMode) {
      case 'grid':
        return renderGridView();
      case 'report':
        return renderReportView();
      default:
        return renderGridView();
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h3" component="h1" gutterBottom>
          Dynamic Search Component Demo
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          A flexible, reusable search component with support for multiple field types, API-driven
          dropdowns, pill-based inputs with range support, and enhanced saved search functionality
          with preview and user/global visibility options.
        </Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          <strong>New Features:</strong> Choose how to display search results - Grid (data table) or Report (detailed document with download options).
          Report view supports downloading as PDF, Excel, or CSV. Results only appear after clicking Search.
        </Alert>
        <Alert severity="success" sx={{ mt: 1 }}>
          <strong>Try these features:</strong> Interdependent fields (Brand → Model auto-fill), accordion fields
          with field copying in the edit modal, pill fields with range support (e.g., &quot;100-150&quot;), and separate View/Edit buttons in the grid.
        </Alert>
      </Box>

      <DynamicSearch
        fields={searchFieldsWithAccordion}
        onSearch={handleSearch}
        onSave={handleSaveSearch}
        onLoad={handleLoadSearch}
        onDelete={handleDeleteSearch}
        onRename={handleRenameSearch}
        onChangeVisibility={handleChangeVisibility}
        savedSearches={savedSearches}
        enableSaveSearch={true}
        currentUser="demo_user"
        searchContext="products"
        allowCrossContext={false}
        isAdmin={false}
        columnLayout={3}
        enableViewMode={true}
        defaultViewMode="grid"
        onViewModeChange={setViewMode}
        customFields={(values, onChange) => {
          // Example: Brand and Model interdependency
          const modelsByBrand: Record<string, string[]> = {
            apple: ['iPhone 15', 'iPhone 14', 'MacBook Pro', 'iPad Air'],
            samsung: ['Galaxy S24', 'Galaxy Note', 'Galaxy Tab'],
            sony: ['PlayStation 5', 'Xperia', 'Bravia TV'],
            lg: ['OLED TV', 'Gram Laptop', 'Wing Phone'],
            dell: ['XPS 13', 'Alienware', 'Inspiron'],
            hp: ['Spectre', 'Envy', 'Pavilion'],
          };

          const models = values.brand ? modelsByBrand[values.brand] || [] : [];

          return (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}>
                  <Chip label="Custom Interdependent Fields" size="small" color="secondary" />
                </Divider>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Brand (Custom)"
                  value={values.brandCustom || ''}
                  onChange={(e) => {
                    onChange('brandCustom', e.target.value);
                    onChange('modelCustom', ''); // Reset model when brand changes
                  }}
                  fullWidth
                  helperText="Selecting a brand will populate available models"
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="apple">Apple</MenuItem>
                  <MenuItem value="samsung">Samsung</MenuItem>
                  <MenuItem value="sony">Sony</MenuItem>
                  <MenuItem value="lg">LG</MenuItem>
                  <MenuItem value="dell">Dell</MenuItem>
                  <MenuItem value="hp">HP</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Model (Auto-populated)"
                  value={values.modelCustom || ''}
                  onChange={(e) => onChange('modelCustom', e.target.value)}
                  fullWidth
                  disabled={!values.brandCustom}
                  helperText={
                    !values.brandCustom
                      ? 'Select a brand first'
                      : `${models.length} models available`
                  }
                >
                  {models.map((model) => (
                    <MenuItem key={model} value={model}>
                      {model}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {values.brandCustom && values.modelCustom && (
                <Grid item xs={12}>
                  <Alert severity="success">
                    Selected: <strong>{values.brandCustom}</strong> - <strong>{values.modelCustom}</strong>
                  </Alert>
                </Grid>
              )}
            </>
          );
        }}
      />

      {/* Search Results */}
      <Box mt={4}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">
              Search Results
              {hasSearched && (
                <Chip
                  label={`${searchResults.length} ${searchResults.length === 1 ? 'result' : 'results'}`}
                  size="small"
                  color="primary"
                  sx={{ ml: 2 }}
                />
              )}
            </Typography>
            {hasSearched && searchResults.length > 0 && (
              <Chip
                label={`View: ${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}`}
                color="secondary"
                variant="outlined"
              />
            )}
          </Box>
          {hasSearched && searchResults.length > 0 && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Click on any item to edit the product details. The DynamicSearch component is used for both searching and editing!
            </Alert>
          )}

          {renderResults()}
        </Paper>
      </Box>

      {/* View/Edit Modal */}
      <Dialog open={editDialogOpen} onClose={handleEditCancel} maxWidth="lg" fullWidth>
        <DialogTitle>
          {dialogMode === 'view' ? 'View Product Details' : 'Edit Product'} - {selectedRow?.productName}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {selectedRow && dialogMode === 'edit' && (
              <DynamicSearch
                key={`edit-${selectedRow.id}`} // Force re-mount when editing different rows
                fields={editFields}
                onSearch={handleEditSave}
                onReset={handleEditCancel}
                searchButtonText="Save Changes"
                resetButtonText="Cancel"
                enableSaveSearch={false}
                initialValues={selectedRow}
                columnLayout={1}
                formMode="edit" // Enable edit mode validation
              />
            )}
            {selectedRow && dialogMode === 'view' && (
              <DynamicSearch
                key={`view-${selectedRow.id}`} // Force re-mount when viewing different rows
                fields={disableAllFields(editFields)} // Recursively disable all fields including nested accordion fields
                onSearch={() => {
                  // Prevent switching to edit mode for read-only rows
                  if (selectedRow.readOnly) {
                    alert('This record is read-only and cannot be edited.');
                    return;
                  }
                  setDialogMode('edit');
                }}
                onReset={handleEditCancel}
                searchButtonText={selectedRow.readOnly ? 'Read-Only' : 'Edit'} // Change button text for read-only rows
                resetButtonText="Close"
                enableSaveSearch={false}
                initialValues={selectedRow}
                columnLayout={1}
                formMode="edit"
              />
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Column Selector Dialog */}
      <Dialog
        open={columnSelectorOpen}
        onClose={() => setColumnSelectorOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Select Columns for Report</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormGroup>
              {selectedColumns.map((col) => (
                <FormControlLabel
                  key={col.id}
                  control={
                    <Checkbox
                      checked={col.selected}
                      onChange={() => handleToggleColumn(col.id)}
                    />
                  }
                  label={col.label}
                />
              ))}
            </FormGroup>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeselectAllColumns}>
            Deselect All
          </Button>
          <Button onClick={handleSelectAllColumns}>
            Select All
          </Button>
          <Button onClick={() => setColumnSelectorOpen(false)} variant="contained">
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
