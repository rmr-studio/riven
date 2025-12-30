# DataTable Refactoring - Migration Guide

## Summary

The DataTable component has been completely refactored from a ~1300-line monolithic component into a scalable, maintainable architecture using Zustand for state management. This document explains what changed and how to migrate existing usages.

## What Changed

### Before (Original Architecture)
- Single 1300-line component with inline sub-components
- 15+ `useState` hooks for local state management
- 10+ `useEffect` hooks for side effects
- Heavy prop drilling through component tree
- Difficult to extend and maintain

### After (Refactored Architecture)
- **Zustand store** manages all table state
- **DataTableProvider** wraps table and provides store context
- **8 focused sub-components** with clear responsibilities
- **Custom hooks** for accessing state (no prop drilling)
- **Memoized components** prevent unnecessary re-renders
- **Scalable** - easy to add features like pagination, inline editing, etc.

## File Structure

```
components/ui/data-table/
├── index.ts                           # Clean exports
├── data-table.store.ts                # Zustand store with slices
├── data-table-provider.tsx            # Context provider + hooks
├── data-table.types.ts                # Shared TypeScript types
├── data-table.tsx                     # Main orchestrator component
├── components/
│   ├── data-table-toolbar.tsx         # Search + filter UI
│   ├── data-table-search-input.tsx    # Search input component
│   ├── data-table-filter-button.tsx   # Filter popover
│   ├── data-table-selection-bar.tsx   # Selection action bar
│   ├── data-table-header.tsx          # Table header
│   ├── data-table-body.tsx            # Table body
│   ├── draggable-column-header.tsx    # Column header with drag
│   ├── draggable-row.tsx              # Row with drag + selection
│   └── row-actions-menu.tsx           # Row actions dropdown
├── data-table.original.tsx            # Backup of original (for reference)
└── MIGRATION_GUIDE.md                 # This file
```

## Migration Steps

### Step 1: Import DataTableProvider

**Before:**
```typescript
import { DataTable } from "@/components/ui/data-table";
```

**After:**
```typescript
import { DataTable, DataTableProvider } from "@/components/ui/data-table";
```

### Step 2: Wrap DataTable with Provider

**Before:**
```tsx
<DataTable
    columns={columns}
    data={data}
    enableSorting={true}
    search={{ enabled: true, searchableColumns: ["name", "email"] }}
    // ... other props
/>
```

**After:**
```tsx
<DataTableProvider
    initialData={data}
    initialColumnSizing={columnSizing}
    onColumnWidthsChange={(sizing) => handleResize(sizing)}
    onColumnOrderChange={(order) => handleOrderChange(order)}
    onFiltersChange={(filters) => handleFilters(filters)}
    onSearchChange={(value) => handleSearch(value)}
    onSelectionChange={(rows) => handleSelection(rows)}
>
    <DataTable
        columns={columns}
        enableSorting={true}
        search={{ enabled: true, searchableColumns: ["name", "email"] }}
        // ... other props (minus 'data')
    />
</DataTableProvider>
```

### Step 3: Move Callbacks to Provider

The provider now handles callbacks for state changes. Move these from DataTable props to DataTableProvider props:

| Old Prop (on DataTable)              | New Prop (on DataTableProvider) |
|--------------------------------------|----------------------------------|
| `data={data}`                        | `initialData={data}`             |
| `columnResizing.initialColumnSizing` | `initialColumnSizing`            |
| `columnResizing.onColumnWidthsChange`| `onColumnWidthsChange`           |
| `columnOrdering.onColumnOrderChange` | `onColumnOrderChange`            |
| `filter.onFiltersChange`             | `onFiltersChange`                |
| `search.onSearchChange`              | `onSearchChange`                 |
| `rowSelection.onSelectionChange`     | `onSelectionChange`              |

**Note:** The `data` prop is no longer passed to `<DataTable>` - it's now `initialData` on the provider.

## Complete Example

### Before (Original)

```tsx
export function MyDataTable() {
    const { data: users } = useUsersQuery();
    const [columnSizing, setColumnSizing] = useState({});

    return (
        <DataTable
            columns={columns}
            data={users}
            enableSorting={true}
            enableDragDrop={true}
            search={{
                enabled: true,
                searchableColumns: ["name", "email"],
            }}
            filter={{
                enabled: true,
                filters: [
                    { column: "status", type: "select", label: "Status", options: statusOptions },
                ],
                onFiltersChange: (filters) => console.log(filters),
            }}
            rowSelection={{
                enabled: true,
                onSelectionChange: (rows) => console.log("Selected:", rows),
            }}
            columnResizing={{
                enabled: true,
                initialColumnSizing: columnSizing,
                onColumnWidthsChange: setColumnSizing,
            }}
        />
    );
}
```

### After (Refactored)

```tsx
export function MyDataTable() {
    const { data: users } = useUsersQuery();
    const [columnSizing, setColumnSizing] = useState({});

    return (
        <DataTableProvider
            initialData={users}
            initialColumnSizing={columnSizing}
            onColumnWidthsChange={setColumnSizing}
            onFiltersChange={(filters) => console.log(filters)}
            onSearchChange={(value) => console.log("Search:", value)}
            onSelectionChange={(rows) => console.log("Selected:", rows)}
        >
            <DataTable
                columns={columns}
                enableSorting={true}
                enableDragDrop={true}
                search={{
                    enabled: true,
                    searchableColumns: ["name", "email"],
                }}
                filter={{
                    enabled: true,
                    filters: [
                        { column: "status", type: "select", label: "Status", options: statusOptions },
                    ],
                }}
                rowSelection={{
                    enabled: true,
                }}
                columnResizing={{
                    enabled: true,
                }}
            />
        </DataTableProvider>
    );
}
```

## Advanced Usage: Accessing Store Directly

If you need to access or manipulate table state programmatically, use the custom hooks inside a child component:

```tsx
function TableControls() {
    // Access specific state slices
    const sorting = useSorting();
    const { searchValue, globalFilter } = useFiltering();
    const { selectedCount, hasSelections } = useSelection();

    // Get actions (never causes re-renders)
    const { clearSearch, clearAllFilters, clearSelection } = useDataTableActions();

    return (
        <div className="flex gap-2">
            <Button onClick={clearSearch}>Clear Search</Button>
            <Button onClick={clearAllFilters}>Clear Filters</Button>
            {hasSelections && (
                <Button onClick={clearSelection}>
                    Clear {selectedCount} selections
                </Button>
            )}
        </div>
    );
}

// Usage
<DataTableProvider initialData={data}>
    <TableControls />
    <DataTable columns={columns} {...config} />
</DataTableProvider>
```

## Breaking Changes

### 1. Data Prop Location
- **Before:** `<DataTable data={data} />`
- **After:** `<DataTableProvider initialData={data}><DataTable /></DataTableProvider>`

### 2. Callback Props
All callbacks moved from `DataTable` to `DataTableProvider`:
- `columnResizing.onColumnWidthsChange` → `onColumnWidthsChange`
- `columnOrdering.onColumnOrderChange` → `onColumnOrderChange`
- `filter.onFiltersChange` → `onFiltersChange`
- `search.onSearchChange` → `onSearchChange`
- `rowSelection.onSelectionChange` → `onSelectionChange`

### 3. Component Must Be Wrapped
**DataTable will throw an error if not wrapped in DataTableProvider.** This is intentional - the store is required for the component to function.

## Benefits

### 1. Performance
- **Memoized components** prevent unnecessary re-renders
- **Selector-based hooks** ensure components only re-render when their specific state changes
- **Shallow equality** checks optimize Zustand subscriptions

### 2. Maintainability
- **8 focused components** vs. 1 monolithic component
- **Clear responsibilities** for each component
- **Easy to debug** - state changes traceable through store

### 3. Scalability
Adding new features is now trivial:

```typescript
// Add column visibility feature
interface VisibilitySlice {
    hiddenColumns: Set<string>;
    toggleColumnVisibility: (columnId: string) => void;
}

// Just add to store, no refactoring needed!
```

### 4. Testability
- **Store can be tested in isolation** without mocking React
- **Components are pure** and easy to test
- **Mocked store** for component tests

### 5. No Prop Drilling
Components access state directly via hooks:

```tsx
// DraggableRow doesn't need 10 props
function DraggableRow() {
    const isMounted = useDataTableStore(state => state.isMounted);
    const { setHoveredRowId } = useDataTableActions();
    // ...
}
```

## Troubleshooting

### Error: "useDataTableStore must be used within DataTableProvider"
**Solution:** Wrap your `<DataTable>` with `<DataTableProvider>`.

### Table not updating when data changes
**Solution:** Ensure `initialData` prop on provider is reactive:
```tsx
const { data } = useQuery(); // TanStack Query
<DataTableProvider initialData={data || []}>
```

### Column sizes not persisting
**Solution:** Provide both `initialColumnSizing` and `onColumnWidthsChange`:
```tsx
const [sizes, setSizes] = useState({});
<DataTableProvider
    initialColumnSizing={sizes}
    onColumnWidthsChange={setSizes}
>
```

## Migration Checklist

- [ ] Import `DataTableProvider` from `@/components/ui/data-table`
- [ ] Wrap `<DataTable>` with `<DataTableProvider>`
- [ ] Move `data` prop to `initialData` on provider
- [ ] Move callback props to provider (onColumnWidthsChange, etc.)
- [ ] Remove callback props from DataTable
- [ ] Test sorting, filtering, search, selection, drag-drop
- [ ] Test column resizing and ordering
- [ ] Verify callbacks are firing correctly
- [ ] Check performance (no re-render cascades)

## Need Help?

- Review the [EntityDataTable example](/components/feature-modules/entity/components/tables/entity-data-table.tsx)
- Check the [store implementation](/components/ui/data-table/data-table.store.ts)
- Read the [provider documentation](/components/ui/data-table/data-table-provider.tsx)
- Examine the [original backup](/components/ui/data-table.original.tsx) for comparison

## Future Enhancements

The new architecture makes these features easy to add:

1. **Server-side pagination** - Add pagination slice to store
2. **Inline editing** - Add editing slice with row-level state
3. **Column visibility** - Add visibility slice
4. **Row expansion** - Add expansion slice
5. **Virtual scrolling** - Integrate `@tanstack/react-virtual`
6. **Export functionality** - Use store to get filtered/sorted data
7. **Saved views** - Serialize store state to localStorage
8. **Multi-table coordination** - Multiple tables can share state patterns

---

**Migration completed! Your DataTable is now ready to scale.** 🚀
