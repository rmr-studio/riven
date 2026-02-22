import { z, type ZodTypeAny, type ZodObject } from "zod";
import type { WorkflowNodeConfigField } from "@/lib/types/models/WorkflowNodeConfigField";
import { WorkflowNodeConfigFieldType } from "@/lib/types/models/WorkflowNodeConfigFieldType";
import { configWidgetRegistry } from "../components/config/widgets/config-widget.registry";

/**
 * Build a Zod schema from an array of config field definitions
 * Handles required/optional fields and type-specific validation
 */
export function buildZodSchemaFromFields(
  fields: WorkflowNodeConfigField[]
): ZodObject<Record<string, ZodTypeAny>> {
  const shape: Record<string, ZodTypeAny> = {};

  for (const field of fields) {
    if (!field.key || !field.type) continue;

    let fieldSchema: ZodTypeAny;

    switch (field.type) {
      case WorkflowNodeConfigFieldType.String:
      case WorkflowNodeConfigFieldType.Template:
      case WorkflowNodeConfigFieldType.Uuid:
        fieldSchema = z.string();
        break;

      case WorkflowNodeConfigFieldType.Number:
        fieldSchema = z.number();
        break;

      case WorkflowNodeConfigFieldType.Boolean:
        fieldSchema = z.boolean();
        break;

      case WorkflowNodeConfigFieldType.Duration:
        // Duration stored as string like "30m" or "1h"
        fieldSchema = z.string().regex(/^\d+[smhd]$/, "Invalid duration format");
        break;

      case WorkflowNodeConfigFieldType.EntityType:
        // Entity type key
        fieldSchema = z.string();
        break;

      case WorkflowNodeConfigFieldType.EntityQuery:
        // Array of field keys
        fieldSchema = z.array(z.string());
        break;

      case WorkflowNodeConfigFieldType.Enum:
        if (field.options && Object.keys(field.options).length > 0) {
          const enumValues = Object.keys(field.options) as [string, ...string[]];
          fieldSchema = z.enum(enumValues);
        } else {
          fieldSchema = z.string();
        }
        break;

      case WorkflowNodeConfigFieldType.Json:
        fieldSchema = z.record(z.unknown());
        break;

      case WorkflowNodeConfigFieldType.KeyValue:
        fieldSchema = z.record(z.string());
        break;

      default:
        fieldSchema = z.unknown();
    }

    // Apply required/optional
    if (!field.required) {
      fieldSchema = fieldSchema.optional().nullable();
    }

    shape[field.key] = fieldSchema;
  }

  return z.object(shape);
}

/**
 * Build default values object from config field definitions
 * Uses widget registry defaults and field-level defaults
 */
export function buildDefaultValues(
  fields: WorkflowNodeConfigField[]
): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};

  for (const field of fields) {
    if (!field.key || !field.type) continue;

    // Use field-level default if provided
    if (field.defaultValue !== undefined) {
      defaults[field.key] = field.defaultValue;
      continue;
    }

    // Fall back to widget registry default
    const widget = configWidgetRegistry[field.type];
    if (widget) {
      defaults[field.key] = widget.defaultValue;
    } else {
      // Final fallback based on type
      switch (field.type) {
        case WorkflowNodeConfigFieldType.EntityQuery:
          defaults[field.key] = [];
          break;
        case WorkflowNodeConfigFieldType.Json:
        case WorkflowNodeConfigFieldType.KeyValue:
          defaults[field.key] = {};
          break;
        case WorkflowNodeConfigFieldType.Boolean:
          defaults[field.key] = false;
          break;
        case WorkflowNodeConfigFieldType.Number:
          defaults[field.key] = 0;
          break;
        default:
          defaults[field.key] = "";
      }
    }
  }

  return defaults;
}
