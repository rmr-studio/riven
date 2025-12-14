import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ColumnDef } from "@tanstack/react-table";
import { Key, Lock } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AttributeFormData } from "../interface/entity-type.interface";
import { EntityType } from "../interface/entity.interface";

export interface AttributeRow {
    name: string;
    type: string;
    required: boolean;
    unique: boolean;
    description?: string;
    dataFormat?: string;
    protected?: boolean;
}

export interface UseAttributeManagementReturn {
    newAttributes: AttributeFormData[];
    attributes: AttributeRow[];
    attributeColumns: ColumnDef<AttributeRow>[];
    handleAttributeAdd: (data: AttributeFormData) => void;
    handleAttributeEdit: (data: AttributeFormData) => void;
    handleAttributeDelete: (name: string) => void;
    handleAttributesReorder: (reordered: AttributeRow[]) => void;
    editAttribute: (row: AttributeRow) => AttributeFormData | undefined;
}

export function useAttributeManagement(
    entityType?: EntityType,
    identifierKey?: string,
    order: string[] = [],
    onOrderChange?: (order: string[]) => void
): UseAttributeManagementReturn {
    const [newAttributes, setNewAttributes] = useState<AttributeFormData[]>([]);

    // Extract attributes from schema and combine with new attributes
    const attributes: AttributeRow[] = useMemo(() => {
        const existingAttrs: AttributeRow[] = entityType?.schema?.properties
            ? Object.entries(entityType.schema.properties).map(([key, schema]) => ({
                  name: key,
                  type: schema.type || "string",
                  required: schema.required || false,
                  unique: schema.unique || false,
                  description: schema.description,
                  dataFormat: schema.format,
                  protected: schema.protected || false,
              }))
            : [];

        const newAttrs: AttributeRow[] = newAttributes.map((attr) => ({
            name: attr.name,
            type: attr.dataType,
            required: attr.required,
            unique: attr.unique,
            description: attr.description,
            dataFormat: attr.dataFormat,
            protected: attr.protected || false,
        }));

        const allAttrs = [...existingAttrs, ...newAttrs];

        // Create a map to get keys for attributes
        const attrKeyMap = new Map<string, string>();
        // For existing attributes, the name is the key
        existingAttrs.forEach((attr) => attrKeyMap.set(attr.name, attr.name));
        // For new attributes, use the actual key field
        newAttributes.forEach((attr) => attrKeyMap.set(attr.name, attr.key));

        // Sort based on order array if it exists
        if (order.length > 0) {
            return allAttrs.sort((a, b) => {
                const aKey = attrKeyMap.get(a.name) || a.name;
                const bKey = attrKeyMap.get(b.name) || b.name;
                const aIndex = order.indexOf(aKey);
                const bIndex = order.indexOf(bKey);

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
        }

        return allAttrs;
    }, [entityType, newAttributes, order]);

    // Attribute column definitions
    const attributeColumns: ColumnDef<AttributeRow>[] = useMemo(() => {
        return [
            {
                accessorKey: "name",
                header: "Name",
                cell: ({ row }) => {
                    const isProtected = row.original.protected;
                    const isIdentifier = row.original.name === identifierKey;

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
                                    <span className="font-medium">{row.original.name}</span>
                                    {row.original.description && (
                                        <span className="text-xs text-muted-foreground">
                                            {row.original.description}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </TooltipProvider>
                    );
                },
            },
            {
                accessorKey: "type",
                header: "Type",
                cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge>,
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
        // Check for duplicate names/keys
        if (
            attributes.find((attr) => attr.name === data.name) ||
            newAttributes.find((attr) => attr.name === data.name)
        ) {
            toast.error("An attribute with this name already exists.");
            return;
        }

        setNewAttributes((prev) => [...prev, data]);
        // Add to order array
        if (onOrderChange) {
            const newOrder = [...order, data.key];
            onOrderChange(newOrder);
        }
    };

    const handleAttributeEdit = (data: AttributeFormData) => {
        setNewAttributes((prev) => prev.map((attr) => (attr.key === data.key ? data : attr)));
    };

    const handleAttributeDelete = (name: string) => {
        const attribute = newAttributes.find((attr) => attr.name === name);
        if (attribute?.protected) {
            toast.error("This attribute is protected and cannot be deleted.");
            return;
        }
        setNewAttributes((prev) => prev.filter((attr) => attr.name !== name));
        // Remove from order array
        if (attribute && onOrderChange) {
            const newOrder = order.filter((key) => key !== attribute.key);
            onOrderChange(newOrder);
        }
    };

    const handleAttributesReorder = (reorderedAttributes: AttributeRow[]) => {
        if (!onOrderChange) return;

        // Create a map to get keys for attributes
        const attrKeyMap = new Map<string, string>();
        // For existing attributes from schema, the name is the key
        if (entityType?.schema?.properties) {
            Object.keys(entityType.schema.properties).forEach((key) => {
                attrKeyMap.set(key, key);
            });
        }
        // For new attributes, use the actual key field
        newAttributes.forEach((attr) => attrKeyMap.set(attr.name, attr.key));

        // Get keys for reordered attributes
        const attributeKeys = reorderedAttributes.map(
            (attr) => attrKeyMap.get(attr.name) || attr.name
        );

        onOrderChange(attributeKeys);
    };

    const editAttribute = (row: AttributeRow): AttributeFormData | undefined => {
        return newAttributes.find((attr) => attr.name === row.name);
    };

    return {
        newAttributes,
        attributes,
        attributeColumns,
        handleAttributeAdd,
        handleAttributeEdit,
        handleAttributeDelete,
        handleAttributesReorder,
        editAttribute,
    };
}
