"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  Row,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
} from "@tanstack/react-table";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  UniqueIdentifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useState, useMemo } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/util/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  enableDragDrop?: boolean;
  onReorder?: (data: TData[]) => void;
  getRowId?: (row: TData, index: number) => string;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  onRowClick?: (row: Row<TData>) => void;
  className?: string;
  emptyMessage?: string;
}

interface DraggableRowProps<TData> {
  row: Row<TData>;
  enableDragDrop: boolean;
  onRowClick?: (row: Row<TData>) => void;
}

function DraggableRow<TData>({ row, enableDragDrop, onRowClick }: DraggableRowProps<TData>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: row.id,
    disabled: !enableDragDrop,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      data-state={row.getIsSelected() ? "selected" : undefined}
      className={cn(
        isDragging && "opacity-50",
        onRowClick && "cursor-pointer"
      )}
      onClick={() => onRowClick?.(row)}
    >
      {enableDragDrop && (
        <TableCell className="w-[40px] p-2">
          <button
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </TableCell>
      )}
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

export function DataTable<TData, TValue>({
  columns,
  data,
  enableDragDrop = false,
  onReorder,
  getRowId,
  enableSorting = false,
  enableFiltering = false,
  onRowClick,
  className,
  emptyMessage = "No results.",
}: DataTableProps<TData, TValue>) {
  const [tableData, setTableData] = useState<TData[]>(data);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

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

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...(enableSorting && {
      getSortedRowModel: getSortedRowModel(),
      onSortingChange: setSorting,
    }),
    ...(enableFiltering && {
      getFilteredRowModel: getFilteredRowModel(),
      onColumnFiltersChange: setColumnFilters,
    }),
    getRowId: getRowId,
    state: {
      ...(enableSorting && { sorting }),
      ...(enableFiltering && { columnFilters }),
    },
  });

  const rowIds = useMemo(
    () => table.getRowModel().rows.map((row) => row.id as UniqueIdentifier),
    [table]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = rowIds.indexOf(active.id);
      const newIndex = rowIds.indexOf(over.id);

      const newData = arrayMove(tableData, oldIndex, newIndex);
      setTableData(newData);
      onReorder?.(newData);
    }
  };

  const tableContent = (
    <Table className={cn("relative", className)}>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {enableDragDrop && (
              <TableHead className="w-[40px]">
                <span className="sr-only">Drag handle</span>
              </TableHead>
            )}
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <DraggableRow
              key={row.id}
              row={row}
              enableDragDrop={enableDragDrop}
              onRowClick={onRowClick}
            />
          ))
        ) : (
          <TableRow>
            <TableCell
              colSpan={columns.length + (enableDragDrop ? 1 : 0)}
              className="h-24 text-center text-muted-foreground"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  if (enableDragDrop) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
          {tableContent}
        </SortableContext>
      </DndContext>
    );
  }

  return tableContent;
}
