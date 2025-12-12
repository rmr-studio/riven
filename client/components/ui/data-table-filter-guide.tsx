/**
 * DATA TABLE FILTER FEATURE GUIDE
 *
 * This file demonstrates how to use the filtering functionality in the DataTable component.
 *
 * OVERVIEW:
 * The filter feature provides comprehensive column-based filtering with:
 * - Multiple filter types (text, select, multi-select, number-range, boolean)
 * - Popover menu for filter options
 * - Active filter count badge
 * - Clear individual or all filters
 * - Scrollable filter panel
 * - Type-safe column definitions
 *
 * FILTER TYPES:
 * 1. text - Text input for string matching
 * 2. select - Single select dropdown
 * 3. multi-select - Multiple checkboxes for multiple values
 * 4. number-range - Min/max number inputs
 * 5. boolean - Single checkbox
 * 6. date-range - Date range picker (upcoming)
 */

import { DataTable, FilterConfig } from "./data-table";
import { ColumnDef } from "@tanstack/react-table";

// Example 1: Basic Text Filter
export function TextFilterExample() {
  interface Product {
    id: string;
    name: string;
    description: string;
    sku: string;
  }

  const columns: ColumnDef<Product>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "description", header: "Description" },
    { accessorKey: "sku", header: "SKU" },
  ];

  const data: Product[] = [];

  return (
    <DataTable
      columns={columns}
      data={data}
      getRowId={(row) => row.id}
      filter={{
        enabled: true,
        filters: [
          {
            column: "name",
            type: "text",
            label: "Product Name",
            placeholder: "Filter by name...",
          },
          {
            column: "sku",
            type: "text",
            label: "SKU",
            placeholder: "Enter SKU...",
          },
        ],
      }}
    />
  );
}

// Example 2: Select Filter
export function SelectFilterExample() {
  interface Order {
    id: string;
    orderNumber: string;
    status: string;
    priority: string;
  }

  const columns: ColumnDef<Order>[] = [
    { accessorKey: "orderNumber", header: "Order #" },
    { accessorKey: "status", header: "Status" },
    { accessorKey: "priority", header: "Priority" },
  ];

  const data: Order[] = [];

  return (
    <DataTable
      columns={columns}
      data={data}
      getRowId={(row) => row.id}
      filter={{
        enabled: true,
        filters: [
          {
            column: "status",
            type: "select",
            label: "Status",
            options: [
              { label: "Pending", value: "pending" },
              { label: "Processing", value: "processing" },
              { label: "Shipped", value: "shipped" },
              { label: "Delivered", value: "delivered" },
              { label: "Cancelled", value: "cancelled" },
            ],
          },
          {
            column: "priority",
            type: "select",
            label: "Priority",
            options: [
              { label: "Low", value: "low" },
              { label: "Medium", value: "medium" },
              { label: "High", value: "high" },
              { label: "Urgent", value: "urgent" },
            ],
          },
        ],
      }}
    />
  );
}

// Example 3: Multi-Select Filter
export function MultiSelectFilterExample() {
  interface Employee {
    id: string;
    name: string;
    departments: string[];
    skills: string[];
  }

  const columns: ColumnDef<Employee>[] = [
    { accessorKey: "name", header: "Name" },
    {
      accessorKey: "departments",
      header: "Departments",
      cell: ({ row }) => row.getValue("departments").join(", "),
    },
    {
      accessorKey: "skills",
      header: "Skills",
      cell: ({ row }) => row.getValue("skills").join(", "),
    },
  ];

  const data: Employee[] = [];

  return (
    <DataTable
      columns={columns}
      data={data}
      getRowId={(row) => row.id}
      filter={{
        enabled: true,
        filters: [
          {
            column: "departments",
            type: "multi-select",
            label: "Departments",
            options: [
              { label: "Engineering", value: "engineering" },
              { label: "Design", value: "design" },
              { label: "Marketing", value: "marketing" },
              { label: "Sales", value: "sales" },
              { label: "Support", value: "support" },
            ],
          },
        ],
      }}
    />
  );
}

// Example 4: Number Range Filter
export function NumberRangeFilterExample() {
  interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
  }

  const columns: ColumnDef<Product>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "price", header: "Price" },
    { accessorKey: "stock", header: "Stock" },
  ];

  const data: Product[] = [];

  return (
    <DataTable
      columns={columns}
      data={data}
      getRowId={(row) => row.id}
      filter={{
        enabled: true,
        filters: [
          {
            column: "price",
            type: "number-range",
            label: "Price Range",
          },
          {
            column: "stock",
            type: "number-range",
            label: "Stock Level",
          },
        ],
      }}
    />
  );
}

// Example 5: Boolean Filter
export function BooleanFilterExample() {
  interface Task {
    id: string;
    title: string;
    completed: boolean;
    archived: boolean;
  }

  const columns: ColumnDef<Task>[] = [
    { accessorKey: "title", header: "Title" },
    { accessorKey: "completed", header: "Completed" },
    { accessorKey: "archived", header: "Archived" },
  ];

  const data: Task[] = [];

  return (
    <DataTable
      columns={columns}
      data={data}
      getRowId={(row) => row.id}
      filter={{
        enabled: true,
        filters: [
          {
            column: "completed",
            type: "boolean",
            label: "Show only completed",
          },
          {
            column: "archived",
            type: "boolean",
            label: "Include archived",
          },
        ],
      }}
    />
  );
}

// Example 6: Mixed Filter Types
export function MixedFiltersExample() {
  interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    inStock: boolean;
    tags: string[];
  }

  const columns: ColumnDef<Product>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "category", header: "Category" },
    { accessorKey: "price", header: "Price" },
    { accessorKey: "inStock", header: "In Stock" },
  ];

  const data: Product[] = [];

  return (
    <DataTable
      columns={columns}
      data={data}
      getRowId={(row) => row.id}
      filter={{
        enabled: true,
        filters: [
          {
            column: "name",
            type: "text",
            label: "Product Name",
            placeholder: "Search products...",
          },
          {
            column: "category",
            type: "select",
            label: "Category",
            options: [
              { label: "Electronics", value: "electronics" },
              { label: "Clothing", value: "clothing" },
              { label: "Food", value: "food" },
              { label: "Books", value: "books" },
            ],
          },
          {
            column: "price",
            type: "number-range",
            label: "Price Range",
          },
          {
            column: "inStock",
            type: "boolean",
            label: "In Stock Only",
          },
        ],
      }}
    />
  );
}

// Example 7: With Filter Change Callback
export function FilterCallbackExample() {
  const handleFiltersChange = (filters: Record<string, any>) => {
    // Track filter usage
    console.log("Current filters:", filters);

    // Sync with URL params
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        params.set(key, JSON.stringify(value));
      }
    });
    // window.history.pushState({}, "", `?${params.toString()}`);

    // Trigger analytics
    if (Object.keys(filters).length > 0) {
      // trackEvent("table_filtered", { filters });
    }
  };

  return (
    <DataTable
      columns={[]}
      data={[]}
      getRowId={(row: any) => row.id}
      filter={{
        enabled: true,
        filters: [],
        onFiltersChange: handleFiltersChange,
      }}
    />
  );
}

// Example 8: Combined Search and Filters
export function SearchAndFiltersExample() {
  interface Contact {
    id: string;
    name: string;
    email: string;
    company: string;
    status: string;
    lastContact: Date;
  }

  const columns: ColumnDef<Contact>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "company", header: "Company" },
    { accessorKey: "status", header: "Status" },
  ];

  const data: Contact[] = [];

  return (
    <DataTable
      columns={columns}
      data={data}
      getRowId={(row) => row.id}
      search={{
        enabled: true,
        searchableColumns: ["name", "email", "company"],
        placeholder: "Search contacts...",
      }}
      filter={{
        enabled: true,
        filters: [
          {
            column: "status",
            type: "select",
            label: "Status",
            options: [
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
              { label: "Pending", value: "pending" },
            ],
          },
          {
            column: "company",
            type: "text",
            label: "Company",
            placeholder: "Filter by company...",
          },
        ],
      }}
    />
  );
}

/**
 * FILTER CONFIGURATION OPTIONS:
 *
 * FilterConfig<T> {
 *   enabled: boolean;                    // Enable/disable filters
 *   filters: ColumnFilter<T>[];          // Array of filter definitions
 *   onFiltersChange?: (filters) => void; // Callback when filters change
 * }
 *
 * ColumnFilter<T> {
 *   column: keyof T;                     // Column to filter (type-safe)
 *   type: FilterType;                    // Filter input type
 *   label: string;                       // Display label
 *   options?: FilterOption[];            // For select/multi-select
 *   placeholder?: string;                // For text filters
 * }
 *
 * FilterType:
 * - "text" - Free text input
 * - "select" - Single selection dropdown
 * - "multi-select" - Multiple checkboxes
 * - "number-range" - Min/max number inputs
 * - "boolean" - Single checkbox
 *
 * FEATURES:
 *
 * 1. Popover Filter Menu
 *    - Filter button always visible when enabled
 *    - Badge showing active filter count
 *    - Popover opens on click
 *    - Clean, focused interface
 *
 * 2. Clear Filters
 *    - Clear all filters at once from popover header
 *    - Clear individual filters with X buttons
 *    - Visual feedback for active filters
 *
 * 3. Scrollable Content
 *    - Max height of 400px for filter panel
 *    - Scrollable when many filters present
 *    - Maintains usability with many options
 *
 * 4. Type Safety
 *    - Column names are type-checked
 *    - Filter values are properly typed
 *    - Autocomplete for column names
 *
 * BEST PRACTICES:
 *
 * 1. Choose appropriate filter types
 *    - Use "select" for limited options (< 10)
 *    - Use "multi-select" for multiple selections
 *    - Use "text" for open-ended search
 *    - Use "number-range" for numeric data
 *
 * 2. Provide clear labels
 *    ❌ Don't: label: "col1"
 *    ✅ Do: label: "Product Category"
 *
 * 3. Limit number of filters
 *    - Too many filters can overwhelm users
 *    - Recommend 3-6 filters maximum
 *    - Use search for general filtering
 *    - Popover scrolls if needed
 *
 * 4. Set sensible defaults
 *    - Don't auto-apply filters on mount
 *    - Let users choose what to filter
 *    - Remember filter state in URL/localStorage
 *
 * 5. Combine with Search
 *    - Use search for quick text-based filtering
 *    - Use filters for categorical/structured data
 *    - Both can work together seamlessly
 */
