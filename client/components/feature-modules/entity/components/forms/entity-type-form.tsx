"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { TabsContent, TabsList, TabsStandard, TabsTrigger } from "@/components/ui/tabs-standard";
import { Textarea } from "@/components/ui/textarea";
import { ColumnDef } from "@tanstack/react-table";
import { Database, Edit2, Link2, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { FC, useMemo, useState } from "react";
import { useEntityTypes } from "../../hooks/use-entity-types";
import { EntityType } from "../../interface/entity.interface";
import {
    AttributeDialog,
    AttributeFormData,
    RelationshipFormData,
} from "./attribute-dialog";

interface EntityTypeFormProps {
    entityType?: EntityType;
    organisationId: string;
    mode: "create" | "edit";
}

interface AttributeRow {
    name: string;
    type: string;
    required: boolean;
    unique: boolean;
    description?: string;
    dataFormat?: string;
    isRelationship?: boolean;
}

interface RelationshipRow {
    name: string;
    key: string;
    cardinality: string;
    targetEntity: string;
    bidirectional: boolean;
    required: boolean;
}

export const EntityTypeForm: FC<EntityTypeFormProps> = ({ entityType, organisationId, mode }) => {
    const [formData, setFormData] = useState({
        key: entityType?.key ?? "",
        name: entityType?.name ?? "",
        identifierKey: entityType?.identifierKey ?? "",
        description: entityType?.description ?? "",
        type: entityType?.type ?? "STANDARD",
        icon: "database",
    });

    const [dialogOpen, setDialogOpen] = useState(false);
    const [newAttributes, setNewAttributes] = useState<AttributeFormData[]>([]);
    const [newRelationships, setNewRelationships] = useState<RelationshipFormData[]>([]);

    // Fetch all entity types for relationship creation
    const { data: entityTypes = [] } = useEntityTypes(organisationId);

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
              }))
            : [];

        const newAttrs: AttributeRow[] = newAttributes.map((attr) => ({
            name: attr.name,
            type: attr.dataType,
            required: attr.required,
            unique: attr.unique,
            description: attr.description,
            dataFormat: attr.dataFormat,
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
              }))
            : [];

        const newRels: RelationshipRow[] = newRelationships.map((rel) => ({
            name: rel.name,
            key: rel.key,
            cardinality: rel.cardinality,
            targetEntity: rel.entityTypeKeys.join(", ") || "Any",
            bidirectional: rel.bidirectional,
            required: rel.required,
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
                cell: ({ row }) => (
                    <Badge variant="outline">{row.original.type}</Badge>
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Implement save functionality
        console.log("Form data:", formData);
        console.log("New attributes:", newAttributes);
        console.log("New relationships:", newRelationships);
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleAttributeSubmit = (data: AttributeFormData | RelationshipFormData) => {
        if (data.type === "attribute") {
            setNewAttributes((prev) => [...prev, data]);
        } else {
            setNewRelationships((prev) => [...prev, data]);
        }
        setDialogOpen(false);
    };

    const handleDeleteAttribute = (name: string) => {
        setNewAttributes((prev) => prev.filter((attr) => attr.name !== name));
    };

    const handleDeleteRelationship = (key: string) => {
        setNewRelationships((prev) => prev.filter((rel) => rel.key !== key));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Database className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold">
                            {mode === "create" ? "New Entity Type" : entityType?.name}
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
                    <Button onClick={handleSubmit}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                    </Button>
                </div>
            </div>

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
                        <p className="text-sm text-muted-foreground mb-6">
                            Set words to describe a single and multiple objects of this type
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                {/* Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">Singular noun</Label>
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                                            <Database className="h-4 w-4 text-primary" />
                                        </div>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => handleInputChange("name", e.target.value)}
                                            placeholder="e.g., Company"
                                        />
                                    </div>
                                </div>

                                {/* Plural Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="pluralName">Plural noun</Label>
                                    <Input
                                        id="pluralName"
                                        value={`${formData.name}s`}
                                        placeholder="e.g., Companies"
                                        disabled
                                    />
                                </div>
                            </div>

                            {/* Key / Slug */}
                            <div className="space-y-2">
                                <Label htmlFor="key">Identifier / Slug</Label>
                                <Input
                                    id="key"
                                    value={formData.key}
                                    onChange={(e) => handleInputChange("key", e.target.value)}
                                    placeholder="e.g., companies"
                                    disabled={mode === "edit" && entityType?.protected}
                                />
                                {mode === "edit" && entityType?.protected && (
                                    <p className="text-xs text-muted-foreground">
                                        You can't change the slug for standard objects
                                    </p>
                                )}
                            </div>

                            {/* Identifier Key */}
                            <div className="space-y-2">
                                <Label htmlFor="identifierKey">Identifier Key</Label>
                                <Select
                                    value={formData.identifierKey}
                                    onValueChange={(value) => handleInputChange("identifierKey", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select which attribute should be the display attribute" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {attributes.map((attr) => (
                                            <SelectItem key={attr.name} value={attr.name}>
                                                {attr.name}
                                            </SelectItem>
                                        ))}
                                        {attributes.length === 0 && (
                                            <SelectItem value="name">name</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    This attribute will be used as the display name for entities
                                </p>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => handleInputChange("description", e.target.value)}
                                    placeholder="Describe what this entity type represents..."
                                    rows={3}
                                />
                            </div>

                            {/* Type */}
                            <div className="space-y-2">
                                <Label htmlFor="type">Type</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value) => handleInputChange("type", value)}
                                    disabled={mode === "edit"}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="STANDARD">Standard</SelectItem>
                                        <SelectItem value="RELATIONSHIP">Relationship</SelectItem>
                                    </SelectContent>
                                </Select>
                                {mode === "edit" && (
                                    <p className="text-xs text-muted-foreground">
                                        Entity type cannot be changed after creation
                                    </p>
                                )}
                            </div>
                        </form>
                    </div>
                </TabsContent>

                {/* Attributes Tab */}
                <TabsContent value="attributes" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">Attributes & Relationships</h2>
                            <p className="text-sm text-muted-foreground">
                                Manage the fields and relationships for this entity type
                            </p>
                        </div>
                        <Button onClick={() => setDialogOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Attribute
                        </Button>
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
                                        console.log("Edit attribute:", row);
                                    },
                                },
                                {
                                    label: "Delete",
                                    icon: Trash2,
                                    onClick: (row) => {
                                        handleDeleteAttribute(row.name);
                                    },
                                    variant: "destructive",
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
                                                console.log("Edit relationship:", row);
                                            },
                                        },
                                        {
                                            label: "Delete",
                                            icon: Trash2,
                                            onClick: (row) => {
                                                handleDeleteRelationship(row.key);
                                            },
                                            variant: "destructive",
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
            <AttributeDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleAttributeSubmit}
                entityTypes={entityTypes}
                currentEntityType={entityType}
            />
        </div>
    );
};
