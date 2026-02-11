'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { GridColDef } from '@mui/x-data-grid';

// Breakpoints matching MUI defaults
export const BREAKPOINTS = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

// Extended column definition with responsive config
export interface ResponsiveColumnConfig {
  field: string;
  // Hide column below this breakpoint (e.g., 'md' = hidden on xs, sm)
  hideBelow?: Breakpoint;
  // Priority for showing columns (lower = more important, shown first on small screens)
  priority?: number;
}

interface UseResponsiveColumnVisibilityOptions {
  // Column definitions from DataGrid
  columns: GridColDef[];
  // Responsive configuration for each column
  responsiveConfig?: ResponsiveColumnConfig[];
  // User's persisted visibility preferences (from state)
  userVisibility?: Record<string, boolean>;
  // Callback to save user visibility preferences
  onUserVisibilityChange?: (visibility: Record<string, boolean>) => void;
  // Whether to respect user preferences over responsive rules
  // If true, user preferences override responsive hiding
  userPreferencesPriority?: boolean;
  // Minimum number of data columns that must remain visible (default: 1)
  minimumVisibleColumns?: number;
  // Fields excluded from the minimum count (e.g., 'actions', '__check__')
  excludeFromMinimum?: string[];
}

interface UseResponsiveColumnVisibilityReturn {
  // Final column visibility model for DataGrid
  columnVisibilityModel: Record<string, boolean>;
  // Current breakpoint
  currentBreakpoint: Breakpoint;
  // Screen width
  screenWidth: number;
  // Update user visibility for a specific column
  setColumnVisible: (field: string, visible: boolean) => void;
  // Update multiple column visibilities at once
  setColumnsVisible: (visibility: Record<string, boolean>) => void;
  // Reset to responsive defaults (clear user preferences)
  resetToResponsiveDefaults: () => void;
  // Get columns that are hidden due to responsive rules
  responsiveHiddenColumns: string[];
  // Get columns that are hidden due to user preferences
  userHiddenColumns: string[];
  // Whether the user has customized column visibility (useful for showing reset button)
  hasCustomVisibility: boolean;
}

function getBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

function shouldHideAtBreakpoint(hideBelow: Breakpoint | undefined, currentBreakpoint: Breakpoint): boolean {
  if (!hideBelow) return false;

  const breakpointOrder: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl'];
  const hideIndex = breakpointOrder.indexOf(hideBelow);
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);

  // Hide if current breakpoint is below the hideBelow threshold
  return currentIndex < hideIndex;
}

export function useResponsiveColumnVisibility({
  columns,
  responsiveConfig = [],
  userVisibility = {},
  onUserVisibilityChange,
  userPreferencesPriority = true,
  minimumVisibleColumns = 1,
  excludeFromMinimum = ['actions', '__check__'],
}: UseResponsiveColumnVisibilityOptions): UseResponsiveColumnVisibilityReturn {
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : BREAKPOINTS.lg
  );

  // Listen to window resize
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    // Set initial width
    setScreenWidth(window.innerWidth);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentBreakpoint = useMemo(() => getBreakpoint(screenWidth), [screenWidth]);

  // Create a map of field -> responsive config
  const responsiveConfigMap = useMemo(() => {
    const map: Record<string, ResponsiveColumnConfig> = {};
    responsiveConfig.forEach((config) => {
      map[config.field] = config;
    });
    return map;
  }, [responsiveConfig]);

  // Calculate responsive visibility (columns hidden due to screen size)
  const responsiveVisibility = useMemo(() => {
    const visibility: Record<string, boolean> = {};

    columns.forEach((col) => {
      const config = responsiveConfigMap[col.field];
      if (config?.hideBelow) {
        const shouldHide = shouldHideAtBreakpoint(config.hideBelow, currentBreakpoint);
        visibility[col.field] = !shouldHide;
      } else {
        visibility[col.field] = true; // Default to visible
      }
    });

    return visibility;
  }, [columns, responsiveConfigMap, currentBreakpoint]);

  // Get list of columns hidden by responsive rules
  const responsiveHiddenColumns = useMemo(() => {
    return Object.entries(responsiveVisibility)
      .filter(([_, visible]) => !visible)
      .map(([field]) => field);
  }, [responsiveVisibility]);

  // Get list of columns hidden by user preferences
  const userHiddenColumns = useMemo(() => {
    return Object.entries(userVisibility)
      .filter(([_, visible]) => visible === false)
      .map(([field]) => field);
  }, [userVisibility]);

  // Merge responsive visibility with user preferences
  const columnVisibilityModel = useMemo(() => {
    const merged: Record<string, boolean> = {};

    columns.forEach((col) => {
      const field = col.field;
      const responsiveVisible = responsiveVisibility[field] ?? true;
      const userPreference = userVisibility[field];

      if (userPreferencesPriority && userPreference !== undefined) {
        // User preference takes priority
        merged[field] = userPreference;
      } else if (userPreference === false) {
        // User explicitly hid this column
        merged[field] = false;
      } else {
        // Use responsive visibility
        merged[field] = responsiveVisible;
      }
    });

    return merged;
  }, [columns, responsiveVisibility, userVisibility, userPreferencesPriority]);

  // Count visible data columns in a given visibility model (excluding non-data columns)
  const countVisibleDataColumns = useCallback(
    (visibilityModel: Record<string, boolean>) => {
      return columns.filter((col) => {
        if (excludeFromMinimum.includes(col.field)) return false;
        return visibilityModel[col.field] !== false;
      }).length;
    },
    [columns, excludeFromMinimum]
  );

  // Update single column visibility (user preference)
  const setColumnVisible = useCallback(
    (field: string, visible: boolean) => {
      // If hiding a column, check minimum
      if (!visible) {
        const projected = { ...columnVisibilityModel, [field]: false };
        if (countVisibleDataColumns(projected) < minimumVisibleColumns) {
          return; // Block: would hide all data columns
        }
      }
      const newVisibility = { ...userVisibility, [field]: visible };
      onUserVisibilityChange?.(newVisibility);
    },
    [userVisibility, onUserVisibilityChange, columnVisibilityModel, countVisibleDataColumns, minimumVisibleColumns]
  );

  // Update multiple columns (user preferences)
  const setColumnsVisible = useCallback(
    (visibility: Record<string, boolean>) => {
      const projected = { ...columnVisibilityModel, ...visibility };
      if (countVisibleDataColumns(projected) < minimumVisibleColumns) {
        return; // Block: would hide all data columns
      }
      const newVisibility = { ...userVisibility, ...visibility };
      onUserVisibilityChange?.(newVisibility);
    },
    [userVisibility, onUserVisibilityChange, columnVisibilityModel, countVisibleDataColumns, minimumVisibleColumns]
  );

  // Reset to responsive defaults (clear all user preferences)
  const resetToResponsiveDefaults = useCallback(() => {
    onUserVisibilityChange?.({});
  }, [onUserVisibilityChange]);

  // Whether the user has any custom visibility preferences set
  const hasCustomVisibility = useMemo(
    () => Object.keys(userVisibility).length > 0,
    [userVisibility]
  );

  return {
    columnVisibilityModel,
    currentBreakpoint,
    screenWidth,
    setColumnVisible,
    setColumnsVisible,
    resetToResponsiveDefaults,
    responsiveHiddenColumns,
    userHiddenColumns,
    hasCustomVisibility,
  };
}

// Helper to create responsive config from column definitions
export function createResponsiveConfig(
  configs: Array<{
    field: string;
    hideBelow?: Breakpoint;
    priority?: number;
  }>
): ResponsiveColumnConfig[] {
  return configs;
}

// Default responsive config factory based on common patterns
export function getDefaultResponsiveConfig(columns: GridColDef[]): ResponsiveColumnConfig[] {
  return columns.map((col, index) => {
    // Example default rules:
    // - ID column: hide below md
    // - Columns after the 4th: hide below lg
    // - Columns after the 6th: hide below xl
    let hideBelow: Breakpoint | undefined;

    if (col.field === 'id') {
      hideBelow = 'md';
    } else if (col.field === 'actions') {
      // Actions always visible
      hideBelow = undefined;
    } else if (index >= 6) {
      hideBelow = 'xl';
    } else if (index >= 4) {
      hideBelow = 'lg';
    } else if (index >= 3) {
      hideBelow = 'md';
    }

    return {
      field: col.field,
      hideBelow,
      priority: index,
    };
  });
}
