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
import { DataType } from "@/lib/types/types";
import { toKeyCase } from "@/lib/util/utils";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { FC, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEntityTypes } from "../../hooks/use-entity-types";
import { EntityType } from "../../interface/entity.interface";
import { AttributeDialog, AttributeFormData, RelationshipFormData } from "./attribute-dialog";

interface EntityTypeFormProps {
    entityType?: EntityType;
    organisationId: string;
    mode: "create" | "edit" | "view";
}

interface AttributeRow {
    name: string;
    type: string;
    required: boolean;
    unique: boolean;
    description?: string;
    dataFormat?: string;
    isRelationship?: boolean;
    protected?: boolean;
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

// Zod schema for entity type form
const entityTypeFormSchema = z.object({
    key: z.string().min(1, "Key is required"),
    singularName: z.string().min(1, "Singular variant of the name is required"),
    pluralName: z.string().min(1, "Plural variant of the name is required"),
    identifierKey: z.string().optional(),
    description: z.string().optional(),
    type: z.enum(["STANDARD", "RELATIONSHIP"]),
    icon: z.string().optional(),
});

type EntityTypeFormValues = z.infer<typeof entityTypeFormSchema>;

export const EntityTypeOverview: FC<EntityTypeFormProps> = ({
    entityType,
    organisationId,
    mode,
}) => {
    const form = useForm<EntityTypeFormValues>({
        resolver: zodResolver(entityTypeFormSchema),
        defaultValues: {
            key: entityType?.key ?? "",
            singularName: entityType?.name.singular ?? "",
            pluralName: entityType?.name.plural ?? "",
            identifierKey: entityType?.identifierKey ?? "",
            description: entityType?.description ?? "",
            type: entityType?.type ?? "STANDARD",
            icon: "database",
        },
    });

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingAttribute, setEditingAttribute] = useState<
        AttributeFormData | RelationshipFormData | undefined
    >(undefined);
    const [newAttributes, setNewAttributes] = useState<AttributeFormData[]>([]);
    const [newRelationships, setNewRelationships] = useState<RelationshipFormData[]>([]);
    const [keyManuallyEdited, setKeyManuallyEdited] = useState(mode === "edit");

    // Fetch all entity types for relationship creation
    const { data: entityTypes = [] } = useEntityTypes(organisationId);

    // Watch the pluralName field for dynamic title and key generation
    const pluralName = form.watch("pluralName");

    // Auto-generate default "name" attribute for new entity types
    useEffect(() => {
        if (mode === "create" && newAttributes.length === 0) {
            const defaultNameAttribute: AttributeFormData = {
                type: "attribute",
                name: "Name",
                key: "name",
                description: "The name of this entity",
                dataType: DataType.STRING,
                required: true,
                unique: true,
                protected: true,
            };
            setNewAttributes([defaultNameAttribute]);
        }
    }, [mode, newAttributes.length]);

    // Auto-generate key from pluralName in create mode
    useEffect(() => {
        if (mode === "create" && !keyManuallyEdited && pluralName) {
            const generatedKey = toKeyCase(pluralName);
            form.setValue("key", generatedKey, { shouldValidate: false });
        }
    }, [pluralName, mode, keyManuallyEdited, form]);

    // Extract attributes from schema and combine with new attributes
    const attributes: AttributeRow[] = useMemo(() => {
        const existingAttrs: AttributeRow[] = entityType?.schema?.properties
            ? Object.entries(entityType.schema.properties).map(([name, schema]) => ({
                  name,
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

        return [...existingAttrs, ...newAttrs];
    }, [entityType, newAttributes]);

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
                  protected: rel.protected || false,
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

        return [...existingRels, ...newRels];
    }, [entityType, newRelationships]);

    const attributeColumns: ColumnDef<AttributeRow>[] = useMemo(
        () => [
            {
                accessorKey: "name",
                header: "Name",
                cell: ({ row }) => (
                    <div className="flex flex-col">
                        <span className="font-medium">{row.original.name}</span>
                        {row.original.description && (
                            <span className="text-xs text-muted-foreground">
                                {row.original.description}
                            </span>
                        )}
                    </div>
                ),
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
        ],
        []
    );

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
        // Validation: At least one unique attribute must exist
        const hasUniqueAttribute = newAttributes.some((attr) => attr.unique);
        if (!hasUniqueAttribute) {
            form.setError("root", {
                type: "manual",
                message: "At least one attribute must be marked as unique",
            });
            return;
        }

        // Validation: Identifier key must reference a unique attribute
        if (values.identifierKey) {
            const identifierAttribute = newAttributes.find(
                (attr) => attr.name === values.identifierKey
            );
            if (identifierAttribute && !identifierAttribute.unique) {
                form.setError("identifierKey", {
                    type: "manual",
                    message: "The identifier key must reference a unique attribute",
                });
                return;
            }
        }

        // Validation: Relationship type entities must have at least 2 relationships
        if (values.type === "RELATIONSHIP" && newRelationships.length < 2) {
            form.setError("root", {
                type: "manual",
                message:
                    "Entity types with 'Relationship' type must have at least 2 relationships defined",
            });
            return;
        }

        // Clear any previous errors
        form.clearErrors();

        // TODO: Implement save functionality
        console.log("Form data:", values);
        console.log("New attributes:", newAttributes);
        console.log("New relationships:", newRelationships);
    };

    const handleAttributeSubmit = (data: AttributeFormData | RelationshipFormData) => {
        if (editingAttribute) {
            // Update existing attribute/relationship
            if (data.type === "attribute") {
                setNewAttributes((prev) =>
                    prev.map((attr) => (attr.key === data.key ? data : attr))
                );
            } else {
                setNewRelationships((prev) =>
                    prev.map((rel) => (rel.key === data.key ? data : rel))
                );
            }
        } else {
            // Add new attribute/relationship
            if (data.type === "attribute") {
                setNewAttributes((prev) => [...prev, data]);
            } else {
                setNewRelationships((prev) => [...prev, data]);
            }
        }

        // Close dialog after state updates - this ensures proper cleanup

        setDialogOpen(false);
        setEditingAttribute(undefined);
    };

    const handleDeleteAttribute = (name: string) => {
        const attribute = newAttributes.find((attr) => attr.name === name);
        if (attribute?.protected) {
            // Show error or toast - attribute is protected
            alert("This attribute is protected and cannot be deleted.");
            return;
        }
        setNewAttributes((prev) => prev.filter((attr) => attr.name !== name));
    };

    const handleDeleteRelationship = (key: string) => {
        const relationship = newRelationships.find((rel) => rel.key === key);
        if (relationship?.protected) {
            // Show error or toast - relationship is protected
            alert("This relationship is protected and cannot be deleted.");
            return;
        }
        setNewRelationships((prev) => prev.filter((rel) => rel.key !== key));
    };

    const handleEditAttribute = (row: AttributeRow) => {
        // Find the attribute in newAttributes
        const attribute = newAttributes.find((attr) => attr.name === row.name);
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
                            <Button onClick={form.handleSubmit(handleSubmit)}>
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
                            <TabsTrigger value="configuration">Configuration</TabsTrigger>
                            <TabsTrigger value="attributes">
                                Attributes
                                {(attributes.length > 0 || relationships.length > 0) && (
                                    <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                                        {attributes.length + relationships.length}
                                    </Badge>
                                )}
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
                                                        {attributes.filter((attr) => attr.unique)
                                                            .length === 0 && (
                                                            <SelectItem value="name" disabled>
                                                                No unique attributes available
                                                            </SelectItem>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription>
                                                    This attribute will be used as the display name
                                                    for entities. Must be a unique attribute.
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
                                        {newAttributes.some((attr) => attr.unique) ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <AlertCircle className="h-4 w-4 text-destructive" />
                                        )}
                                        <span
                                            className={
                                                newAttributes.some((attr) => attr.unique)
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
                                                handleDeleteAttribute(row.name);
                                            },
                                            variant: "destructive",
                                            disabled: (row) => row.protected || false,
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
                                                    disabled: (row) => row.protected || false,
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
