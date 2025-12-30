/**
 * DataTable Zustand Store
 *
 * Manages all client-side state for the data table component:
 * - Data (synced from TanStack Query)
 * - Sorting, filtering, search
 * - Row selection
 * - Column sizing and ordering
 * - UI state (hover, popovers, mounted)
 * - Drag and drop state
 *
 * Architecture:
 * - Single store with logical slices
 * - Factory function creates scoped instances
 * - subscribeWithSelector for fine-grained updates
 * - Integrates with TanStack React Table instance
 */

import { ColumnFiltersState, RowSelectionState, SortingState, Table } from "@tanstack/react-table";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

// ============================================================================
// State Interfaces (organized by concern)
// ============================================================================

interface DataState<TData> {
    /** Current table data (synced from props) */
    tableData: TData[];
    /** TanStack Table instance (set after initialization) */
    tableInstance: Table<TData> | null;
}

interface SortingSliceState {
    /** TanStack Table sorting state */
    sorting: SortingState;
}

interface FilteringSliceState {
    /** Column-specific filters (TanStack Table format) */
    columnFilters: ColumnFiltersState;
    /** Global search filter value */
    globalFilter: string;
    /** Search input value (before debounce) */
    searchValue: string;
    /** Active filter values by column ID */
    activeFilters: Record<string, any>;
    /** Set of enabled filter column IDs */
    enabledFilters: Set<string>;
}

interface SelectionSliceState {
    /** Row selection state (TanStack Table format) */
    rowSelection: RowSelectionState;
    /** ID of currently hovered row (for conditional checkbox display) */
    hoveredRowId: string | null;
}

interface ColumnSliceState {
    /** Column widths by column ID */
    columnSizing: Record<string, number>;
    /** Ordered array of column IDs */
    columnOrder: string[];
}

interface UISliceState {
    /** Client-side hydration flag (prevents SSR mismatches) */
    isMounted: boolean;
    /** Filter popover open state */
    filterPopoverOpen: boolean;
}

// ============================================================================
// Actions Interfaces (organized by concern)
// ============================================================================

interface DataActions<TData> {
    /** Sync table data from external source (TanStack Query) */
    setTableData: (data: TData[]) => void;
    /** Register TanStack Table instance for advanced operations */
    setTableInstance: (table: Table<TData>) => void;
    /** Reorder rows (for drag and drop) */
    reorderRows: (oldIndex: number, newIndex: number) => void;
}

interface SortingActions {
    setSorting: (sorting: SortingState | ((prev: SortingState) => SortingState)) => void;
}

interface FilteringActions {
    setColumnFilters: (filters: ColumnFiltersState) => void;
    setGlobalFilter: (filter: string) => void;
    setSearchValue: (value: string) => void;
    setActiveFilters: (filters: Record<string, any> | ((prev: Record<string, any>) => Record<string, any>)) => void;
    setEnabledFilters: (filters: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
    /** Clear search input and global filter */
    clearSearch: () => void;
    /** Clear all filters and reset enabled state */
    clearAllFilters: () => void;
    /** Clear a specific filter */
    clearFilter: (columnId: string) => void;
    /** Toggle a filter on/off */
    toggleFilter: (columnId: string, enabled: boolean) => void;
    /** Update a specific filter value */
    updateFilter: (columnId: string, value: any) => void;
}

interface SelectionActions<TData> {
    setRowSelection: (selection: RowSelectionState | ((prev: RowSelectionState) => RowSelectionState)) => void;
    setHoveredRowId: (rowId: string | null) => void;
    /** Clear all row selections */
    clearSelection: () => void;
    /** Get selected row data (requires table instance) */
    getSelectedRows: () => TData[];
}

interface ColumnActions {
    setColumnSizing: (sizing: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)) => void;
    setColumnOrder: (order: string[]) => void;
}

interface UIActions {
    setMounted: (mounted: boolean) => void;
    setFilterPopoverOpen: (open: boolean) => void;
}

// ============================================================================
// Combined Store Type
// ============================================================================

export type DataTableStore<TData> =
    & DataState<TData>
    & SortingSliceState
    & FilteringSliceState
    & SelectionSliceState
    & ColumnSliceState
    & UISliceState
    & DataActions<TData>
    & SortingActions
    & FilteringActions
    & SelectionActions<TData>
    & ColumnActions
    & UIActions
    & {
        // Derived state (computed on-demand)
        /** Number of active filters */
        getActiveFilterCount: () => number;
        /** Number of selected rows */
        getSelectedCount: () => number;
        /** Whether any rows are selected */
        hasSelections: () => boolean;
        /** Whether drag-drop should be enabled (no filters/search/selections) */
        isDragDropEnabled: (enableDragDrop: boolean) => boolean;
        /** Whether selection should be enabled (inverse of drag-drop in some cases) */
        isSelectionEnabled: (selectionConfig: boolean, dragDropConfig: boolean) => boolean;
    };

// ============================================================================
// Store Factory
// ============================================================================

export interface CreateDataTableStoreOptions<TData> {
    /** Initial table data */
    initialData: TData[];
    /** Initial column sizing */
    initialColumnSizing?: Record<string, number>;
}

/**
 * Factory function to create a DataTable store instance
 *
 * Each table gets its own store instance to avoid state collisions.
 * The store is scoped to the table's lifecycle via the provider.
 */
export const createDataTableStore = <TData,>(
    options: CreateDataTableStoreOptions<TData>
) => {
    const { initialData, initialColumnSizing = {} } = options;

    return create<DataTableStore<TData>>()(
        subscribeWithSelector((set, get) => ({
            // ================================================================
            // Initial State
            // ================================================================

            // Data slice
            tableData: initialData,
            tableInstance: null,

            // Sorting slice
            sorting: [],

            // Filtering slice
            columnFilters: [],
            globalFilter: "",
            searchValue: "",
            activeFilters: {},
            enabledFilters: new Set<string>(),

            // Selection slice
            rowSelection: {},
            hoveredRowId: null,

            // Column slice
            columnSizing: initialColumnSizing,
            columnOrder: [],

            // UI slice
            isMounted: false,
            filterPopoverOpen: false,

            // ================================================================
            // Data Actions
            // ================================================================

            setTableData: (data) => set({ tableData: data }),

            setTableInstance: (table) => set({ tableInstance: table }),

            reorderRows: (oldIndex, newIndex) => {
                const { tableData } = get();
                const newData = [...tableData];
                const [movedItem] = newData.splice(oldIndex, 1);
                newData.splice(newIndex, 0, movedItem);
                set({ tableData: newData });
            },

            // ================================================================
            // Sorting Actions
            // ================================================================

            setSorting: (sorting) =>
                set((state) => ({
                    sorting: typeof sorting === "function" ? sorting(state.sorting) : sorting
                })),

            // ================================================================
            // Filtering Actions
            // ================================================================

            setColumnFilters: (filters) => set({ columnFilters: filters }),

            setGlobalFilter: (filter) => set({ globalFilter: filter }),

            setSearchValue: (value) => set({ searchValue: value }),

            setActiveFilters: (filters) =>
                set((state) => ({
                    activeFilters: typeof filters === "function" ? filters(state.activeFilters) : filters
                })),

            setEnabledFilters: (filters) =>
                set((state) => ({
                    enabledFilters: typeof filters === "function" ? filters(state.enabledFilters) : filters
                })),

            clearSearch: () => set({ searchValue: "", globalFilter: "" }),

            clearAllFilters: () => set({
                activeFilters: {},
                enabledFilters: new Set(),
                columnFilters: []
            }),

            clearFilter: (columnId) => {
                set((state) => {
                    const newActiveFilters = { ...state.activeFilters };
                    delete newActiveFilters[columnId];

                    const newEnabledFilters = new Set(state.enabledFilters);
                    newEnabledFilters.delete(columnId);

                    return {
                        activeFilters: newActiveFilters,
                        enabledFilters: newEnabledFilters,
                    };
                });
            },

            toggleFilter: (columnId, enabled) => {
                if (enabled) {
                    set((state) => ({
                        enabledFilters: new Set(state.enabledFilters).add(columnId)
                    }));
                } else {
                    set((state) => {
                        const newEnabledFilters = new Set(state.enabledFilters);
                        newEnabledFilters.delete(columnId);

                        const newActiveFilters = { ...state.activeFilters };
                        delete newActiveFilters[columnId];

                        return {
                            enabledFilters: newEnabledFilters,
                            activeFilters: newActiveFilters,
                        };
                    });
                }
            },

            updateFilter: (columnId, value) => {
                set((state) => ({
                    activeFilters: {
                        ...state.activeFilters,
                        [columnId]: value,
                    }
                }));
            },

            // ================================================================
            // Selection Actions
            // ================================================================

            setRowSelection: (selection) =>
                set((state) => ({
                    rowSelection: typeof selection === "function" ? selection(state.rowSelection) : selection
                })),

            setHoveredRowId: (rowId) => set({ hoveredRowId: rowId }),

            clearSelection: () => set({ rowSelection: {} }),

            getSelectedRows: () => {
                const { tableInstance } = get();
                if (!tableInstance) return [];
                return tableInstance.getSelectedRowModel().rows.map((row) => row.original);
            },

            // ================================================================
            // Column Actions
            // ================================================================

            setColumnSizing: (sizing) =>
                set((state) => ({
                    columnSizing: typeof sizing === "function" ? sizing(state.columnSizing) : sizing
                })),

            setColumnOrder: (order) => set({ columnOrder: order }),

            // ================================================================
            // UI Actions
            // ================================================================

            setMounted: (mounted) => set({ isMounted: mounted }),

            setFilterPopoverOpen: (open) => set({ filterPopoverOpen: open }),

            // ================================================================
            // Derived State (Computed)
            // ================================================================

            getActiveFilterCount: () => {
                const { activeFilters, enabledFilters } = get();
                return Object.entries(activeFilters).filter(([key, value]) => {
                    if (!enabledFilters.has(key)) return false;
                    if (Array.isArray(value)) return value.length > 0;
                    return value !== null && value !== undefined && value !== "";
                }).length;
            },

            getSelectedCount: () => {
                const { rowSelection } = get();
                return Object.keys(rowSelection).filter((key) => rowSelection[key]).length;
            },

            hasSelections: () => {
                const { rowSelection } = get();
                return Object.keys(rowSelection).length > 0;
            },

            isDragDropEnabled: (enableDragDrop) => {
                if (!enableDragDrop) return false;
                const { globalFilter, hasSelections, getActiveFilterCount } = get();
                if (globalFilter && globalFilter.length > 0) return false;
                if (getActiveFilterCount() > 0) return false;
                if (hasSelections()) return false;
                return true;
            },

            isSelectionEnabled: (selectionConfig, dragDropConfig) => {
                if (!selectionConfig) return false;
                const { globalFilter, hasSelections, getActiveFilterCount } = get();
                // Disable selection when drag-drop would be active
                if (dragDropConfig && !globalFilter && getActiveFilterCount() === 0 && !hasSelections()) {
                    return false;
                }
                return true;
            },
        }))
    );
};

// Export store API type for TypeScript
export type DataTableStoreApi<TData> = ReturnType<typeof createDataTableStore<TData>>;
