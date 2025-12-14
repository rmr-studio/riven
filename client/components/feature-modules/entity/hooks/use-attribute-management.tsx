import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { attributeTypes } from "@/lib/util/form/schema.util";
import { ColumnDef } from "@tanstack/react-table";
import { Key, Lock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AttributeFormData, EntityType } from "../interface/entity.interface";

export interface UseAttributeManagementReturn {
    attributes: AttributeFormData[];
    attributeColumns: ColumnDef<AttributeFormData>[];
    handleAttributeAdd: (data: AttributeFormData) => void;
    handleAttributeEdit: (data: AttributeFormData) => void;
    handleAttributeDelete: (name: string) => void;
    handleAttributesReorder: (reordered: AttributeFormData[]) => void;
    editAttribute: (row: AttributeFormData) => AttributeFormData | undefined;
}

export function useAttributeManagement(
    entityType?: EntityType,
    identifierKey?: string,
    order: string[] = [],
    onOrderChange?: (order: string[]) => void
): UseAttributeManagementReturn {
    const [attributes, setAttributes] = useState<AttributeFormData[]>([]);

    // Initialize attributes from entity type schema on mount or when entityType changes
    useEffect(() => {
        if (entityType?.schema?.properties) {
            const existingAttrs: AttributeFormData[] = Object.entries(
                entityType.schema.properties
            ).map(([key, schema]) => ({
                type: "attribute" as const,
                name: key,
                key: key,
                description: schema.description,
                dataType: schema.type,
                dataFormat: schema.format,
                required: schema.required || false,
                unique: schema.unique || false,
                protected: schema.protected || false,
                options: {
                    enum: schema.enum,
                    enumSorting: schema.enumSorting,
                    minimum: schema.minimum,
                    maximum: schema.maximum,
                    minLength: schema.minLength,
                    maxLength: schema.maxLength,
                    regex: schema.regex,
                },
            }));
            setAttributes(existingAttrs);
        }
    }, [entityType]);

    // Sort attributes based on order array
    const sortedAttributes = useMemo(() => {
        if (order.length === 0) return attributes;

        return [...attributes].sort((a, b) => {
            const aIndex = order.indexOf(a.key);
            const bIndex = order.indexOf(b.key);

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
                    const attribute = attributeTypes[row.original.key];
                    return (
                        <Badge variant="outline">
                            <attribute.icon className="mr-1" />
                            <span>{row.original.key}</span>
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
        // Check for duplicate names/keys
        if (attributes.find((attr) => attr.name === data.name)) {
            toast.error("An attribute with this name already exists.");
            return;
        }

        setAttributes((prev) => [...prev, data]);
        // Add to order array
        if (onOrderChange) {
            const newOrder = [...order, data.key];
            onOrderChange(newOrder);
        }
    };

    const handleAttributeEdit = (data: AttributeFormData) => {
        setAttributes((prev) => prev.map((attr) => (attr.key === data.key ? data : attr)));
    };

    const handleAttributeDelete = (name: string) => {
        const attribute = attributes.find((attr) => attr.name === name);
        if (attribute?.protected) {
            toast.error("This attribute is protected and cannot be deleted.");
            return;
        }
        setAttributes((prev) => prev.filter((attr) => attr.name !== name));
        // Remove from order array
        if (attribute && onOrderChange) {
            const newOrder = order.filter((key) => key !== attribute.key);
            onOrderChange(newOrder);
        }
    };

    const handleAttributesReorder = (reorderedAttributes: AttributeFormData[]) => {
        if (!onOrderChange) return;

        // Get keys for reordered attributes
        const attributeKeys = reorderedAttributes.map((attr) => attr.key);

        onOrderChange(attributeKeys);
    };

    const editAttribute = (row: AttributeFormData): AttributeFormData | undefined => {
        return attributes.find((attr) => attr.name === row.name);
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
