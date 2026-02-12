export type FieldType = 'text' | 'number' | 'dropdown' | 'checkbox' | 'radio' | 'date' | 'multiselect' | 'pill' | 'group' | 'modal-select' | 'accordion' | 'richtext';

export interface DropdownOption {
  label: string;
  value: string | number;
}

export type FormMode = 'search' | 'edit';

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  defaultValue?: any;
  options?: DropdownOption[];
  apiUrl?: string;
  apiLabelField?: string; // Field name for label in API response (default: 'label')
  apiValueField?: string; // Field name for value in API response (default: 'value')
  required?: boolean; // Always required (both search and edit)
  requiredForEdit?: boolean; // Only required in edit mode
  requiredForSearch?: boolean; // Only required in search mode
  disabled?: boolean; // Always disabled (both search and edit)
  disabledInEdit?: boolean; // Only disabled in edit mode (e.g., ID, created_at fields)
  disabledInSearch?: boolean; // Only disabled in search mode
  placeholder?: string;
  helperText?: string;
  pillType?: 'number' | 'text';
  allowRanges?: boolean;
  tooltip?: string;
  fields?: FieldConfig[]; // For grouped fields (only when type='group' or 'accordion')
  allowMultiple?: boolean; // For modal-select: allow selecting multiple values (default: false)
  defaultExpanded?: boolean; // For accordion: whether section starts expanded (default: false)
  copyFromField?: string; // Field name to copy value from (creates a "Copy from X" button)
  copyButtonText?: string; // Custom text for copy button (default: "Copy from {fieldLabel}")
  gridSpan?: 1 | 2 | 3 | 4 | 'full'; // How many grid columns this field spans (default: auto based on type)
}

export type SearchVisibility = 'user' | 'global';

export type ColumnLayout = 'auto' | 1 | 2 | 3 | 4;

export type ModalPosition = 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export type ViewMode = 'grid' | 'report' | string; // 'grid' for data grid, 'report' for default report, or custom string for custom views
export type ReportFormat = 'pdf' | 'excel' | 'csv' | 'zip' | 'html' | 'json';

// Export format configuration for a report
export interface ExportFormat {
  format: ReportFormat; // The export format type
  label?: string; // Custom label (default: "Download as PDF", etc.)
  icon?: 'pdf' | 'excel' | 'csv' | 'zip' | 'html' | 'json' | 'download'; // Icon to display
  enabled?: boolean; // Whether this export is enabled (default: true)
}

// Configuration for view/report options in the dropdown
export interface ReportOption {
  id: string; // Unique identifier (used as ViewMode value)
  label: string; // Display label in dropdown
  description?: string; // Optional description/tooltip
  icon?: 'grid' | 'report' | 'chart' | 'summary' | 'detailed' | 'table'; // Icon for the report type
  fetchAll?: boolean; // Whether this report needs all data (no pagination)
  exportFormats?: ExportFormat[]; // Available export formats for this report (if any)
}

// Legacy type for backward compatibility - maps to download action
export interface LegacyReportOption {
  id: string;
  label: string;
  description?: string;
  icon?: 'report' | 'pdf' | 'excel' | 'csv' | 'zip' | 'download' | 'chart' | 'summary' | 'detailed';
  type: 'view' | 'download';
  fetchAll?: boolean;
}


export interface SavedSearch {
  id: string;
  name: string;
  params: Record<string, any>;
  createdAt: string;
  visibility: SearchVisibility;
  createdBy?: string;
  context?: string;
  description?: string;
  viewMode?: ViewMode; // Preferred view mode for this saved search
}

export interface DynamicSearchProps {
  fields: FieldConfig[];
  onSearch: (params: Record<string, any>, viewMode?: ViewMode) => void;
  onSave?: (search: SavedSearch) => void;
  onLoad?: (searchId: string) => void;
  onDelete?: (searchId: string) => void;
  onRename?: (searchId: string, newName: string) => void;
  onChangeVisibility?: (searchId: string, visibility: SearchVisibility) => void;
  savedSearches?: SavedSearch[];
  enableSaveSearch?: boolean;
  searchButtonText?: string;
  resetButtonText?: string;
  onReset?: () => void; // Callback when reset button is clicked
  currentUser?: string;
  searchContext?: string;
  allowCrossContext?: boolean;
  isAdmin?: boolean;
  columnLayout?: ColumnLayout;
  initialValues?: Record<string, any>;
  modalPosition?: ModalPosition; // Position of all dialogs (default: 'center')
  enableViewMode?: boolean; // Enable view mode selector (default: false)
  defaultViewMode?: ViewMode; // Default view mode (default: 'grid')
  availableViewModes?: ViewMode[]; // Available view modes (default: all) - deprecated, use reportOptions instead
  onViewModeChange?: (viewMode: ViewMode) => void; // Callback when view mode changes
  reportOptions?: ReportOption[]; // Custom report/view options for the dropdown
  onExport?: (reportId: string, format: ReportFormat, params: Record<string, any>) => void; // Callback when user wants to export/download
  customFields?: (values: Record<string, any>, onChange: (name: string, value: any) => void) => React.ReactNode; // Custom fields render function
  formMode?: FormMode; // Form mode: 'search' or 'edit' (default: 'search')
  defaultExpanded?: boolean; // Whether the search section starts expanded (default: true)
  searchTitle?: string; // Title for the search section (default: 'Advanced Search')
}
