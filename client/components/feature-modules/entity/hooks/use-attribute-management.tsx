import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EntityPropertyType } from "@/lib/types/types";
import { attributeTypes } from "@/lib/util/form/schema.util";
import { fromKeyCase, toKeyCase } from "@/lib/util/utils";
import { ColumnDef } from "@tanstack/react-table";
import { Key, Lock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
    EntityType,
    EntityTypeOrderingKey,
} from "../interface/entity.interface";

export interface UseAttributeManagementReturn {
    attributes: AttributeFormData[];
    attributeColumns: ColumnDef<AttributeFormData>[];
    handleAttributeAdd: (data: AttributeFormData) => void;
    handleAttributeEdit: (data: AttributeFormData) => void;
    handleAttributeDelete: (id: string) => void;
    handleAttributesReorder: (reordered: AttributeFormData[]) => void;
    editAttribute: (row: AttributeFormData) => AttributeFormData | undefined;
}

export function useAttributeManagement(
    entityType?: EntityType,
    identifierKey?: string,
    order: EntityTypeOrderingKey[] = [],
    onOrderChange?: (order: EntityTypeOrderingKey[]) => void
): UseAttributeManagementReturn {
    const [attributes, setAttributes] = useState<AttributeFormData[]>([]);

    // Initialize attributes from entity type schema on mount or when entityType changes
    useEffect(() => {
        if (entityType?.schema?.properties) {
            const existingAttrs: AttributeFormData[] = Object.entries(
                entityType.schema.properties
            ).map(([key, schema]) => ({
                id: key,
                type: EntityPropertyType.ATTRIBUTE,
                label: schema.label || fromKeyCase(key),
                schemaKey: schema.key,
                dataType: schema.type,
                dataFormat: schema.format,
                required: schema.required || false,
                unique: schema.unique || false,
                protected: schema.protected || false,
                options: {
                    ...schema.options,
                },
            }));
            setAttributes(existingAttrs);
        }
    }, [entityType]);

    // Sort attributes based on order array
    const sortedAttributes = useMemo(() => {
        if (order.length === 0) return attributes;

        return [...attributes].sort((a, b) => {
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
    }, [attributes, order]);

    // Attribute column definitions
    const attributeColumns: ColumnDef<AttributeFormData>[] = useMemo(() => {
        return [
            {
                accessorKey: "name",
                header: "Name",
                cell: ({ row }) => {
                    const isProtected = row.original.protected;
                    const isIdentifier = row.original.id === identifierKey;

                    return (
                        <TooltipProvider>
                            <div className="flex items-center gap-2">
                                {isProtected && !isIdentifier && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Lock className="size-3.5 mr-1 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Protected attribute - cannot be deleted</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                                {isIdentifier && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Key className="size-3.5 mr-1 text-primary" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Identifier key - used to identify entities</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                                <div className="flex flex-col">
                                    <span className="font-medium">{row.original.label}</span>
                                </div>
                            </div>
                        </TooltipProvider>
                    );
                },
            },
            {
                accessorKey: "key",
                header: "Type",
                cell: ({ row }) => {
                    const attribute = attributeTypes[row.original.schemaKey];
                    return (
                        <Badge variant="outline">
                            <attribute.icon className="mr-1" />
                            <span>{row.original.schemaKey}</span>
                        </Badge>
                    );
                },
            },
            {
                accessorKey: "required",
                header: "Required",
                cell: ({ row }) => (
                    <Badge variant={row.original.required ? "default" : "secondary"}>
                        {row.original.required ? "Yes" : "No"}
                    </Badge>
                ),
            },
            {
                accessorKey: "unique",
                header: "Unique",
                cell: ({ row }) => (
                    <Badge variant={row.original.unique ? "default" : "secondary"}>
                        {row.original.unique ? "Yes" : "No"}
                    </Badge>
                ),
            },
        ];
    }, [identifierKey]);

    const handleAttributeAdd = (data: AttributeFormData) => {
        // Check for duplicate ids or labels
        if (
            attributes.find(
                (attr) => attr.id === data.id || toKeyCase(attr.label) === toKeyCase(data.label)
            )
        ) {
            toast.error("This attribute already exists.");
            return;
        }

        setAttributes((prev) => [...prev, data]);
        // Add to order array
        if (onOrderChange) {
            const newOrder: EntityTypeOrderingKey[] = [
                ...order,
                { key: data.id, type: EntityPropertyType.ATTRIBUTE },
            ];
            onOrderChange(newOrder);
        }
    };

    const handleAttributeEdit = (data: AttributeFormData) => {
        setAttributes((prev) => {
            const index = prev.findIndex((attr) => attr.id === data.id);
            if (index === -1) return prev;
            const updated = [...prev];
            updated[index] = data;
            return updated;
        });
    };

    const handleAttributeDelete = (id: string) => {
        const attribute = attributes.find((attr) => attr.id === id);
        if (attribute?.protected) {
            toast.error("This attribute is protected and cannot be deleted.");
            return;
        }
        setAttributes((prev) => prev.filter((attr) => attr.id !== id));
        // Remove from order array
        if (attribute && onOrderChange) {
            const newOrder = order.filter(
                (o) => !(o.key === attribute.id && o.type === EntityPropertyType.ATTRIBUTE)
            );
            onOrderChange(newOrder);
        }
    };

    const handleAttributesReorder = (reorderedAttributes: AttributeFormData[]) => {
        if (!onOrderChange) return;

        // Get ids for reordered attributes
        const attributeKeys: EntityTypeOrderingKey[] = reorderedAttributes.map((attr) => ({
            key: attr.id,
            type: EntityPropertyType.ATTRIBUTE,
        }));
        onOrderChange(attributeKeys);
    };

    const editAttribute = (row: AttributeFormData): AttributeFormData | undefined => {
        return attributes.find((attr) => attr.id === row.id);
    };

    return {
        attributes: sortedAttributes,
        attributeColumns,
        handleAttributeAdd,
        handleAttributeEdit,
        handleAttributeDelete,
        handleAttributesReorder,
        editAttribute,
    };
}
