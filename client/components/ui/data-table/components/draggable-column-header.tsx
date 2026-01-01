"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Header, flexRender } from "@tanstack/react-table";
import { TableHead } from "@/components/ui/table";
import { useDataTableStore } from "../data-table-provider";
import { cn } from "@/lib/util/utils";
import type { ColumnResizingConfig } from "../data-table.types";

interface DraggableColumnHeaderProps<TData, TValue> {
    header: Header<TData, TValue>;
    enableColumnOrdering: boolean;
    columnResizing?: ColumnResizingConfig;
    addingNewEntry: boolean;
}

export function DraggableColumnHeader<TData, TValue>({
    header,
    enableColumnOrdering,
    columnResizing,
    addingNewEntry,
}: DraggableColumnHeaderProps<TData, TValue>) {
    const isMounted = useDataTableStore<TData, boolean>((state) => state.isMounted);

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: header.id,
        disabled: !enableColumnOrdering || !isMounted,
    });

    const style = isMounted
        ? {
              transform: CSS.Transform.toString(transform),
              transition,
              opacity: isDragging ? 0.5 : 1,
              width: `${header.getSize()}px`,
          }
        : {
              width: `${header.getSize()}px`,
          };

    return (
        <TableHead
            ref={enableColumnOrdering && isMounted ? setNodeRef : undefined}
            style={style}
            key={header.id}
            className={cn(
                "py-2 px-3 relative border-l first:border-l-transparent",
                enableColumnOrdering && "cursor-move"
            )}
            {...(isMounted && enableColumnOrdering ? attributes : {})}
            {...(isMounted && enableColumnOrdering ? listeners : {})}
        >
            <div className="flex items-center justify-between">
                {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
            </div>

            {columnResizing?.enabled && header.column.getCanResize() && !addingNewEntry && (
                <div
                    onMouseDown={header.getResizeHandler()}
                    onTouchStart={header.getResizeHandler()}
                    className={cn(
                        "absolute top-0 right-0 h-full w-3 cursor-col-resize select-none",
                        "group/resizer z-10"
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div
                        className={cn(
                            "absolute top-0 right-0 h-full w-[1px]",
                            "bg-transparent group-hover/resizer:bg-blue-500 group-hover/resizer:w-[2px]",
                            "group-active/resizer:bg-blue-600 transition-all duration-150",
                            header.column.getIsResizing() && "bg-blue-600 w-[2px]"
                        )}
                    />
                </div>
            )}
        </TableHead>
    );
}
