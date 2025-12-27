"use client";

import { SchemaUUID } from "@/lib/interfaces/common.interface";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { FC, useState } from "react";
import { useDraftForm } from "../../../context/entity-provider";
import { useValidateUniqueMutation } from "../../../hooks/mutation/instance/use-validate-unique-mutation";
import { getWidgetForSchema } from "./entity-field-registry";

export interface EntityFieldCellProps {
    attributeId: string;
    schema: SchemaUUID;
    entityTypeKey: string;
}

export const EntityFieldCell: FC<EntityFieldCellProps> = ({
    attributeId,
    schema,

    entityTypeKey,
}) => {
    const form = useDraftForm();
    const [isValidatingUnique, setIsValidatingUnique] = useState(false);
    const { organisationId } = useParams<{ organisationId: string }>();

    // Get current value and errors from form
    const value = form.watch(attributeId);
    const fieldError = form.formState.errors[attributeId];
    const errors = fieldError?.message ? [String(fieldError.message)] : undefined;

    // Unique validation mutation
    const { mutateAsync: validateUnique } = useValidateUniqueMutation(
        organisationId,
        entityTypeKey
    );

    // Get widget component for this schema type
    const Widget = getWidgetForSchema(schema);

    const handleBlur = async () => {
        // Trigger field validation (Zod schema)
        await form.trigger(attributeId);

        // Check uniqueness if required
        if (schema.unique && value !== null && value !== undefined && value !== "") {
            setIsValidatingUnique(true);
            try {
                const isUnique = await validateUnique({ attributeId, value });
                if (!isUnique) {
                    form.setError(attributeId, {
                        type: "unique",
                        message: `This ${schema.label?.toLowerCase() || "value"} is already in use`,
                    });
                }
            } catch (error) {
                console.error("Unique validation error:", error);
                // Don't show error to user - will be validated on submit
            } finally {
                setIsValidatingUnique(false);
            }
        }
    };

    const handleChange = (newValue: any) => {
        // Clear error when user starts typing
        if (fieldError) {
            form.clearErrors(attributeId);
        }

        // Update form value
        form.setValue(attributeId, newValue, {
            shouldValidate: false, // Don't validate on change, only on blur
            shouldDirty: true,
        });
    };

    if (!Widget) {
        return (
            <div className="text-sm text-muted-foreground">
                Unsupported field type: {schema.key}
            </div>
        );
    }

    return (
        <div className="relative">
            <Widget
                value={value}
                onChange={handleChange}
                onBlur={handleBlur}
                label={schema.label || attributeId}
                placeholder={`Enter ${schema.label?.toLowerCase() || "value"}...`}
                disabled={isValidatingUnique}
                errors={errors}
                schema={schema}
                options={
                    schema.options?.enum
                        ? schema.options.enum.map((opt) => ({
                              label: opt,
                              value: opt,
                          }))
                        : undefined
                }
            />
            {isValidatingUnique && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
            )}
        </div>
    );
};
