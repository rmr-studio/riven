'use client';

import { FC } from 'react';
import { UseFormReturn, useFormState } from 'react-hook-form';
import { FormField } from '@/components/ui/form';
import { FormWidgetProps } from '@/components/feature-modules/blocks/components/forms';
import { SchemaUUID } from '@/lib/interfaces/common.interface';
import { getWidgetForSchema } from '@/components/feature-modules/entity/components/forms/instance/entity-field-registry';

interface CellEditorWidgetProps {
  form: UseFormReturn<any>;
  fieldName: string;
  schema: SchemaUUID;
  autoFocus?: boolean;
  onBlur?: () => void;
}

/**
 * CellEditorWidget component
 *
 * Renders the appropriate form widget based on the schema type.
 * Reuses the entity field widget registry for consistency.
 */
export function CellEditorWidget({
  form,
  fieldName,
  schema,
  autoFocus,
  onBlur,
}: CellEditorWidgetProps) {
  // Get widget from registry (same as EntityFieldCell)
  const Widget: FC<FormWidgetProps> = getWidgetForSchema(schema);

  // Extract error messages
  const { errors } = useFormState({ control: form.control, name: fieldName });
  const fieldError = errors[fieldName];
  const errorMessages = fieldError?.message
    ? [String(fieldError.message)]
    : fieldError?.type
      ? [String(fieldError.type)]
      : undefined;

  // Trigger validation on blur
  const handleBlur = async () => {
    await form.trigger(fieldName);
    onBlur?.();
  };

  if (!Widget) {
    return <div className="text-sm text-muted-foreground">Unsupported type: {schema.key}</div>;
  }

  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <Widget
          value={field.value}
          onChange={field.onChange}
          onBlur={handleBlur}
          schema={schema}
          displayError="tooltip" // Compact for tables
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
      )}
    />
  );
}
