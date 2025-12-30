"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useDataTableStore, useDataTableActions } from "../data-table-provider";
import { cn } from "@/lib/util/utils";
import type { ColumnFilter, FilterConfig } from "../data-table.types";
import { useEffect } from "react";

interface DataTableFilterButtonProps<TData> {
    config: FilterConfig<TData>;
}

export function DataTableFilterButton<TData>({ config }: DataTableFilterButtonProps<TData>) {
    const activeFilters = useDataTableStore<TData, Record<string, any>>((state) => state.activeFilters);
    const enabledFilters = useDataTableStore<TData, Set<string>>((state) => state.enabledFilters);
    const activeFilterCount = useDataTableStore<TData, number>((state) => state.getActiveFilterCount());

    const {
        setColumnFilters,
        clearAllFilters,
        clearFilter,
        toggleFilter,
        updateFilter
    } = useDataTableActions<TData>();

    // Sync active filters with column filters (only for enabled filters)
    useEffect(() => {
        const newColumnFilters: any[] = [];

        Object.entries(activeFilters).forEach(([columnId, value]) => {
            if (!enabledFilters.has(columnId)) return;
            if (value === null || value === undefined || value === "") return;

            if (Array.isArray(value)) {
                if (value.length > 0) {
                    newColumnFilters.push({ id: columnId, value });
                }
            } else {
                newColumnFilters.push({ id: columnId, value });
            }
        });

        setColumnFilters(newColumnFilters);

        // Notify parent of enabled filters only
        const enabledActiveFilters = Object.fromEntries(
            Object.entries(activeFilters).filter(([key]) => enabledFilters.has(key))
        );
        config.onFiltersChange?.(enabledActiveFilters);
    }, [activeFilters, enabledFilters, setColumnFilters, config]);

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
                                placeholder={columnFilter.placeholder ?? `Filter ${columnFilter.label}...`}
                                value={currentValue ?? ""}
                                onChange={(e) => updateFilter(columnId, e.target.value)}
                                className="h-9"
                                disabled={!isEnabled}
                            />
                            {currentValue && isEnabled && (
                                <button
                                    onClick={() => clearFilter(columnId)}
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
                            onValueChange={(value) => updateFilter(columnId, value)}
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
                                                    : selectedValues.filter((v) => v !== option.value);
                                                updateFilter(columnId, newValues);
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
                                onCheckedChange={(checked) => updateFilter(columnId, checked)}
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
                                    updateFilter(columnId, {
                                        ...rangeValue,
                                        min: e.target.value ? parseFloat(e.target.value) : undefined,
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
                                    updateFilter(columnId, {
                                        ...rangeValue,
                                        max: e.target.value ? parseFloat(e.target.value) : undefined,
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
                        onCheckedChange={(checked) => toggleFilter(columnId, !!checked)}
                    />
                    <Label
                        htmlFor={`toggle-${columnId}`}
                        className="text-sm font-medium cursor-pointer flex-1"
                    >
                        {columnFilter.label}
                    </Label>
                    {isEnabled && currentValue && (
                        <button
                            onClick={() => clearFilter(columnId)}
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

    return (
        <>
            <div className="flex items-center justify-between p-4 border-b">
                <h4 className="font-semibold text-sm">Filter Options</h4>
                {activeFilterCount > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="h-7 text-xs text-muted-foreground hover:text-foreground"
                    >
                        Clear all
                    </Button>
                )}
            </div>
            <ScrollArea className="max-h-[400px]">
                <div className="p-4 space-y-4">
                    {config.filters.map((columnFilter) => renderFilter(columnFilter))}
                </div>
            </ScrollArea>
        </>
    );
}
