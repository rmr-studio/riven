import { SchemaOptions } from "@/lib/interfaces/common.interface";
import {
    DataFormat,
    EntityTypeRequestDefinition,
    OptionSortingType,
    SchemaType,
} from "@/lib/types/types";
import { attributeTypes } from "@/lib/util/form/schema.util";
import { uuid } from "@/lib/util/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import {
    EntityAttributeDefinition,
    EntityType,
    SaveAttributeDefinitionRequest,
    TypeDefinitionRequest,
} from "../../../interface/entity.interface";
import { useSaveDefinitionMutation } from "../../mutation/type/use-save-definition-mutation";

// Zod schema
export const attributeFormSchema = z
    .object({
        selectedType: z.nativeEnum(SchemaType),
        name: z.string().min(1, "Name is required"),
        dataFormat: z.nativeEnum(DataFormat).optional(),
        required: z.boolean(),
        unique: z.boolean(),

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
    );

export interface UseEntityTypeAttributeFormReturn {
    form: UseFormReturn<AttributeFormValues>;
    handleSubmit: (values: AttributeFormValues) => void;
    currentType: SchemaType;
    mode: "create" | "edit";
}

export type AttributeFormValues = z.infer<typeof attributeFormSchema>;

export function useEntityTypeAttributeForm(
    type: EntityType,
    open: boolean,
    onSave: () => void,
    attribute?: EntityAttributeDefinition
): UseEntityTypeAttributeFormReturn {
    // Always start form as blank, this is because we would want it to reset to blank when a dialogue is re-opened.
    // Regardless of selected attribute, or previous changes.
    const form = useForm<AttributeFormValues>({
        resolver: zodResolver(attributeFormSchema),
        defaultValues: {
            selectedType: SchemaType.TEXT,
            name: "",
            required: false,
            unique: false,

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

    // When the dialogue is opened for editing, populate the form with existing attribute data, or blank for new attribute
    useEffect(() => {
        if (!open || !attribute) return;

        const { schema } = attribute;

        // Parse Attribute Payload
        const attributeType = attributeTypes[schema.key];
        if (!attributeType) return;

        form.reset({
            selectedType: attributeType.key,
            name: schema.label,
            required: schema.required,
            unique: schema.unique,
            dataFormat: schema.format,
            enumValues: schema.options?.enum,
            enumSorting: schema.options?.enumSorting,
            minimum: schema.options?.minimum,
            maximum: schema.options?.maximum,
            minLength: schema.options?.minLength,
            maxLength: schema.options?.maxLength,
            regex: schema.options?.regex,
        });
    }, [open, attribute]);

    useEffect(() => {
        if (!open) {
            form.reset();
        }
    }, [open]);

    const { mutateAsync: saveDefinition } = useSaveDefinitionMutation(type.key, {
        onSettled: () => {
            onSave();
        },
    });

    const handleSubmit = useCallback(
        async (values: AttributeFormValues) => {
            const attributeType = attributeTypes[values.selectedType];
            if (!attributeType) return;

            const id = attribute?.id || uuid();

            const options: SchemaOptions = {
                enum: values.enumValues,
                enumSorting: values.enumSorting,
                minimum: values.minimum,
                maximum: values.maximum,
                minLength: values.minLength,
                maxLength: values.maxLength,
                regex: values.regex,
            };

            const definition: SaveAttributeDefinitionRequest = {
                id,
                type: EntityTypeRequestDefinition.SCHEMA,
                key: type.key,
                schema: {
                    key: attributeType.key,
                    protected: false,
                    type: attributeType.type,
                    format: values.dataFormat,
                    label: values.name,
                    required: values.required,
                    unique: values.unique,
                    options: options,
                },
            };

            const request: TypeDefinitionRequest = {
                index: undefined,
                definition,
            };

            await saveDefinition(request);
        },
        [attribute, type.key]
    );

    return {
        form,
        handleSubmit,
        currentType,
        mode: isEditMode ? "edit" : "create",
    };
}
