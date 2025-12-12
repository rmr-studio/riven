"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Schema, SchemaOptions } from "@/lib/interfaces/common.interface";
import { DataFormat, DataType, EntityRelationshipCardinality } from "@/lib/types/types";
import {
    Calendar,
    CheckSquare,
    Clock,
    Code,
    DollarSign,
    Hash,
    Info,
    Link,
    List,
    ListChecks,
    MapPin,
    Paperclip,
    Percent,
    Stars,
    Type,
} from "lucide-react";
import { FC, useState } from "react";
import { EntityType } from "../../interface/entity.interface";

interface AttributeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (attribute: AttributeFormData | RelationshipFormData) => void;
    entityTypes?: EntityType[];
    currentEntityType?: EntityType;
}

export interface AttributeFormData {
    type: "attribute";
    name: string;
    key: string;
    description?: string;
    dataType: DataType;
    dataFormat?: DataFormat;
    required: boolean;
    unique: boolean;
}

export interface RelationshipFormData {
    type: "relationship";
    name: string;
    key: string;
    cardinality: EntityRelationshipCardinality;
    minOccurs?: number;
    maxOccurs?: number;
    entityTypeKeys: string[];
    allowPolymorphic: boolean;
    bidirectional: boolean;
    inverseName?: string;
    required: boolean;
    targetAttributeName: string;
}

type FormState = {
    name?: string;
    key?: string;
    description?: string;
    dataType?: DataType;
    dataFormat?: DataFormat;
    required?: boolean;
    unique?: boolean;
    cardinality?: EntityRelationshipCardinality;
    minOccurs?: number;
    maxOccurs?: number;
    entityTypeKeys?: string[];
    allowPolymorphic?: boolean;
    bidirectional?: boolean;
    inverseName?: string;
    targetAttributeName?: string;
};

interface AttributeSchemaType {
    label: string;
    key: string;
    type: DataType;
    format?: DataFormat;
    options?: SchemaOptions;
    icon: FC<React.SVGProps<SVGSVGElement>>;
    schemaBuilder?: (schema: Schema, config: any) => Schema;
}

type AttributeTypeOption = DataType | "RELATIONSHIP";

export const AttributeDialog: FC<AttributeDialogProps> = ({
    open,
    onOpenChange,
    onSubmit,
    entityTypes = [],
    currentEntityType,
}) => {
    const [selectedType, setSelectedType] = useState<AttributeTypeOption>(DataType.STRING);
    const [formData, setFormData] = useState<FormState>({
        required: false,
        unique: false,
        bidirectional: false,
        allowPolymorphic: false,
        dataType: DataType.STRING,
        cardinality: EntityRelationshipCardinality.ONE_TO_ONE,
        entityTypeKeys: [],
    });

    const handleSubmit = () => {
        const isRelationship = selectedType === "RELATIONSHIP";

        if (!isRelationship) {
            const data: AttributeFormData = {
                type: "attribute",
                name: formData.name!,
                key: formData.key || formData.name?.toLowerCase().replace(/\s+/g, "_") || "",
                description: formData.description,
                dataType: selectedType as DataType,
                dataFormat: formData.dataFormat,
                required: formData.required!,
                unique: formData.unique!,
            };
            onSubmit(data);
        } else {
            const data: RelationshipFormData = {
                type: "relationship",
                name: formData.name!,
                key: formData.key || formData.name?.toLowerCase().replace(/\s+/g, "_") || "",
                cardinality: formData.cardinality!,
                minOccurs: formData.minOccurs,
                maxOccurs: formData.maxOccurs,
                entityTypeKeys: formData.entityTypeKeys!,
                allowPolymorphic: formData.allowPolymorphic!,
                bidirectional: formData.bidirectional!,
                inverseName: formData.inverseName,
                required: formData.required!,
                targetAttributeName: formData.targetAttributeName || "",
            };
            onSubmit(data);
        }
        handleReset();
    };

    const handleReset = () => {
        setSelectedType(DataType.STRING);
        setFormData({
            required: false,
            unique: false,
            bidirectional: false,
            allowPolymorphic: false,
            dataType: DataType.STRING,
            cardinality: EntityRelationshipCardinality.ONE_TO_ONE,
            entityTypeKeys: [],
        });
        onOpenChange(false);
    };

    const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const isRelationship = selectedType === "RELATIONSHIP";

    const attributeTypes: AttributeSchemaType[] = [
        { label: "Text", key: "text", type: DataType.STRING, icon: Type },
        { label: "Number", key: "number", type: DataType.NUMBER, icon: Hash },
        { label: "Checkbox", key: "checkbox", type: DataType.BOOLEAN, icon: CheckSquare },
        {
            label: "Date",
            key: "date",
            type: DataType.STRING,
            format: DataFormat.DATE,
            icon: Calendar,
        },
        {
            label: "DateTime",
            key: "datetime",
            type: DataType.STRING,
            format: DataFormat.DATETIME,
            icon: Clock,
        },
        {
            label: "Rating",
            key: "rating",
            type: DataType.NUMBER,
            options: {
                minimum: 1,
                maximum: 5,
            },
            icon: Stars,
        },
        {
            label: "Phone",
            key: "phone",
            type: DataType.STRING,
            format: DataFormat.PHONE,
            icon: Link,
        },
        {
            label: "Email",
            key: "email",
            type: DataType.STRING,
            format: DataFormat.EMAIL,
            icon: Link,
        },
        { label: "URL", key: "url", type: DataType.STRING, format: DataFormat.URL, icon: Link },
        {
            label: "Currency",
            key: "currency",
            type: DataType.NUMBER,
            format: DataFormat.CURRENCY,
            icon: DollarSign,
        },
        {
            label: "Percentage",
            key: "percentage",
            type: DataType.NUMBER,
            format: DataFormat.PERCENTAGE,
            icon: Percent,
        },
        {
            label: "Select",
            key: "select",
            type: DataType.STRING,
            icon: List,
            schemaBuilder: (schema: Schema, config: string[]) => ({
                ...schema,
                options: {
                    ...schema.options,
                    enum: config,
                },
            }),
        },
        {
            label: "Multi-select",
            type: DataType.ARRAY,
            key: "multi_select",
            icon: ListChecks,
            schemaBuilder: (schema: Schema, config: string[]) => ({
                ...schema,
                items: {
                    name: "option",
                    description: "Select options",
                    type: DataType.STRING,
                    options: {
                        enum: config,
                    },
                    required: true,
                    unique: true,
                    protected: false,
                },
            }),
        },
        { label: "File Attachments", key: "attachments", type: DataType.ARRAY, icon: Paperclip },
        { label: "JSON Data", key: "json_data", type: DataType.OBJECT, icon: Code },
        {
            label: "Location",
            key: "location",
            type: DataType.OBJECT,
            icon: MapPin,
            schemaBuilder: (schema: Schema, _: unknown) => ({
                ...schema,
                type: DataType.OBJECT,
                properties: {
                    latitude: { name: "latitude", type: DataType.NUMBER, required: true },
                    longitude: { name: "longitude", type: DataType.NUMBER, required: true },
                    address: { name: "address", type: DataType.STRING },
                    placeId: { name: "placeId", type: DataType.STRING },
                },
            }),
        },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create attribute</DialogTitle>
                    <DialogDescription>
                        Add a new attribute or relationship to your entity type
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Combined Type Selector */}
                    <div className="space-y-2">
                        <Label>Attribute Type</Label>
                        <Select
                            value={selectedType}
                            onValueChange={(value) => setSelectedType(value as AttributeTypeOption)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {allTypeOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        <div className="flex items-center gap-2">
                                            <option.icon className="h-4 w-4" />
                                            <span>{option.label}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Standard Attribute Form */}
                    {!isRelationship && (
                        <>
                            {/* Data Format (conditional) */}
                            {selectedType === DataType.STRING && (
                                <div className="space-y-2">
                                    <Label>Format (Optional)</Label>
                                    <Select
                                        value={formData.dataFormat || ""}
                                        onValueChange={(value) =>
                                            updateField(
                                                "dataFormat",
                                                (value || undefined) as DataFormat | undefined
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select format" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {dataFormatOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Name */}
                            <div className="space-y-2">
                                <Label htmlFor="attr-name">Name</Label>
                                <Input
                                    id="attr-name"
                                    value={formData.name || ""}
                                    onChange={(e) => updateField("name", e.target.value)}
                                    placeholder="Enter attribute name"
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="attr-description">Description (optional)</Label>
                                <Textarea
                                    id="attr-description"
                                    value={formData.description || ""}
                                    onChange={(e) => updateField("description", e.target.value)}
                                    placeholder="Add a description for this attribute"
                                    rows={3}
                                />
                            </div>

                            {/* Required & Unique */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="attr-required">Required</Label>
                                    <Switch
                                        id="attr-required"
                                        checked={formData.required}
                                        onCheckedChange={(checked) =>
                                            updateField("required", checked)
                                        }
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="attr-unique">Unique</Label>
                                    <Switch
                                        id="attr-unique"
                                        checked={formData.unique}
                                        onCheckedChange={(checked) =>
                                            updateField("unique", checked)
                                        }
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Relationship Form */}
                    {isRelationship && (
                        <>
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                                <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                    Changes on one side of the relationship will be reflected on the
                                    other side as well.{" "}
                                    <a href="#" className="text-primary hover:underline">
                                        Learn more about attributes
                                    </a>
                                </p>
                            </div>

                            {/* Configure relationship */}
                            <div className="space-y-4">
                                <Label>Configure relationship</Label>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Source Entity */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 p-3 rounded-lg border bg-card">
                                            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10">
                                                <span className="text-xs font-semibold">
                                                    {currentEntityType?.name?.charAt(0) || "E"}
                                                </span>
                                            </div>
                                            <span className="font-medium">
                                                {currentEntityType?.name || "Current Entity"}
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="source-attr">
                                                Associated attribute name
                                            </Label>
                                            <Input
                                                id="source-attr"
                                                value={formData.name || ""}
                                                onChange={(e) =>
                                                    updateField("name", e.target.value)
                                                }
                                                placeholder="E.g. Person"
                                            />
                                        </div>
                                    </div>

                                    {/* Cardinality */}
                                    <div className="flex items-center justify-center">
                                        <Select
                                            value={formData.cardinality}
                                            onValueChange={(value) =>
                                                updateField(
                                                    "cardinality",
                                                    value as EntityRelationshipCardinality
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-[200px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem
                                                    value={EntityRelationshipCardinality.ONE_TO_ONE}
                                                >
                                                    One to one
                                                </SelectItem>
                                                <SelectItem
                                                    value={
                                                        EntityRelationshipCardinality.ONE_TO_MANY
                                                    }
                                                >
                                                    One to many
                                                </SelectItem>
                                                <SelectItem
                                                    value={
                                                        EntityRelationshipCardinality.MANY_TO_ONE
                                                    }
                                                >
                                                    Many to one
                                                </SelectItem>
                                                <SelectItem
                                                    value={
                                                        EntityRelationshipCardinality.MANY_TO_MANY
                                                    }
                                                >
                                                    Many to many
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Target Entity */}
                                    <div className="space-y-2 col-span-2">
                                        <Label>Target Entity Type</Label>
                                        <Select
                                            value={formData.entityTypeKeys?.[0] || ""}
                                            onValueChange={(value) =>
                                                updateField("entityTypeKeys", [value])
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select entity type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {entityTypes.map((et) => (
                                                    <SelectItem key={et.key} value={et.key}>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10">
                                                                <span className="text-xs">
                                                                    {et.name.charAt(0)}
                                                                </span>
                                                            </div>
                                                            <span>{et.name}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Target Attribute Name */}
                                    <div className="space-y-2 col-span-2">
                                        <Label htmlFor="target-attr">
                                            Associated attribute name (other side)
                                        </Label>
                                        <Input
                                            id="target-attr"
                                            value={formData.targetAttributeName || ""}
                                            onChange={(e) =>
                                                updateField("targetAttributeName", e.target.value)
                                            }
                                            placeholder="E.g. Company"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Relationship Key & Label */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="rel-key">Key</Label>
                                    <Input
                                        id="rel-key"
                                        value={formData.key || ""}
                                        onChange={(e) => updateField("key", e.target.value)}
                                        placeholder="relationship_key"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="rel-inverse">Inverse Label (Optional)</Label>
                                    <Input
                                        id="rel-inverse"
                                        value={formData.inverseName || ""}
                                        onChange={(e) => updateField("inverseName", e.target.value)}
                                        placeholder="Inverse relationship name"
                                    />
                                </div>
                            </div>

                            {/* Min/Max Occurrences */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="min-occurs">Min Occurrences</Label>
                                    <Input
                                        id="min-occurs"
                                        type="number"
                                        min={0}
                                        value={formData.minOccurs || ""}
                                        onChange={(e) =>
                                            updateField(
                                                "minOccurs",
                                                parseInt(e.target.value) || undefined
                                            )
                                        }
                                        placeholder="0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="max-occurs">Max Occurrences</Label>
                                    <Input
                                        id="max-occurs"
                                        type="number"
                                        min={0}
                                        value={formData.maxOccurs || ""}
                                        onChange={(e) =>
                                            updateField(
                                                "maxOccurs",
                                                parseInt(e.target.value) || undefined
                                            )
                                        }
                                        placeholder="Unlimited"
                                    />
                                </div>
                            </div>

                            {/* Bidirectional Toggle */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="bidirectional">Bidirectional</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Add this relationship to the other entity
                                        </p>
                                    </div>
                                    <Switch
                                        id="bidirectional"
                                        checked={formData.bidirectional}
                                        onCheckedChange={(checked) =>
                                            updateField("bidirectional", checked)
                                        }
                                    />
                                </div>
                            </div>

                            {/* Polymorphic Options */}
                            <div className="space-y-2">
                                <Label>Polymorphic Relationship</Label>
                                <div className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="polymorphic">Allow any entity type</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Enable polymorphic relationships across all entity types
                                        </p>
                                    </div>
                                    <Switch
                                        id="polymorphic"
                                        checked={formData.allowPolymorphic}
                                        onCheckedChange={(checked) =>
                                            updateField("allowPolymorphic", checked)
                                        }
                                    />
                                </div>
                            </div>

                            {/* Required */}
                            <div className="flex items-center justify-between">
                                <Label htmlFor="rel-required">Required</Label>
                                <Switch
                                    id="rel-required"
                                    checked={formData.required}
                                    onCheckedChange={(checked) => updateField("required", checked)}
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={handleReset}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!formData.name}>
                        Create attribute
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
