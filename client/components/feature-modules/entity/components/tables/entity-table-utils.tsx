import { Badge } from "@/components/ui/badge";
import { ColumnFilter, FilterOption } from "@/components/ui/data-table";
import { IconCell } from "@/components/ui/icon/icon-cell";
import { DataFormat, DataType, EntityPropertyType } from "@/lib/types/types";
import { toTitleCase } from "@/lib/util/utils";
import { ColumnDef } from "@tanstack/react-table";
import { ReactNode } from "react";
import {
    Entity,
    EntityAttribute,
    EntityType,
    EntityTypeAttributeColumn,
    isRelationshipPayload,
} from "../../interface/entity.interface";

// Row type for entity instance data table
// Discriminated union to safely handle both entity rows and draft rows
export type EntityRow =
    | {
          _entityId: string;
          _isDraft: false;
          _entity: Entity;
          [attributeId: string]: any; // Dynamic fields from payload
      }
    | {
          _entityId: string;
          _isDraft: true;
          _entity?: undefined; // Explicitly undefined for draft rows
          [attributeId: string]: any; // Dynamic fields for draft values
      };

/**
 * Type guard to check if a row is a draft row
 */
export function isDraftRow(row: EntityRow): row is Extract<EntityRow, { _isDraft: true }> {
    return row._isDraft === true;
}

/**
 * Type guard to check if a row is an entity row (not draft)
 */
export function isEntityRow(row: EntityRow): row is Extract<EntityRow, { _isDraft: false }> {
    return row._isDraft === false;
}

/**
 * Transform entities into flat row objects for the data table
 */
export function transformEntitiesToRows(entities: Entity[]): EntityRow[] {
    return entities
        .filter((entity) => !!entity.payload)
        .map((entity) => {
            const row: EntityRow = {
                _entityId: entity.id,
                _isDraft: false,
                _entity: entity,
            };

            Object.entries(entity.payload).forEach(([key, value]) => {
                const { payload } = value;
                if (isRelationshipPayload(payload)) {
                    row[key] = payload.relations;
                    return;
                }
                row[key] = payload.value;
            });

            return row;
        });
}

/**
 * Format entity attribute value based on data type and format
 */
export function formatEntityAttributeValue(value: any, schema: any): ReactNode {
    // Handle null/undefined
    if (value === null || value === undefined) {
        return <span className="text-muted-foreground">-</span>;
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
        return <Badge variant={value ? "default" : "secondary"}>{value ? "Yes" : "No"}</Badge>;
    }

    // ARRAY type formatting (multi-select enums, etc.)
    if (dataType === DataType.ARRAY) {
        if (Array.isArray(value)) {
            if (value.length === 0) {
                return <div className="text-muted-foreground flex grow h-full" />;
            }

            // Render each item as its own badge
            return (
                <div className="flex flex-wrap gap-1">
                    {value.map((item, idx) => (
                        <Badge key={idx} variant="secondary" className="font-normal">
                            {String(item)}
                        </Badge>
                    ))}
                </div>
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
    entityType: EntityType,
    options?: { enableEditing?: boolean }
): ColumnDef<EntityRow>[] {
    const columns: ColumnDef<EntityRow>[] = [];

    if (!entityType.schema.properties) {
        return columns;
    }

    Object.entries(entityType.schema.properties).forEach(([attributeId, schema]) => {
        columns.push({
            accessorKey: attributeId,
            header: (_) => {
                const { icon, label } = schema;
                const { icon: type, colour } = icon;

                return (
                    <div className="flex items-center">
                        <IconCell
                            readonly
                            iconType={type}
                            colour={colour}
                            className="size-4 mr-2"
                        />
                        <span>{label}</span>
                    </div>
                );
            },
            cell: ({ row }) => {
                const value = row.getValue(attributeId);
                return formatEntityAttributeValue(value, schema);
            },
            enableSorting: true,
            meta: options?.enableEditing
                ? {
                      editable: true,
                      fieldSchema: schema, // SchemaUUID for widget selection
                      // Don't need zodSchema - widget handles validation via schema
                      parseValue: (val: any) => val, // Pass through as-is
                      formatValue: (val: any) => val, // Pass through as-is
                      // Keep existing meta
                      schema,
                      required: schema.required,
                      unique: schema.unique,
                      protected: schema.protected,
                  }
                : {
                      schema,
                      required: schema.required,
                      unique: schema.unique,
                      protected: schema.protected,
                  },
        });
    });

    entityType.relationships?.forEach((relationship) => {
        columns.push({
            accessorKey: relationship.id,
            header: () => {
                const { icon, name } = relationship;
                return (
                    <div className="flex items-center">
                        <IconCell
                            readonly
                            iconType={icon.icon}
                            colour={icon.colour}
                            className="size-4 mr-2"
                        />
                        <span>{name}</span>
                    </div>
                );
            },
            cell: ({ row }) => {
                const value = row.getValue(relationship.id);
                if (!value) return;
                if (Array.isArray(value)) {
                    if (value.length === 0) {
                        return;
                    }

                    return (
                        <div className="flex flex-wrap gap-1">
                            {value.map((item: any, idx: number) => (
                                <Badge key={idx} variant="secondary" className="font-normal">
                                    {String(item)}
                                </Badge>
                            ))}
                        </div>
                    );
                }
            },
            enableSorting: false,
            meta: {
                schema: {
                    type: "RELATIONSHIP",
                },
            },
        });
    });

    return columns;
}

/**
 * Apply column ordering based on entity type columns array
 */
export function applyColumnOrdering(
    columns: ColumnDef<EntityRow>[],
    columnsOrder: EntityTypeAttributeColumn[]
): ColumnDef<EntityRow>[] {
    const orderedColumns: ColumnDef<EntityRow>[] = [];
    const columnMap = new Map(columns.map((col) => [col.accessorKey as string, col]));

    // Add columns in order array sequence
    columnsOrder.forEach((orderItem) => {
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
): ColumnFilter<EntityRow>[] {
    const filters: ColumnFilter<EntityRow>[] = [];

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
                    column: attributeId as keyof EntityRow & string,
                    type: "select",
                    label,
                    options: uniqueValues,
                });
            } else if (uniqueValues.length > selectFilterThreshold) {
                // Use text filter for high-cardinality attributes
                filters.push({
                    column: attributeId as keyof EntityRow & string,
                    type: "text",
                    label,
                    placeholder: `Filter by ${label.toLowerCase()}...`,
                });
            }
        }

        // NUMBER type filters
        if (dataType === DataType.NUMBER) {
            filters.push({
                column: attributeId as keyof EntityRow & string,
                type: "number-range",
                label,
            });
        }

        // BOOLEAN type filters
        if (dataType === DataType.BOOLEAN) {
            filters.push({
                column: attributeId as keyof EntityRow & string,
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
): (keyof EntityRow & string)[] {
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

/**
 * Get entity display name using the identifier field value
 * Falls back to truncated entity ID if identifier value not found
 */
export function getEntityDisplayName(entity: Entity): string {
    // Get the identifier field value from the entity payload
    const identifierValue: EntityAttribute | null = entity.payload[entity.identifierKey];
    if (!identifierValue) {
        return `Entity ${entity.id.slice(0, 8)}...`;
    }

    const { payload } = identifierValue;
    // An identifier value should always be of type ATTRIBUTE and be of SCHEMA TYPE STRING or NUMBER
    if (isRelationshipPayload(payload)) {
        return `Entity ${entity.id.slice(0, 8)}...`;
    }

    return String(payload.value);
}
