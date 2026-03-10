'use client';

import type { ReactNode } from 'react';
import { Filter } from 'lucide-react';
import { Badge } from '@riven/ui/badge';
import { Button } from '@riven/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@riven/ui/popover';
import { DataTableSearchInput } from './data-table-search-input';
import { DataTableFilterButton } from './data-table-filter-button';
import { useDataTableStore, useDataTableActions } from '../data-table-provider';
import type { SearchConfig, FilterConfig } from '../data-table.types';

interface DataTableToolbarProps<TData> {
  search?: SearchConfig<TData>;
  filter?: FilterConfig<TData>;
  actions?: ReactNode;
}

export function DataTableToolbar<TData>({ search, filter, actions }: DataTableToolbarProps<TData>) {
  const activeFilterCount = useDataTableStore<TData, number>((state) =>
    state.getActiveFilterCount(),
  );
  const filterPopoverOpen = useDataTableStore<TData, boolean>((state) => state.filterPopoverOpen);
  const { setFilterPopoverOpen } = useDataTableActions<TData>();

  const showSearch = search?.enabled;
  const showFilter = filter?.enabled && filter.filters.length > 0;

  if (!showSearch && !showFilter && !actions) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {/* Search Input (left) */}
      {showSearch && <DataTableSearchInput config={search} />}

      {/* Right-side actions */}
      <div className="ml-auto flex items-center gap-2">
        {/* Filter Button */}
        {showFilter && (
          <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9" disabled={filter.disabled}>
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <DataTableFilterButton config={filter} />
            </PopoverContent>
          </Popover>
        )}

        {/* Extra toolbar actions */}
        {actions}
      </div>
    </div>
  );
}
