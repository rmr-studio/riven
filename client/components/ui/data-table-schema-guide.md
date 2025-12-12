# Schema-Driven Data Table Guide

## Overview

The Schema-Driven Data Table automatically configures columns, filters, and search functionality based on your Schema definition. This eliminates the need to manually configure tables for each entity type.

## Schema Structure

Based on your OpenAPI schema:

```typescript
interface Schema {
    name: string;              // Display name
    description?: string;      // Optional description
    type: DataType;           // STRING, NUMBER, BOOLEAN, OBJECT, ARRAY
    format?: DataFormat;      // DATE, DATETIME, EMAIL, PHONE, CURRENCY
    required: boolean;        // Is field required
    properties?: {            // For OBJECT type
        [key: string]: Schema;
    };
    items?: Schema;           // For ARRAY type
    unique: boolean;          // Is value unique
    protected: boolean;       // Protected from editing/filtering
}
```

## How Auto-Configuration Works

### 1. Column Generation

The table automatically generates columns from `schema.properties`:

```typescript
// Schema
{
    name: "User",
    type: DataType.OBJECT,
    properties: {
        name: { name: "Name", type: DataType.STRING, ... },
        email: { name: "Email", type: DataType.STRING, format: DataFormat.EMAIL, ... }
    }
}

// Auto-generates columns:
// - Name column (text)
// - Email column (clickable mailto link)
```

### 2. Filter Auto-Configuration

Filters are automatically configured based on field types:

| Schema Type | Schema Format | Filter Type | Example |
|------------|---------------|-------------|---------|
| STRING | - | text | Name, Description |
| STRING | EMAIL | text | Email address |
| STRING | PHONE | text | Phone number |
| NUMBER | - | number-range | Quantity, Score |
| NUMBER | CURRENCY | number-range | Price, Revenue |
| BOOLEAN | - | boolean | Active, Verified |
| OBJECT | - | ❌ none | Complex objects |
| ARRAY | - | ❌ none | Lists |

**Protected fields** (`protected: true`) are **never filterable**.

### 3. Search Auto-Configuration

Only text-based fields are searchable:

- ✅ `DataType.STRING` fields
- ❌ `DataType.NUMBER` fields
- ❌ `DataType.BOOLEAN` fields
- ❌ `protected: true` fields

### 4. Cell Formatting

Values are formatted based on type and format:

```typescript
// STRING + EMAIL format → mailto link
john@example.com → <a href="mailto:john@example.com">john@example.com</a>

// STRING + PHONE format → tel link
+1234567890 → <a href="tel:+1234567890">+1234567890</a>

// STRING + DATE format → formatted date
2024-01-15 → 1/15/2024

// NUMBER + CURRENCY format → formatted currency
1299.99 → $1,299.99

// BOOLEAN → badge
true → <Badge>Yes</Badge>
false → <Badge variant="secondary">No</Badge>
```

## Basic Usage

```tsx
import { SchemaDataTable } from "@/components/ui/data-table-schema";
import { Schema } from "@/lib/interfaces/common.interface";
import { DataType, DataFormat } from "@/lib/types/types";

function MyEntityTable() {
    // Define your schema
    const schema: Schema = {
        name: "Contact",
        type: DataType.OBJECT,
        required: true,
        unique: false,
        protected: false,
        properties: {
            id: {
                name: "ID",
                type: DataType.STRING,
                required: true,
                unique: true,
                protected: true, // Won't be searchable/filterable
            },
            name: {
                name: "Name",
                type: DataType.STRING,
                required: true,
                unique: false,
                protected: false,
            },
            email: {
                name: "Email",
                type: DataType.STRING,
                format: DataFormat.EMAIL,
                required: true,
                unique: true,
                protected: false,
            },
            isActive: {
                name: "Active",
                type: DataType.BOOLEAN,
                required: true,
                unique: false,
                protected: false,
            },
        },
    };

    // Your data
    const contacts = [
        { id: "1", name: "John", email: "john@example.com", isActive: true },
        { id: "2", name: "Jane", email: "jane@example.com", isActive: false },
    ];

    return (
        <SchemaDataTable
            schema={schema}
            data={contacts}
            getRowId={(row) => row.id}
            enableSearch={true}
            enableFilters={true}
            enableSorting={true}
        />
    );
}
```

This automatically creates:
- ✅ 3 columns (ID, Name, Email, Active)
- ✅ 2 searchable columns (Name, Email)
- ✅ 2 filters (Name [text], Active [boolean])
- ✅ Email as clickable mailto link
- ✅ Active as Yes/No badge

## Enhanced Auto-Detection

Use `EnhancedSchemaDataTable` for smart filter type detection:

```tsx
import { EnhancedSchemaDataTable } from "@/components/ui/data-table-schema";

<EnhancedSchemaDataTable
    schema={orderSchema}
    data={orders}
    getRowId={(row) => row.id}
    autoDetectSelectFilters={true}
    selectFilterThreshold={10} // Convert to select if ≤10 unique values
/>
```

This analyzes your data and converts text filters to select dropdowns when:
- Field has ≤ 10 unique values (configurable)
- Example: "Status" with values ["pending", "shipped", "delivered"]

## Customization Options

### Custom Columns

Override auto-generated columns:

```tsx
const customColumns: ColumnDef<Contact>[] = [
    {
        accessorKey: "name",
        header: "Full Name",
        cell: ({ row }) => (
            <div className="font-bold">{row.getValue("name")}</div>
        ),
    },
];

<SchemaDataTable
    schema={schema}
    data={data}
    customColumns={customColumns} // Use custom instead of auto-generated
/>
```

### Custom Filters

Override auto-generated filters:

```tsx
const customFilters: ColumnFilter<Contact>[] = [
    {
        column: "status",
        type: "select",
        label: "Status",
        options: [
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
        ],
    },
];

<SchemaDataTable
    schema={schema}
    data={data}
    customFilters={customFilters}
/>
```

### Custom Searchable Columns

Override auto-detected searchable columns:

```tsx
<SchemaDataTable
    schema={schema}
    data={data}
    customSearchableColumns={["name", "email", "company"]}
/>
```

## Real-World Example

```tsx
function DealsTable({ deals, schema }) {
    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-2xl font-bold">Sales Pipeline</h2>
                <p className="text-sm text-muted-foreground">
                    Manage deals and opportunities
                </p>
            </div>

            <EnhancedSchemaDataTable
                schema={schema}
                data={deals}
                getRowId={(row) => row.id}
                enableDragDrop={true}
                enableSearch={true}
                enableFilters={true}
                enableSorting={true}
                autoDetectSelectFilters={true}
                onRowClick={(row) => navigateToDeal(row.original.id)}
                onReorder={(newOrder) => saveDealOrder(newOrder)}
            />
        </div>
    );
}
```

## Benefits

### ✅ Zero Configuration
- No manual column definitions
- No manual filter setup
- No manual search configuration

### ✅ Type-Safe
- Schema drives everything
- TypeScript validation
- Autocomplete support

### ✅ Consistent Formatting
- Emails as mailto links
- Phones as tel links
- Currency formatting
- Date formatting
- Boolean badges

### ✅ Smart Defaults
- Protected fields excluded from filters
- Only text fields searchable
- Appropriate filter types per data type

### ✅ Flexible
- Override any auto-generated config
- Add custom columns
- Add custom filters
- Combine auto + manual

## API Reference

### SchemaDataTable Props

```typescript
interface SchemaDataTableProps<TData> {
    schema: Schema;                        // Required: Entity schema
    data: TData[];                         // Required: Data array
    getRowId?: (row: TData) => string;    // Row ID extractor
    enableDragDrop?: boolean;             // Enable drag-drop reordering
    onReorder?: (data: TData[]) => void;  // Reorder callback
    onRowClick?: (row: Row<TData>) => void; // Row click handler
    className?: string;                    // Custom CSS class
    emptyMessage?: string;                 // Empty state message

    // Overrides
    customColumns?: ColumnDef<TData>[];   // Override auto columns
    customFilters?: ColumnFilter<TData>[]; // Override auto filters
    customSearchableColumns?: string[];    // Override auto search

    // Feature toggles
    enableSearch?: boolean;                // Enable search (default: true)
    enableFilters?: boolean;               // Enable filters (default: true)
    enableSorting?: boolean;               // Enable sorting (default: false)
}
```

### EnhancedSchemaDataTable Props

All `SchemaDataTable` props plus:

```typescript
{
    autoDetectSelectFilters?: boolean;     // Auto-convert to selects (default: true)
    selectFilterThreshold?: number;        // Max unique values for select (default: 10)
}
```

## Schema Constraints

### Protected Fields

```typescript
{
    id: {
        name: "ID",
        type: DataType.STRING,
        protected: true,  // ← Not filterable, not searchable
    }
}
```

### Required Fields

```typescript
{
    email: {
        name: "Email",
        type: DataType.STRING,
        required: true,  // ← Metadata for forms, doesn't affect table
    }
}
```

### Unique Fields

```typescript
{
    email: {
        name: "Email",
        type: DataType.STRING,
        unique: true,  // ← Metadata for validation, doesn't affect table
    }
}
```

## Migration from Manual Tables

### Before (Manual)

```tsx
const columns: ColumnDef<Deal>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "status", header: "Status" },
];

<DataTable
    columns={columns}
    data={deals}
    search={{
        enabled: true,
        searchableColumns: ["name", "email"],
    }}
    filter={{
        enabled: true,
        filters: [
            {
                column: "status",
                type: "select",
                label: "Status",
                options: [...]
            }
        ]
    }}
/>
```

### After (Schema-Driven)

```tsx
<SchemaDataTable
    schema={dealSchema}
    data={deals}
    getRowId={(row) => row.id}
/>
```

Everything is auto-configured from the schema!
