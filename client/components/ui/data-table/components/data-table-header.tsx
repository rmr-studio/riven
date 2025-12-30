"use client";

import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { Table as TanStackTable, flexRender } from "@tanstack/react-table";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDataTableStore } from "../data-table-provider";
import { DraggableColumnHeader } from "./draggable-column-header";
import type { ColumnResizingConfig, RowActionsConfig } from "../data-table.types";
import { useMemo } from "react";

interface DataTableHeaderProps<TData> {
    table: TanStackTable<TData>;
    enableDragDrop: boolean;
    enableColumnOrdering: boolean;
    columnResizing?: ColumnResizingConfig;
    rowActions?: RowActionsConfig<TData>;
    addingNewEntry: boolean;
}

export function DataTableHeader<TData>({
    table,
    enableDragDrop,
    enableColumnOrdering,
    columnResizing,
    rowActions,
    addingNewEntry,
}: DataTableHeaderProps<TData>) {
    const isMounted = useDataTableStore<TData, boolean>((state) => state.isMounted);

    const columnIds = useMemo(() => {
        return table.getAllLeafColumns().map((col) => col.id);
    }, [table]);

    return (
        <TableHeader className="bg-background">
            {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                    {/* Drag handle column header */}
                    {enableDragDrop && (
                        <TableHead className="w-[40px]">
                            <span className="sr-only">Drag handle</span>
                        </TableHead>
                    )}

                    {/* Column headers */}
                    {enableColumnOrdering && isMounted ? (
                        <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
                            {headerGroup.headers.map((header) => (
                                <DraggableColumnHeader
                                    key={header.id}
                                    header={header}
                                    enableColumnOrdering={enableColumnOrdering}
                                    columnResizing={columnResizing}
                                    addingNewEntry={addingNewEntry}
                                />
                            ))}
                        </SortableContext>
                    ) : (
                        headerGroup.headers.map((header) => (
                            <TableHead
                                key={header.id}
                                className="py-2 px-3 relative border-l first:border-l-transparent"
                                style={{
                                    width: columnResizing?.enabled ? `${header.getSize()}px` : undefined,
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(header.column.columnDef.header, header.getContext())}
                                </div>

                                {columnResizing?.enabled &&
                                    header.column.getCanResize() &&
                                    !addingNewEntry && (
                                        <div
                                            onMouseDown={header.getResizeHandler()}
                                            onTouchStart={header.getResizeHandler()}
                                            className="absolute top-0 right-0 h-full w-3 cursor-col-resize select-none group/resizer z-10"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div
                                                className={`absolute top-0 right-0 h-full w-[1px] bg-transparent group-hover/resizer:bg-blue-500 group-hover/resizer:w-[2px] group-active/resizer:bg-blue-600 transition-all duration-150 ${
                                                    header.column.getIsResizing() && "bg-blue-600 w-[2px]"
                                                }`}
                                            />
                                        </div>
                                    )}
                            </TableHead>
                        ))
                    )}

                    {/* Row actions column header */}
                    {rowActions?.enabled && (
                        <TableHead className="w-[50px]">
                            <span className="sr-only">Actions</span>
                        </TableHead>
                    )}
                </TableRow>
            ))}
        </TableHeader>
    );
}
