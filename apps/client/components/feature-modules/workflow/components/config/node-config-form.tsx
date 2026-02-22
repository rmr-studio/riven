'use client';

import { useMemo, useEffect, type FC } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { WorkflowNodeConfigField } from '@/lib/types/workflow';
import { WorkflowNodeConfigFieldType } from '@/lib/types/workflow';
import { buildZodSchemaFromFields, buildDefaultValues } from '../../util/schema-builder.util';
import { getWidgetForType } from './widgets/config-widget.registry';

/**
 * Type guard for fields with required key and type
 * Narrows WorkflowNodeConfigField to a type with non-optional key and type
 */
type ValidConfigField = WorkflowNodeConfigField & {
  key: string;
  type: WorkflowNodeConfigFieldType;
};

function isValidConfigField(field: WorkflowNodeConfigField): field is ValidConfigField {
  return !!field.key && !!field.type;
}

export interface NodeConfigFormProps {
  /** Node ID being configured */
  nodeId: string;
  /** Node type key (frontend key like "trigger_entity_event") */
  nodeType: string;
  /** Config field definitions from backend */
  configSchema: WorkflowNodeConfigField[];
  /** Current config values from node data */
  initialValues?: Record<string, unknown>;
  /** Callback when form values change - called on every change */
  onValuesChange: (values: Record<string, unknown>) => void;
  /** Workspace ID for entity widgets */
  workspaceId: string;
}

/**
 * Dynamic form component that renders configuration fields based on schema
 *
 * Features:
 * - Builds Zod schema from config field definitions
 * - Renders fields using widget registry
 * - Validates on change for immediate feedback
 * - Syncs changes to parent on every update
 * - Watches ENTITY_TYPE fields and passes value to ENTITY_QUERY widgets
 */
export const NodeConfigForm: FC<NodeConfigFormProps> = ({
  nodeId,
  nodeType,
  configSchema,
  initialValues,
  onValuesChange,
  workspaceId,
}) => {
  // Filter schema to only include fields with registered widgets
  // This prevents crashes when unknown field types are encountered
  const supportedFields = useMemo(
    () =>
      configSchema
        .filter(isValidConfigField)
        .filter((field) => getWidgetForType(field.type)),
    [configSchema],
  );

  // Track unsupported fields for warning display
  const unsupportedFields = useMemo(
    () =>
      configSchema
        .filter(isValidConfigField)
        .filter((field) => !getWidgetForType(field.type)),
    [configSchema],
  );

  // Memoize schema to avoid rebuilding on every render
  const zodSchema = useMemo(() => buildZodSchemaFromFields(supportedFields), [supportedFields]);

  const defaultValues = useMemo(
    () => ({
      ...buildDefaultValues(supportedFields),
      ...initialValues,
    }),
    [supportedFields, initialValues],
  );

  const form = useForm({
    resolver: zodResolver(zodSchema),
    defaultValues,
    mode: 'onChange', // Validate on change for immediate feedback
  });

  const {
    formState: { errors },
  } = form;
  const errorMessages = Object.entries(errors)
    .filter(([_, error]) => error?.message)
    .map(([key, error]) => ({ key, message: error?.message as string }));

  // Sync form changes to parent immediately
  useEffect(() => {
    const subscription = form.watch((values) => {
      onValuesChange(values as Record<string, unknown>);
    });
    return () => subscription.unsubscribe();
  }, [form, onValuesChange]);

  // Reset form when node changes (not when initialValues change, to avoid infinite loop)
  // initialValues is derived from store which gets updated by onValuesChange
  useEffect(() => {
    form.reset({
      ...buildDefaultValues(supportedFields),
      ...initialValues,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId, supportedFields, form]);

  // Find ENTITY_TYPE field key to track selected entity type
  // This enables the entity fields widget to know which entity's fields to show
  const entityTypeFieldKey = supportedFields.find(
    (f) => f.type === WorkflowNodeConfigFieldType.EntityType,
  )?.key;

  // Watch the entity type field value for passing to entity fields widgets
  const selectedEntityType = entityTypeFieldKey ? form.watch(entityTypeFieldKey) : undefined;

  if (supportedFields.length === 0 && unsupportedFields.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        No configuration options for this node type.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Error summary at top */}
      {errorMessages.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-inside list-disc">
              {errorMessages.map(({ key, message }) => (
                <li key={key}>
                  {supportedFields.find((f) => f.key === key)?.label ?? key}: {message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Unsupported fields warning */}
      {unsupportedFields.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium">Unsupported field types:</span>
            <ul className="mt-1 list-inside list-disc text-xs">
              {unsupportedFields.map((field) => (
                <li key={field.key}>
                  {field.label ?? field.key}: {field.type}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Form fields */}
      {supportedFields.map((field) => {
        const widgetMeta = getWidgetForType(field.type);
        // Widget is guaranteed to exist due to supportedFields filter
        if (!widgetMeta) return null;

        const Widget = widgetMeta.component;

        return (
          <Controller
            key={field.key}
            name={field.key}
            control={form.control}
            render={({ field: formField, fieldState }) => (
              <Widget
                value={formField.value}
                onChange={formField.onChange}
                onBlur={formField.onBlur}
                label={field.label}
                description={field.description}
                placeholder={field.placeholder}
                required={field.required}
                options={field.options}
                errors={fieldState.error?.message ? [fieldState.error.message] : undefined}
                workspaceId={workspaceId}
                entityTypeKey={selectedEntityType as string | undefined}
              />
            )}
          />
        );
      })}
    </div>
  );
};
