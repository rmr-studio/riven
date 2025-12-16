/**
 * DATA TABLE SEARCH FEATURE GUIDE
 *
 * This file demonstrates how to use the search functionality in the DataTable component.
 *
 * OVERVIEW:
 * The search feature allows you to filter table data across specified columns with:
 * - Debounced input for performance
 * - Customizable search placeholder
 * - Real-time result count
 * - Clear button for easy reset
 * - Column-specific search scope
 *
 * SEARCH CONFIG INTERFACE:
 *
 * export interface SearchConfig {
 *   enabled: boolean;              // Enable/disable search
 *   searchableColumns: string[];   // Column IDs to search in
 *   placeholder?: string;          // Custom placeholder text
 *   debounceMs?: number;          // Debounce delay (default: 300ms)
 *   onSearchChange?: (value: string) => void;  // Callback on search change
 * }
 */

import { DataTable, SearchConfig } from "./data-table";
import { ColumnDef } from "@tanstack/react-table";

// Example 1: Basic Search
// Search across specific columns only
export function BasicSearchExample() {
  interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
  }

  const columns: ColumnDef<Product>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "category", header: "Category" },
    { accessorKey: "price", header: "Price" },
  ];

  const data: Product[] = [
    { id: "1", name: "Laptop", category: "Electronics", price: 999 },
    { id: "2", name: "Mouse", category: "Electronics", price: 25 },
    { id: "3", name: "Desk", category: "Furniture", price: 200 },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      getRowId={(row) => row.id}
      search={{
        enabled: true,
        searchableColumns: ["name", "category"], // Only search in name and category
        placeholder: "Search products...",
      }}
    />
  );
}

// Example 2: Search with Callback
// Track search queries and perform additional actions
export function SearchWithCallbackExample() {
  const handleSearchChange = (searchTerm: string) => {
    // Log search terms for analytics
    console.log("User searched for:", searchTerm);

    // Could trigger external API calls, logging, etc.
    if (searchTerm.length > 3) {
      // fetchSearchSuggestions(searchTerm);
    }
  };

  return (
    <DataTable
      columns={[]}
      data={[]}
      getRowId={(row: any) => row.id}
      search={{
        enabled: true,
        searchableColumns: ["name", "description"],
        debounceMs: 500, // Wait 500ms before triggering search
        onSearchChange: handleSearchChange,
      }}
    />
  );
}

// Example 3: Search All Columns
// Search across every column in the table
export function SearchAllColumnsExample() {
  interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    department: string;
    role: string;
  }

  const columns: ColumnDef<Employee>[] = [
    { accessorKey: "firstName", header: "First Name" },
    { accessorKey: "lastName", header: "Last Name" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "department", header: "Department" },
    { accessorKey: "role", header: "Role" },
  ];

  const data: Employee[] = [];

  // Define all searchable columns
  const allColumnIds = columns
    .map((col: any) => col.accessorKey)
    .filter(Boolean);

  return (
    <DataTable
      columns={columns}
      data={data}
      getRowId={(row) => row.id}
      search={{
        enabled: true,
        searchableColumns: allColumnIds,
        placeholder: "Search employees by any field...",
      }}
    />
  );
}

// Example 4: Reusable Search Config
// Define search configuration separately for reuse
export function ReusableSearchConfigExample() {
  const searchConfig: SearchConfig = {
    enabled: true,
    searchableColumns: ["name", "email", "status"],
    placeholder: "Search users...",
    debounceMs: 300,
    onSearchChange: (value) => {
      localStorage.setItem("lastSearch", value);
    },
  };

  return (
    <DataTable
      columns={[]}
      data={[]}
      getRowId={(row: any) => row.id}
      search={searchConfig}
    />
  );
}

// Example 5: Conditional Search
// Enable search based on data size or user permissions
export function ConditionalSearchExample() {
  const data: any[] = Array(100).fill({});
  const hasLargeDataset = data.length > 50;
  const userCanSearch = true; // From auth context

  return (
    <DataTable
      columns={[]}
      data={data}
      getRowId={(row: any) => row.id}
      search={
        hasLargeDataset && userCanSearch
          ? {
              enabled: true,
              searchableColumns: ["name", "description"],
              placeholder: "Search through 100+ items...",
            }
          : undefined
      }
    />
  );
}

// Example 6: Combined with Other Features
// Use search alongside drag-drop, sorting, and row clicks
export function FullFeaturedTableExample() {
  interface Task {
    id: string;
    title: string;
    status: string;
    assignee: string;
    priority: string;
  }

  const columns: ColumnDef<Task>[] = [
    { accessorKey: "title", header: "Title" },
    { accessorKey: "status", header: "Status" },
    { accessorKey: "assignee", header: "Assignee" },
    { accessorKey: "priority", header: "Priority" },
  ];

  const data: Task[] = [];

  const handleReorder = (reorderedData: Task[]) => {
    console.log("New order:", reorderedData);
  };

  const handleRowClick = (row: any) => {
    console.log("Task clicked:", row.original);
  };

  const handleSearch = (searchTerm: string) => {
    console.log("Searching for:", searchTerm);
  };

  return (
    <DataTable
      columns={columns}
      data={data}
      getRowId={(row) => row.id}
      enableDragDrop={true}
      enableSorting={true}
      onReorder={handleReorder}
      onRowClick={handleRowClick}
      search={{
        enabled: true,
        searchableColumns: ["title", "assignee", "status"],
        placeholder: "Search tasks by title, assignee, or status...",
        debounceMs: 300,
        onSearchChange: handleSearch,
      }}
    />
  );
}

/**
 * KEY FEATURES:
 *
 * 1. COLUMN-SPECIFIC SEARCH
 *    - Only searches in columns you specify
 *    - Prevents searching in irrelevant columns (like IDs, actions, etc.)
 *
 * 2. DEBOUNCED INPUT
 *    - Configurable delay before search executes
 *    - Prevents excessive filtering on every keystroke
 *    - Default: 300ms
 *
 * 3. VISUAL FEEDBACK
 *    - Search icon in input field
 *    - Clear button when text is entered
 *    - Result count displayed while searching
 *
 * 4. CASE-INSENSITIVE
 *    - Search is always case-insensitive
 *    - "laptop" matches "Laptop", "LAPTOP", "LaPtOp"
 *
 * 5. SUBSTRING MATCHING
 *    - Searches for partial matches
 *    - "elec" matches "Electronics"
 *
 * 6. INTEGRATES WITH OTHER FEATURES
 *    - Works alongside drag-drop
 *    - Compatible with sorting
 *    - Works with row selection
 *    - Maintains column filtering
 *
 * BEST PRACTICES:
 *
 * 1. Only make relevant columns searchable
 *    ❌ Don't: searchableColumns: ["id", "actions", "checkbox"]
 *    ✅ Do: searchableColumns: ["name", "email", "description"]
 *
 * 2. Use appropriate debounce times
 *    - Small datasets (<100 rows): 200-300ms
 *    - Medium datasets (100-1000 rows): 300-500ms
 *    - Large datasets (1000+ rows): 500-700ms
 *
 * 3. Provide clear placeholder text
 *    ❌ Don't: "Search..."
 *    ✅ Do: "Search by name, email, or department..."
 *
 * 4. Consider search callbacks for analytics
 *    - Track popular search terms
 *    - Identify missing content
 *    - Improve search UX based on data
 */
