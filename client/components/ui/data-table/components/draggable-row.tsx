"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Row, flexRender } from "@tanstack/react-table";
import { GripVertical } from "lucide-react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useDataTableStore, useDataTableActions } from "../data-table-provider";
import { RowActionsMenu } from "./row-actions-menu";
import { cn } from "@/lib/util/utils";
import type { RowActionsConfig, ColumnResizingConfig } from "../data-table.types";
import React from "react";

interface DraggableRowProps<TData> {
    row: Row<TData>;
    enableDragDrop: boolean;
    onRowClick?: (row: Row<TData>) => void;
    rowActions?: RowActionsConfig<TData>;
    columnResizing?: ColumnResizingConfig;
    disabled?: boolean;
    disableDragForRow?: (row: Row<TData>) => boolean;
    isSelectionEnabled: boolean;
}

function DraggableRowComponent<TData>({
    row,
    enableDragDrop,
    onRowClick,
    rowActions,
    columnResizing,
    disabled,
    disableDragForRow,
    isSelectionEnabled,
}: DraggableRowProps<TData>) {
    const isMounted = useDataTableStore<TData, boolean>((state) => state.isMounted);
    const hoveredRowId = useDataTableStore<TData, string | null>((state) => state.hoveredRowId);
    const hasSelections = useDataTableStore<TData, boolean>((state) => state.hasSelections());
    const { setHoveredRowId } = useDataTableActions<TData>();

    const isDragDisabled = disableDragForRow?.(row) ?? false;

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: row.id,
        disabled: !enableDragDrop || !isMounted || isDragDisabled,
    });

    const style = isMounted
        ? {
              transform: CSS.Transform.toString(transform),
              transition,
          }
        : undefined;

    return (
        <TableRow
            ref={enableDragDrop && isMounted ? setNodeRef : undefined}
            style={style}
            data-state={row.getIsSelected() ? "selected" : undefined}
            className={cn(
                isDragging && "opacity-50",
                onRowClick && !disabled && "cursor-pointer",
                disabled && "opacity-40 pointer-events-none"
            )}
            onClick={() => !disabled && onRowClick?.(row)}
            onMouseEnter={() => isSelectionEnabled && setHoveredRowId(row.id)}
            onMouseLeave={() => isSelectionEnabled && setHoveredRowId(null)}
        >
            {/* Drag handle column */}
            {enableDragDrop && (
                <TableCell className="w-[40px] p-2">
                    <button
                        className={cn(
                            "cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors",
                            isDragDisabled && "opacity-30 cursor-not-allowed"
                        )}
                        {...(isMounted && !isDragDisabled ? attributes : {})}
                        {...(isMounted && !isDragDisabled ? listeners : {})}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <GripVertical className="h-4 w-4" />
                    </button>
                </TableCell>
            )}

            {/* Data cells (includes selection checkbox if enabled) */}
            {row.getVisibleCells().map((cell) => {
                // Special handling for selection column
                if (cell.column.id === "select") {
                    return (
                        <TableCell
                            key={cell.id}
                            className="border-l border-l-accent/40 first:border-l-transparent"
                            style={{
                                width: columnResizing?.enabled ? `${cell.column.getSize()}px` : undefined,
                                maxWidth: columnResizing?.enabled ? `${cell.column.getSize()}px` : undefined,
                            }}
                        >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                    );
                }

                return (
                    <TableCell
                        key={cell.id}
                        className="border-l border-l-accent/40 first:border-l-transparent"
                        style={{
                            width: columnResizing?.enabled ? `${cell.column.getSize()}px` : undefined,
                            maxWidth: columnResizing?.enabled ? `${cell.column.getSize()}px` : undefined,
                        }}
                    >
                        <div className={cn(columnResizing?.enabled && "overflow-x-auto")}>
                            <div className="overflow-hidden text-ellipsis">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </div>
                        </div>
                    </TableCell>
                );
            })}

            {/* Row actions column */}
            {rowActions?.enabled && (
                <TableCell className="w-[50px] p-2">
                    <RowActionsMenu row={row.original} config={rowActions} />
                </TableCell>
            )}
        </TableRow>
    );
}

// Memoize to prevent unnecessary re-renders
export const DraggableRow = React.memo(DraggableRowComponent, (prevProps, nextProps) => {
    // Re-render only if row ID or disabled state changes
    return (
        prevProps.row.id === nextProps.row.id &&
        prevProps.disabled === nextProps.disabled &&
        prevProps.enableDragDrop === nextProps.enableDragDrop &&
        prevProps.isSelectionEnabled === nextProps.isSelectionEnabled
    );
}) as typeof DraggableRowComponent;
