"use client";

import { Cell, flexRender } from "@tanstack/react-table";
import { cn } from "@/lib/util/utils";

interface ReadOnlyCellProps<TData, TValue> {
    cell: Cell<TData, TValue>;
    isEditable: boolean;
    onClick: () => void;
}

/**
 * ReadOnlyCell component
 *
 * Renders a read-only view of a cell with optional edit capabilities.
 * When editable, adds hover styles and click handler to enter edit mode.
 */
export function ReadOnlyCell<TData, TValue>({
    cell,
    isEditable,
    onClick,
}: ReadOnlyCellProps<TData, TValue>) {
    const rendered = flexRender(cell.column.columnDef.cell, cell.getContext());

    if (!isEditable) {
        return <>{rendered}</>;
    }

    return (
        <div
            onClick={onClick}
            className={cn(
                'cursor-pointer rounded px-2 py-1 -mx-2 -my-1',
                'hover:bg-muted/50 hover:ring-1 hover:ring-ring/20',
                'transition-colors duration-150'
            )}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                }
            }}
        >
            {rendered}
        </div>
    );
}
