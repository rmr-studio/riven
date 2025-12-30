"use client";

import { Schema } from "@/lib/interfaces/common.interface";
import { DataFormat, DataType } from "@/lib/types/types";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { ColumnFilter, DataTable, FilterConfig, FilterOption, SearchConfig } from ".";
import { Badge } from "../badge";

/**
 * Schema-Driven Data Table
 *
 * Automatically configures columns, filters, and search based on a Schema definition.
 *
 * Features:
 * - Auto-generates columns from schema properties
 * - Auto-configures filters based on field types
 * - Auto-configures searchable columns
 * - Handles nested objects and arrays
 * - Respects schema constraints (required, unique, protected)
 */

interface SchemaDataTableProps<TData extends Record<string, any>> {
    schema: Schema;
    data: TData[];
    getRowId?: (row: TData, index: number) => string;
    enableDragDrop?: boolean;
    onReorder?: (data: TData[]) => void;
    onRowClick?: (row: any) => void;
    className?: string;
    emptyMessage?: string;
    // Override auto-generated configs
    customColumns?: ColumnDef<TData, any>[];
    customFilters?: ColumnFilter<TData>[];
    customSearchableColumns?: string[];
    // Feature toggles
    enableSearch?: boolean;
    enableFilters?: boolean;
    enableSorting?: boolean;
}

/**
 * Maps Schema DataType and DataFormat to appropriate filter type
 */
function getFilterTypeFromSchema(schema: Schema): ColumnFilter<any>["type"] | null {
    // Protected fields shouldn't be filterable
    if (schema.protected) return null;

    switch (schema.type) {
        case DataType.STRING:
            // Use select for short strings, text for others
            return "text";

        case DataType.NUMBER:
            if (schema.format === DataFormat.CURRENCY) {
                return "number-range";
            }
            return "number-range";

        case DataType.BOOLEAN:
            return "boolean";

        case DataType.OBJECT:
        case DataType.ARRAY:
            // Complex types not directly filterable
            return null;

        default:
            return null;
    }
}

/**
 * Determines if a field should be searchable based on schema
 */
function isSearchableField(schema: Schema): boolean {
    // Protected fields shouldn't be searchable
    if (schema.protected) return false;

    // Only search text-based fields
    switch (schema.type) {
        case DataType.STRING:
            return true;
        default:
            return false;
    }
}

/**
 * Formats cell value based on schema type and format
 */
function formatCellValue(value: any, schema: Schema): React.ReactNode {
    if (value === null || value === undefined) {
        return <span className="text-muted-foreground">—</span>;
    }

    switch (schema.type) {
        case DataType.STRING:
            if (schema.format === DataFormat.EMAIL) {
                return (
                    <a href={`mailto:${value}`} className="text-primary hover:underline">
                        {value}
                    </a>
                );
            }
            if (schema.format === DataFormat.PHONE) {
                return (
                    <a href={`tel:${value}`} className="text-primary hover:underline">
                        {value}
                    </a>
                );
            }
            if (schema.format === DataFormat.DATE) {
                return new Date(value).toLocaleDateString();
            }
            if (schema.format === DataFormat.DATETIME) {
                return new Date(value).toLocaleString();
            }
            return <span>{value}</span>;

        case DataType.NUMBER:
            if (schema.format === DataFormat.CURRENCY) {
                return <span>${value.toLocaleString()}</span>;
            }
            return <span>{value.toLocaleString()}</span>;

        case DataType.BOOLEAN:
            return <Badge variant={value ? "default" : "secondary"}>{value ? "Yes" : "No"}</Badge>;

        case DataType.ARRAY:
            if (Array.isArray(value)) {
                return <span>{value.length} items</span>;
            }
            return <span className="text-muted-foreground">—</span>;

        case DataType.OBJECT:
            return <span className="text-muted-foreground">Object</span>;

        default:
            return <span>{String(value)}</span>;
    }
}

/**
 * Generates column definitions from schema
 */
function generateColumnsFromSchema<TData extends Record<string, any>>(
    schema: Schema
): ColumnDef<TData, any>[] {
    if (!schema.properties) return [];

    return Object.entries(schema.properties).map(([key, fieldSchema]) => {
        const column: ColumnDef<TData, any> = {
            accessorKey: key,
            header: fieldSchema.name,
            cell: ({ row }) => {
                const value = row.getValue(key);
                return formatCellValue(value, fieldSchema);
            },
            // Add metadata for potential use
            meta: {
                schema: fieldSchema,
                required: fieldSchema.required,
                unique: fieldSchema.unique,
                protected: fieldSchema.protected,
            },
        };

        return column;
    });
}

/**
 * Generates filter configuration from schema
 */
function generateFiltersFromSchema<TData extends Record<string, any>>(
    schema: Schema
): ColumnFilter<TData>[] {
    if (!schema.properties) return [];

    const filters: ColumnFilter<TData>[] = [];

    Object.entries(schema.properties).forEach(([key, fieldSchema]) => {
        const filterType = getFilterTypeFromSchema(fieldSchema);
        if (!filterType) return;

        const filter: ColumnFilter<TData> = {
            column: key as any,
            type: filterType,
            label: fieldSchema.name,
        };

        // Add placeholder for text filters
        if (filterType === "text") {
            filter.placeholder = `Filter by ${fieldSchema.name.toLowerCase()}...`;
        }

        filters.push(filter);
    });

    return filters;
}

/**
 * Generates search configuration from schema
 */
function generateSearchConfigFromSchema<TData extends Record<string, any>>(
    schema: Schema
): string[] {
    if (!schema.properties) return [];

    return Object.entries(schema.properties)
        .filter(([_, fieldSchema]) => isSearchableField(fieldSchema))
        .map(([key]) => key);
}

/**
 * Schema-driven DataTable component
 */
export function SchemaDataTable<TData extends Record<string, any>>({
    schema,
    data,
    getRowId,
    enableDragDrop = false,
    onReorder,
    onRowClick,
    className,
    emptyMessage = "No data available.",
    customColumns,
    customFilters,
    customSearchableColumns,
    enableSearch = true,
    enableFilters = true,
    enableSorting = false,
}: SchemaDataTableProps<TData>) {
    // Generate columns from schema
    const columns = useMemo(() => {
        return customColumns ?? generateColumnsFromSchema<TData>(schema);
    }, [schema, customColumns]);

    // Generate filters from schema
    const filters = useMemo(() => {
        if (!enableFilters) return undefined;
        const schemaFilters = customFilters ?? generateFiltersFromSchema<TData>(schema);
        if (schemaFilters.length === 0) return undefined;

        return {
            enabled: true,
            filters: schemaFilters,
        } as FilterConfig<TData>;
    }, [schema, customFilters, enableFilters]);

    // Generate search config from schema
    const searchConfig = useMemo(() => {
        if (!enableSearch) return undefined;
        const searchableColumns =
            customSearchableColumns ?? generateSearchConfigFromSchema<TData>(schema);
        if (searchableColumns.length === 0) return undefined;

        return {
            enabled: true,
            searchableColumns: searchableColumns as any,
            placeholder: `Search ${schema.name.toLowerCase()}...`,
        } as SearchConfig<TData>;
    }, [schema, customSearchableColumns, enableSearch]);

    return (
        <DataTable
            columns={columns}
            data={data}
            getRowId={getRowId}
            enableDragDrop={enableDragDrop}
            onReorder={onReorder}
            onRowClick={onRowClick}
            className={className}
            emptyMessage={emptyMessage}
            search={searchConfig}
            filter={filters}
            enableSorting={enableSorting}
        />
    );
}

/**
 * Utility to extract options from data for select filters
 */
export function extractUniqueValuesForFilter<TData extends Record<string, any>>(
    data: TData[],
    columnKey: string
): FilterOption[] {
    const uniqueValues = new Set<string | number | boolean>();

    data.forEach((row) => {
        const value = row[columnKey];
        if (value !== null && value !== undefined) {
            uniqueValues.add(value);
        }
    });

    return Array.from(uniqueValues)
        .sort()
        .map((value) => ({
            label: String(value),
            value: value,
        }));
}

/**
 * Enhanced Schema DataTable with auto-detected select filters
 */
export function EnhancedSchemaDataTable<TData extends Record<string, any>>(
    props: SchemaDataTableProps<TData> & {
        autoDetectSelectFilters?: boolean;
        selectFilterThreshold?: number; // Max unique values to convert to select
    }
) {
    const {
        schema,
        data,
        autoDetectSelectFilters = true,
        selectFilterThreshold = 10,
        customFilters,
        ...rest
    } = props;

    // Generate enhanced filters with auto-detected selects
    const enhancedFilters = useMemo(() => {
        if (!autoDetectSelectFilters || customFilters) return customFilters;

        const baseFilters = generateFiltersFromSchema<TData>(schema);

        return baseFilters.map((filter) => {
            // Only enhance text filters
            if (filter.type !== "text") return filter;

            // Extract unique values
            const uniqueValues = extractUniqueValuesForFilter(data, String(filter.column));

            // Convert to select if within threshold
            if (uniqueValues.length > 0 && uniqueValues.length <= selectFilterThreshold) {
                return {
                    ...filter,
                    type: "select" as const,
                    options: uniqueValues,
                };
            }

            return filter;
        });
    }, [schema, data, autoDetectSelectFilters, selectFilterThreshold, customFilters]);

    return (
        <SchemaDataTable {...rest} schema={schema} data={data} customFilters={enhancedFilters} />
    );
}
