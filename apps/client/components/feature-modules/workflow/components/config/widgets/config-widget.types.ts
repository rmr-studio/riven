import type { ComponentType } from "react";
import type { WorkflowNodeConfigFieldType } from "@/lib/types/models/WorkflowNodeConfigFieldType";

/**
 * Props passed to all config widget components
 * Widgets receive field metadata and form control props
 */
export interface ConfigWidgetProps<T = unknown> {
  /** Field value from form */
  value: T;
  /** Callback when value changes */
  onChange: (value: T) => void;
  /** Callback when field loses focus */
  onBlur?: () => void;
  /** Field label from schema */
  label?: string;
  /** Field description from schema */
  description?: string;
  /** Placeholder text from schema */
  placeholder?: string;
  /** Whether field is required */
  required?: boolean;
  /** Validation errors to display */
  errors?: string[];
  /** Options for enum/select fields - key is value, value is display label */
  options?: Record<string, string>;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Workspace ID for entity-related widgets */
  workspaceId?: string;
}

/**
 * Metadata for a registered widget type
 */
export interface ConfigWidgetMeta {
  /** The field type this widget handles */
  type: WorkflowNodeConfigFieldType;
  /** React component to render */
  component: ComponentType<ConfigWidgetProps<any>>;
  /** Default value when field is empty */
  defaultValue: unknown;
}
