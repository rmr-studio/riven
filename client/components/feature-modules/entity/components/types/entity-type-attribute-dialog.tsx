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
    EntityPropertyType,
    EntityRelationshipCardinality,
    OptionSortingType,
    SchemaType,
} from "@/lib/types/types";
import { attributeTypes } from "@/lib/util/form/schema.util";
import { toKeyCase } from "@/lib/util/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { FC, useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { AttributeTypeDropdown } from "../../../../ui/attribute-type-dropdown";
import type {
    AttributeFormData,
    RelationshipFormData,
    RelationshipLimit,
} from "../../interface/entity.interface";
import { EntityType, isRelationshipType } from "../../interface/entity.interface";
import { AttributeForm } from "../forms/attribute-form";
import { RelationshipAttributeForm } from "../forms/attributes-relationship-form";

interface AttributeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (attribute: AttributeFormData | RelationshipFormData) => void;
    entityTypes?: EntityType[];
    currentEntityType?: EntityType;
    currentAttributes?: AttributeFormData[];
    currentRelationships?: RelationshipFormData[];
    editingAttribute?: AttributeFormData | RelationshipFormData;
    identifierKey?: string;
    currentFormKey?: string;
    currentFormPluralName?: string;
}

// Zod schema
const formSchema = z
    .object({
        selectedType: z.nativeEnum(SchemaType).or(z.literal("RELATIONSHIP")),
        name: z.string().min(1, "Name is required"),
        dataFormat: z.nativeEnum(DataFormat).optional(),
        required: z.boolean(),
        unique: z.boolean(),
        entityTypeKeys: z.array(z.string()).optional(),
        allowPolymorphic: z.boolean().optional(),
        bidirectional: z.boolean().optional(),
        bidirectionalEntityTypeKeys: z.array(z.string()).optional(),
        inverseName: z.string().optional(),
        //
        sourceRelationsLimit: z.enum(["singular", "many"]).optional(),
        targetRelationsLimit: z.enum(["singular", "many"]).optional(),
        // Schema options
        enumValues: z.array(z.string()).optional(),
        enumSorting: z.nativeEnum(OptionSortingType).optional(),
        minimum: z.coerce.number().optional(),
        maximum: z.coerce.number().optional(),
        minLength: z.coerce.number().min(0).optional(),
        maxLength: z.coerce.number().min(0).optional(),
        regex: z.string().optional(),
    })
    .refine(
        (data) => {
            // If selectedType is select or multi-select, at least 2 enum values must be provided
            if (
                data.selectedType === SchemaType.SELECT ||
                data.selectedType === SchemaType.MULTI_SELECT
            ) {
                return data.enumValues && data.enumValues.length >= 2;
            }
            return true;
        },
        {
            message: "At least 2 options are required for select and multi-select types",
            path: ["enumValues"], // Attach error to the enumValues field
        }
    )
    .refine(
        (data) => {
            // If selectedType is RELATIONSHIP, either entityTypeKeys must have values or allowPolymorphic must be true
            if (data.selectedType === "RELATIONSHIP") {
                return (
                    (data.entityTypeKeys && data.entityTypeKeys.length > 0) ||
                    data.allowPolymorphic === true
                );
            }
            return true;
        },
        {
            message: "Please select at least one entity type or allow all entity types",
            path: ["entityTypeKeys"], // Attach error to the entityTypeKeys field
        }
    );

export type AttributeFormValues = z.infer<typeof formSchema>;

export const AttributeDialog: FC<AttributeDialogProps> = ({
    open,
    onOpenChange,
    onSubmit,
    entityTypes = [],
    currentAttributes = [],
    currentRelationships = [],
    currentEntityType,
    editingAttribute,
    identifierKey,
    currentFormKey,
    currentFormPluralName,
}) => {
    const [typePopoverOpen, setTypePopoverOpen] = useState(false);
    const isEditMode = !!editingAttribute;

    // Check if the editing attribute is the identifier key
    const isIdentifierAttribute =
        isEditMode &&
        editingAttribute &&
        !isRelationshipType(editingAttribute) &&
        editingAttribute.id === identifierKey;

    const form = useForm<AttributeFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            selectedType: SchemaType.TEXT,
            name: "",
            required: false,
            unique: false,
            sourceRelationsLimit: "singular",
            targetRelationsLimit: "singular",
            entityTypeKeys: [],
            allowPolymorphic: false,
            bidirectional: false,
            bidirectionalEntityTypeKeys: [],
            inverseName: "",
            enumValues: [],
            enumSorting: OptionSortingType.MANUAL,
            minimum: undefined,
            maximum: undefined,
            minLength: undefined,
            maxLength: undefined,
            regex: undefined,
        },
    });

    const selectedType: SchemaType | "RELATIONSHIP" | "" = form.watch("selectedType");
    const isRelationship = selectedType === "RELATIONSHIP";

    // Pre-populate schema options for specific types. Provided they have been provided default options.
    useEffect(() => {
        if (!isEditMode) {
            if (isRelationship) return;
            const attribute = attributeTypes[selectedType];
            if (!attribute) return;

            if (attribute?.options) {
                if (attribute.options.minimum !== undefined) {
                    form.setValue("minimum", attribute.options.minimum);
                }
                if (attribute.options.maximum !== undefined) {
                    form.setValue("maximum", attribute.options.maximum);
                }
            }
        }
    }, [selectedType, isEditMode, form]);

    // Populate form when editing
    useEffect(() => {
        if (!open) return;

        if (editingAttribute) {
            if (isRelationshipType(editingAttribute)) {
                // Derive source and target limits from cardinality
                let sourceLimit: RelationshipLimit = "singular";
                let targetLimit: RelationshipLimit = "singular";

                switch (editingAttribute.cardinality) {
                    case EntityRelationshipCardinality.ONE_TO_ONE:
                        sourceLimit = "singular";
                        targetLimit = "singular";
                        break;
                    case EntityRelationshipCardinality.ONE_TO_MANY:
                        sourceLimit = "singular";
                        targetLimit = "many";
                        break;
                    case EntityRelationshipCardinality.MANY_TO_ONE:
                        sourceLimit = "many";
                        targetLimit = "singular";
                        break;
                    case EntityRelationshipCardinality.MANY_TO_MANY:
                        sourceLimit = "many";
                        targetLimit = "many";
                        break;
                }

                form.reset({
                    selectedType: "RELATIONSHIP",
                    name: editingAttribute.label,
                    required: editingAttribute.required,
                    unique: false,
                    entityTypeKeys: editingAttribute.entityTypeKeys,
                    allowPolymorphic: editingAttribute.allowPolymorphic,
                    bidirectional: editingAttribute.bidirectional,
                    bidirectionalEntityTypeKeys: editingAttribute.bidirectionalEntityTypeKeys || [],
                    inverseName: editingAttribute.inverseName,
                    sourceRelationsLimit: sourceLimit,
                    targetRelationsLimit: targetLimit,
                });
            } else {
                const attribute = attributeTypes[editingAttribute.schemaKey];
                if (!attribute) return;

                form.reset({
                    selectedType: attribute.key,
                    name: editingAttribute.label,
                    required: editingAttribute.required,
                    unique: editingAttribute.unique,
                    dataFormat: editingAttribute.dataFormat,
                    enumValues: editingAttribute.options?.enum,
                    enumSorting: editingAttribute.options?.enumSorting,
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
                selectedType: SchemaType.TEXT,
                name: "",
                required: false,
                unique: false,
                entityTypeKeys: [],
                allowPolymorphic: false,
                bidirectional: false,
                bidirectionalEntityTypeKeys: [],
                sourceRelationsLimit: "singular",
                targetRelationsLimit: "singular",
                inverseName: "",
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

    /**
     * Handles form submission for both attributes and relationships.
     * Validates and constructs the appropriate data object before invoking onSubmit.
     * When handling an attribute update/edit. It is vital that the id is preserved.
     */
    const handleFormSubmit = useCallback(
        (values: AttributeFormValues) => {
            if (values.selectedType === "RELATIONSHIP")
                return handleRelationshipSubmission(values, editingAttribute?.id);
            return handleAttributeSubmission(values, editingAttribute?.id);
        },
        [onSubmit, editingAttribute]
    );

    const handleAttributeSubmission = (
        values: AttributeFormValues,
        existingId: string | undefined
    ) => {
        if (values.selectedType === "RELATIONSHIP") return;
        const attribute = attributeTypes[values.selectedType];
        if (!attribute) return;

        const options: SchemaOptions = {
            enum: values.enumValues,
            enumSorting: values.enumSorting,
            minimum: values.minimum,
            maximum: values.maximum,
            minLength: values.minLength,
            maxLength: values.maxLength,
            regex: values.regex,
        };

        const data: AttributeFormData = {
            type: EntityPropertyType.ATTRIBUTE,
            id: existingId || uuidv4(),
            label: values.name,
            schemaKey: values.selectedType,
            dataType: attribute.type,
            dataFormat: attribute.format,
            required: values.required || false,
            unique: values.unique || false,
            options,
        };

        onSubmit(data);
    };

    const createId = (): string => {
        return uuidv4();
    };

    const calculateCardinality = (
        source: RelationshipLimit,
        target: RelationshipLimit
    ): EntityRelationshipCardinality => {
        if (source === "singular" && target === "singular") {
            return EntityRelationshipCardinality.ONE_TO_ONE;
        } else if (source === "singular" && target === "many") {
            return EntityRelationshipCardinality.ONE_TO_MANY;
        } else if (source === "many" && target === "singular") {
            return EntityRelationshipCardinality.MANY_TO_ONE;
        } else {
            return EntityRelationshipCardinality.MANY_TO_MANY;
        }
    };

    const handleRelationshipSubmission = (
        values: AttributeFormValues,
        existingId: string | undefined
    ) => {
        // If creating new relationship (no existingId), generate a UUID
        const id = existingId || createId();

        const data: RelationshipFormData = {
            type: EntityPropertyType.RELATIONSHIP,
            label: values.name,
            id: id,
            cardinality: calculateCardinality(
                values.sourceRelationsLimit || "singular",
                values.targetRelationsLimit || "singular"
            ),
            entityTypeKeys: values.entityTypeKeys || [],
            allowPolymorphic: values.allowPolymorphic || false,
            bidirectional: values.bidirectional || false,
            bidirectionalEntityTypeKeys: values.bidirectionalEntityTypeKeys || [],
            inverseName: values.inverseName,
            required: values.required || false,
        };
        onSubmit(data);
        return;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full min-w-11/12 lg:min-w-5xl max-h-[90vh] overflow-y-auto">
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
                            <AttributeForm
                                form={form}
                                isEditMode={isEditMode}
                                isIdentifierAttribute={isIdentifierAttribute}
                            />
                        ) : (
                            <RelationshipAttributeForm
                                relationships={currentRelationships}
                                form={form}
                                type={currentEntityType}
                                avaiableTypes={entityTypes}
                                isEditMode={isEditMode}
                                currentFormKey={currentFormKey}
                                currentFormPluralName={currentFormPluralName}
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
