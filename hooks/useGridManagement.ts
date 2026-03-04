'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGridNavigationStore, GridState, getDefaultGridState } from '@/stores/gridNavigationStore';

interface UseGridManagementOptions {
  gridId: string;
  // Optional ref to the grid container for scroll tracking
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
}

interface UseGridManagementReturn {
  // Current grid state
  state: GridState;
  // Update specific parts of the state
  updateState: (updates: Partial<GridState>) => void;
  // Update a single filter
  updateFilter: (key: string, value: any) => void;
  // Clear all filters
  clearFilters: () => void;
  // Clear a specific filter
  clearFilter: (key: string) => void;
  // Prefetch a route's JS bundle (call on hover before navigateTo)
  prefetchRoute: (path: string) => void;
  // Navigate to a path while saving current state
  navigateTo: (path: string) => void;
  // Return to the grid from edit page
  returnToGrid: () => void;
  // Set page (resets to page 0 when filters change)
  setPage: (page: number) => void;
  // Set page size
  setPageSize: (pageSize: number) => void;
  // Set sort model
  setSortModel: (sortModel: Array<{ field: string; sort: 'asc' | 'desc' }>) => void;
  // Set column visibility
  setColumnVisibility: (visibility: Record<string, boolean>) => void;
  // Set selected rows
  setSelectedRows: (rowIds: (string | number)[]) => void;
}

// Debounce helper
function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  }) as T;
}

export function useGridManagement({
  gridId,
  scrollContainerRef,
}: UseGridManagementOptions): UseGridManagementReturn {
  const router = useRouter();
  const rafRef = useRef<number | null>(null);
  const lastScrollPosition = useRef<{ top: number; left: number }>({ top: 0, left: 0 });

  // Subscribe to the specific grid's state via selector for proper reactivity
  const state = useGridNavigationStore(
    (s) => s.activeGridState[gridId]
  ) ?? getDefaultGridState();

  const {
    updateGridState,
    pushNavigation,
    popNavigation,
  } = useGridNavigationStore();

  // Debounced state update to avoid excessive writes
  const debouncedUpdateState = useCallback(
    debounce((updates: Partial<GridState>) => {
      updateGridState(gridId, updates);
    }, 100),
    [gridId, updateGridState]
  );

  // Update state immediately for critical changes
  const updateState = useCallback(
    (updates: Partial<GridState>) => {
      updateGridState(gridId, updates);
    },
    [gridId, updateGridState]
  );

  // Update a single filter (resets page to 0)
  const updateFilter = useCallback(
    (key: string, value: any) => {
      const currentFilters = useGridNavigationStore.getState().activeGridState[gridId]?.filters ?? {};
      const newFilters = { ...currentFilters };

      if (value === undefined || value === null || value === '' ||
          (Array.isArray(value) && value.length === 0)) {
        delete newFilters[key];
      } else {
        newFilters[key] = value;
      }

      updateGridState(gridId, { filters: newFilters, page: 0 });
    },
    [gridId, updateGridState]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    updateGridState(gridId, { filters: {}, page: 0 });
  }, [gridId, updateGridState]);

  // Clear a specific filter
  const clearFilter = useCallback(
    (key: string) => {
      const currentFilters = useGridNavigationStore.getState().activeGridState[gridId]?.filters ?? {};
      const newFilters = { ...currentFilters };
      delete newFilters[key];
      updateGridState(gridId, { filters: newFilters, page: 0 });
    },
    [gridId, updateGridState]
  );

  // Prefetch a route's JS bundle so navigation is instant on click
  const prefetchRoute = useCallback(
    (path: string) => {
      router.prefetch(path);
    },
    [router]
  );

  // Navigate to edit page while preserving state
  const navigateTo = useCallback(
    (path: string) => {
      // Save scroll position before navigation
      if (scrollContainerRef?.current) {
        const { scrollTop, scrollLeft } = scrollContainerRef.current;
        updateGridState(gridId, {
          scrollPosition: { top: scrollTop, left: scrollLeft },
        });
      }

      // Push current state to navigation stack
      pushNavigation(gridId, window.location.pathname);

      // Navigate to the new path
      router.push(path);
    },
    [gridId, pushNavigation, router, scrollContainerRef, updateGridState]
  );

  // Return to grid from edit page
  const returnToGrid = useCallback(() => {
    const snapshot = popNavigation();
    if (snapshot) {
      router.push(snapshot.returnPath);
    } else {
      // Fallback: go back in history or to default path
      router.back();
    }
  }, [popNavigation, router]);

  // Set page
  const setPage = useCallback(
    (page: number) => {
      updateGridState(gridId, { page });
    },
    [gridId, updateGridState]
  );

  // Set page size (resets to page 0)
  const setPageSize = useCallback(
    (pageSize: number) => {
      updateGridState(gridId, { pageSize, page: 0 });
    },
    [gridId, updateGridState]
  );

  // Set sort model
  const setSortModel = useCallback(
    (sortModel: Array<{ field: string; sort: 'asc' | 'desc' }>) => {
      updateGridState(gridId, { sortModel });
    },
    [gridId, updateGridState]
  );

  // Set column visibility
  const setColumnVisibility = useCallback(
    (columnVisibility: Record<string, boolean>) => {
      updateGridState(gridId, { columnVisibility });
    },
    [gridId, updateGridState]
  );

  // Set selected rows
  const setSelectedRows = useCallback(
    (selectedRowIds: (string | number)[]) => {
      updateGridState(gridId, { selectedRowIds });
    },
    [gridId, updateGridState]
  );

  // Track scroll position with requestAnimationFrame throttling
  useEffect(() => {
    const container = scrollContainerRef?.current;
    if (!container) return;

    const handleScroll = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        const { scrollTop, scrollLeft } = container;
        // Only update if scroll position changed significantly
        if (
          Math.abs(scrollTop - lastScrollPosition.current.top) > 5 ||
          Math.abs(scrollLeft - lastScrollPosition.current.left) > 5
        ) {
          lastScrollPosition.current = { top: scrollTop, left: scrollLeft };
          debouncedUpdateState({
            scrollPosition: { top: scrollTop, left: scrollLeft },
          });
        }
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [scrollContainerRef, debouncedUpdateState]);

  // Restore scroll position on mount
  useEffect(() => {
    const container = scrollContainerRef?.current;
    if (!container) return;

    const { scrollPosition } = state;
    if (scrollPosition.top > 0 || scrollPosition.left > 0) {
      // Delay scroll restoration to ensure content is rendered
      const timeoutId = setTimeout(() => {
        container.scrollTo({
          top: scrollPosition.top,
          left: scrollPosition.left,
          behavior: 'instant',
        });
      }, 50);

      return () => clearTimeout(timeoutId);
    }
  }, [scrollContainerRef, state.scrollPosition]);

  return {
    state,
    updateState,
    updateFilter,
    clearFilters,
    clearFilter,
    navigateTo,
    prefetchRoute,
    returnToGrid,
    setPage,
    setPageSize,
    setSortModel,
    setColumnVisibility,
    setSelectedRows,
  };
}
