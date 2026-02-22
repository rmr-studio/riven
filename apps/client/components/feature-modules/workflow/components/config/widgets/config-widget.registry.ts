import { WorkflowNodeConfigFieldType } from "@/lib/types/models/WorkflowNodeConfigFieldType";
import type { ConfigWidgetMeta } from "./config-widget.types";
import { StringWidget } from "./string-widget";
import { NumberWidget } from "./number-widget";
import { BooleanWidget } from "./boolean-widget";
import { EnumWidget } from "./enum-widget";
import { DurationWidget } from "./duration-widget";
import { EntityTypeWidget } from "./entity-type-widget";
import { EntityFieldsWidget } from "./entity-fields-widget";
import { KeyValueWidget } from "./key-value-widget";

/**
 * Registry mapping WorkflowNodeConfigFieldType to widget implementations
 * Used by NodeConfigForm to render fields dynamically
 */
export const configWidgetRegistry: Partial<
  Record<WorkflowNodeConfigFieldType, ConfigWidgetMeta>
> = {
  [WorkflowNodeConfigFieldType.String]: {
    type: WorkflowNodeConfigFieldType.String,
    component: StringWidget,
    defaultValue: "",
  },
  [WorkflowNodeConfigFieldType.Number]: {
    type: WorkflowNodeConfigFieldType.Number,
    component: NumberWidget,
    defaultValue: 0,
  },
  [WorkflowNodeConfigFieldType.Boolean]: {
    type: WorkflowNodeConfigFieldType.Boolean,
    component: BooleanWidget,
    defaultValue: false,
  },
  [WorkflowNodeConfigFieldType.Enum]: {
    type: WorkflowNodeConfigFieldType.Enum,
    component: EnumWidget,
    defaultValue: "",
  },
  [WorkflowNodeConfigFieldType.Duration]: {
    type: WorkflowNodeConfigFieldType.Duration,
    component: DurationWidget,
    defaultValue: "",
  },
  [WorkflowNodeConfigFieldType.EntityType]: {
    type: WorkflowNodeConfigFieldType.EntityType,
    component: EntityTypeWidget,
    defaultValue: null,
  },
  [WorkflowNodeConfigFieldType.EntityQuery]: {
    type: WorkflowNodeConfigFieldType.EntityQuery,
    component: EntityFieldsWidget,
    defaultValue: [],
  },
  [WorkflowNodeConfigFieldType.KeyValue]: {
    type: WorkflowNodeConfigFieldType.KeyValue,
    component: KeyValueWidget,
    defaultValue: {},
  },
};

/**
 * Get widget metadata for a field type
 * Returns undefined if no widget registered for type
 */
export function getWidgetForType(
  type: WorkflowNodeConfigFieldType
): ConfigWidgetMeta | undefined {
  return configWidgetRegistry[type];
}
