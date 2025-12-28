import type { Schema, SchemaUUID } from "@/lib/interfaces/common.interface";
import { ComponentType } from "react";

/**
 * Base props interface for all form widgets
 */
export interface FormWidgetProps<T = any> {
    value: T;
    onChange: (value: T) => void;
    onBlur?: () => void;
    label?: string;
    description?: string;
    tooltip?: string;
    placeholder?: string;
    errors?: string[];
    schema: SchemaUUID | Schema
    disabled?: boolean;
    options?: Array<{ label: string; value: string }>;
}

/**
 * Widget metadata for registry
 */
export interface FormWidgetMeta {
    type: string;
    component: ComponentType<FormWidgetProps<any>>;
    defaultValue?: any;
}
