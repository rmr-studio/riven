"use client";

import { useMemo, useEffect, type FC } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { WorkflowNodeConfigField } from "@/lib/types/models/WorkflowNodeConfigField";
import { WorkflowNodeConfigFieldType } from "@/lib/types/models/WorkflowNodeConfigFieldType";
import { buildZodSchemaFromFields, buildDefaultValues } from "../../util/schema-builder.util";
import { configWidgetRegistry, getWidgetForType } from "./widgets/config-widget.registry";

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
  // Memoize schema to avoid rebuilding on every render
  const zodSchema = useMemo(
    () => buildZodSchemaFromFields(configSchema),
    [configSchema]
  );

  const defaultValues = useMemo(
    () => ({
      ...buildDefaultValues(configSchema),
      ...initialValues,
    }),
    [configSchema, initialValues]
  );

  const form = useForm({
    resolver: zodResolver(zodSchema),
    defaultValues,
    mode: "onChange", // Validate on change for immediate feedback
  });

  const { formState: { errors } } = form;
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

  // Reset form when node changes
  useEffect(() => {
    form.reset({
      ...buildDefaultValues(configSchema),
      ...initialValues,
    });
  }, [nodeId, configSchema, initialValues, form]);

  // Find ENTITY_TYPE field key to track selected entity type
  // This enables the entity fields widget to know which entity's fields to show
  const entityTypeFieldKey = configSchema.find(
    (f) => f.type === WorkflowNodeConfigFieldType.EntityType
  )?.key;

  // Watch the entity type field value for passing to entity fields widgets
  const selectedEntityType = entityTypeFieldKey
    ? form.watch(entityTypeFieldKey)
    : undefined;

  if (configSchema.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
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
            <ul className="list-disc list-inside">
              {errorMessages.map(({ key, message }) => (
                <li key={key}>
                  {configSchema.find((f) => f.key === key)?.label ?? key}: {message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Form fields */}
      {configSchema.map((field) => {
        if (!field.key || !field.type) return null;

        const widgetMeta = getWidgetForType(field.type);
        if (!widgetMeta) {
          console.warn(`No widget registered for field type: ${field.type}`);
          return (
            <div key={field.key} className="text-sm text-muted-foreground">
              Unsupported field type: {field.type}
            </div>
          );
        }

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
