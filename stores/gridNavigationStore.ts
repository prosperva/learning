import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Grid state interface
export interface GridState {
  filters: Record<string, any>;
  page: number;
  pageSize: number;
  sortModel: Array<{ field: string; sort: 'asc' | 'desc' }>;
  columnVisibility: Record<string, boolean>;
  columnWidths: Record<string, number>;
  scrollPosition: { top: number; left: number };
  selectedRowIds: (string | number)[];
  hasSearched: boolean; // Track if a search has been performed
}

// Navigation snapshot with timestamp for expiry
export interface NavigationSnapshot {
  gridId: string;
  state: GridState;
  returnPath: string;
  timestamp: number;
}

// Store state interface
interface GridNavigationState {
  // Current active state per grid
  activeGridState: Record<string, GridState>;
  // Navigation stack for back navigation
  navigationStack: NavigationSnapshot[];

  // Actions
  updateGridState: (gridId: string, updates: Partial<GridState>) => void;
  getGridState: (gridId: string) => GridState;
  setGridState: (gridId: string, state: GridState) => void;
  pushNavigation: (gridId: string, returnPath: string) => void;
  popNavigation: () => NavigationSnapshot | null;
  clearNavigationStack: () => void;
  pruneOldSnapshots: (maxAgeMs?: number) => void;
}

// Default grid state
export const getDefaultGridState = (): GridState => ({
  filters: {},
  page: 0,
  pageSize: 25,
  sortModel: [],
  columnVisibility: {},
  columnWidths: {},
  scrollPosition: { top: 0, left: 0 },
  selectedRowIds: [],
  hasSearched: false,
});

// 30 minutes in milliseconds
const DEFAULT_SNAPSHOT_MAX_AGE = 30 * 60 * 1000;

export const useGridNavigationStore = create<GridNavigationState>()(
  persist(
    (set, get) => ({
      activeGridState: {},
      navigationStack: [],

      updateGridState: (gridId, updates) => {
        set((state) => ({
          activeGridState: {
            ...state.activeGridState,
            [gridId]: {
              ...getDefaultGridState(),
              ...state.activeGridState[gridId],
              ...updates,
            },
          },
        }));
      },

      getGridState: (gridId) => {
        const state = get().activeGridState[gridId];
        return state || getDefaultGridState();
      },

      setGridState: (gridId, gridState) => {
        set((state) => ({
          activeGridState: {
            ...state.activeGridState,
            [gridId]: gridState,
          },
        }));
      },

      pushNavigation: (gridId, returnPath) => {
        const currentState = get().getGridState(gridId);
        const snapshot: NavigationSnapshot = {
          gridId,
          state: { ...currentState },
          returnPath,
          timestamp: Date.now(),
        };

        set((state) => ({
          navigationStack: [...state.navigationStack, snapshot],
        }));
      },

      popNavigation: () => {
        const stack = get().navigationStack;
        if (stack.length === 0) return null;

        const snapshot = stack[stack.length - 1];

        set((state) => ({
          navigationStack: state.navigationStack.slice(0, -1),
          // Restore the state for the grid
          activeGridState: {
            ...state.activeGridState,
            [snapshot.gridId]: snapshot.state,
          },
        }));

        return snapshot;
      },

      clearNavigationStack: () => {
        set({ navigationStack: [] });
      },

      pruneOldSnapshots: (maxAgeMs = DEFAULT_SNAPSHOT_MAX_AGE) => {
        const now = Date.now();
        set((state) => ({
          navigationStack: state.navigationStack.filter(
            (snapshot) => now - snapshot.timestamp < maxAgeMs
          ),
        }));
      },
    }),
    {
      name: 'grid-navigation-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        activeGridState: state.activeGridState,
        navigationStack: state.navigationStack,
      }),
    }
  )
);
