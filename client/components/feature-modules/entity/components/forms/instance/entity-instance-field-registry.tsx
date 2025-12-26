import { SchemaType } from "@/lib/types/types";
import { SchemaUUID } from "@/lib/interfaces/common.interface";
import { FC } from "react";

// Import existing widgets from blocks module
import { TextInputWidget } from "@/components/feature-modules/blocks/components/forms/widgets/text-input-widget";
import { NumberInputWidget } from "@/components/feature-modules/blocks/components/forms/widgets/number-input-widget";
import { CheckboxWidget } from "@/components/feature-modules/blocks/components/forms/widgets/checkbox-widget";
import { DatePickerWidget } from "@/components/feature-modules/blocks/components/forms/widgets/date-picker-widget";
import { DropdownWidget } from "@/components/feature-modules/blocks/components/forms/widgets/dropdown-widget";
import { FileUploadWidget } from "@/components/feature-modules/blocks/components/forms/widgets/file-upload-widget";
import { SliderWidget } from "@/components/feature-modules/blocks/components/forms/widgets/slider-widget";
import { EmailInputWidget } from "@/components/feature-modules/blocks/components/forms/widgets/email-input-widget";
import { PhoneInputWidget } from "@/components/feature-modules/blocks/components/forms/widgets/phone-input-widget";
import { CurrencyInputWidget } from "@/components/feature-modules/blocks/components/forms/widgets/currency-input-widget";
import { TextareaWidget } from "@/components/feature-modules/blocks/components/forms/widgets/textarea-widget";

/**
 * Props interface for entity field widgets
 * Extends the base FormWidgetProps with schema-specific data
 */
export interface EntityFieldWidgetProps {
    value: any;
    onChange: (value: any) => void;
    onBlur: () => void;
    disabled?: boolean;
    schema: SchemaUUID;
    errors?: string[];
}

/**
 * Registry mapping SchemaType to widget components
 * Reuses existing widgets from blocks module where possible
 */
export const entityFieldWidgetRegistry: Record<
    SchemaType,
    FC<EntityFieldWidgetProps>
> = {
    [SchemaType.TEXT]: TextInputWidget as any,
    [SchemaType.NUMBER]: NumberInputWidget as any,
    [SchemaType.CHECKBOX]: CheckboxWidget as any,
    [SchemaType.EMAIL]: EmailInputWidget as any,
    [SchemaType.PHONE]: PhoneInputWidget as any,
    [SchemaType.DATE]: DatePickerWidget as any,
    [SchemaType.DATETIME]: DatePickerWidget as any, // with time enabled via schema
    [SchemaType.CURRENCY]: CurrencyInputWidget as any,
    [SchemaType.PERCENTAGE]: NumberInputWidget as any, // will show % suffix
    [SchemaType.RATING]: SliderWidget as any,
    [SchemaType.SELECT]: DropdownWidget as any,
    [SchemaType.MULTI_SELECT]: DropdownWidget as any, // TODO: Create MultiSelectWidget
    [SchemaType.URL]: TextInputWidget as any, // with URL validation
    [SchemaType.LOCATION]: TextInputWidget as any, // TODO: Create LocationWidget (simple text for now)
    [SchemaType.FILE_ATTACHMENT]: FileUploadWidget as any,
    [SchemaType.OBJECT]: TextareaWidget as any, // TODO: Create JsonEditorWidget (textarea for now)
};

/**
 * Get widget component for a given schema
 */
export function getWidgetForSchema(schema: SchemaUUID): FC<EntityFieldWidgetProps> {
    return entityFieldWidgetRegistry[schema.key];
}

/**
 * Check if a schema type has a widget implementation
 */
export function hasWidgetForSchema(schema: SchemaUUID): boolean {
    return schema.key in entityFieldWidgetRegistry;
}
