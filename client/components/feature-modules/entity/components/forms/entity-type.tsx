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
import { DataType, SchemaType } from "@/lib/types/types";
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
import type {
    AttributeFormData,
    EntityType,
    RelationshipFormData,
} from "../../interface/entity.interface";
import { AttributeDialog } from "./attribute-dialog";

interface EntityTypeFormProps {
    entityType?: EntityType;
    organisationId: string;
    mode: "create" | "edit" | "view";
}

interface RelationshipRow {
    name: string;
    key: string;
    cardinality: string;
    targetEntity: string;
    bidirectional: boolean;
    required: boolean;
    protected?: boolean;
}

export const EntityTypeOverview: FC<EntityTypeFormProps> = ({
    entityType,
    organisationId,
    mode,
}) => {
    const [order, setOrder] = useState<string[]>(entityType?.order || []);
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

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingAttribute, setEditingAttribute] = useState<
        AttributeFormData | RelationshipFormData | undefined
    >(undefined);
    const [newRelationships, setNewRelationships] = useState<RelationshipFormData[]>([]);

    // Fetch all entity types for relationship creation
    const { data: entityTypes = [] } = useEntityTypes(organisationId);

    // Watch the pluralName field for dynamic title
    const pluralName = form.watch("pluralName");

    // Determine which tabs have validation errors
    const tabErrors = useMemo(() => {
        const errors = form.formState.errors;
        const configurationFields = ["pluralName", "singularName", "key", "identifierKey", "description", "type"];

        const hasConfigurationErrors = configurationFields.some(field =>
            errors[field as keyof typeof errors]
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
                type: "attribute",
                name: "Name",
                key: SchemaType.TEXT,
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

    // Extract relationships and combine with new relationships
    const relationships: RelationshipRow[] = useMemo(() => {
        const existingRels: RelationshipRow[] = entityType?.relationships
            ? entityType.relationships.map((rel) => ({
                  name: rel.name,
                  key: rel.key,
                  cardinality: rel.cardinality,
                  targetEntity: rel.entityTypeKeys?.join(", ") || "Any",
                  bidirectional: rel.bidirectional,
                  required: rel.required,
                  protected: false,
              }))
            : [];

        const newRels: RelationshipRow[] = newRelationships.map((rel) => ({
            name: rel.name,
            key: rel.key,
            cardinality: rel.cardinality,
            targetEntity: rel.entityTypeKeys.join(", ") || "Any",
            bidirectional: rel.bidirectional,
            required: rel.required,
            protected: rel.protected || false,
        }));

        const allRels = [...existingRels, ...newRels];

        // Sort based on order array if it exists
        if (order.length > 0) {
            return allRels.sort((a, b) => {
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
        }

        return allRels;
    }, [entityType, newRelationships, order]);

    const relationshipColumns: ColumnDef<RelationshipRow>[] = useMemo(
        () => [
            {
                accessorKey: "name",
                header: "Name",
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{row.original.name}</span>
                    </div>
                ),
            },
            {
                accessorKey: "cardinality",
                header: "Cardinality",
                cell: ({ row }) => (
                    <Badge variant="outline">
                        {row.original.cardinality.replace(/_/g, " ").toLowerCase()}
                    </Badge>
                ),
            },
            {
                accessorKey: "targetEntity",
                header: "Target Entity",
                cell: ({ row }) => <span>{row.original.targetEntity}</span>,
            },
            {
                accessorKey: "bidirectional",
                header: "Bidirectional",
                cell: ({ row }) => (
                    <Badge variant={row.original.bidirectional ? "default" : "secondary"}>
                        {row.original.bidirectional ? "Yes" : "No"}
                    </Badge>
                ),
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
        ],
        []
    );

    const handleSubmit = (values: EntityTypeFormValues) => {
        handleFormSubmit(values, attributes, newRelationships, order);
    };

    const handleInvalidSubmit = (errors: typeof form.formState.errors) => {
        const errorMessages: string[] = [];

        // Collect all error messages
        Object.entries(errors).forEach(([field, error]) => {
            if (error && typeof error === 'object' && 'message' in error) {
                const fieldName = field.replace(/([A-Z])/g, ' $1').toLowerCase();
                errorMessages.push(`${fieldName}: ${error.message}`);
            }
        });

        // Show toast with all validation errors
        toast.error("Validation errors", {
            description: errorMessages.length > 0
                ? errorMessages.join("\n")
                : "Please check all required fields and try again.",
        });
    };

    const handleSaveClick = () => {
        form.handleSubmit(handleSubmit, handleInvalidSubmit)();
    };

    const handleAttributeSubmit = (data: AttributeFormData | RelationshipFormData) => {
        if (editingAttribute) {
            // Update existing attribute/relationship
            if (data.type === "attribute") {
                handleAttributeEdit(data);
            } else {
                setNewRelationships((prev) =>
                    prev.map((rel) => (rel.key === data.key ? data : rel))
                );
            }
        } else {
            // Add new attribute/relationship
            if (data.type === "attribute") {
                handleAttributeAdd(data);
            } else {
                setNewRelationships((prev) => [...prev, data]);
                // Add to order array
                setOrder((prev) => [...prev, data.key]);
            }
        }

        // Close dialog after state updates - this ensures proper cleanup
        setDialogOpen(false);
        setEditingAttribute(undefined);
    };

    const handleDeleteRelationship = (key: string) => {
        const relationship = newRelationships.find((rel) => rel.key === key);
        if (relationship?.protected) {
            // Show error or toast - relationship is protected
            toast.error("This relationship is protected and cannot be deleted.");
            return;
        }
        setNewRelationships((prev) => prev.filter((rel) => rel.key !== key));
        // Remove from order array
        setOrder((prev) => prev.filter((orderKey) => orderKey !== key));
    };

    const handleEditAttribute = (row: AttributeFormData) => {
        // Find the attribute in attributes
        const attribute = attributes.find((attr) => attr.name === row.name);
        if (attribute) {
            setEditingAttribute(attribute);
            setDialogOpen(true);
        }
    };

    const handleEditRelationship = (row: RelationshipRow) => {
        // Find the relationship in newRelationships
        const relationship = newRelationships.find((rel) => rel.key === row.key);
        if (relationship) {
            setEditingAttribute(relationship);
            setDialogOpen(true);
        }
    };

    const handleRelationshipsReorder = (reorderedRelationships: RelationshipRow[]) => {
        // Get keys for reordered relationships
        const relationshipKeys = reorderedRelationships.map((rel) => rel.key);

        // Get attribute keys from current attributes
        const attributeKeys = attributes.map((attr) => attr.key);

        // Combine: attributes first, then relationships
        const newOrder = [...attributeKeys, ...relationshipKeys];
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
                                <Save className="h-4 w-4 mr-2" />
                                Save
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
                                    {(attributes.length > 0 || relationships.length > 0) && (
                                        <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                                            {attributes.length + relationships.length}
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
                                                                    key={attr.name}
                                                                    value={attr.name}
                                                                >
                                                                    {attr.name}
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
                                            {newRelationships.length >= 2 ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                            ) : (
                                                <AlertCircle className="h-4 w-4 text-destructive" />
                                            )}
                                            <span
                                                className={
                                                    newRelationships.length >= 2
                                                        ? "text-green-600"
                                                        : "text-destructive"
                                                }
                                            >
                                                Minimum 2 relationships ({newRelationships.length}
                                                /2)
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <DataTable
                                columns={attributeColumns}
                                data={attributes}
                                enableSorting
                                enableDragDrop
                                onReorder={handleAttributesReorder}
                                getRowId={(row) => row.key}
                                search={{
                                    enabled: true,
                                    searchableColumns: ["name"],
                                    placeholder: "Search attributes...",
                                }}
                                filter={{
                                    enabled: true,
                                    filters: [
                                        {
                                            column: "required",
                                            type: "boolean",
                                            label: "Required",
                                        },
                                        {
                                            column: "unique",
                                            type: "boolean",
                                            label: "Unique",
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
                                                handleEditAttribute(row);
                                            },
                                        },
                                        {
                                            label: "Delete",
                                            icon: Trash2,
                                            onClick: (row) => {
                                                handleAttributeDelete(row.name);
                                            },
                                            variant: "destructive",
                                            disabled: (row) => row?.protected || false,
                                        },
                                    ],
                                }}
                                emptyMessage="No attributes defined yet. Add your first attribute to get started."
                                className="border rounded-md"
                            />

                            {/* Relationships Section */}
                            {relationships.length > 0 && (
                                <div className="mt-8 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-md font-semibold">Relationships</h3>
                                    </div>
                                    <DataTable
                                        columns={relationshipColumns}
                                        data={relationships}
                                        enableSorting
                                        enableDragDrop
                                        onReorder={handleRelationshipsReorder}
                                        getRowId={(row) => row.key}
                                        search={{
                                            enabled: true,
                                            searchableColumns: ["name"],
                                            placeholder: "Search relationships...",
                                        }}
                                        rowActions={{
                                            enabled: true,
                                            menuLabel: "Actions",
                                            actions: [
                                                {
                                                    label: "Edit",
                                                    icon: Edit2,
                                                    onClick: (row) => {
                                                        handleEditRelationship(row);
                                                    },
                                                },
                                                {
                                                    label: "Delete",
                                                    icon: Trash2,
                                                    onClick: (row) => {
                                                        handleDeleteRelationship(row.key);
                                                    },
                                                    variant: "destructive",
                                                    disabled: (row) => row?.protected || false,
                                                },
                                            ],
                                        }}
                                        emptyMessage="No relationships defined."
                                        className="border rounded-md"
                                    />
                                </div>
                            )}
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
            />
        </>
    );
};

// Alias export for backwards compatibility
export const EntityTypeForm = EntityTypeOverview;
