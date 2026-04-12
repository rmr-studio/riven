'use client';

import { entityFieldWidgetRegistry } from '@/components/feature-modules/entity/components/forms/instance/entity-field-registry';
import { AttributeFormValues } from '@/components/feature-modules/entity/hooks/form/type/use-schema-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { DynamicDefaultFunction, SchemaType, SchemaUUID } from '@/lib/types/common';
import {
  dynamicFunctionDescriptions,
  dynamicFunctionLabels,
  dynamicFunctionsForType,
} from '@/lib/util/form/default-value.util';
import { attributeTypes } from '@/lib/util/form/schema.util';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@riven/ui/select';
import { FC, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';

export const TYPES_WITHOUT_DEFAULT = new Set([
  SchemaType.FileAttachment,
  SchemaType.Object,
  SchemaType.Location,
]);

type DefaultValueMode = 'none' | 'static' | 'dynamic';

const modeLabels: Record<DefaultValueMode, string> = {
  none: 'No default',
  static: 'Static value',
  dynamic: 'Dynamic',
};

interface DefaultValueInputProps {
  currentType: SchemaType;
  form: UseFormReturn<AttributeFormValues>;
  enumValues?: string[];
}

export const DefaultValueInput: FC<DefaultValueInputProps> = ({
  currentType,
  form,
  enumValues,
}) => {
  if (TYPES_WITHOUT_DEFAULT.has(currentType)) return null;

  const mode = form.watch('defaultValueMode') as DefaultValueMode;
  const availableDynamicFunctions = dynamicFunctionsForType[currentType] ?? [];
  const hasDynamicOptions = availableDynamicFunctions.length > 0;

  const availableModes: DefaultValueMode[] = hasDynamicOptions
    ? ['none', 'static', 'dynamic']
    : ['none', 'static'];

  // Clear the other mode's value when switching
  useEffect(() => {
    if (mode === 'none') {
      form.setValue('defaultStaticValue', undefined);
      form.setValue('defaultDynamicFunction', null);
    } else if (mode === 'static') {
      form.setValue('defaultDynamicFunction', null);
    } else if (mode === 'dynamic') {
      form.setValue('defaultStaticValue', undefined);
      // Auto-select the first available function if none is set
      const currentFn = form.getValues('defaultDynamicFunction');
      if (!currentFn && availableDynamicFunctions.length > 0) {
        form.setValue('defaultDynamicFunction', availableDynamicFunctions[0]);
      }
    }
  }, [mode]);

  return (
    <div className="space-y-3">
      <FormField
        control={form.control}
        name="defaultValueMode"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-normal">Default value</FormLabel>
            <FormDescription className="text-xs">
              Existing records with no value will be backfilled with this default
            </FormDescription>
            <Select onValueChange={field.onChange} value={field.value ?? 'none'}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {availableModes.map((m) => (
                  <SelectItem key={m} value={m}>
                    {modeLabels[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      {mode === 'static' && <StaticValueWidget currentType={currentType} form={form} enumValues={enumValues} />}
      {mode === 'dynamic' && (
        <DynamicFunctionSelect form={form} availableFunctions={availableDynamicFunctions} />
      )}
    </div>
  );
};

/** Renders the type-specific widget for entering a static default value. */
const StaticValueWidget: FC<{
  currentType: SchemaType;
  form: UseFormReturn<AttributeFormValues>;
  enumValues?: string[];
}> = ({ currentType, form, enumValues }) => {
  const Widget = entityFieldWidgetRegistry[currentType];
  if (!Widget) return null;

  const attrType = attributeTypes[currentType];
  if (!attrType) return null;

  const schema: SchemaUUID = {
    key: attrType.key,
    type: attrType.type,
    format: attrType.format,
    icon: attrType.icon,
    required: false,
    unique: false,
    _protected: false,
    options: attrType.options,
  };

  const options =
    enumValues && enumValues.length > 0
      ? enumValues.map((v) => ({ label: v, value: v }))
      : undefined;

  return (
    <FormField
      control={form.control}
      name="defaultStaticValue"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Widget
              value={field.value ?? (currentType === SchemaType.Checkbox ? false : '')}
              onChange={field.onChange}
              onBlur={field.onBlur}
              schema={schema}
              placeholder="Enter default value..."
              options={options}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
};

/** Renders a select dropdown for choosing a dynamic default function. */
const DynamicFunctionSelect: FC<{
  form: UseFormReturn<AttributeFormValues>;
  availableFunctions: DynamicDefaultFunction[];
}> = ({ form, availableFunctions }) => {
  return (
    <FormField
      control={form.control}
      name="defaultDynamicFunction"
      render={({ field }) => (
        <FormItem>
          <Select onValueChange={field.onChange} value={field.value ?? ''}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select function..." />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {availableFunctions.map((fn) => (
                <SelectItem key={fn} value={fn} textValue={dynamicFunctionLabels[fn]}>
                  <div className="flex flex-col gap-0.5">
                    <span>{dynamicFunctionLabels[fn]}</span>
                    <span className="text-xs text-muted-foreground">
                      {dynamicFunctionDescriptions[fn]}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>
      )}
    />
  );
};
