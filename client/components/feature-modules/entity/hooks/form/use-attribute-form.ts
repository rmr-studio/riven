import { SchemaOptions } from "@/lib/interfaces/common.interface";
import {
    DataFormat,
    EntityPropertyType,
    EntityRelationshipCardinality,
    EntityTypeRelationshipType,
    OptionSortingType,
    SchemaType,
} from "@/lib/types/types";
import { attributeTypes } from "@/lib/util/form/schema.util";
import { uuid } from "@/lib/util/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { isUUID } from "validator";
import { z } from "zod";
import {
    AttributeFormData,
    EntityType,
    isRelationshipType,
    RelationshipFormData,
    RelationshipLimit,
} from "../../interface/entity.interface";

// Zod schema
export const entityTypeAttributeFormSchema = z
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

        // Relationship Source Management
        relationshipType: z.nativeEnum(EntityTypeRelationshipType),
        sourceEntityTypeKey: z.string(), // Linking to the source entity type
        originRelationshipId: z.string().optional().nullable(), // Linking to the relationship WITHIN the source entity type (Provided this is a reference definition)

        // Relationship Cardinality
        sourceRelationsLimit: z.enum(["singular", "many"]).optional().nullable(),
        targetRelationsLimit: z.enum(["singular", "many"]).optional().nullable(),

        // Attribute Schema options
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
    )
    // Further Validation based on relationship type for bidirectional relationship referencing
    .refine(
        (data) => {
            if (data.relationshipType === EntityTypeRelationshipType.REFERENCE) {
                return !!data.originRelationshipId && isUUID(data.originRelationshipId);
            }
            return true;
        },
        {
            message:
                "Origin Relationship ID must be present on a Reference relationship, and must be a valid UUID",
            path: ["originRelationshipId"], // Attach error to the originRelationshipId field
        }
    );

export interface UseEntityTypeAttributeFormReturn {
    form: UseFormReturn<AttributeFormValues>;
    handleSubmit: (values: AttributeFormValues) => void;
    currentType: SchemaType | "RELATIONSHIP";
    mode: "create" | "edit";
}

export type AttributeFormValues = z.infer<typeof entityTypeAttributeFormSchema>;

export function useEntityTypeAttributeForm(
    type: EntityType,
    open: boolean, // Dialogue open state
    onSubmit: (attribute: AttributeFormData | RelationshipFormData) => void, // Submission of attribute back into Entity type form
    attribute?: AttributeFormData | RelationshipFormData // Existing attribute for editing
): UseEntityTypeAttributeFormReturn {
    // Always start form as blank, this is because we would want it to reset to blank when a dialogue is re-opened.
    // Regardless of selected attribute, or previous changes.
    const form = useForm<AttributeFormValues>({
        resolver: zodResolver(entityTypeAttributeFormSchema),
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
            // By default. Treat all new relationships as Origin type. Form would update to Reference if needed (ie. Due to overlap prompting)
            relationshipType: EntityTypeRelationshipType.ORIGIN,
            sourceEntityTypeKey: type.key,
            originRelationshipId: undefined,
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

    // Determines if we are currently editing an existing attribute
    const isEditMode = Boolean(attribute);
    const currentType = form.watch("selectedType");

    // Pre-populate schema options for specific types.
    // Provided they have been provided default options (ie. Rating type with min/max values)
    useEffect(() => {
        if (!isEditMode) {
            if (currentType === "RELATIONSHIP") return;
            const attribute = attributeTypes[currentType];
            if (!attribute) return;

            // TODO. Expand this to cover more types as needed.
            if (attribute?.options) {
                if (attribute.options.minimum !== undefined) {
                    form.setValue("minimum", attribute.options.minimum);
                }
                if (attribute.options.maximum !== undefined) {
                    form.setValue("maximum", attribute.options.maximum);
                }
            }
        }
    }, [currentType, isEditMode]);

    const processCardinality = (
        attribute: RelationshipFormData
    ): { source: RelationshipLimit; target: RelationshipLimit } => {
        switch (attribute.cardinality) {
            case EntityRelationshipCardinality.ONE_TO_ONE:
                return { source: "singular", target: "singular" };
            case EntityRelationshipCardinality.ONE_TO_MANY:
                return { source: "singular", target: "many" };
            case EntityRelationshipCardinality.MANY_TO_ONE:
                return { source: "many", target: "singular" };
            case EntityRelationshipCardinality.MANY_TO_MANY:
                return { source: "many", target: "many" };
            default:
                return { source: "singular", target: "singular" };
        }
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

    // When the dialogue is opened for editing, populate the form with existing attribute data, or blank for new attribute
    useEffect(() => {
        if (!open || !attribute) return;

        if (isRelationshipType(attribute)) {
            // Parse Relationship Payload
            const { source, target } = processCardinality(attribute);

            form.reset({
                selectedType: "RELATIONSHIP",
                name: attribute.label,
                required: attribute.required,
                unique: false,
                entityTypeKeys: attribute.entityTypeKeys,
                allowPolymorphic: attribute.allowPolymorphic,
                relationshipType: attribute.relationshipType,
                sourceEntityTypeKey: attribute.sourceEntityTypeKey,
                originRelationshipId: attribute.originRelationshipId,
                bidirectional: attribute.bidirectional,
                bidirectionalEntityTypeKeys: attribute.bidirectionalEntityTypeKeys || [],
                inverseName: attribute.inverseName,
                sourceRelationsLimit: source,
                targetRelationsLimit: target,
            });

            return;
        }
        // Parse Attribute Payload
        const attributeType = attributeTypes[attribute.schemaKey];
        if (!attributeType) return;

        form.reset({
            selectedType: attributeType.key,
            name: attribute.label,
            required: attribute.required,
            unique: attribute.unique,
            dataFormat: attribute.dataFormat,
            enumValues: attribute.options?.enum,
            enumSorting: attribute.options?.enumSorting,
            minimum: attribute.options?.minimum,
            maximum: attribute.options?.maximum,
            minLength: attribute.options?.minLength,
            maxLength: attribute.options?.maxLength,
            regex: attribute.options?.regex,
        });
    }, [open, attribute]);

    useEffect(() => {
        if (!open) {
            form.reset();
        }
    }, [open]);

    /**
     * Handles form submission for both attributes and relationships.
     * Validates and constructs the appropriate data object before invoking onSubmit.
     * When handling an attribute update/edit. It is vital that the id is preserved.
     */
    const handleFormSubmit = useCallback(
        (values: AttributeFormValues) => {
            if (values.selectedType === "RELATIONSHIP")
                return handleRelationshipSubmission(values, attribute?.id);

            return handleAttributeSubmission(values, attribute?.id);
        },
        [onSubmit, attribute]
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
            id: existingId || uuid(),
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

    const handleRelationshipSubmission = (
        values: AttributeFormValues,
        existingId: string | undefined
    ) => {
        // If creating new relationship (no existingKey) and key is empty, generate it

        const data: RelationshipFormData = {
            id: existingId || uuid(),
            type: EntityPropertyType.RELATIONSHIP,
            label: values.name,
            cardinality: calculateCardinality(
                values.sourceRelationsLimit || "singular",
                values.targetRelationsLimit || "singular"
            ),
            relationshipType: values.relationshipType,
            sourceEntityTypeKey: values.sourceEntityTypeKey,
            originRelationshipId: values.originRelationshipId,
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

    return {
        form,
        handleSubmit: handleFormSubmit,
        currentType,
        mode: isEditMode ? "edit" : "create",
    };
}
