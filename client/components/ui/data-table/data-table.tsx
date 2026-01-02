"use client";

/**
 * DataTable - Refactored Main Component
 *
 * This is the orchestrator component that:
 * - Initializes TanStack Table instance
 * - Registers table with store
 * - Sets up DnD context
 * - Composes sub-components
 * - Manages TanStack Table configuration
 *
 * State management is handled by the DataTableProvider and store.
 * Components access state directly via hooks (no prop drilling).
 */

import { Checkbox } from "@/components/ui/checkbox";
import { Table } from "@/components/ui/table";
import { cn } from "@/lib/util/utils";
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    UniqueIdentifier,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import {
    ColumnDef,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    Row,
    useReactTable,
} from "@tanstack/react-table";
import { ReactNode, useCallback, useEffect, useMemo, useRef } from "react";
import { DataTableBody } from "./components/data-table-body";
import { DataTableHeader } from "./components/data-table-header";
import { DataTableSelectionBar } from "./components/data-table-selection-bar";
import { DataTableToolbar } from "./components/data-table-toolbar";
import { useDataTableActions, useDataTableStore, useDerivedState } from "./data-table-provider";
import type {
    ColumnOrderingConfig,
    ColumnResizingConfig,
    FilterConfig,
    RowActionsConfig,
    RowSelectionConfig,
    SearchConfig,
} from "./data-table.types";

// ============================================================================
// DataTable Props
// ============================================================================

export interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    enableDragDrop?: boolean;
    onReorder?: (data: TData[]) => void | boolean;
    getRowId?: (row: TData, index: number) => string;
    enableSorting?: boolean;
    enableFiltering?: boolean;
    onRowClick?: (row: Row<TData>) => void;
    className?: string;
    emptyMessage?: string;
    search?: SearchConfig<TData>;
    filter?: FilterConfig<TData>;
    rowActions?: RowActionsConfig<TData>;
    columnResizing?: ColumnResizingConfig;
    columnOrdering?: ColumnOrderingConfig;
    customRowRenderer?: (row: Row<TData>) => ReactNode | null;
    addingNewEntry?: boolean;
    disableDragForRow?: (row: Row<TData>) => boolean;
    onTableReady?: (columnSizes: Record<string, number>) => void;
    rowSelection?: RowSelectionConfig<TData>;
    /** Enable inline cell editing */
    enableInlineEdit?: boolean;

    /** Callback when a cell is edited (returns true on success) */
    onCellEdit?: (row: TData, columnId: string, newValue: any, oldValue: any) => Promise<boolean>;
    /** Edit mode trigger (click or doubleClick) */
    editMode?: "click" | "doubleClick";
}

export const DEFAULT_COLUMN_WIDTH = 250;

// ============================================================================
// Main Component
// ============================================================================

export function DataTable<TData, TValue>({
    columns,
    enableDragDrop = false,
    onReorder,
    getRowId,
    enableSorting = false,
    enableFiltering = false,
    onRowClick,
    className,
    emptyMessage = "No results.",
    search,
    filter,
    rowActions,
    columnResizing,
    columnOrdering,
    customRowRenderer,
    addingNewEntry = false,
    disableDragForRow,
    onTableReady,
    rowSelection,
    enableInlineEdit = false,
    onCellEdit,
    editMode = "click",
}: DataTableProps<TData, TValue>) {
    // ========================================================================
    // Store State & Actions
    // ========================================================================

    const tableData = useDataTableStore<TData, TData[]>((state) => state.tableData);
    const sorting = useDataTableStore<TData, any>((state) => state.sorting);
    const columnFilters = useDataTableStore<TData, any>((state) => state.columnFilters);
    const globalFilter = useDataTableStore<TData, string>((state) => state.globalFilter);
    const columnSizing = useDataTableStore<TData, Record<string, number>>(
        (state) => state.columnSizing
    );
    const columnOrder = useDataTableStore<TData, string[]>((state) => state.columnOrder);
    const rowSelectionState = useDataTableStore<TData, any>((state) => state.rowSelection);
    const activeFilterCount = useDataTableStore<TData, number>((state) =>
        state.getActiveFilterCount()
    );

    const focusedCell = useDataTableStore<TData, { rowId: string; columnId: string } | null>(
        (state) => state.focusedCell
    );
    const editingCell = useDataTableStore<TData, { rowId: string; columnId: string } | null>(
        (state) => state.editingCell
    );
    const requestCommit = useDataTableStore<TData, () => void>((state) => state.requestCommit);

    const {
        setSorting,
        setColumnSizing,
        setColumnOrder,
        setRowSelection,
        setTableInstance,
        reorderRows,
        clearSelection,
        // Focus actions
        clearFocus,
        focusNextCell,
        focusPrevCell,
        focusAdjacentCell,
        enterEditMode,
    } = useDataTableActions<TData>();

    // Ref for table container to detect outside clicks
    const tableContainerRef = useRef<HTMLDivElement>(null);

    // Derived state
    const { isDragDropEnabled, isSelectionEnabled } = useDerivedState<TData>(
        enableDragDrop,
        rowSelection?.enabled || false
    );

    // ========================================================================
    // Selection Column
    // ========================================================================

    const finalColumns = useMemo(() => {
        if (!isSelectionEnabled && !enableDragDrop) {
            return columns;
        }

        // Action Column includes selection/drag handle, row actions and expand button
        const actionsColumn: ColumnDef<TData, TValue> = {
            id: "actions",
            size: 80,
            minSize: 80,
            maxSize: 80,
            enableResizing: false,
            enableSorting: false,
            enableHiding: false,
            header: ({ table }) => (
                <div className="flex items-center justify-center">
                    <Checkbox
                        checked={table.getIsAllPageRowsSelected()}
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label="Select all"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            ),
        };

        return [actionsColumn, ...columns];
    }, [columns]);

    // ========================================================================
    // TanStack Table Configuration
    // ========================================================================

    // Custom global filter function with nested property support
    const globalFilterFn = (row: Row<TData>, columnId: string, filterValue: string) => {
        if (!search?.enabled || !filterValue) return true;

        const searchableColumns = search.searchableColumns;
        if (!searchableColumns || searchableColumns.length === 0) return true;

        const searchLower = filterValue.toLowerCase();

        // Helper to get nested property value (e.g., "name.plural")
        const getNestedValue = (obj: any, path: string): any => {
            return path.split(".").reduce((current, prop) => current?.[prop], obj);
        };

        return searchableColumns.some((colId) => {
            const colIdStr = colId as string;
            let value: any;

            // Check if colId contains dot notation (nested property)
            if (colIdStr.includes(".")) {
                // Access nested property from row.original
                value = getNestedValue(row.original, colIdStr);
            } else {
                // Standard column access
                value = row.getValue(colIdStr);
            }

            if (value == null) return false;

            // Handle objects by searching all their string values
            if (typeof value === "object" && !Array.isArray(value)) {
                return Object.values(value).some(
                    (v) => v != null && String(v).toLowerCase().includes(searchLower)
                );
            }

            return String(value).toLowerCase().includes(searchLower);
        });
    };

    // Check if any column has explicit size defined
    const hasExplicitColumnSizes = useMemo(() => {
        return finalColumns.some((col) => col.size !== undefined);
    }, [finalColumns]);

    const table = useReactTable<TData>({
        data: tableData,
        columns: finalColumns,
        getCoreRowModel: getCoreRowModel(),
        ...(enableSorting && {
            getSortedRowModel: getSortedRowModel(),
            onSortingChange: setSorting,
        }),
        ...((enableFiltering || search?.enabled || filter?.enabled) && {
            getFilteredRowModel: getFilteredRowModel(),
            globalFilterFn,
            filterFns: {
                multiSelect: (row: Row<TData>, columnId: string, filterValue: any[]) => {
                    if (!filterValue || filterValue.length === 0) return true;
                    const value = row.getValue(columnId);
                    return filterValue.includes(value);
                },
                numberRange: (
                    row: Row<TData>,
                    columnId: string,
                    filterValue: { min?: number; max?: number }
                ) => {
                    if (!filterValue) return true;
                    const value = row.getValue(columnId) as number;
                    if (filterValue.min !== undefined && value < filterValue.min) return false;
                    if (filterValue.max !== undefined && value > filterValue.max) return false;
                    return true;
                },
            },
        }),
        // Always set defaultColumn for sizing, but only enable resize interactions if columnResizing is enabled
        defaultColumn: {
            size: columnResizing?.defaultColumnSize ?? 150,
            minSize: 50,
            maxSize: 500,
        },
        ...(columnResizing?.enabled && {
            columnResizeMode: columnResizing.columnResizeMode ?? "onEnd",
            onColumnSizingChange: setColumnSizing,
        }),
        ...(columnOrdering?.enabled && {
            onColumnOrderChange: setColumnOrder,
        }),
        ...(isSelectionEnabled && {
            enableRowSelection: true,
            onRowSelectionChange: setRowSelection,
        }),
        getRowId: getRowId,
        state: {
            ...(enableSorting && { sorting }),
            ...((enableFiltering || search?.enabled || filter?.enabled) && { columnFilters }),
            ...(search?.enabled && { globalFilter }),
            ...(columnResizing?.enabled && { columnSizing }),
            ...(columnOrdering?.enabled && { columnOrder }),
            ...(isSelectionEnabled && { rowSelection: rowSelectionState }),
        },
    } as any);

    // ========================================================================
    // Register Table Instance with Store
    // ========================================================================

    useEffect(() => {
        setTableInstance(table);
    }, [table, setTableInstance]);

    // ========================================================================
    // Notify Parent on Table Ready
    // ========================================================================

    const hasNotifiedRef = useRef(false);
    useEffect(() => {
        if (!onTableReady || hasNotifiedRef.current) return;

        if (tableData.length === 0) return;

        const sizes: Record<string, number> = {};
        table.getAllLeafColumns().forEach((column) => {
            sizes[column.id] = column.getSize();
        });

        onTableReady(sizes);
        hasNotifiedRef.current = true;
    }, [tableData.length, table, onTableReady]);

    // ========================================================================
    // Clear Selections on Filter Change
    // ========================================================================

    useEffect(() => {
        if (!rowSelection?.enabled) return;
        if (rowSelection.clearOnFilterChange === false) return;

        if (globalFilter || activeFilterCount > 0) {
            clearSelection();
        }
    }, [globalFilter, activeFilterCount, rowSelection, clearSelection]);

    // ========================================================================
    // Clear Focus When Focused Row No Longer Exists
    // ========================================================================

    useEffect(() => {
        if (!focusedCell) return;

        const rows = table.getRowModel().rows;
        const rowExists = rows.some((r) => r.id === focusedCell.rowId);

        if (!rowExists) {
            clearFocus();
        }
    }, [table, focusedCell, clearFocus]);

    // ========================================================================
    // Handle Click Outside Editing Cell
    // ========================================================================

    const handleClickOutside = useCallback(
        (event: MouseEvent) => {
            // Only handle if we have focus or edit state
            if (!editingCell && !focusedCell) return;

            const target = event.target as HTMLElement;

            // Check if click is inside the table container
            if (tableContainerRef.current?.contains(target)) {
                // Click is inside table - let the cell click handlers manage this
                // (startEditing auto-commits previous cell)
                return;
            }

            // Check if click is inside a portal (select dropdowns, popovers, etc.)
            // These are rendered outside the table but are still part of the editing context
            const isInsidePortal =
                target.closest("[data-radix-popper-content-wrapper]") ||
                target.closest("[data-radix-select-viewport]") ||
                target.closest("[data-radix-menu-content]") ||
                target.closest("[data-radix-popover-content]") ||
                target.closest("[role='listbox']") ||
                target.closest("[role='dialog']");

            if (isInsidePortal) {
                return;
            }

            // Click is outside the table and not in a portal
            if (editingCell) {
                // Commit edit and clear focus
                requestCommit();
            }
            // Clear focus when clicking outside table
            clearFocus();
        },
        [editingCell, focusedCell, requestCommit, clearFocus]
    );

    useEffect(() => {
        // Attach when editing or focused
        if (!editingCell && !focusedCell) return;

        // Use mousedown to catch the click before focus changes
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [editingCell, focusedCell, handleClickOutside]);

    // ========================================================================
    // Table-Level Keyboard Navigation (when focused but not editing)
    // ========================================================================

    const handleTableKeyDown = useCallback(
        (event: KeyboardEvent) => {
            // Only handle when focused but not editing
            if (!focusedCell || editingCell) return;

            switch (event.key) {
                case "Enter":
                    event.preventDefault();
                    enterEditMode();
                    break;
                case "Escape":
                    event.preventDefault();
                    clearFocus();
                    break;
                case "Tab":
                    event.preventDefault();
                    if (event.shiftKey) {
                        focusPrevCell();
                    } else {
                        focusNextCell();
                    }
                    break;
                case "ArrowUp":
                    event.preventDefault();
                    focusAdjacentCell("up");
                    break;
                case "ArrowDown":
                    event.preventDefault();
                    focusAdjacentCell("down");
                    break;
                case "ArrowLeft":
                    event.preventDefault();
                    focusAdjacentCell("left");
                    break;
                case "ArrowRight":
                    event.preventDefault();
                    focusAdjacentCell("right");
                    break;
            }
        },
        [
            focusedCell,
            editingCell,
            enterEditMode,
            clearFocus,
            focusNextCell,
            focusPrevCell,
            focusAdjacentCell,
        ]
    );

    useEffect(() => {
        // Only attach keyboard handler when focused but not editing
        if (!focusedCell || editingCell) return;

        document.addEventListener("keydown", handleTableKeyDown);
        return () => {
            document.removeEventListener("keydown", handleTableKeyDown);
        };
    }, [focusedCell, editingCell, handleTableKeyDown]);

    // ========================================================================
    // DnD Sensors
    // ========================================================================

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const columnIds = useMemo(() => {
        return table.getAllLeafColumns().map((col) => col.id as UniqueIdentifier);
    }, [table]);

    const rowIds = useMemo(() => {
        return table.getRowModel().rows.map((row) => row.id as UniqueIdentifier);
    }, [table, tableData]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const isColumnDrag = columnIds.includes(active.id);

        if (isColumnDrag) {
            // Handle column reordering
            const oldIndex = columnIds.indexOf(active.id);
            const newIndex = columnIds.indexOf(over.id);

            const newColumnOrder = arrayMove(columnIds as string[], oldIndex, newIndex);
            setColumnOrder(newColumnOrder);
        } else {
            // Handle row reordering
            const oldIndex = rowIds.indexOf(active.id);
            const newIndex = rowIds.indexOf(over.id);

            // Call onReorder callback if provided
            if (onReorder) {
                const newData = arrayMove([...tableData], oldIndex, newIndex);
                const result = onReorder(newData);

                // Only update store if not explicitly rejected
                if (result !== false) {
                    reorderRows(oldIndex, newIndex);
                }
            } else {
                reorderRows(oldIndex, newIndex);
            }
        }
    };

    // ========================================================================
    // Render
    // ========================================================================

    const tableContent = (
        <div ref={tableContainerRef} className={cn("relative rounded-t-md overflow-auto")}>
            <Table
                className={cn((columnResizing?.enabled || hasExplicitColumnSizes) && "table-fixed")}
            >
                <DataTableHeader
                    table={table}
                    enableColumnOrdering={columnOrdering?.enabled ?? false}
                    columnResizing={columnResizing}
                    rowActions={rowActions}
                    addingNewEntry={addingNewEntry}
                />
                <DataTableBody
                    table={table}
                    enableDragDrop={isDragDropEnabled}
                    isSelectionEnabled={isSelectionEnabled}
                    onRowClick={onRowClick}
                    rowActions={rowActions}
                    columnResizing={columnResizing}
                    customRowRenderer={customRowRenderer}
                    addingNewEntry={addingNewEntry}
                    disableDragForRow={disableDragForRow}
                    emptyMessage={emptyMessage}
                    finalColumnsCount={finalColumns.length}
                    enableInlineEdit={enableInlineEdit}
                    focusedCell={focusedCell}
                />
            </Table>
        </div>
    );

    // Only apply vertical axis restriction when row drag-drop is enabled but column ordering is not
    // Column ordering needs horizontal movement, so we can't restrict to vertical axis
    const dndModifiers =
        isDragDropEnabled && !columnOrdering?.enabled ? [restrictToVerticalAxis] : [];

    const wrappedContent =
        isDragDropEnabled || columnOrdering?.enabled ? (
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                modifiers={dndModifiers}
            >
                {tableContent}
            </DndContext>
        ) : (
            tableContent
        );

    return (
        <div className={cn("space-y-4 relative min-w-0", className)}>
            {/* Selection Action Bar */}
            <DataTableSelectionBar actionComponent={rowSelection?.actionComponent} />

            {/* Toolbar */}
            <DataTableToolbar search={search} filter={filter} />

            {/* Table */}
            {wrappedContent}
        </div>
    );
}
