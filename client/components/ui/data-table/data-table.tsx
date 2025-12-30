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
import { ReactNode, useEffect, useMemo, useRef } from "react";
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
    const hoveredRowId = useDataTableStore<TData, string | null>((state) => state.hoveredRowId);
    const activeFilterCount = useDataTableStore<TData, number>((state) =>
        state.getActiveFilterCount()
    );

    const {
        setSorting,
        setColumnSizing,
        setColumnOrder,
        setRowSelection,
        setTableInstance,
        reorderRows,
        clearSelection,
    } = useDataTableActions<TData>();

    // Derived state
    const { isDragDropEnabled, isSelectionEnabled } = useDerivedState<TData>(
        enableDragDrop,
        rowSelection?.enabled ?? false
    );

    // ========================================================================
    // Selection Column
    // ========================================================================

    const finalColumns = useMemo(() => {
        if (!isSelectionEnabled) return columns;

        const selectionColumn: ColumnDef<TData, TValue> = {
            id: "select",
            size: 40,
            minSize: 40,
            maxSize: 40,
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
            cell: ({ row }) => {
                const hasSelections = useDataTableStore<TData, boolean>((state) =>
                    state.hasSelections()
                );
                const isVisible =
                    rowSelection?.persistCheckboxes || hasSelections || hoveredRowId === row.id;

                return (
                    <div className="flex items-center justify-center">
                        <Checkbox
                            checked={row.getIsSelected()}
                            onCheckedChange={(value) => row.toggleSelected(!!value)}
                            aria-label="Select row"
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                                "transition-opacity duration-150",
                                !isVisible && "opacity-0 pointer-events-none"
                            )}
                        />
                    </div>
                );
            },
        };

        return [selectionColumn, ...columns];
    }, [columns, isSelectionEnabled, rowSelection?.persistCheckboxes, hoveredRowId]);

    // ========================================================================
    // TanStack Table Configuration
    // ========================================================================

    // Custom global filter function
    const globalFilterFn = (row: Row<TData>, columnId: string, filterValue: string) => {
        if (!search?.enabled || !filterValue) return true;

        const searchableColumns = search.searchableColumns;
        if (!searchableColumns || searchableColumns.length === 0) return true;

        const searchLower = filterValue.toLowerCase();

        return searchableColumns.some((colId) => {
            const value = row.getValue(colId as string);
            if (value == null) return false;
            return String(value).toLowerCase().includes(searchLower);
        });
    };

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
                numberRange: (row: Row<TData>, columnId: string, filterValue: { min?: number; max?: number }) => {
                    if (!filterValue) return true;
                    const value = row.getValue(columnId) as number;
                    if (filterValue.min !== undefined && value < filterValue.min) return false;
                    if (filterValue.max !== undefined && value > filterValue.max) return false;
                    return true;
                },
            },
        }),
        ...(columnResizing?.enabled && {
            columnResizeMode: columnResizing.columnResizeMode ?? "onEnd",
            onColumnSizingChange: setColumnSizing,
            defaultColumn: {
                size: columnResizing.defaultColumnSize ?? 150,
                minSize: 50,
                maxSize: 500,
            },
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
        <div
            className={cn(
                "relative w-full rounded-t-md",
                isDragDropEnabled ? "overflow-visible" : "overflow-x-auto"
            )}
        >
            <Table className={cn(columnResizing?.enabled && "table-fixed w-full")}>
                <DataTableHeader
                    table={table}
                    enableDragDrop={isDragDropEnabled}
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
                />
            </Table>
        </div>
    );

    const wrappedContent =
        isDragDropEnabled || columnOrdering?.enabled ? (
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis]}
            >
                {tableContent}
            </DndContext>
        ) : (
            tableContent
        );

    return (
        <div className={cn("w-full space-y-4 relative", className)}>
            {/* Selection Action Bar */}
            <DataTableSelectionBar actionComponent={rowSelection?.actionComponent} />

            {/* Toolbar */}
            <DataTableToolbar search={search} filter={filter} />

            {/* Table */}
            {wrappedContent}
        </div>
    );
}
