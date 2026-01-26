'use client';

import { FormWidgetProps } from '@/components/feature-modules/blocks/components/forms';
import { FormField } from '@/components/ui/form';
import { SchemaUUID } from '@/lib/interfaces/common.interface';
import { FC } from 'react';
import { useFormState } from 'react-hook-form';
import { useEntityDraft } from '../../../context/entity-provider';
import { getWidgetForSchema } from './entity-field-registry';

export interface EntityFieldCellProps {
  attributeId: string;
  schema: SchemaUUID;
  autoFocus?: boolean;
}

export const EntityFieldCell: FC<EntityFieldCellProps> = ({ attributeId, schema, autoFocus }) => {
  const { form } = useEntityDraft();

  // Watch for validation errors on this specific field
  const { errors } = useFormState({
    control: form.control,
    name: attributeId,
  });

  // Get widget component for this schema type
  const Widget: FC<FormWidgetProps> = getWidgetForSchema(schema);

  // Extract error messages for this field
  const fieldError = errors[attributeId];
  const errorMessages = fieldError?.message
    ? [String(fieldError.message)]
    : fieldError?.type
      ? [String(fieldError.type)]
      : undefined;

  /**
   * Handle blur event:
   * 1. Trigger React Hook Form's native onBlur
   * 2. Re-validate this specific field to update error state
   */
  const handleBlur = async () => {
    // Trigger validation for this specific field
    await form.trigger(attributeId);
  };

  if (!Widget) {
    return (
      <div className="text-sm text-muted-foreground">Unsupported field type: {schema.key}</div>
    );
  }

  return (
    <div className="relative w-full min-w-0">
      <FormField
        control={form.control}
        name={attributeId}
        render={({ field }) => {
          return (
            <div className="w-full min-w-0">
              <Widget
                value={field.value}
                onChange={field.onChange}
                onBlur={handleBlur}
                schema={schema}
                displayError="tooltip"
                errors={errorMessages}
                autoFocus={autoFocus}
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
        }}
      />
    </div>
  );
};
