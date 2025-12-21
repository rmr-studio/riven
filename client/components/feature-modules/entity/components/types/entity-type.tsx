"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    DataType,
    EntityPropertyType,
    EntityRelationshipCardinality,
    SchemaType,
} from "@/lib/types/types";
import { ColumnDef, Row } from "@tanstack/react-table";
import {
    AlertCircle,
    CheckCircle2,
    Database,
    Edit2,
    Key,
    Link2,
    ListTodo,
    ListX,
    Plus,
    Save,
    Trash2,
} from "lucide-react";
import Link from "next/link";
import { FC, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAttributeManagement } from "../../hooks/use-attribute-management";
import { EntityTypeFormValues, useEntityTypeForm } from "../../hooks/use-entity-type-form";
import { useEntityTypes } from "../../hooks/use-entity-types";
import { useRelationshipManagement } from "../../hooks/use-relationship-management";
import {
    isAttributeType,
    type AttributeFormData,
    type EntityType,
    type EntityTypeAttributeData,
    type EntityTypeOrderingKey,
    type RelationshipFormData,
} from "../../interface/entity.interface";
import { ConfigurationForm } from "../forms/entity-type-configuration-form";
import { AttributeDialog } from "./entity-type-attribute-dialog";

interface EntityTypeOverviewProps {
    entityType: EntityType;
    organisationId: string;
}

// Common type for data table rows (both attributes and relationships)
interface EntityTypeFieldRow extends EntityTypeAttributeData {
    schemaType: SchemaType | "RELATIONSHIP";
    additionalConstraints: string[];
    // Attribute-specific fields (optional for relationships)
    schemaKey?: SchemaType;
    dataType?: DataType;
    unique?: boolean;
    // Relationship-specific fields (optional for attributes)
    cardinality?: EntityRelationshipCardinality;
    entityTypeKeys?: string[];
    allowPolymorphic?: boolean;
    bidirectional?: boolean;
    targetAttributeName?: string | undefined;
}

export const EntityTypeOverview: FC<EntityTypeOverviewProps> = ({ entityType, organisationId }) => {
    const [order, setOrder] = useState<EntityTypeOrderingKey[]>(entityType?.order || []);
    const hasInitialized = useRef(false);

    // Form management hook
    const { handleSubmit: handleFormSubmit } = useEntityTypeForm(organisationId, entityType);
    const { form } = useEntityTypeForm(organisationId, entityType);
    const identifierKey = form.watch("identifierKey");
    // Attribute management hook
    const {
        attributes,
        attributeColumns,
        handleAttributeAdd,
        handleAttributeEdit,
        handleAttributeDelete,
        handleAttributesReorder,
        editAttribute,
    } = useAttributeManagement(entityType, identifierKey, order, setOrder);

    // Relationship management hook
    const {
        relationships,
        handleRelationshipAdd,
        handleRelationshipEdit,
        handleRelationshipDelete,
        handleRelationshipsReorder,
        editRelationship,
    } = useRelationshipManagement(entityType, order, setOrder);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingAttribute, setEditingAttribute] = useState<
        AttributeFormData | RelationshipFormData | undefined
    >(undefined);

    // Fetch all entity types for relationship creation
    const { data: entityTypes = [] } = useEntityTypes(organisationId);

    // Watch the pluralName field for dynamic title
    const pluralName = form.watch("pluralName");

    // Watch the key field to handle self-reference updates
    const currentKey = form.watch("key");
    const previousKeyRef = useRef<string>(currentKey);
    const isUpdatingKeyRef = useRef(false);

    // Determine which tabs have validation errors
    const tabErrors = useMemo(() => {
        const errors = form.formState.errors;
        const configurationFields = [
            "pluralName",
            "singularName",
            "key",
            "identifierKey",
            "description",
            "type",
        ];

        const hasConfigurationErrors = configurationFields.some(
            (field) => errors[field as keyof typeof errors]
        );

        // Check for root errors (like attribute/relationship validation)
        const hasAttributeErrors = !!errors.root;

        return {
            configuration: hasConfigurationErrors,
            attributes: hasAttributeErrors,
        };
    }, [form.formState.errors]);

    // Check for relationship suggestions from overlap detection
    useEffect(() => {
        const suggestionData = sessionStorage.getItem("relationship-suggestion");
        if (suggestionData) {
            try {
                const suggestion = JSON.parse(suggestionData);

                // Only use if recent (within 5 minutes)
                if (Date.now() - suggestion.timestamp < 5 * 60 * 1000) {
                    toast.info(
                        `Suggestion: Consider adding ${suggestion.sourceEntityKey} to the bidirectional list of the "${suggestion.relationshipKey}" relationship`,
                        { duration: 10000 }
                    );
                }
            } catch (e) {
                console.error("Failed to parse relationship suggestion", e);
            } finally {
                // Clear the suggestion
                sessionStorage.removeItem("relationship-suggestion");
            }
        }
    }, []);

    const validName = pluralName && pluralName.trim().length > 0;

    // Clear manual error on pluralName when user enters a valid name
    useEffect(() => {
        if (validName && form.formState.errors.pluralName?.type === "manual") {
            form.clearErrors("pluralName");
        }
    }, [validName, form]);

    // Sync order array with all attributes and relationships
    useEffect(() => {
        // Create a map of existing order items for quick lookup
        const orderMap = new Map(order.map((o) => [`${o.type}-${o.key}`, o]));
        let needsUpdate = false;
        const newOrder: EntityTypeOrderingKey[] = [...order];

        // Add any attributes that aren't in the order array
        attributes.forEach((attr) => {
            const key = `${attr.type}-${attr.id}`;
            if (!orderMap.has(key)) {
                newOrder.push({ key: attr.id, type: attr.type });
                needsUpdate = true;
            }
        });

        // Add any relationships that aren't in the order array
        relationships.forEach((rel) => {
            const key = `${rel.type}-${rel.id}`;
            if (!orderMap.has(key)) {
                newOrder.push({ key: rel.id, type: rel.type });
                needsUpdate = true;
            }
        });

        // Remove any items from order that no longer exist in attributes or relationships
        const allFieldKeys = new Set([
            ...attributes.map((a) => `${a.type}-${a.id}`),
            ...relationships.map((r) => `${r.type}-${r.id}`),
        ]);

        const filteredOrder = newOrder.filter((o) => allFieldKeys.has(`${o.type}-${o.key}`));

        if (needsUpdate || filteredOrder.length !== newOrder.length) {
            setOrder(filteredOrder);
        }
    }, [attributes, relationships, order]);

    // Combine attributes and relationships into a single array
    const allFields: EntityTypeFieldRow[] = useMemo(() => {
        // Convert attributes to EntityTypeFieldRow
        const attributeRows: EntityTypeFieldRow[] = attributes.map((attr) => ({
            id: attr.id,
            label: attr.label,
            type: attr.type,
            required: attr.required,
            protected: attr.protected,
            schemaType: attr.schemaKey,
            // Attribute-specific fields
            schemaKey: attr.schemaKey,
            dataType: attr.dataType,
            unique: attr.unique,
            // Determine additional constraints from `schemaOptions`
            additionalConstraints: [],
        }));

        // Convert relationships to EntityTypeFieldRow
        const relationshipRows: EntityTypeFieldRow[] = relationships.map((rel) => ({
            id: rel.id,
            label: rel.label,
            type: rel.type,
            required: rel.required,
            protected: rel.protected,
            schemaType: "RELATIONSHIP" as const,
            // Relationship-specific fields
            cardinality: rel.cardinality,
            entityTypeKeys: rel.entityTypeKeys,
            allowPolymorphic: rel.allowPolymorphic,
            bidirectional: rel.bidirectional,
            targetAttributeName: rel.inverseName,
            additionalConstraints: [],
        }));

        const combined = [...attributeRows, ...relationshipRows];

        // Sort based on order array if it exists
        if (order.length > 0) {
            return combined.sort((a, b) => {
                const aOrderItem = order.find((o) => o.key === a.id && o.type === a.type);
                const bOrderItem = order.find((o) => o.key === b.id && o.type === b.type);
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
        }

        return combined;
    }, [attributes, relationships, order]);

    const getIcon = (row: Row<EntityTypeFieldRow>): ReactNode | null => {
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
    const fieldColumns: ColumnDef<EntityTypeFieldRow>[] = useMemo(
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
                    const isRelationship = row.original.type === EntityPropertyType.RELATIONSHIP;
                    if (isRelationship) {
                        const rel = row.original as RelationshipFormData;
                        return (
                            <div className="flex flex-col gap-1">
                                <Badge variant="outline">
                                    {rel.cardinality.replace(/_/g, " ")}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    {rel.entityTypeKeys?.join(", ") || "Any"}
                                </span>
                            </div>
                        );
                    } else {
                        const attr = row.original as AttributeFormData;
                        return <Badge variant="outline">{attr.schemaKey}</Badge>;
                    }
                },
            },
            {
                id: "constraints",
                header: "Constraints",
                cell: ({ row }) => {
                    const isRelationship = row.original.type === EntityPropertyType.RELATIONSHIP;
                    const constraints: string[] = [];

                    if (row.original.required) constraints.push("Required");
                    if (!isRelationship && (row.original as AttributeFormData).unique)
                        constraints.push("Unique");
                    if (isRelationship && (row.original as RelationshipFormData).bidirectional)
                        constraints.push("Bidirectional");

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

    const handleInvalidSubmit = (errors: typeof form.formState.errors) => {
        const errorMessages: string[] = [];

        // Collect all error messages
        Object.entries(errors).forEach(([field, error]) => {
            if (error && typeof error === "object" && "message" in error) {
                const fieldName = field.replace(/([A-Z])/g, " $1").toLowerCase();
                errorMessages.push(`${fieldName}: ${error.message}`);
            }
        });

        // Show toast with all validation errors
        toast.error("Validation errors", {
            description:
                errorMessages.length > 0
                    ? errorMessages.join("\n")
                    : "Please check all required fields and try again.",
        });
    };

    const submit = useCallback(
        (values: EntityTypeFormValues) => {
            handleFormSubmit(values, attributes, relationships, order);
        },
        [attributes, relationships, order]
    );

    const handleSaveClick = () => {
        form.handleSubmit(submit, handleInvalidSubmit)();
    };

    const handleAttributeSubmit = (data: AttributeFormData | RelationshipFormData) => {
        if (editingAttribute) {
            if (isAttributeType(data)) {
                handleAttributeEdit(data);
            } else {
                handleRelationshipEdit(data);
            }
        } else {
            // Add new attribute/relationship
            if (isAttributeType(data)) {
                handleAttributeAdd(data);
            } else {
                handleRelationshipAdd(data);
            }
        }

        // Close dialog after state updates - this ensures proper cleanup
        setDialogOpen(false);
        setEditingAttribute(undefined);
    };

    const handleDeleteField = (id: string, type: EntityPropertyType) => {
        if (type === EntityPropertyType.RELATIONSHIP) {
            handleRelationshipDelete(id);
        } else {
            handleAttributeDelete(id);
        }
    };

    const handleEditField = (row: EntityTypeFieldRow) => {
        if (row.type === EntityPropertyType.ATTRIBUTE) {
            const attribute = attributes.find((attr) => attr.id === row.id);
            if (attribute) {
                setEditingAttribute(attribute);
                setDialogOpen(true);
            }
        } else {
            const relationship = relationships.find((rel) => rel.id === row.id);
            if (relationship) {
                setEditingAttribute(relationship);
                setDialogOpen(true);
            }
        }
    };

    const handleFieldsReorder = (reorderedFields: EntityTypeFieldRow[]) => {
        // Create new order array from reordered fields
        const newOrder: EntityTypeOrderingKey[] = reorderedFields.map((field) => ({
            key: field.id,
            type: field.type,
        }));

        setOrder(newOrder);
    };

    return (
        <>
            <Form {...form}>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                <Database className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-semibold">{pluralName}</h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary">{entityType.type}</Badge>
                                    <span className="text-sm text-muted-foreground">
                                        Manage object attributes and other relevant settings
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link href={`/dashboard/organisation/${organisationId}/entity`}>
                                <Button variant="outline">Back</Button>
                            </Link>
                            <Button onClick={handleSaveClick}>
                                <Save className="size-4 mr-1" />
                                Save Changes
                            </Button>
                        </div>
                    </div>

                    {/* Validation Errors */}
                    {form.formState.errors.root && (
                        <Alert variant="destructive">
                            <AlertDescription>
                                {form.formState.errors.root.message}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Tabs */}
                    <Tabs defaultValue="configuration" className="w-full">
                        <TabsList className="justify-start w-2/5">
                            <div className="w-auto flex flex-grow">
                                <TabsTrigger value="configuration">
                                    <div className="flex items-center gap-2">
                                        Configuration
                                        {tabErrors.configuration && (
                                            <AlertCircle className="size-4 mr-1 text-destructive" />
                                        )}
                                    </div>
                                </TabsTrigger>
                            </div>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className="flex flex-grow w-auto"
                                            onClick={(e) => {
                                                if (!validName) {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    // Trigger validation and focus on pluralName field
                                                    form.setError("pluralName", {
                                                        type: "manual",
                                                        message: "Plural name is required",
                                                    });
                                                    form.setFocus("pluralName");
                                                }
                                            }}
                                        >
                                            <TabsTrigger value="attributes" disabled={!validName}>
                                                <div className="flex items-center gap-2">
                                                    Attributes
                                                    {tabErrors.attributes && (
                                                        <AlertCircle className="size-4 mr-1 text-destructive" />
                                                    )}
                                                    {allFields.length > 0 && (
                                                        <Badge className="h-4 w-5 border border-border ">
                                                            {allFields.length}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TabsTrigger>
                                        </div>
                                    </TooltipTrigger>

                                    <TooltipContent>
                                        <p className="text-xs">
                                            Please configure the entity name before adding
                                            attributes.
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </TabsList>

                        {/* Configuration Tab */}
                        <TabsContent value="configuration" className="space-y-6">
                            <ConfigurationForm
                                form={form}
                                availableIdentifiers={attributes.filter(
                                    (attr) => attr.unique && attr.required
                                )}
                            />
                        </TabsContent>

                        {/* Attributes Tab */}
                        <TabsContent value="attributes" className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold">
                                        Attributes & Relationships
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Manage the fields and relationships for this entity type
                                    </p>
                                </div>
                                <Button
                                    onClick={() => {
                                        setEditingAttribute(undefined);
                                        setDialogOpen(true);
                                    }}
                                >
                                    <Plus className="size-4 mr-2" />
                                    Add Attribute
                                </Button>
                            </div>

                            {/* Validation Requirements */}
                            <div className="rounded-lg border bg-muted/50 p-4">
                                <h3 className="text-sm font-semibold mb-3">
                                    Validation Requirements
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        {attributes.some((attr) => attr.unique) ? (
                                            <CheckCircle2 className="size-4 mr-1 text-green-600" />
                                        ) : (
                                            <AlertCircle className="size-4 mr-1 text-destructive" />
                                        )}
                                        <span
                                            className={
                                                attributes.some((attr) => attr.unique)
                                                    ? "text-green-600"
                                                    : "text-destructive"
                                            }
                                        >
                                            At least one unique attribute
                                        </span>
                                    </div>
                                    {form.watch("type") === "RELATIONSHIP" && (
                                        <div className="flex items-center gap-2 text-sm">
                                            {relationships.length >= 2 ? (
                                                <CheckCircle2 className="size-4 mr-1 text-green-600" />
                                            ) : (
                                                <AlertCircle className="size-4 mr-1 text-destructive" />
                                            )}
                                            <span
                                                className={
                                                    relationships.length >= 2
                                                        ? "text-green-600"
                                                        : "text-destructive"
                                                }
                                            >
                                                Minimum 2 relationships ({relationships.length}
                                                /2)
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <DataTable
                                columns={fieldColumns}
                                data={allFields}
                                enableDragDrop
                                onReorder={handleFieldsReorder}
                                getRowId={(row) => row.id}
                                search={{
                                    enabled: true,
                                    searchableColumns: ["label"],
                                    placeholder: "Search fields...",
                                }}
                                filter={{
                                    enabled: true,
                                    filters: [
                                        {
                                            column: "type",
                                            type: "select",
                                            label: "Type",
                                            options: [
                                                {
                                                    label: "Attributes",
                                                    value: EntityPropertyType.ATTRIBUTE,
                                                },
                                                {
                                                    label: "Relationships",
                                                    value: EntityPropertyType.RELATIONSHIP,
                                                },
                                            ],
                                        },
                                    ],
                                }}
                                rowActions={{
                                    enabled: true,
                                    menuLabel: "Actions",
                                    actions: [
                                        {
                                            label: "Edit",
                                            icon: Edit2,
                                            onClick: (row) => {
                                                handleEditField(row);
                                            },
                                        },
                                        {
                                            label: "Delete",
                                            icon: Trash2,
                                            onClick: (row) => {
                                                handleDeleteField(row.id, row.type);
                                            },
                                            variant: "destructive",
                                            disabled: (row) => row?.protected || false,
                                        },
                                    ],
                                }}
                                emptyMessage="No fields defined yet. Add your first attribute or relationship to get started."
                                className="border rounded-md"
                            />
                        </TabsContent>
                    </Tabs>

                    {/* Attribute/Relationship Dialog */}
                </div>
            </Form>
            <AttributeDialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) {
                        setEditingAttribute(undefined);
                    }
                }}
                onSubmit={handleAttributeSubmit}
                entityTypes={entityTypes}
                currentEntityType={entityType}
                editingAttribute={editingAttribute}
                currentAttributes={attributes}
                currentRelationships={relationships}
                identifierKey={identifierKey}
                currentFormKey={form.watch("key")}
                currentFormPluralName={form.watch("pluralName")}
            />
        </>
    );
};
