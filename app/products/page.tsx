'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Alert,
  Button,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  FormGroup,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Description as CsvIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  // Lock as LockIcon,
} from '@mui/icons-material';
// import { LockService } from '@/lib/lockService';
import { DataGrid, GridColDef, GridPaginationModel, GridSortModel, GridRowSelectionModel } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { DynamicSearch, SavedSearch, ViewMode, ReportFormat, ReportOption, FieldConfig } from '@/components/DynamicSearch';
import { useProductsSearchFields } from '../fieldConfigs/productsSearchFields';
import { useGridManagement } from '@/hooks/useGridManagement';
import { useProducts, useAllProducts, usePrefetchProduct, type ProductsQueryParams } from '@/hooks/useProducts';
import {
  useSavedSearches,
  useCreateSavedSearch,
  // useRenameSavedSearch,
  // useChangeSearchVisibility,
  useDeleteSavedSearch,
} from '@/hooks/useSavedSearches';
import {
  useResponsiveColumnVisibility,
  type ResponsiveColumnConfig,
  type Breakpoint,
} from '@/hooks/useResponsiveColumnVisibility';

// Extend GridColDef with responsive config
type ResponsiveGridColDef = GridColDef & { hideBelow?: Breakpoint };

// Search field configurations - similar to app/page.tsx
// searchFields is now loaded inside the component via useProductsSearchFields hook

export default function ProductsPage() {
  // ========================================
  // CONFIGURATION OPTIONS
  // ========================================
  const { searchFields } = useProductsSearchFields();
  const enableExport = true;
  const enableEditView = true;
  // const currentUser = 'demo_user@example.com'; // In production, get from auth context

  // Report options for the view mode dropdown
  // Each report type can have different export formats available
  const reportOptions: ReportOption[] = [
    {
      id: 'grid',
      label: 'Search Results',
      icon: 'grid',
      fetchAll: false,
      // No exports for grid view - use report views for exports
    },
    {
      id: 'report',
      label: 'Standard Report',
      icon: 'report',
      fetchAll: true,
      exportFormats: [
        { format: 'pdf', label: 'Download PDF', icon: 'pdf' },
        { format: 'excel', label: 'Download Excel', icon: 'excel' },
        { format: 'csv', label: 'Download CSV', icon: 'csv' },
      ],
    },
    {
      id: 'product-types-report',
      label: 'Product Types Report',
      icon: 'chart',
      fetchAll: true,
      description: 'Report grouped by product categories',
      exportFormats: [
        { format: 'pdf', label: 'Download PDF', icon: 'pdf' },
        { format: 'excel', label: 'Download Excel', icon: 'excel' },
        { format: 'zip', label: 'Download ZIP Archive', icon: 'zip' },
      ],
    },
    {
      id: 'test-data-report',
      label: 'Test Data Report',
      icon: 'detailed',
      fetchAll: true,
      description: 'Report with test/sample data for validation',
      exportFormats: [
        { format: 'csv', label: 'Download CSV', icon: 'csv' },
        { format: 'json', label: 'Download JSON', icon: 'json' },
        { format: 'html', label: 'View as HTML', icon: 'html' },
      ],
    },
  ];

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Grid management for state persistence
  const {
    state,
    updateState,
    navigateTo,
    prefetchRoute,
    setSortModel,
    setColumnVisibility,
    setSelectedRows,
  } = useGridManagement({
    gridId: 'products-grid',
    scrollContainerRef,
  });

  // Saved searches from .NET API
  const { data: savedSearches = [], isLoading: isSavedSearchesLoading } = useSavedSearches({
    context: 'products',
    // includeGlobal: true,
  });
  const createSavedSearchMutation = useCreateSavedSearch();
  // const renameSavedSearchMutation = useRenameSavedSearch();
  // const changeVisibilityMutation = useChangeSearchVisibility();
  const deleteSavedSearchMutation = useDeleteSavedSearch();

  // Use hasSearched from persisted grid state
  const hasSearched = state.hasSearched;
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [downloadMenuAnchor, setDownloadMenuAnchor] = useState<null | HTMLElement>(null);
  const [columnSelectorOpen, setColumnSelectorOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Track locked rows: { rowId: { lockedBy: string, lockedAt: Date } }
  // const [lockedRows, setLockedRows] = useState<Record<number, { lockedBy: string; lockedAt: Date }>>({});

  // Build query params directly from Zustand state (single source of truth)
  const queryParams: ProductsQueryParams = {
    page: state.page,
    pageSize: state.pageSize,
    sortField: state.sortModel[0]?.field,
    sortOrder: state.sortModel[0]?.sort,
    search: state.filters.search,
    category: state.filters.category,
    status: state.filters.status,
    priceRange: state.filters.priceRange,
    dateFrom: state.filters.dateFrom,
    dateTo: state.filters.dateTo,
  };

  // Build filter-only params for report view (no pagination)
  const reportQueryParams = useMemo(() => ({
    sortField: state.sortModel[0]?.field,
    sortOrder: state.sortModel[0]?.sort,
    search: state.filters.search,
    category: state.filters.category,
    status: state.filters.status,
    priceRange: state.filters.priceRange,
    dateFrom: state.filters.dateFrom,
    dateTo: state.filters.dateTo,
  }), [state.sortModel, state.filters]);

  // Fetch products using React Query (paginated for grid view)
  // Only fetch when user has clicked search (hasSearched = true)
  const { data, isLoading, isError, error, refetch, isFetching } = useProducts(queryParams, {
    enabled: hasSearched,
  });

  // Check if current view mode requires all data (fetchAll: true)
  const currentReportOption = reportOptions.find(opt => opt.id === viewMode);
  const needsAllData = currentReportOption?.fetchAll === true;

  // Fetch ALL products for report view (only enabled when view needs all data and has searched)
  const {
    data: reportData,
    isLoading: isReportLoading,
    isFetching: isReportFetching,
  } = useAllProducts(reportQueryParams, {
    enabled: needsAllData && hasSearched,
  });

  // Prefetch hook for hover
  const prefetchProduct = usePrefetchProduct();

  // // Sync locks from database on mount and periodically
  // useEffect(() => {
  //   const syncLocks = async () => {
  //     const locks = await LockService.getTableLocks('products');
  //     const lockMap: Record<number, { lockedBy: string; lockedAt: Date }> = {};

  //     locks.forEach(lock => {
  //       lockMap[Number(lock.rowId)] = {
  //         lockedBy: lock.lockedBy,
  //         lockedAt: new Date(lock.lockedAt)
  //       };
  //     });

  //     setLockedRows(lockMap);
  //   };

  //   // Initial sync
  //   syncLocks();

  //   // Sync every 10 seconds
  //   const interval = setInterval(syncLocks, 10000);

  //   return () => clearInterval(interval);
  // }, []);

  // Grid columns definition
  const baseColumns: ResponsiveGridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70, hideBelow: 'md' },
    { field: 'name', headerName: 'Product Name', width: 200, flex: 1 },
    { field: 'category', headerName: 'Category', width: 130, hideBelow: 'sm' },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={
            params.value === 'active'
              ? 'success'
              : params.value === 'inactive'
              ? 'warning'
              : 'error'
          }
        />
      ),
    },
    {
      field: 'price',
      headerName: 'Price ($)',
      width: 100,
      type: 'number',
      hideBelow: 'sm',
      valueFormatter: (value: number) => `$${value?.toFixed(2) || '0.00'}`,
    },
    { field: 'stock', headerName: 'Stock', width: 100, type: 'number', hideBelow: 'md' },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 120,
      hideBelow: 'lg',
      valueFormatter: (value: string) => dayjs(value).format('MM/DD/YYYY'),
    },
  ];

  // Derive responsive config from baseColumns + actions (always visible)
  const responsiveColumnConfig: ResponsiveColumnConfig[] = [
    ...baseColumns.map(({ field, hideBelow }) => ({ field, hideBelow })),
    { field: 'actions' },
  ];

  // Optimistic navigation - prefetch and navigate immediately
  const handleEditClick = (row: any) => {
    prefetchProduct(row.id);
    navigateTo(`/products/edit/${row.id}`);
  };

  // Add actions column if enabled
  const columns: GridColDef[] = enableEditView
    ? [
        ...baseColumns,
        {
          field: 'actions',
          headerName: 'Actions',
          width: 250,
          sortable: false,
          filterable: false,
          renderCell: (params) => {
            return (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ViewIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewProduct(params.row);
                  }}
                >
                  View
                </Button>
                <Tooltip title="Edit product">
                  <span>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<EditIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(params.row);
                      }}
                      onMouseEnter={() => {
                        prefetchProduct(params.row.id);
                        prefetchRoute(`/products/edit/${params.row.id}`);
                      }}
                    >
                      Edit
                    </Button>
                  </span>
                </Tooltip>
              </Box>
            );
          },
        },
      ]
    : baseColumns;

  // Responsive column visibility - merges responsive rules with user preferences
  const {
    columnVisibilityModel,
    setColumnsVisible,
    resetToResponsiveDefaults,
    hasCustomVisibility,
  } = useResponsiveColumnVisibility({
    columns,
    responsiveConfig: responsiveColumnConfig,
    userVisibility: state.columnVisibility,
    onUserVisibilityChange: setColumnVisibility,
    userPreferencesPriority: true, // User can override responsive hiding
    minimumVisibleColumns: 1,
    excludeFromMinimum: ['actions', '__check__'],
  });

  // Column config for report view
  const availableColumns = useMemo(
    () =>
      baseColumns
        .filter((col) => col.field !== 'id' && col.field !== 'actions')
        .map((col) => ({
          id: col.field,
          label: col.headerName || col.field,
          selected: true,
        })),
    []
  );

  const [selectedColumns, setSelectedColumns] = useState(availableColumns);

  // Handlers
  const handleSearch = (params: Record<string, any>, selectedViewMode?: ViewMode) => {
    console.log('Search Parameters:', params);
    console.log('Selected View Mode:', selectedViewMode);

    updateState({
      filters: params,
      page: 0,
      hasSearched: true,
    });
  };

  const handleReset = () => {
    updateState({
      filters: {},
      page: 0,
      hasSearched: false,
    });
  };

  const handleViewProduct = (product: any) => {
    setSelectedProduct(product);
    setViewDialogOpen(true);
  };

  // Saved search handlers - using .NET API via React Query mutations
  const handleSaveSearch = (search: SavedSearch) => {
    createSavedSearchMutation.mutate({
      name: search.name,
      // description: search.description,
      context: 'products',
      visibility: search.visibility,
      params: search.params,
    }, {
      onSuccess: () => {
        console.log('Saved Search:', search.name);
      },
      onError: (error) => {
        console.error('Failed to save search:', error);
        alert('Failed to save search. Please try again.');
      },
    });
  };

  const handleLoadSearch = (searchId: string) => {
    const loaded = savedSearches.find((s) => s.id === searchId);
    console.log('Loaded Search:', loaded);
  };

  const handleDeleteSearch = (searchId: string) => {
    deleteSavedSearchMutation.mutate(searchId, {
      onSuccess: () => {
        console.log('Deleted Search ID:', searchId);
      },
      onError: (error) => {
        console.error('Failed to delete search:', error);
        alert('Failed to delete search. Please try again.');
      },
    });
  };

  const handleRenameSearch = (searchId: string, newName: string) => {
    // renameSavedSearchMutation.mutate({ id: searchId, name: newName }, {
    //   onSuccess: () => {
    //     console.log('Renamed Search ID:', searchId, 'to:', newName);
    //   },
    //   onError: (error) => {
    //     console.error('Failed to rename search:', error);
    //     alert('Failed to rename search. Please try again.');
    //   },
    // });
  };

  const handleChangeVisibility = (searchId: string, visibility: 'user' | 'global') => {
    // changeVisibilityMutation.mutate({ id: searchId, visibility }, {
    //   onSuccess: () => {
    //     console.log('Changed Search ID:', searchId, 'visibility to:', visibility);
    //   },
    //   onError: (error) => {
    //     console.error('Failed to change visibility:', error);
    //     alert('Failed to change visibility. Please try again.');
    //   },
    // });
  };

  // Handle export/download for the current report type
  const handleExport = async (format: ReportFormat) => {
    console.log('Export requested:', format, 'for report:', viewMode);

    // Handle standard formats
    if (format === 'pdf' || format === 'excel' || format === 'csv') {
      await handleDownloadReport(format);
    } else if (format === 'zip') {
      // Example: Handle ZIP export
      console.log('ZIP export requested - implement custom logic here');
      alert('ZIP export not yet implemented. This would bundle all data into a ZIP archive.');
    } else if (format === 'json') {
      // Example: Handle JSON export
      const searchResults = reportData?.data || [];
      const jsonContent = JSON.stringify(searchResults, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `product-report-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'html') {
      // Generate HTML preview and open in new window
      const searchResults = reportData?.data || [];
      const activeColumns = selectedColumns.filter((col) => col.selected);
      const timestamp = new Date().toLocaleString();

      // Helper function to format cell content
      const formatCellContent = (colId: string, value: any): string => {
        if (colId === 'price') {
          return '<span class="price">$' + (value?.toFixed(2) || '0.00') + '</span>';
        } else if (colId === 'createdAt') {
          return dayjs(value).format('MM/DD/YYYY');
        } else if (colId === 'status') {
          const statusClass = value === 'active' ? 'chip-active' : value === 'inactive' ? 'chip-inactive' : 'chip-discontinued';
          return '<span class="chip ' + statusClass + '">' + value + '</span>';
        } else if (colId === 'category') {
          return '<span class="chip chip-category">' + value + '</span>';
        }
        return String(value ?? '');
      };

      // Pre-generate table headers
      const tableHeaders = activeColumns.map(col => {
        const alignClass = col.id === 'price' || col.id === 'stock' ? 'right' : '';
        return '<th class="' + alignClass + '">' + col.label + '</th>';
      }).join('');

      // Pre-generate table rows
      const tableRows = searchResults.map((product: any) => {
        const cells = activeColumns.map(col => {
          const value = product[col.id];
          const alignClass = col.id === 'price' || col.id === 'stock' ? 'right' : '';
          const cellContent = formatCellContent(col.id, value);
          return '<td class="' + alignClass + '">' + cellContent + '</td>';
        }).join('');
        return '<tr>' + cells + '</tr>';
      }).join('\n          ');

      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${currentReportOption?.label || 'Report'} - Preview</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header {
      background: linear-gradient(135deg, #3f51b5, #1a237e);
      color: white;
      padding: 24px;
      border-radius: 8px 8px 0 0;
    }
    .header h1 { font-size: 24px; margin-bottom: 8px; }
    .header .meta { font-size: 14px; opacity: 0.9; }
    .content { padding: 24px; }
    .stats {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .stat {
      background: #e3f2fd;
      padding: 12px 20px;
      border-radius: 6px;
      font-weight: 500;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    th {
      background: #3f51b5;
      color: white;
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
    }
    th.right { text-align: right; }
    td {
      padding: 12px 16px;
      border-bottom: 1px solid #e0e0e0;
    }
    td.right { text-align: right; }
    tr:nth-child(even) { background: #fafafa; }
    tr:hover { background: #e8f4fd; }
    .chip {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }
    .chip-active { background: #e8f5e9; color: #2e7d32; }
    .chip-inactive { background: #fff3e0; color: #e65100; }
    .chip-discontinued { background: #ffebee; color: #c62828; }
    .chip-category { background: #e3f2fd; color: #1565c0; border: 1px solid #90caf9; }
    .price { font-weight: 600; color: #1565c0; }
    .footer {
      padding: 16px 24px;
      background: #fafafa;
      border-top: 1px solid #e0e0e0;
      border-radius: 0 0 8px 8px;
      font-size: 12px;
      color: #666;
      display: flex;
      justify-content: space-between;
    }
    .actions {
      padding: 16px 24px;
      background: #fafafa;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      gap: 12px;
    }
    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    }
    .btn-primary { background: #3f51b5; color: white; }
    .btn-primary:hover { background: #303f9f; }
    .btn-secondary { background: #e0e0e0; color: #333; }
    .btn-secondary:hover { background: #bdbdbd; }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; }
      .actions { display: none; }
      .header { background: #3f51b5 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      th { background: #3f51b5 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${currentReportOption?.label || 'Product Report'}</h1>
      <div class="meta">Generated: ${timestamp}</div>
      ${currentReportOption?.description ? '<div class="meta">' + currentReportOption.description + '</div>' : ''}
    </div>
    <div class="actions">
      <button class="btn btn-primary" onclick="window.print()">Print Report</button>
      <button class="btn btn-secondary" onclick="window.close()">Close Preview</button>
    </div>
    <div class="content">
      <div class="stats">
        <div class="stat">Total Results: ${searchResults.length}</div>
        <div class="stat">Columns: ${activeColumns.length}</div>
      </div>
      <table>
        <thead>
          <tr>
            ${tableHeaders}
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>
    <div class="footer">
      <span>Product Report</span>
      <span>Page 1 of 1</span>
    </div>
  </div>
</body>
</html>`;

      // Open in new window
      const previewWindow = window.open('', '_blank', 'width=1200,height=800');
      if (previewWindow) {
        previewWindow.document.write(htmlContent);
        previewWindow.document.close();
      } else {
        alert('Could not open preview window. Please allow popups for this site.');
      }
    }
  };

  // Column selection handlers
  const handleToggleColumn = (columnId: string) => {
    setSelectedColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, selected: !col.selected } : col
      )
    );
  };

  const handleSelectAllColumns = () => {
    setSelectedColumns((prev) => prev.map((col) => ({ ...col, selected: true })));
  };

  const handleDeselectAllColumns = () => {
    setSelectedColumns((prev) => prev.map((col) => ({ ...col, selected: false })));
  };

  // Download handlers
  const handleDownloadReport = async (format: ReportFormat) => {
    setDownloadMenuAnchor(null);

    // Use report data (all rows) for exports
    const searchResults = reportData?.data || [];
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `product-report-${timestamp}`;

    const activeColumns = selectedColumns.filter((col) => col.selected);

    if (activeColumns.length === 0) {
      alert('Please select at least one column to export');
      return;
    }

    try {
      switch (format) {
        case 'pdf': {
          const jsPDFModule = await import('jspdf');
          const jsPDF = jsPDFModule.default;
          const autoTable = (await import('jspdf-autotable')).default;

          const doc = new jsPDF();
          doc.setFontSize(18);
          doc.text('Product Report', 14, 20);
          doc.setFontSize(10);
          doc.setTextColor(100);
          doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
          doc.text(`Total Results: ${searchResults.length}`, 14, 34);
          doc.setTextColor(0);

          const headers = activeColumns.map((col) => col.label);
          const body = searchResults.map((product: any) =>
            activeColumns.map((col) => {
              const value = product[col.id];
              if (col.id === 'price') return `$${value?.toFixed(2) || '0.00'}`;
              if (col.id === 'createdAt') return dayjs(value).format('MM/DD/YYYY');
              return value;
            })
          );

          autoTable(doc, {
            startY: 42,
            head: [headers],
            body: body,
            styles: { fontSize: 10, cellPadding: 3 },
            headStyles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { top: 42 },
          });

          doc.save(`${fileName}.pdf`);
          break;
        }

        case 'excel': {
          const XLSX = await import('xlsx');
          const worksheet = XLSX.utils.json_to_sheet(
            searchResults.map((product: any) => {
              const row: any = {};
              activeColumns.forEach((col) => {
                const value = product[col.id];
                let formattedValue = value;
                if (col.id === 'price') formattedValue = value;
                else if (col.id === 'createdAt') formattedValue = dayjs(value).format('MM/DD/YYYY');
                row[col.label] = formattedValue;
              });
              return row;
            })
          );

          const columnWidths = activeColumns.map(() => ({ wch: 20 }));
          worksheet['!cols'] = columnWidths;

          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
          workbook.Props = {
            Title: 'Product Report',
            Subject: 'Search Results',
            Author: 'Dynamic Search Component',
            CreatedDate: new Date(),
          };

          XLSX.writeFile(workbook, `${fileName}.xlsx`);
          break;
        }

        case 'csv': {
          const headers = activeColumns.map((col) => col.label);
          const csvRows = [
            headers.join(','),
            ...searchResults.map((product: any) =>
              activeColumns
                .map((col) => {
                  const value = product[col.id];
                  let formattedValue = value;
                  if (col.id === 'price') formattedValue = value;
                  else if (col.id === 'name') formattedValue = `"${value}"`;
                  else if (col.id === 'createdAt') formattedValue = dayjs(value).format('MM/DD/YYYY');
                  return formattedValue;
                })
                .join(',')
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

  // Pagination handler - Zustand is the single source of truth
  const handlePaginationChange = (model: GridPaginationModel) => {
    if (model.page === state.page && model.pageSize === state.pageSize) return;
    updateState({ page: model.page, pageSize: model.pageSize });
  };

  const handleSortChange = (model: GridSortModel) => {
    setSortModel(model as Array<{ field: string; sort: 'asc' | 'desc' }>);
  };

  const handleRowSelectionChange = (model: GridRowSelectionModel) => {
    console.log('Selection model:', model);
    // MUI DataGrid v8 format: { type: 'include' | 'exclude', ids: Set }
    if (model && typeof model === 'object' && 'ids' in model) {
      const ids = Array.from(model.ids) as (string | number)[];
      console.log('Selected IDs:', ids);
      setSelectedRows(ids);
    }
  };

  // Render grid view
  const renderGridView = () => (
    <Paper elevation={1} sx={{ height: 500, width: '100%' }} ref={scrollContainerRef}>
      {hasCustomVisibility && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 1, pt: 1 }}>
          <Button
            size="small"
            startIcon={<RefreshIcon />}
            onClick={resetToResponsiveDefaults}
          >
            Reset Columns
          </Button>
        </Box>
      )}
      <DataGrid
        rows={data?.data || []}
        columns={columns}
        rowCount={data?.total || 0}
        loading={isLoading || isFetching}
        getRowId={(row) => row.id}
        pageSizeOptions={[10, 25, 50, 100]}
        paginationModel={{ page: state.page, pageSize: state.pageSize }}
        onPaginationModelChange={handlePaginationChange}
        paginationMode="server"
        sortModel={state.sortModel}
        onSortModelChange={handleSortChange}
        sortingMode="server"
        checkboxSelection
        onRowSelectionModelChange={handleRowSelectionChange}
        columnVisibilityModel={columnVisibilityModel}
        onColumnVisibilityModelChange={(model) => setColumnsVisible(model)}
        slots={{
          loadingOverlay: () => (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ),
        }}
      />
    </Paper>
  );

  // Get icon component for export format
  const getExportIcon = (iconType?: string) => {
    switch (iconType) {
      case 'pdf': return <PdfIcon fontSize="small" />;
      case 'excel': return <ExcelIcon fontSize="small" />;
      case 'csv': return <CsvIcon fontSize="small" />;
      default: return <DownloadIcon fontSize="small" />;
    }
  };

  // Render report view
  const renderReportView = () => {
    const activeColumns = selectedColumns.filter((col) => col.selected);
    // Use report data (all rows) for report view
    const searchResults = reportData?.data || [];

    // Get export formats for current report type
    const currentExportFormats = currentReportOption?.exportFormats || [];

    // Show loading state for report data
    if (isReportLoading || isReportFetching) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading all data for report...</Typography>
        </Box>
      );
    }

    return (
      <Box>
        {/* Report Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {currentReportOption?.label || 'Report'} ({reportData?.total || searchResults.length} results)
            </Typography>
            {currentReportOption?.description && (
              <Typography variant="body2" color="text.secondary">
                {currentReportOption.description}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" onClick={() => setColumnSelectorOpen(true)}>
              Select Columns
            </Button>
            {enableExport && currentExportFormats.length > 0 && (
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={(e) => setDownloadMenuAnchor(e.currentTarget)}
              >
                Export
              </Button>
            )}
          </Box>
        </Box>

        {/* Export Menu - dynamic based on report's export formats */}
        {enableExport && currentExportFormats.length > 0 && (
          <Menu
            anchorEl={downloadMenuAnchor}
            open={Boolean(downloadMenuAnchor)}
            onClose={() => setDownloadMenuAnchor(null)}
          >
            {currentExportFormats.map((exportOption) => (
              <MenuItem
                key={exportOption.format}
                onClick={() => {
                  setDownloadMenuAnchor(null);
                  handleExport(exportOption.format);
                }}
                disabled={exportOption.enabled === false}
              >
                <ListItemIcon>{getExportIcon(exportOption.icon)}</ListItemIcon>
                <ListItemText>{exportOption.label || `Download as ${exportOption.format.toUpperCase()}`}</ListItemText>
              </MenuItem>
            ))}
          </Menu>
        )}
        <TableContainer component={Paper} variant="outlined">
          <Table sx={{ minWidth: 650 }} aria-label="product report table">
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                {activeColumns.map((col) => (
                  <TableCell
                    key={col.id}
                    sx={{ color: 'white', fontWeight: 'bold' }}
                    align={col.id === 'price' || col.id === 'stock' ? 'right' : 'left'}
                  >
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {searchResults.map((product: any) => (
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
                        align={col.id === 'price' || col.id === 'stock' ? 'right' : 'left'}
                      >
                        {col.id === 'category' ? (
                          <Chip label={value} size="small" color="primary" variant="outlined" />
                        ) : col.id === 'status' ? (
                          <Chip
                            label={value}
                            size="small"
                            color={value === 'active' ? 'success' : value === 'inactive' ? 'warning' : 'error'}
                          />
                        ) : col.id === 'price' ? (
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            ${value?.toFixed(2) || '0.00'}
                          </Typography>
                        ) : col.id === 'createdAt' ? (
                          dayjs(value).format('MM/DD/YYYY')
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

  // Render results based on view mode
  const renderResults = () => {
    if (!hasSearched) {
      return (
        <Alert severity="info">
          Fill out the search form above and click "Search" to see results.
        </Alert>
      );
    }

    if (isError) {
      return (
        <Alert severity="error">
          Failed to load products: {(error as Error)?.message || 'Unknown error'}
        </Alert>
      );
    }

    // For views needing all data, check reportData; for grid view, check data
    const currentData = needsAllData ? reportData : data;
    if (currentData?.data.length === 0) {
      return (
        <Alert severity="warning">
          No products found matching your search criteria. Try adjusting your filters.
        </Alert>
      );
    }

    // Render based on view mode - grid for 'grid', report view for any fetchAll view
    if (viewMode === 'grid') {
      return renderGridView();
    } else if (needsAllData) {
      // All fetchAll view types use the report view renderer
      return renderReportView();
    }
    return renderGridView();
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h3" component="h1" gutterBottom>
            Products
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" paragraph>
            Search and manage your product inventory with filters, export options, and saved searches.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh data">
            <IconButton onClick={() => refetch()} disabled={isFetching}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigateTo('/products/new')}
          >
            Add Product
          </Button>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        <strong>Features:</strong> Grid or Report view, export to PDF/Excel/CSV, saved searches, and filter persistence when editing.
      </Alert>

      {/* DynamicSearch Component */}
      <DynamicSearch
        key={JSON.stringify(state.filters)}
        fields={searchFields}
        onSearch={handleSearch}
        onReset={handleReset}
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
        defaultViewMode={viewMode}
        onViewModeChange={setViewMode}
        reportOptions={reportOptions}
        initialValues={state.filters}
        defaultExpanded={!hasSearched}
      />

      {/* Search Results */}
      <Box mt={4}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">
              Search Results
              {hasSearched && (needsAllData ? reportData : data) && (
                <Chip
                  label={`${(needsAllData ? reportData?.total : data?.total) || 0} ${((needsAllData ? reportData?.total : data?.total) || 0) === 1 ? 'result' : 'results'}`}
                  size="small"
                  color="primary"
                  sx={{ ml: 2 }}
                />
              )}
            </Typography>
            {hasSearched && (needsAllData ? reportData : data) && ((needsAllData ? reportData?.data : data?.data)?.length ?? 0) > 0 && (
              <Chip
                label={`View: ${currentReportOption?.label || viewMode}`}
                color="secondary"
                variant="outlined"
              />
            )}
          </Box>

          {/* Selection Info */}
          {state.selectedRowIds.length > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {state.selectedRowIds.length} row(s) selected
            </Alert>
          )}

          {renderResults()}

          {/* Stats */}
          {hasSearched && data && data.data.length > 0 && viewMode === 'grid' && (
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Page {data.page + 1} of {data.totalPages}
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>

      {/* View Product Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>View Product - {selectedProduct?.name}</DialogTitle>
        <DialogContent>
          {selectedProduct && (
            <Box sx={{ pt: 2 }}>
              <DynamicSearch
                fields={searchFields.map((f: FieldConfig) => ({ ...f, disabled: true }))}
                onSearch={() => {}}
                initialValues={selectedProduct}
                searchButtonText="Edit"
                resetButtonText="Close"
                enableSaveSearch={false}
                columnLayout={2}
                onReset={() => setViewDialogOpen(false)}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Column Selector Dialog */}
      <Dialog open={columnSelectorOpen} onClose={() => setColumnSelectorOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Select Columns for Report</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormGroup>
              {selectedColumns.map((col) => (
                <FormControlLabel
                  key={col.id}
                  control={<Checkbox checked={col.selected} onChange={() => handleToggleColumn(col.id)} />}
                  label={col.label}
                />
              ))}
            </FormGroup>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeselectAllColumns}>Deselect All</Button>
          <Button onClick={handleSelectAllColumns}>Select All</Button>
          <Button onClick={() => setColumnSelectorOpen(false)} variant="contained">Done</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
