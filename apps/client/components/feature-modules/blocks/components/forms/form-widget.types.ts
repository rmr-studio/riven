import type { Schema, SchemaUUID } from '@/lib/interfaces/common.interface';
import { ComponentType } from 'react';

/**
 * Base props interface for all form widgets
 */
export interface FormWidgetProps<T = any> {
  value: T;
  onChange: (value: T) => void;
  onBlur?: () => void;
  label?: string;
  description?: string;
  placeholder?: string;
  schema: SchemaUUID | Schema;
  disabled?: boolean;
  errors?: string[];
  displayError?: 'message' | 'tooltip' | 'none';
  options?: Array<{ label: string; value: string }>;
  autoFocus?: boolean;
}

/**
 * Widget metadata for registry
 */
export interface FormWidgetMeta {
  type: string;
  component: ComponentType<FormWidgetProps<any>>;
  defaultValue?: any;
}
