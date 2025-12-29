"use client";

import { FormWidgetProps } from "@/components/feature-modules/blocks/components/forms";
import { FormField } from "@/components/ui/form";
import { SchemaUUID } from "@/lib/interfaces/common.interface";
import { FC } from "react";
import { Noop } from "react-hook-form";
import { useEntityDraft } from "../../../context/entity-provider";
import { getWidgetForSchema } from "./entity-field-registry";

export interface EntityFieldCellProps {
    attributeId: string;
    schema: SchemaUUID;
}

export const EntityFieldCell: FC<EntityFieldCellProps> = ({ attributeId, schema }) => {
    const { form } = useEntityDraft();

    // Get widget component for this schema type
    const Widget: FC<FormWidgetProps> = getWidgetForSchema(schema);

    /**
     * This should perform a brief validation check for existing data already loaded inside the client.
     * E.g. for URL fields, check if the value is a valid URL format. If invalid, set error in form state.
     * This should also perform a brief uniqueness check if the schema requires it, e.g. check against existing entities in the entity store.
     * This shouldnt perform a full validation, nor call any APIs, just basic checks that can be done client-side.
     */
    const onBlur = (onBlur: Noop, value: unknown) => {
        onBlur();
        console.log(value);
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
            <FormField
                control={form.control}
                name={attributeId}
                render={({ field }) => {
                    return (
                        <Widget
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={() => onBlur(field.onBlur, field.value)}
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
                    );
                }}
            />
        </div>
    );
};
