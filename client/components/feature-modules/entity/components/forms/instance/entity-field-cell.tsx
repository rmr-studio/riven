"use client";

import { FormWidgetProps } from "@/components/feature-modules/blocks/components/forms";
import { SchemaUUID } from "@/lib/interfaces/common.interface";
import { FC } from "react";
import { useEntityDraft } from "../../../context/entity-provider";
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
    const { form } = useEntityDraft();
    // Get current value and errors from form
    const value = form.watch(attributeId);
    const fieldError = form.formState.errors[attributeId];
    const errors = fieldError?.message ? [String(fieldError.message)] : undefined;

    // Get widget component for this schema type
    const Widget: FC<FormWidgetProps> = getWidgetForSchema(schema);

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

    /**
     * This should perform a brief validation check for existing data already loaded inside the client.
     * E.g. for URL fields, check if the value is a valid URL format. If invalid, set error in form state.
     * This should also perform a brief uniqueness check if the schema requires it, e.g. check against existing entities in the entity store.
     * This shouldnt perform a full validation, nor call any APIs, just basic checks that can be done client-side.
     */
    const onBlur = () => {};

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
                onBlur={onBlur}
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
        </div>
    );
};
