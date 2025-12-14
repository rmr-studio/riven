"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SchemaOptions } from "@/lib/interfaces/common.interface";
import {
    DataFormat,
    DataType,
    EntityRelationshipCardinality,
    OptionSortingType,
} from "@/lib/types/types";
import { toKeyCase } from "@/lib/util/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AttributeTypeDropdown, attributeTypes } from "../../../../ui/attribute-type-dropdown";
import type {
    AttributeFormData,
    RelationshipFormData,
} from "../../interface/entity-type.interface";
import { EntityType } from "../../interface/entity.interface";
import { AttributeForm } from "./attribute-form";
import { RelationshipAttributeForm } from "./attributes-relationship-form";

interface AttributeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (attribute: AttributeFormData | RelationshipFormData) => void;
    entityTypes?: EntityType[];
    currentEntityType?: EntityType;
    editingAttribute?: AttributeFormData | RelationshipFormData;
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
    // Schema options
    enumValues: z.array(z.string()).optional(),
    enumSorting: z.nativeEnum(OptionSortingType).optional(),
    minimum: z.coerce.number().optional(),
    maximum: z.coerce.number().optional(),
    minLength: z.coerce.number().min(0).optional(),
    maxLength: z.coerce.number().min(0).optional(),
    regex: z.string().optional(),
});

export type AttributeFormValues = z.infer<typeof formSchema>;

export const AttributeDialog: FC<AttributeDialogProps> = ({
    open,
    onOpenChange,
    onSubmit,
    entityTypes = [],
    currentEntityType,
    editingAttribute,
}) => {
    const [typePopoverOpen, setTypePopoverOpen] = useState(false);
    const isEditMode = !!editingAttribute;

    const form = useForm<AttributeFormValues>({
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
            enumValues: [],
            enumSorting: OptionSortingType.MANUAL,
            minimum: undefined,
            maximum: undefined,
            minLength: undefined,
            maxLength: undefined,
            regex: undefined,
        },
    });

    const selectedType: string = form.watch("selectedType");
    const name: string = form.watch("name");
    const isRelationship = selectedType === "RELATIONSHIP";

    // Auto-update key based on name (only in create mode)
    useEffect(() => {
        if (!isEditMode && name) {
            form.setValue("key", toKeyCase(name));
        }
    }, [name, form, isEditMode]);

    // Pre-populate schema options for specific types
    useEffect(() => {
        if (!isEditMode) {
            const selectedAttr = attributeTypes.find((attr) => attr.key === selectedType);
            if (selectedAttr?.options) {
                if (selectedAttr.options.minimum !== undefined) {
                    form.setValue("minimum", selectedAttr.options.minimum);
                }
                if (selectedAttr.options.maximum !== undefined) {
                    form.setValue("maximum", selectedAttr.options.maximum);
                }
            }
        }
    }, [selectedType, isEditMode, form]);

    // Populate form when editing
    useEffect(() => {
        if (open && editingAttribute) {
            if (editingAttribute.type === "relationship") {
                form.reset({
                    selectedType: "RELATIONSHIP",
                    name: editingAttribute.name,
                    key: editingAttribute.key,
                    required: editingAttribute.required,
                    unique: false,
                    cardinality: editingAttribute.cardinality,
                    minOccurs: editingAttribute.minOccurs,
                    maxOccurs: editingAttribute.maxOccurs,
                    entityTypeKeys: editingAttribute.entityTypeKeys,
                    allowPolymorphic: editingAttribute.allowPolymorphic,
                    bidirectional: editingAttribute.bidirectional,
                    inverseName: editingAttribute.inverseName,
                    targetAttributeName: editingAttribute.targetAttributeName,
                });
            } else {
                // Find matching attribute type or use dataType directly
                const matchingType = attributeTypes.find(
                    (attr) =>
                        attr.type === editingAttribute.dataType &&
                        attr.format === editingAttribute.dataFormat
                );
                form.reset({
                    selectedType: matchingType?.key || editingAttribute.dataType,
                    name: editingAttribute.name,
                    key: editingAttribute.key,
                    description: editingAttribute.description,
                    required: editingAttribute.required,
                    unique: editingAttribute.unique,
                    dataFormat: editingAttribute.dataFormat,
                    enumValues: editingAttribute.options?.enum?.map(String) || [],
                    enumSorting:
                        (editingAttribute.options?.enumSorting as OptionSortingType) ||
                        OptionSortingType.MANUAL,
                    minimum: editingAttribute.options?.minimum,
                    maximum: editingAttribute.options?.maximum,
                    minLength: editingAttribute.options?.minLength,
                    maxLength: editingAttribute.options?.maxLength,
                    regex: editingAttribute.options?.regex,
                });
            }
        } else if (open && !editingAttribute) {
            // Reset to default values when creating new
            form.reset({
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
                enumValues: [],
                enumSorting: OptionSortingType.MANUAL,
                minimum: undefined,
                maximum: undefined,
                minLength: undefined,
                maxLength: undefined,
                regex: undefined,
            });
        }
    }, [open, editingAttribute, form]);

    // Reset form when dialog closes
    useEffect(() => {
        if (!open) {
            form.reset();
        }
    }, [open, form]);

    const handleFormSubmit = (values: AttributeFormValues) => {
        if (values.selectedType === "RELATIONSHIP") {
            const data: RelationshipFormData = {
                type: "relationship",
                name: values.name,
                key: values.key,
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

            // Build schema options
            const options: SchemaOptions = {};
            if (values.enumValues && values.enumValues.length > 0) {
                options.enum = values.enumValues;
            }
            if (values.enumSorting) {
                options.enumSorting = values.enumSorting;
            }
            if (values.minimum !== undefined && values.minimum !== null) {
                options.minimum = values.minimum;
            }
            if (values.maximum !== undefined && values.maximum !== null) {
                options.maximum = values.maximum;
            }
            if (values.minLength !== undefined && values.minLength !== null) {
                options.minLength = values.minLength;
            }
            if (values.maxLength !== undefined && values.maxLength !== null) {
                options.maxLength = values.maxLength;
            }
            if (values.regex) {
                options.regex = values.regex;
            }

            const data: AttributeFormData = {
                type: "attribute",
                name: values.name,
                key: values.key,
                description: values.description,
                dataType: selectedAttr?.type || (values.selectedType as DataType),
                dataFormat: selectedAttr?.format || values.dataFormat,
                required: values.required || false,
                unique: values.unique || false,
                options: Object.keys(options).length > 0 ? options : undefined,
            };
            onSubmit(data);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full min-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? "Edit attribute" : "Create attribute"}</DialogTitle>
                    <DialogDescription>
                        {isEditMode
                            ? "Update the attribute or relationship"
                            : "Add a new attribute or relationship to your entity type"}
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

                        {!isRelationship ? (
                            <AttributeForm form={form} isEditMode={isEditMode} />
                        ) : (
                            <RelationshipAttributeForm
                                form={form}
                                type={currentEntityType}
                                avaiableTypes={entityTypes}
                                isEditMode={isEditMode}
                            />
                        )}

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit">
                                {isEditMode ? "Update attribute" : "Create attribute"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
