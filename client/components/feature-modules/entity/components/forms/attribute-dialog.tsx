"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DataFormat, DataType, EntityRelationshipCardinality } from "@/lib/types/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
    AttributeKey,
    AttributeTypeDropdown,
    attributeTypes,
} from "../../../../ui/attribute-type-dropdown";
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
    targetAttributeName: string | undefined;
}

// Zod schema
const formSchema = z.object({
    selectedType: z.nativeEnum(DataType).or(z.literal("RELATIONSHIP")),
    name: z.string().min(1, "Name is required"),
    key: z.string().min(1, "Key is required"),
    description: z.string().optional(),
    dataFormat: z.nativeEnum(DataFormat).optional(),
    required: z.boolean(),
    unique: z.boolean(),
    cardinality: z.nativeEnum(EntityRelationshipCardinality).optional(),
    minOccurs: z.coerce.number().min(0).optional(),
    maxOccurs: z.coerce.number().min(0).optional(),
    entityTypeKeys: z.array(z.string()).optional(),
    allowPolymorphic: z.boolean().optional(),
    bidirectional: z.boolean().optional(),
    inverseName: z.string().optional(),
    targetAttributeName: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export const AttributeDialog: FC<AttributeDialogProps> = ({
    open,
    onOpenChange,
    onSubmit,
    entityTypes = [],
    currentEntityType,
}) => {
    const [typePopoverOpen, setTypePopoverOpen] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            selectedType: DataType.STRING,
            name: "",
            key: "",
            description: "",
            required: false,
            unique: false,
            cardinality: EntityRelationshipCardinality.ONE_TO_ONE,
            minOccurs: undefined,
            maxOccurs: undefined,
            entityTypeKeys: [],
            allowPolymorphic: false,
            bidirectional: false,
            inverseName: "",
            targetAttributeName: undefined,
        },
    });

    const selectedType: AttributeKey = form.watch("selectedType");
    const isRelationship = selectedType === "RELATIONSHIP";

    // Reset form when dialog closes
    useEffect(() => {
        if (!open) {
            form.reset();
        }
    }, [open, form]);

    const handleFormSubmit = (values: FormValues) => {
        if (values.selectedType === "RELATIONSHIP") {
            const data: RelationshipFormData = {
                type: "relationship",
                name: values.name,
                key: values.key || values.name.toLowerCase().replace(/\s+/g, "_"),
                cardinality: values.cardinality || EntityRelationshipCardinality.ONE_TO_ONE,
                minOccurs: values.minOccurs,
                maxOccurs: values.maxOccurs,
                entityTypeKeys: values.entityTypeKeys || [],
                allowPolymorphic: values.allowPolymorphic || false,
                bidirectional: values.bidirectional || false,
                inverseName: values.inverseName,
                required: values.required || false,
                targetAttributeName: values.targetAttributeName || "",
            };
            onSubmit(data);
        } else {
            const selectedAttr = attributeTypes.find((attr) => attr.key === values.selectedType);
            const data: AttributeFormData = {
                type: "attribute",
                name: values.name,
                key: values.key || values.name.toLowerCase().replace(/\s+/g, "_"),
                description: values.description,
                dataType: selectedAttr?.type || (values.selectedType as DataType),
                dataFormat: selectedAttr?.format || values.dataFormat,
                required: values.required || false,
                unique: values.unique || false,
            };
            onSubmit(data);
        }
        form.reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full min-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create attribute</DialogTitle>
                    <DialogDescription>
                        Add a new attribute or relationship to your entity type
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="selectedType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Attribute Type</FormLabel>
                                    <AttributeTypeDropdown
                                        open={typePopoverOpen}
                                        setOpen={setTypePopoverOpen}
                                        value={selectedType}
                                        onChange={field.onChange}
                                    />

                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {!isRelationship && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter attribute name"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description (optional)</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Add a description for this attribute"
                                                    rows={3}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="required"
                                        render={({ field }) => (
                                            <>
                                                <FormItem className="flex items-center justify-between space-y-0 mb-1">
                                                    <FormLabel>Required</FormLabel>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                                <FormDescription className="text-xs italic">
                                                    Required attributes must have a value for each
                                                    record
                                                </FormDescription>
                                            </>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="unique"
                                        render={({ field }) => (
                                            <>
                                                <FormItem className="flex items-center justify-between space-y-0 mb-1">
                                                    <FormLabel>Unique</FormLabel>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                                <FormDescription className="text-xs italic">
                                                    Unique attributes enforce distinct values across
                                                    all records. There can be only one record with a
                                                    given value.
                                                </FormDescription>
                                            </>
                                        )}
                                    />
                                </div>
                            </>
                        )}

                        {isRelationship && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
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
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Associated attribute name</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="E.g. Person"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="flex items-center justify-center pt-8">
                                        <FormField
                                            control={form.control}
                                            name="cardinality"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="w-[200px]">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem
                                                                value={
                                                                    EntityRelationshipCardinality.ONE_TO_ONE
                                                                }
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
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                <FormField
                                    control={form.control}
                                    name="entityTypeKeys"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Target Entity Type</FormLabel>
                                            <Select
                                                onValueChange={(value) => field.onChange([value])}
                                                value={field.value?.[0]}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select entity type" />
                                                    </SelectTrigger>
                                                </FormControl>
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
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="targetAttributeName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Associated attribute name (other side)
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="E.g. Company" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="key"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Key</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="relationship_key"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="inverseName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Inverse Label (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Inverse relationship name"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="minOccurs"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Min Occurrences</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        placeholder="0"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="maxOccurs"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Max Occurrences</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        placeholder="Unlimited"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="bidirectional"
                                    render={({ field }) => (
                                        <FormItem className="rounded-lg border p-3">
                                            <div className="flex items-center justify-between space-y-0">
                                                <div className="space-y-1">
                                                    <FormLabel>Bidirectional</FormLabel>
                                                    <FormDescription>
                                                        Add this relationship to the other entity
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </div>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="allowPolymorphic"
                                    render={({ field }) => (
                                        <FormItem className="rounded-lg border p-3">
                                            <div className="flex items-center justify-between space-y-0">
                                                <div className="space-y-1">
                                                    <FormLabel>Allow any entity type</FormLabel>
                                                    <FormDescription>
                                                        Enable polymorphic relationships across all
                                                        entity types
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </div>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="required"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between space-y-0">
                                            <FormLabel>Required</FormLabel>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit">Create attribute</Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
