import { Badge } from "@/components/ui/badge";
import { ColumnFilter, FilterOption } from "@/components/ui/data-table";
import { DataFormat, DataType, EntityPropertyType } from "@/lib/types/types";
import { toTitleCase } from "@/lib/util/utils";
import { ColumnDef } from "@tanstack/react-table";
import { ReactNode } from "react";
import { Entity, EntityType, EntityTypeOrderingKey } from "../../interface/entity.interface";

// Row type for entity instance data table
export interface EntityInstanceRow {
    _entityId: string;
    _entity: Entity;
    [attributeId: string]: any; // Dynamic fields from payload
}

/**
 * Transform entities into flat row objects for the data table
 */
export function transformEntitiesToRows(entities: Entity[]): EntityInstanceRow[] {
    return entities.map((entity) => {
        const row: EntityInstanceRow = {
            _entityId: entity.id,
            _entity: entity,
        };

        // Flatten payload into row properties
        if (entity.payload) {
            Object.entries(entity.payload).forEach(([key, value]) => {
                row[key] = value;
            });
        }

        return row;
    });
}

/**
 * Format entity attribute value based on data type and format
 */
export function formatEntityAttributeValue(value: any, schema: any): ReactNode {
    // Handle null/undefined
    if (value === null || value === undefined) {
        return <span className="text-muted-foreground">—</span>;
    }

    const dataType = schema.type as DataType;
    const dataFormat = schema.format as DataFormat | undefined;

    // STRING type formatting
    if (dataType === DataType.STRING) {
        const strValue = String(value);

        if (dataFormat === DataFormat.EMAIL) {
            return (
                <a href={`mailto:${strValue}`} className="text-primary hover:underline">
                    {strValue}
                </a>
            );
        }

        if (dataFormat === DataFormat.PHONE) {
            return (
                <a href={`tel:${strValue}`} className="text-primary hover:underline">
                    {strValue}
                </a>
            );
        }

        if (dataFormat === DataFormat.URL) {
            return (
                <a
                    href={strValue}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                >
                    {strValue}
                </a>
            );
        }

        if (dataFormat === DataFormat.DATE) {
            try {
                const date = new Date(strValue);
                return <span>{date.toLocaleDateString()}</span>;
            } catch {
                return <span>{strValue}</span>;
            }
        }

        if (dataFormat === DataFormat.DATETIME) {
            try {
                const date = new Date(strValue);
                return <span>{date.toLocaleString()}</span>;
            } catch {
                return <span>{strValue}</span>;
            }
        }

        return <span>{strValue}</span>;
    }

    // NUMBER type formatting
    if (dataType === DataType.NUMBER) {
        const numValue = Number(value);

        if (dataFormat === DataFormat.CURRENCY) {
            return (
                <span>
                    {numValue.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                    })}
                </span>
            );
        }

        if (dataFormat === DataFormat.PERCENTAGE) {
            return <span>{numValue}%</span>;
        }

        return <span>{numValue.toLocaleString()}</span>;
    }

    // BOOLEAN type formatting
    if (dataType === DataType.BOOLEAN) {
        return (
            <Badge variant={value ? "default" : "secondary"}>
                {value ? "Yes" : "No"}
            </Badge>
        );
    }

    // ARRAY type formatting
    if (dataType === DataType.ARRAY) {
        if (Array.isArray(value)) {
            return (
                <Badge variant="outline" className="font-mono">
                    [{value.length} items]
                </Badge>
            );
        }
        return <Badge variant="outline">Array</Badge>;
    }

    // OBJECT type formatting
    if (dataType === DataType.OBJECT) {
        return <Badge variant="outline">Object</Badge>;
    }

    // Fallback for unknown types
    return <span>{String(value)}</span>;
}

/**
 * Generate columns from entity type schema
 */
export function generateColumnsFromEntityType(
    entityType: EntityType
): ColumnDef<EntityInstanceRow>[] {
    const columns: ColumnDef<EntityInstanceRow>[] = [];

    if (!entityType.schema.properties) {
        return columns;
    }

    Object.entries(entityType.schema.properties).forEach(([attributeId, schema]) => {
        columns.push({
            accessorKey: attributeId,
            header: schema.label || attributeId,
            cell: ({ row }) => {
                const value = row.getValue(attributeId);
                return formatEntityAttributeValue(value, schema);
            },
            enableSorting: true,
            meta: {
                schema,
                required: schema.required,
                unique: schema.unique,
                protected: schema.protected,
            },
        });
    });

    return columns;
}

/**
 * Apply column ordering based on entity type order array
 */
export function applyColumnOrdering(
    columns: ColumnDef<EntityInstanceRow>[],
    order: EntityTypeOrderingKey[]
): ColumnDef<EntityInstanceRow>[] {
    const orderedColumns: ColumnDef<EntityInstanceRow>[] = [];
    const columnMap = new Map(
        columns.map((col) => [col.accessorKey as string, col])
    );

    // Add columns in order array sequence
    order.forEach((orderItem) => {
        if (orderItem.type === EntityPropertyType.ATTRIBUTE) {
            const column = columnMap.get(orderItem.key);
            if (column) {
                orderedColumns.push(column);
                columnMap.delete(orderItem.key);
            }
        }
    });

    // Add remaining columns (not in order array)
    columnMap.forEach((column) => {
        orderedColumns.push(column);
    });

    return orderedColumns;
}

/**
 * Extract unique values from entities for a specific attribute
 */
export function extractUniqueAttributeValues(
    entities: Entity[],
    attributeId: string
): FilterOption[] {
    const uniqueValues = new Set<string>();

    entities.forEach((entity) => {
        const value = entity.payload?.[attributeId];
        if (value !== null && value !== undefined) {
            uniqueValues.add(String(value));
        }
    });

    return Array.from(uniqueValues)
        .sort()
        .map((value) => ({
            label: toTitleCase(value),
            value: value,
        }));
}

/**
 * Generate filters from entity type schema based on actual entity data
 */
export function generateFiltersFromEntityType(
    entityType: EntityType,
    entities: Entity[],
    selectFilterThreshold: number = 10
): ColumnFilter<EntityInstanceRow>[] {
    const filters: ColumnFilter<EntityInstanceRow>[] = [];

    if (!entityType.schema.properties) {
        return filters;
    }

    Object.entries(entityType.schema.properties).forEach(([attributeId, schema]) => {
        // Skip protected fields
        if (schema.protected) {
            return;
        }

        const dataType = schema.type as DataType;
        const label = schema.label || attributeId;

        // STRING type filters
        if (dataType === DataType.STRING) {
            const uniqueValues = extractUniqueAttributeValues(entities, attributeId);

            // Use select filter for low-cardinality attributes
            if (uniqueValues.length > 0 && uniqueValues.length <= selectFilterThreshold) {
                filters.push({
                    column: attributeId as keyof EntityInstanceRow & string,
                    type: "select",
                    label,
                    options: uniqueValues,
                });
            } else if (uniqueValues.length > selectFilterThreshold) {
                // Use text filter for high-cardinality attributes
                filters.push({
                    column: attributeId as keyof EntityInstanceRow & string,
                    type: "text",
                    label,
                    placeholder: `Filter by ${label.toLowerCase()}...`,
                });
            }
        }

        // NUMBER type filters
        if (dataType === DataType.NUMBER) {
            filters.push({
                column: attributeId as keyof EntityInstanceRow & string,
                type: "number-range",
                label,
            });
        }

        // BOOLEAN type filters
        if (dataType === DataType.BOOLEAN) {
            filters.push({
                column: attributeId as keyof EntityInstanceRow & string,
                type: "boolean",
                label,
            });
        }

        // DATE/DATETIME filters could be added here when date-range filter is implemented
    });

    return filters;
}

/**
 * Generate search configuration from entity type schema
 */
export function generateSearchConfigFromEntityType(
    entityType: EntityType
): (keyof EntityInstanceRow & string)[] {
    const searchableColumns: string[] = [];

    if (!entityType.schema.properties) {
        return searchableColumns;
    }

    Object.entries(entityType.schema.properties).forEach(([attributeId, schema]) => {
        // Only include non-protected STRING attributes for search
        if (schema.type === DataType.STRING && !schema.protected) {
            searchableColumns.push(attributeId);
        }
    });

    return searchableColumns;
}
