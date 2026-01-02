"use client";

import { FormWidgetProps } from "@/components/feature-modules/blocks/components/forms";
import { getWidgetForSchema } from "@/components/feature-modules/entity/components/forms/instance/entity-field-registry";
import { EntityRelationshipPicker } from "@/components/feature-modules/entity/components/forms/instance/entity-relationship-picker";
import {
    EntityRelationshipDefinition,
} from "@/components/feature-modules/entity/interface/entity.interface";
import { FormField } from "@/components/ui/form";
import { SchemaUUID } from "@/lib/interfaces/common.interface";
import { EntityRelationshipCardinality } from "@/lib/types/types";
import { FC } from "react";
import { useFormState } from "react-hook-form";
import { EditRenderProps } from "../../data-table.types";

/**
 * Creates an attribute edit renderer using schema-based widgets
 *
 * @example
 * ```tsx
 * const columns = [
 *   {
 *     accessorKey: "name",
 *     meta: {
 *       edit: {
 *         enabled: true,
 *         render: createAttributeRenderer(schema),
 *       }
 *     }
 *   }
 * ]
 * ```
 */
export function createAttributeRenderer<TData>(
    schema: SchemaUUID
): (props: EditRenderProps<TData>) => React.ReactNode {
    return function AttributeEditRenderer({ form, onSave }) {
        const Widget: FC<FormWidgetProps> = getWidgetForSchema(schema);

        // Extract error messages
        const { errors } = useFormState({ control: form.control, name: "value" });
        const fieldError = errors["value"];
        const errorMessages = fieldError?.message
            ? [String(fieldError.message)]
            : fieldError?.type
              ? [String(fieldError.type)]
              : undefined;

        // Trigger validation on blur
        const handleBlur = async () => {
            await form.trigger("value");
            onSave();
        };

        if (!Widget) {
            return (
                <div className="text-sm text-muted-foreground">Unsupported type: {schema.key}</div>
            );
        }

        return (
            <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                    <Widget
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={handleBlur}
                        schema={schema}
                        displayError="tooltip"
                        errors={errorMessages}
                        autoFocus
                        options={
                            schema.options?.enum
                                ? schema.options.enum.map((opt) => ({
                                      label: opt,
                                      value: opt,
                                  }))
                                : undefined
                        }
                    />
                )}
            />
        );
    };
}

/**
 * Creates a relationship edit renderer using EntityRelationshipPicker
 *
 * @example
 * ```tsx
 * const columns = [
 *   {
 *     accessorKey: "assignedTo",
 *     meta: {
 *       edit: {
 *         enabled: true,
 *         render: createRelationshipRenderer(relationship),
 *       }
 *     }
 *   }
 * ]
 * ```
 */
export function createRelationshipRenderer<TData>(
    relationship: EntityRelationshipDefinition
): (props: EditRenderProps<TData>) => React.ReactNode {
    const isSingleSelect =
        relationship.cardinality === EntityRelationshipCardinality.ONE_TO_ONE ||
        relationship.cardinality === EntityRelationshipCardinality.MANY_TO_ONE;

    return function RelationshipEditRenderer({ form, onSave }) {
        const value = form.watch("value");

        // Normalize to array for the picker
        const normalizedValue: string[] = Array.isArray(value) ? value : value ? [value] : [];

        // Extract error messages
        const { errors } = useFormState({ control: form.control, name: "value" });
        const fieldError = errors["value"];
        const errorMessages = fieldError?.message
            ? [String(fieldError.message)]
            : fieldError?.type
              ? [String(fieldError.type)]
              : undefined;

        const handleChange = (newValue: string | string[] | null) => {
            if (isSingleSelect) {
                // For single-select, normalize to single value
                const singleValue = Array.isArray(newValue) ? (newValue[0] ?? null) : newValue;
                form.setValue("value", singleValue as string | string[] | null);
            } else {
                form.setValue("value", newValue as string | string[] | null);
            }
        };

        const handleRemove = (entityId: string) => {
            const current = form.getValues("value");
            if (Array.isArray(current)) {
                form.setValue(
                    "value",
                    current.filter((id) => id !== entityId)
                );
            } else if (current === entityId) {
                form.setValue("value", null);
            }
        };

        const handleBlur = async () => {
            await form.trigger("value");
            onSave();
        };

        return (
            <EntityRelationshipPicker
                relationship={relationship}
                autoFocus
                value={normalizedValue}
                errors={errorMessages}
                handleBlur={handleBlur}
                handleChange={handleChange}
                handleRemove={handleRemove}
            />
        );
    };
}
