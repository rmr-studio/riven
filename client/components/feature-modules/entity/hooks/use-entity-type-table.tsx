import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    DataType,
    EntityPropertyType,
    EntityRelationshipCardinality,
    SchemaType,
} from "@/lib/types/types";
import { toTitleCase } from "@/lib/util/utils";
import { ColumnDef, Row } from "@tanstack/react-table";
import { Key, Link2, ListTodo, ListX } from "lucide-react";
import { ReactNode, useMemo } from "react";
import {
    EntityAttributeDefinition,
    EntityRelationshipDefinition,
    EntityType,
    EntityTypeDefinition,
} from "../interface/entity.interface";

// Common type for data table rows (both attributes and relationships)
interface EntityTypeAttributeRow {
    // Persistent Hash map lookup uuid => Cannot be changed after creation. Also unique identifier for relationships
    id: string;
    // Human readable display name
    label: string;
    type: EntityPropertyType;
    protected?: boolean;
    required: boolean;
    schemaType: SchemaType | "RELATIONSHIP";
    additionalConstraints: string[];
    dataType?: DataType;
    unique?: boolean;
    // Relationship-specific fields (optional for attributes)
    cardinality?: EntityRelationshipCardinality;
    entityTypeKeys?: string[];
    allowPolymorphic?: boolean;
    bidirectional?: boolean;
}

interface UseEntityTypeTableReturn {
    columns: ColumnDef<EntityTypeAttributeRow>[];
    sortedRowData: EntityTypeAttributeRow[];
    onDelete: (row: EntityTypeAttributeRow) => void;
    onEdit: (row: EntityTypeAttributeRow) => void;
}

export function useEntityTypeTable(
    type: EntityType,
    identifierKey: string,
    editCB: (definition: EntityTypeDefinition) => void,
    deleteCB: (definition: EntityTypeDefinition) => void
): UseEntityTypeTableReturn {
    // Create a lookup map for attributes and relationships by their IDs. This should allow for quick access when choosing the correct item to edit
    const attributeLookup: Map<string, EntityAttributeDefinition | EntityRelationshipDefinition> =
        useMemo(() => {
            const map = new Map<string, EntityAttributeDefinition | EntityRelationshipDefinition>();

            if (type.schema.properties) {
                Object.entries(type.schema.properties).forEach(([id, attr]) => {
                    map.set(id, {
                        id,
                        schema: attr,
                    });
                });
            }

            type.relationships &&
                type.relationships.forEach((rel) => {
                    map.set(rel.id, rel);
                });
            return map;
        }, [type]);

    const getIcon = (row: Row<EntityTypeAttributeRow>): ReactNode | null => {
        if (row.original.type === EntityPropertyType.RELATIONSHIP)
            return (
                <>
                    <TooltipTrigger asChild>
                        <Link2 className="size-4 mr-1 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className=" text-xs font-mono italic">
                        This attribute references a relationship to another entity type
                    </TooltipContent>
                </>
            );

        if (identifierKey === row.original.id)
            return (
                <>
                    <TooltipTrigger asChild>
                        <Key className="size-4 mr-1 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className=" text-xs font-mono italic">
                        This attribute represents the primary identifier for this entity
                    </TooltipContent>
                </>
            );

        if (!row.original.required && !row.original.unique) return <div className="w-4 mr-1"></div>;

        return (
            <div className="flex space-x-2">
                {row.original.required && (
                    <>
                        <TooltipTrigger asChild>
                            <ListTodo className="size-4 mr-1 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className=" text-xs font-mono italic">
                            This attribute is required and must have a value for each entity
                        </TooltipContent>
                    </>
                )}
                {row.original.unique && (
                    <>
                        <TooltipTrigger asChild>
                            <ListX className="size-4 mr-1 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className=" text-xs font-mono italic">
                            This attribute must have a unique value for each entity
                        </TooltipContent>
                    </>
                )}
            </div>
        );
    };

    // Unified columns for both attributes and relationships
    const fieldColumns: ColumnDef<EntityTypeAttributeRow>[] = useMemo(
        () => [
            {
                accessorKey: "label",
                header: "Name",
                cell: ({ row }) => {
                    return (
                        <div className="flex items-center gap-2">
                            <TooltipProvider>
                                <Tooltip>{getIcon(row)}</Tooltip>
                            </TooltipProvider>
                            <span className="font-medium">{row.original.label}</span>
                        </div>
                    );
                },
            },
            {
                accessorKey: "rowType",
                header: "Type",
                cell: ({ row }) => {
                    return <Badge variant="outline">{toTitleCase(row.original.schemaType)}</Badge>;
                },
            },
            {
                id: "constraints",
                header: "Constraints",
                cell: ({ row }) => {
                    const isRelationship = row.original.type === EntityPropertyType.RELATIONSHIP;
                    const constraints: string[] = [];

                    if (row.original.required) constraints.push("Required");

                    if (!isRelationship && row.original.unique) {
                        constraints.push("Unique");
                    }

                    if (isRelationship && row.original.allowPolymorphic) {
                        constraints.push("Polymorphic");
                    }

                    if (isRelationship && row.original.bidirectional) {
                        constraints.push("Bidirectional");
                    }

                    return (
                        <div className="flex gap-1 flex-wrap">
                            {constraints.map((constraint) => (
                                <Badge key={constraint} variant="secondary" className="text-xs">
                                    {constraint}
                                </Badge>
                            ))}
                            {constraints.length === 0 && (
                                <span className="text-xs text-muted-foreground">None</span>
                            )}
                        </div>
                    );
                },
            },
        ],
        []
    );

    const convertRelationshipToRow = (
        relationship: EntityRelationshipDefinition
    ): EntityTypeAttributeRow => ({
        id: relationship.id,
        label: relationship.name || relationship.id,
        type: EntityPropertyType.RELATIONSHIP,
        required: relationship.required || false,
        schemaType: "RELATIONSHIP",
        additionalConstraints: [],
        cardinality: relationship.cardinality,
        entityTypeKeys: relationship.entityTypeKeys || [],
        allowPolymorphic: relationship.allowPolymorphic || false,
        bidirectional: relationship.bidirectional || false,
    });

    const convertSchemaPropertyToRow = (
        attribute: EntityAttributeDefinition
    ): EntityTypeAttributeRow => {
        const { id, schema } = attribute;
        return {
            id,
            label: schema.label ?? "Unknown",
            type: EntityPropertyType.ATTRIBUTE,
            required: schema.required || false,
            schemaType: schema.key,
            // Todo. Set up additional constraints properly
            additionalConstraints: [],
            dataType: schema.type,
            unique: schema.unique || false,
        };
    };

    const sortedRowData: EntityTypeAttributeRow[] = useMemo(() => {
        const { schema, order, relationships } = type;
        const rows: EntityTypeAttributeRow[] = [
            ...Object.entries(schema.properties || {}).map(([id, attr]) =>
                convertSchemaPropertyToRow({ id, schema: attr })
            ),
            ...(relationships || []).map((rel) => convertRelationshipToRow(rel)),
        ];

        return rows.toSorted((a, b) => {
            const aOrderItem = order.find(
                (o) => o.key === a.id && o.type === EntityPropertyType.ATTRIBUTE
            );
            const bOrderItem = order.find(
                (o) => o.key === b.id && o.type === EntityPropertyType.ATTRIBUTE
            );
            const aIndex = aOrderItem ? order.indexOf(aOrderItem) : -1;
            const bIndex = bOrderItem ? order.indexOf(bOrderItem) : -1;

            // If both are in order array, sort by their position
            if (aIndex !== -1 && bIndex !== -1) {
                return aIndex - bIndex;
            }
            // If only one is in order array, prioritize it
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
            // If neither is in order array, maintain current order
            return 0;
        });
    }, [type, attributeLookup]);

    const onEdit = (row: EntityTypeAttributeRow) => {
        const definition = attributeLookup.get(row.id);
        if (!definition) return;

        editCB({
            id: row.id,
            type: row.type,
            definition,
        });
    };

    const onDelete = (row: EntityTypeAttributeRow) => {
        const definition = attributeLookup.get(row.id);
        if (!definition) return;

        deleteCB({
            id: row.id,
            type: row.type,
            definition,
        });
    };

    return {
        columns: fieldColumns,
        sortedRowData,
        onEdit,
        onDelete,
    };
}
