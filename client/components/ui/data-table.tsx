"use client";

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
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    Row,
    SortingState,
    useReactTable,
} from "@tanstack/react-table";
import { Filter, GripVertical, MoreVertical, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/util/utils";

export interface SearchConfig<T> {
    enabled: boolean;
    searchableColumns: (keyof T extends string ? keyof T : never)[];
    placeholder?: string;
    debounceMs?: number;
    onSearchChange?: (value: string) => void;
}

export type FilterType =
    | "text"
    | "select"
    | "multi-select"
    | "date-range"
    | "number-range"
    | "boolean";

export interface FilterOption {
    label: string;
    value: string | number | boolean;
}

export interface ColumnFilter<T> {
    column: keyof T extends string ? keyof T : never;
    type: FilterType;
    label: string;
    options?: FilterOption[]; // For select/multi-select
    placeholder?: string; // For text filters
}

export interface FilterConfig<T> {
    enabled: boolean;
    filters: ColumnFilter<T>[];
    onFiltersChange?: (filters: Record<string, any>) => void;
}

export interface RowAction<TData> {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: (row: TData) => void;
    variant?: "default" | "destructive";
    disabled?: (row: TData) => boolean;
    separator?: boolean; // Show separator after this item
}

export interface RowActionsConfig<TData> {
    enabled: boolean;
    actions: RowAction<TData>[];
    menuLabel?: string;
}

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
    search?: SearchConfig<TData>;
    filter?: FilterConfig<TData>;
    rowActions?: RowActionsConfig<TData>;
}

interface DraggableRowProps<TData> {
    row: Row<TData>;
    enableDragDrop: boolean;
    onRowClick?: (row: Row<TData>) => void;
    isMounted: boolean;
    rowActions?: RowActionsConfig<TData>;
}

function DraggableRow<TData>({
    row,
    enableDragDrop,
    onRowClick,
    isMounted,
    rowActions,
}: DraggableRowProps<TData>) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: row.id,
        disabled: !enableDragDrop || !isMounted,
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
            className={cn(isDragging && "opacity-50", onRowClick && "cursor-pointer")}
            onClick={() => onRowClick?.(row)}
        >
            {enableDragDrop && (
                <TableCell className="w-[40px] p-2 ">
                    <button
                        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
                        {...(isMounted ? attributes : {})}
                        {...(isMounted ? listeners : {})}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <GripVertical className="h-4 w-4" />
                    </button>
                </TableCell>
            )}
            {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="border-l first:border-l-transparent">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
            ))}
            {rowActions?.enabled && (
                <TableCell className="w-[50px] p-2 ">
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {rowActions.menuLabel && (
                                <>
                                    <DropdownMenuLabel>{rowActions.menuLabel}</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                </>
                            )}
                            {rowActions.actions.map((action, index) => (
                                <div key={index}>
                                    <DropdownMenuItem
                                        disabled={action.disabled?.(row.original) ?? false}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            action.onClick(row.original);
                                        }}
                                        className={cn(
                                            action.variant === "destructive" &&
                                                "text-destructive focus:text-destructive"
                                        )}
                                    >
                                        {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                                        {action.label}
                                    </DropdownMenuItem>
                                    {action.separator && <DropdownMenuSeparator />}
                                </div>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
            )}
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
    search,
    filter,
    rowActions,
}: DataTableProps<TData, TValue>) {
    const [tableData, setTableData] = useState<TData[]>(data);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState<string>("");
    const [searchValue, setSearchValue] = useState<string>("");
    const [filterPopoverOpen, setFilterPopoverOpen] = useState<boolean>(false);
    const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
    const [enabledFilters, setEnabledFilters] = useState<Set<string>>(new Set());
    const [isMounted, setIsMounted] = useState(false);

    // Prevent hydration errors by only enabling DnD on client
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Debounce search
    useEffect(() => {
        if (!search?.enabled) return;

        const debounceMs = search.debounceMs ?? 300;
        const timer = setTimeout(() => {
            setGlobalFilter(searchValue);
            search.onSearchChange?.(searchValue);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [searchValue, search]);

    // Update table data when prop data changes
    useEffect(() => {
        setTableData(data);
    }, [data]);

    // Sync active filters with column filters (only for enabled filters)
    useEffect(() => {
        if (!filter?.enabled) return;

        const newColumnFilters: ColumnFiltersState = [];

        Object.entries(activeFilters).forEach(([columnId, value]) => {
            // Only apply filter if it's enabled
            if (!enabledFilters.has(columnId)) return;
            if (value === null || value === undefined || value === "") return;

            // Handle different filter types
            if (Array.isArray(value)) {
                if (value.length > 0) {
                    newColumnFilters.push({ id: columnId, value });
                }
            } else {
                newColumnFilters.push({ id: columnId, value });
            }
        });

        setColumnFilters(newColumnFilters);

        // Only pass enabled filters to callback
        const enabledActiveFilters = Object.fromEntries(
            Object.entries(activeFilters).filter(([key]) => enabledFilters.has(key))
        );
        filter.onFiltersChange?.(enabledActiveFilters);
    }, [activeFilters, enabledFilters, filter]);

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

    // Custom global filter function that searches across specified columns
    const globalFilterFn = (row: Row<TData>, columnId: string, filterValue: string) => {
        if (!search?.enabled || !filterValue) return true;

        const searchableColumns = search.searchableColumns;
        if (!searchableColumns || searchableColumns.length === 0) return true;

        const searchLower = filterValue.toLowerCase();

        return searchableColumns.some((colId) => {
            const value = row.getValue(colId);
            if (value == null) return false;
            return String(value).toLowerCase().includes(searchLower);
        });
    };

    const table = useReactTable({
        data: tableData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        ...(enableSorting && {
            getSortedRowModel: getSortedRowModel(),
            onSortingChange: setSorting,
        }),
        ...((enableFiltering || search?.enabled || filter?.enabled) && {
            getFilteredRowModel: getFilteredRowModel(),
            onColumnFiltersChange: setColumnFilters,
            globalFilterFn,
            onGlobalFilterChange: setGlobalFilter,
            filterFns: {
                multiSelect: (row, columnId, filterValue: any[]) => {
                    if (!filterValue || filterValue.length === 0) return true;
                    const value = row.getValue(columnId);
                    return filterValue.includes(value);
                },
                numberRange: (row, columnId, filterValue: { min?: number; max?: number }) => {
                    if (!filterValue) return true;
                    const value = row.getValue(columnId) as number;
                    if (filterValue.min !== undefined && value < filterValue.min) return false;
                    if (filterValue.max !== undefined && value > filterValue.max) return false;
                    return true;
                },
            },
        }),
        getRowId: getRowId,
        state: {
            ...(enableSorting && { sorting }),
            ...((enableFiltering || search?.enabled || filter?.enabled) && { columnFilters }),
            ...(search?.enabled && { globalFilter }),
        },
    });

    const rowIds = useMemo(() => {
        return table.getRowModel().rows.map((row) => row.id as UniqueIdentifier);
    }, [table, tableData]);

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

    const handleClearSearch = () => {
        setSearchValue("");
        setGlobalFilter("");
    };

    const handleFilterChange = (columnId: string, value: any) => {
        setActiveFilters((prev) => ({
            ...prev,
            [columnId]: value,
        }));
    };

    const handleClearFilters = () => {
        setActiveFilters({});
        setEnabledFilters(new Set());
    };

    const handleClearFilter = (columnId: string) => {
        setActiveFilters((prev) => {
            const newFilters = { ...prev };
            delete newFilters[columnId];
            return newFilters;
        });
        setEnabledFilters((prev) => {
            const newSet = new Set(prev);
            newSet.delete(columnId);
            return newSet;
        });
    };

    const handleToggleFilter = (columnId: string, enabled: boolean) => {
        if (enabled) {
            setEnabledFilters((prev) => new Set(prev).add(columnId));
        } else {
            setEnabledFilters((prev) => {
                const newSet = new Set(prev);
                newSet.delete(columnId);
                return newSet;
            });
            // Clear the filter value when disabled
            setActiveFilters((prev) => {
                const newFilters = { ...prev };
                delete newFilters[columnId];
                return newFilters;
            });
        }
    };

    const activeFilterCount = useMemo(() => {
        return Object.entries(activeFilters).filter(([key, value]) => {
            // Only count if filter is enabled
            if (!enabledFilters.has(key)) return false;
            if (Array.isArray(value)) return value.length > 0;
            return value !== null && value !== undefined && value !== "";
        }).length;
    }, [activeFilters, enabledFilters]);

    // Disable drag and drop when search or filters are active
    const isDragDropEnabled = useMemo(() => {
        if (!enableDragDrop) return false;
        // Disable if there's an active search
        if (globalFilter && globalFilter.length > 0) return false;
        // Disable if there are active filters
        if (activeFilterCount > 0) return false;
        return true;
    }, [enableDragDrop, globalFilter, activeFilterCount]);

    const renderFilter = (columnFilter: ColumnFilter<TData>) => {
        const columnId = String(columnFilter.column);
        const currentValue = activeFilters[columnId];
        const isEnabled = enabledFilters.has(columnId);

        const renderFilterInput = () => {
            switch (columnFilter.type) {
                case "text":
                    return (
                        <div className="relative">
                            <Input
                                placeholder={
                                    columnFilter.placeholder ?? `Filter ${columnFilter.label}...`
                                }
                                value={currentValue ?? ""}
                                onChange={(e) => handleFilterChange(columnId, e.target.value)}
                                className="h-9"
                                disabled={!isEnabled}
                            />
                            {currentValue && isEnabled && (
                                <button
                                    onClick={() => handleClearFilter(columnId)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    );

                case "select":
                    return (
                        <Select
                            value={currentValue ?? ""}
                            onValueChange={(value) => handleFilterChange(columnId, value)}
                            disabled={!isEnabled}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder={`Select ${columnFilter.label}`} />
                            </SelectTrigger>
                            <SelectContent>
                                {columnFilter.options?.map((option) => (
                                    <SelectItem
                                        key={String(option.value)}
                                        value={String(option.value)}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    );

                case "multi-select":
                    const selectedValues = (currentValue ?? []) as any[];
                    return (
                        <div className="flex flex-col gap-2 border rounded-md p-3">
                            {columnFilter.options?.map((option) => {
                                const isChecked = selectedValues.includes(option.value);
                                return (
                                    <div
                                        key={String(option.value)}
                                        className="flex items-center gap-2"
                                    >
                                        <Checkbox
                                            id={`${columnId}-${option.value}`}
                                            checked={isChecked}
                                            disabled={!isEnabled}
                                            onCheckedChange={(checked) => {
                                                const newValues = checked
                                                    ? [...selectedValues, option.value]
                                                    : selectedValues.filter(
                                                          (v) => v !== option.value
                                                      );
                                                handleFilterChange(columnId, newValues);
                                            }}
                                        />
                                        <Label
                                            htmlFor={`${columnId}-${option.value}`}
                                            className={cn(
                                                "text-sm font-normal cursor-pointer",
                                                !isEnabled && "text-muted-foreground"
                                            )}
                                        >
                                            {option.label}
                                        </Label>
                                    </div>
                                );
                            })}
                        </div>
                    );

                case "boolean":
                    return (
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id={`${columnId}-bool`}
                                checked={currentValue ?? false}
                                disabled={!isEnabled}
                                onCheckedChange={(checked) => handleFilterChange(columnId, checked)}
                            />
                            <Label
                                htmlFor={`${columnId}-bool`}
                                className={cn(
                                    "text-sm font-normal cursor-pointer",
                                    !isEnabled && "text-muted-foreground"
                                )}
                            >
                                Apply filter
                            </Label>
                        </div>
                    );

                case "number-range":
                    const rangeValue = (currentValue ?? {}) as { min?: number; max?: number };
                    return (
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                placeholder="Min"
                                value={rangeValue.min ?? ""}
                                disabled={!isEnabled}
                                onChange={(e) =>
                                    handleFilterChange(columnId, {
                                        ...rangeValue,
                                        min: e.target.value
                                            ? parseFloat(e.target.value)
                                            : undefined,
                                    })
                                }
                                className="h-9"
                            />
                            <Input
                                type="number"
                                placeholder="Max"
                                value={rangeValue.max ?? ""}
                                disabled={!isEnabled}
                                onChange={(e) =>
                                    handleFilterChange(columnId, {
                                        ...rangeValue,
                                        max: e.target.value
                                            ? parseFloat(e.target.value)
                                            : undefined,
                                    })
                                }
                                className="h-9"
                            />
                        </div>
                    );

                default:
                    return null;
            }
        };

        return (
            <div key={columnId} className="space-y-2 pb-3 border-b last:border-b-0">
                <div className="flex items-center gap-2">
                    <Checkbox
                        id={`toggle-${columnId}`}
                        checked={isEnabled}
                        onCheckedChange={(checked) => handleToggleFilter(columnId, !!checked)}
                    />
                    <Label
                        htmlFor={`toggle-${columnId}`}
                        className="text-sm font-medium cursor-pointer flex-1"
                    >
                        {columnFilter.label}
                    </Label>
                    {isEnabled && currentValue && (
                        <button
                            onClick={() => handleClearFilter(columnId)}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    )}
                </div>
                {isEnabled && <div className="pl-6">{renderFilterInput()}</div>}
            </div>
        );
    };

    const tableContent = (
        <div
            className={cn(
                "relative w-full rounded-t-md",
                isDragDropEnabled ? "overflow-visible" : "overflow-x-auto "
            )}
        >
            <Table>
                <TableHeader className="bg-accent/30">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {isDragDropEnabled && (
                                <TableHead className="w-[40px]">
                                    <span className="sr-only">Drag handle</span>
                                </TableHead>
                            )}
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id} className="py-2 px-3">
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                              header.column.columnDef.header,
                                              header.getContext()
                                          )}
                                </TableHead>
                            ))}
                            {rowActions?.enabled && (
                                <TableHead className="w-[50px]">
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            )}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table
                            .getRowModel()
                            .rows.map((row) => (
                                <DraggableRow
                                    key={row.id}
                                    row={row}
                                    enableDragDrop={isDragDropEnabled}
                                    onRowClick={onRowClick}
                                    isMounted={isMounted}
                                    rowActions={rowActions}
                                />
                            ))
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={
                                    columns.length +
                                    (isDragDropEnabled ? 1 : 0) +
                                    (rowActions?.enabled ? 1 : 0)
                                }
                                className="h-24 text-center text-muted-foreground "
                            >
                                {emptyMessage}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );

    const wrappedContent = isDragDropEnabled ? (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
        >
            <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
                {tableContent}
            </SortableContext>
        </DndContext>
    ) : (
        tableContent
    );

    return (
        <div className="w-full space-y-4">
            {/* Toolbar - Search and Filters on same line */}
            {(search?.enabled || (filter?.enabled && filter.filters.length > 0)) && (
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Search Input */}
                    {search?.enabled && (
                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder={search.placeholder ?? "Search..."}
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    className="pl-8 pr-8 h-9"
                                />
                                {searchValue && (
                                    <button
                                        onClick={handleClearSearch}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            {searchValue && (
                                <p className="text-sm text-muted-foreground whitespace-nowrap">
                                    {table.getFilteredRowModel().rows.length} result
                                    {table.getFilteredRowModel().rows.length !== 1 ? "s" : ""}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Filter Button */}
                    {filter?.enabled && filter.filters.length > 0 && (
                        <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9">
                                    <Filter className="h-4 w-4 mr-2" />
                                    Filters
                                    {activeFilterCount > 0 && (
                                        <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                                            {activeFilterCount}
                                        </Badge>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0" align="end">
                                <div className="flex items-center justify-between p-4 border-b">
                                    <h4 className="font-semibold text-sm">Filter Options</h4>
                                    {activeFilterCount > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleClearFilters}
                                            className="h-7 text-xs text-muted-foreground hover:text-foreground"
                                        >
                                            Clear all
                                        </Button>
                                    )}
                                </div>
                                <ScrollArea className="max-h-[400px]">
                                    <div className="p-4 space-y-4">
                                        {filter.filters.map((columnFilter) =>
                                            renderFilter(columnFilter)
                                        )}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            )}

            {wrappedContent}
        </div>
    );
}
