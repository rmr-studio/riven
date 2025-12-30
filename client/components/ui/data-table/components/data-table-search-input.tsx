"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDataTableStore, useDataTableActions } from "../data-table-provider";
import type { SearchConfig } from "../data-table.types";
import { useEffect } from "react";

interface DataTableSearchInputProps<TData> {
    config: SearchConfig<TData>;
}

export function DataTableSearchInput<TData>({ config }: DataTableSearchInputProps<TData>) {
    const searchValue = useDataTableStore<TData, string>((state) => state.searchValue);
    const globalFilter = useDataTableStore<TData, string>((state) => state.globalFilter);
    const tableInstance = useDataTableStore<TData, any>((state) => state.tableInstance);
    const { setSearchValue, setGlobalFilter, clearSearch } = useDataTableActions<TData>();

    // Debounce search value to global filter
    useEffect(() => {
        const debounceMs = config.debounceMs ?? 300;
        const timer = setTimeout(() => {
            setGlobalFilter(searchValue);
            config.onSearchChange?.(searchValue);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [searchValue, config.debounceMs, setGlobalFilter, config]);

    const resultCount = tableInstance ? tableInstance.getFilteredRowModel().rows.length : 0;

    return (
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder={config.placeholder ?? "Search..."}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="pl-8 pr-8 h-9"
                    disabled={config.disabled}
                />
                {searchValue && !config.disabled && (
                    <button
                        onClick={clearSearch}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
            {searchValue && (
                <p className="text-sm text-muted-foreground whitespace-nowrap">
                    {resultCount} result{resultCount !== 1 ? "s" : ""}
                </p>
            )}
        </div>
    );
}
