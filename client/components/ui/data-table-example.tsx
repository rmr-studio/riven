"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "./badge";
import { DataTable } from "./data-table";

// Example data type matching the image structure
interface AttributeRow {
    id: string;
    name: string;
    type: string;
    constraints?: string;
    properties?: string;
    icon?: string;
}

// Example data
const exampleData: AttributeRow[] = [
    {
        id: "1",
        name: "Record ID",
        type: "Text",
        constraints: "Unique",
        properties: "System",
    },
    {
        id: "2",
        name: "Deal name",
        type: "Text",
        constraints: "Required",
        properties: "System",
    },
    {
        id: "3",
        name: "Deal stage",
        type: "Status",
        constraints: "Required",
        properties: "System",
    },
    {
        id: "4",
        name: "Deal type",
        type: "Select",
        properties: "System",
    },
    {
        id: "5",
        name: "List Entries",
        type: "Record",
        properties: "System",
    },
    {
        id: "6",
        name: "Deal owner",
        type: "User",
        constraints: "Required",
        properties: "System",
    },
    {
        id: "7",
        name: "Deal value",
        type: "Currency",
        properties: "System",
    },
];

// Column definitions
const columns: ColumnDef<AttributeRow>[] = [
    {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
                {row.original.icon && (
                    <span className="text-muted-foreground">{row.original.icon}</span>
                )}
                <span className="font-medium">{row.getValue("name")}</span>
            </div>
        ),
    },
    {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("type")}</span>,
    },
    {
        accessorKey: "constraints",
        header: "Constraints",
        cell: ({ row }) => {
            const constraints = row.getValue("constraints") as string | undefined;
            return constraints ? (
                <span className="text-muted-foreground">{constraints}</span>
            ) : null;
        },
    },
    {
        accessorKey: "properties",
        header: "Properties",
        cell: ({ row }) => {
            const properties = row.getValue("properties") as string | undefined;
            return properties ? (
                <Badge variant="outline" className="text-xs">
                    {properties}
                </Badge>
            ) : null;
        },
    },
];

// Example usage component
export function DataTableExample() {
    const handleReorder = (newData: AttributeRow[]) => {
        console.log("Reordered data:", newData);
    };

    const handleRowClick = (row: any) => {
        console.log("Row clicked:", row.original);
    };

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Deals</h2>
                    <p className="text-sm text-muted-foreground">
                        Manage object attributes and other relevant settings
                    </p>
                </div>
            </div>

            <DataTable
                search={{
                    enabled: true,
                    searchableColumns: ["name"],
                    placeholder: "Search Attributes",
                }}
                filter={{
                    enabled: true,
                    filters: [
                        {
                            column: "name",
                            type: "text",
                            label: "Name",
                            placeholder: "Filter by name...",
                        },
                    ],
                }}
                columns={columns}
                data={exampleData}
                enableDragDrop={true}
                onReorder={handleReorder}
                onRowClick={handleRowClick}
                getRowId={(row) => row.id}
                emptyMessage="No attributes found."
            />
        </div>
    );
}

// Usage with all features enabled
export function DataTableFullFeatures() {
    const handleReorder = (newData: AttributeRow[]) => {
        console.log("Reordered:", newData);
    };

    const handleSearchChange = (value: string) => {
        console.log("Search:", value);
    };

    const handleFiltersChange = (filters: Record<string, any>) => {
        console.log("Filters:", filters);
    };

    const handleRowClick = (row: any) => {
        console.log("Clicked:", row.original);
    };

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Deals</h2>
                    <p className="text-sm text-muted-foreground">
                        Manage object attributes and other relevant settings
                    </p>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={exampleData}
                enableDragDrop={true}
                enableSorting={true}
                onReorder={handleReorder}
                onRowClick={handleRowClick}
                getRowId={(row) => row.id}
                search={{
                    enabled: true,
                    searchableColumns: ["name", "type", "constraints"],
                    placeholder: "Search by name, type, or constraints...",
                    debounceMs: 300,
                    onSearchChange: handleSearchChange,
                }}
                filter={{
                    enabled: true,
                    filters: [
                        {
                            column: "type",
                            type: "select",
                            label: "Type",
                            options: [
                                { label: "Text", value: "Text" },
                                { label: "Status", value: "Status" },
                                { label: "Select", value: "Select" },
                                { label: "Record", value: "Record" },
                                { label: "User", value: "User" },
                                { label: "Currency", value: "Currency" },
                            ],
                        },
                        {
                            column: "constraints",
                            type: "multi-select",
                            label: "Constraints",
                            options: [
                                { label: "Unique", value: "Unique" },
                                { label: "Required", value: "Required" },
                            ],
                        },
                    ],
                    onFiltersChange: handleFiltersChange,
                }}
                emptyMessage="No attributes found."
            />
        </div>
    );
}
