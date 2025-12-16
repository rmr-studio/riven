"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { TabsContent, TabsList, TabsStandard, TabsTrigger } from "@/components/ui/tabs-standard";
import { Textarea } from "@/components/ui/textarea";
import {
    DataType,
    EntityPropertyType,
    EntityRelationshipCardinality,
    SchemaType,
} from "@/lib/types/types";
import { ColumnDef } from "@tanstack/react-table";
import {
    AlertCircle,
    CheckCircle2,
    Database,
    Edit2,
    Link2,
    Plus,
    Save,
    Trash2,
} from "lucide-react";
import Link from "next/link";
import { FC, useEffect, useMemo, useRef, useState } from "react";
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
import { AttributeDialog } from "./attribute-dialog";

interface EntityTypeFormProps {
    entityType?: EntityType;
    organisationId: string;
    mode: "create" | "edit";
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

export const EntityTypeOverview: FC<EntityTypeFormProps> = ({
    entityType,
    organisationId,
    mode,
}) => {
    const [order, setOrder] = useState<EntityTypeOrderingKey[]>(entityType?.order || []);
    const hasInitialized = useRef(false);

    // Form management hook
    const {
        form,
        keyManuallyEdited,
        setKeyManuallyEdited,
        handleSubmit: handleFormSubmit,
    } = useEntityTypeForm(organisationId, entityType, mode);

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

    // Auto-generate default "name" attribute for new entity types
    useEffect(() => {
        if (mode === "create" && attributes.length === 0 && !hasInitialized.current) {
            hasInitialized.current = true;
            const defaultNameAttribute: AttributeFormData = {
                type: EntityPropertyType.ATTRIBUTE,
                key: "name",
                label: "Name",
                schemaKey: SchemaType.TEXT,
                dataType: DataType.STRING,
                required: true,
                unique: true,
                protected: true,
            };
            handleAttributeAdd(defaultNameAttribute);
            // Set the default name attribute as the identifier key
            form.setValue("identifierKey", "Name");
        }
    }, [mode, attributes.length, handleAttributeAdd, form]);

    // Sync order array with all attributes and relationships
    useEffect(() => {
        // Create a map of existing order items for quick lookup
        const orderMap = new Map(order.map((o) => [`${o.type}-${o.key}`, o]));
        let needsUpdate = false;
        const newOrder: EntityTypeOrderingKey[] = [...order];

        // Add any attributes that aren't in the order array
        attributes.forEach((attr) => {
            const key = `${attr.type}-${attr.key}`;
            if (!orderMap.has(key)) {
                newOrder.push({ key: attr.key, type: attr.type });
                needsUpdate = true;
            }
        });

        // Add any relationships that aren't in the order array
        relationships.forEach((rel) => {
            const key = `${rel.type}-${rel.key}`;
            if (!orderMap.has(key)) {
                newOrder.push({ key: rel.key, type: rel.type });
                needsUpdate = true;
            }
        });

        // Remove any items from order that no longer exist in attributes or relationships
        const allFieldKeys = new Set([
            ...attributes.map((a) => `${a.type}-${a.key}`),
            ...relationships.map((r) => `${r.type}-${r.key}`),
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
            key: attr.key,
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
            key: rel.key,
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
            targetAttributeName: rel.targetAttributeName,
            additionalConstraints: [],
        }));

        const combined = [...attributeRows, ...relationshipRows];

        // Sort based on order array if it exists
        if (order.length > 0) {
            return combined.sort((a, b) => {
                const aOrderItem = order.find((o) => o.key === a.key && o.type === a.type);
                const bOrderItem = order.find((o) => o.key === b.key && o.type === b.type);
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

    // Unified columns for both attributes and relationships
    const fieldColumns: ColumnDef<EntityTypeFieldRow>[] = useMemo(
        () => [
            {
                accessorKey: "label",
                header: "Name",
                cell: ({ row }) => {
                    const isRelationship = row.original.type === EntityPropertyType.RELATIONSHIP;
                    return (
                        <div className="flex items-center gap-2">
                            {isRelationship ? (
                                <Link2 className="h-4 w-4 text-muted-foreground" />
                            ) : null}
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

    const handleSubmit = (values: EntityTypeFormValues) => {
        handleFormSubmit(values, attributes, relationships, order);
    };

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

    const handleSaveClick = () => {
        form.handleSubmit(handleSubmit, handleInvalidSubmit)();
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

    const handleDeleteField = (key: string, type: EntityPropertyType) => {
        if (type === EntityPropertyType.RELATIONSHIP) {
            handleRelationshipDelete(key);
        } else {
            handleAttributeDelete(key);
        }
    };

    const handleEditField = (row: EntityTypeFieldRow) => {
        if (row.type === EntityPropertyType.ATTRIBUTE) {
            const attribute = attributes.find((attr) => attr.key === row.key);
            if (attribute) {
                setEditingAttribute(attribute);
                setDialogOpen(true);
            }
        } else {
            const relationship = relationships.find((rel) => rel.key === row.key);
            if (relationship) {
                setEditingAttribute(relationship);
                setDialogOpen(true);
            }
        }
    };

    const handleFieldsReorder = (reorderedFields: EntityTypeFieldRow[]) => {
        console.log(reorderedFields);
        // Create new order array from reordered fields
        const newOrder: EntityTypeOrderingKey[] = reorderedFields.map((field) => ({
            key: field.key,
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
                                <h1 className="text-2xl font-semibold">
                                    {pluralName ||
                                        (mode === "create"
                                            ? "New Entity Type"
                                            : entityType?.name.plural || "Entity Type")}
                                </h1>
                                {mode === "edit" && entityType?.type && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="secondary">{entityType.type}</Badge>
                                        <span className="text-sm text-muted-foreground">
                                            Manage object attributes and other relevant settings
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link href={`/dashboard/organisation/${organisationId}/entity`}>
                                <Button variant="outline">Back</Button>
                            </Link>
                            <Button onClick={handleSaveClick}>
                                {mode === "create" ? (
                                    <Plus className="size-4 mr-1" />
                                ) : (
                                    <Save className="size-4 mr-1" />
                                )}
                                {mode === "create" ? "Create" : "Save Changes"}
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
                    <TabsStandard defaultValue="configuration" className="w-full">
                        <TabsList className="w-full justify-start">
                            <TabsTrigger value="configuration">
                                <div className="flex items-center gap-2">
                                    Configuration
                                    {tabErrors.configuration && (
                                        <AlertCircle className="h-4 w-4 text-destructive" />
                                    )}
                                </div>
                            </TabsTrigger>
                            <TabsTrigger value="attributes">
                                <div className="flex items-center gap-2">
                                    Attributes
                                    {tabErrors.attributes && (
                                        <AlertCircle className="h-4 w-4 text-destructive" />
                                    )}
                                    {allFields.length > 0 && (
                                        <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                                            {allFields.length}
                                        </Badge>
                                    )}
                                </div>
                            </TabsTrigger>
                        </TabsList>

                        {/* Configuration Tab */}
                        <TabsContent value="configuration" className="space-y-6">
                            <div className="rounded-lg border bg-card p-6">
                                <h2 className="text-lg font-semibold mb-4">General</h2>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Name */}
                                        <FormField
                                            control={form.control}
                                            name="pluralName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-semibold">
                                                        Plural noun
                                                    </FormLabel>
                                                    <FormDescription className="text-xs italic">
                                                        This will be used to label a collection of
                                                        these entities
                                                    </FormDescription>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                                                            <Database className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="e.g., Companies"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Plural Name */}
                                        <FormField
                                            control={form.control}
                                            name="singularName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-semibold">
                                                        Singular noun
                                                    </FormLabel>
                                                    <FormDescription className="text-xs italic">
                                                        How we should label a single entity of this
                                                        type
                                                    </FormDescription>
                                                    <div className="flex items-center gap-2">
                                                        <FormControl>
                                                            <Input
                                                                placeholder="e.g., Company"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Key / Slug */}
                                    <FormField
                                        control={form.control}
                                        name="key"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Identifier / Slug</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="e.g., companies"
                                                        disabled={mode === "edit"}
                                                        {...field}
                                                        onChange={(e) => {
                                                            field.onChange(e);
                                                            if (mode === "create") {
                                                                setKeyManuallyEdited(true);
                                                            }
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormDescription className="text-xs italic">
                                                    A unique key used to identify and link this
                                                    particular entity type. This cannot be changed
                                                    later.
                                                    {mode === "create" && !keyManuallyEdited && (
                                                        <span className="block mt-1 text-muted-foreground">
                                                            Auto-generated from plural noun. Edit to
                                                            customize.
                                                        </span>
                                                    )}
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Identifier Key */}
                                    <FormField
                                        control={form.control}
                                        name="identifierKey"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Identifier Key</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a unique identifier" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {attributes
                                                            .filter((attr) => attr.unique)
                                                            .map((attr) => (
                                                                <SelectItem
                                                                    key={attr.label}
                                                                    value={attr.label}
                                                                >
                                                                    {attr.label}
                                                                </SelectItem>
                                                            ))}
                                                        {attributes.filter(
                                                            (attr) => attr.unique && attr.required
                                                        ).length === 0 && (
                                                            <SelectItem value="name" disabled>
                                                                No unique attributes available
                                                            </SelectItem>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription>
                                                    This attribute will be used to uniquely identify
                                                    an entity. This value must reference an
                                                    attribute marked as "Unique", and must be a
                                                    Required field.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Description */}
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Describe what this entity type represents..."
                                                        rows={3}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Type */}
                                    <FormField
                                        control={form.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Type</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                    disabled={mode === "edit"}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="STANDARD">
                                                            Standard
                                                        </SelectItem>
                                                        <SelectItem value="RELATIONSHIP">
                                                            Relationship
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {mode === "edit" && (
                                                    <FormDescription>
                                                        Entity type cannot be changed after creation
                                                    </FormDescription>
                                                )}
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
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
                                    <Plus className="h-4 w-4 mr-2" />
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
                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <AlertCircle className="h-4 w-4 text-destructive" />
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
                                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                            ) : (
                                                <AlertCircle className="h-4 w-4 text-destructive" />
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
                                getRowId={(row) => row.key}
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
                                                handleDeleteField(row.key, row.type);
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
                    </TabsStandard>

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
            />
        </>
    );
};

// Alias export for backwards compatibility
export const EntityTypeForm = EntityTypeOverview;
