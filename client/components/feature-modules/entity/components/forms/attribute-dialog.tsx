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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DataFormat, DataType, EntityRelationshipCardinality } from "@/lib/types/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AttributeTypeDropdown, attributeTypes } from "../../../../ui/attribute-type-dropdown";
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
    selectedType: z.string(),
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

    const selectedType: string = form.watch("selectedType");
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
                                        attributeKey={selectedType}
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
