// Entity domain barrel - aggregates all entity type exports

export type * from "./models";
export type * from "./requests";
export type * from "./responses";
export * from "./guards";
export * from "./custom";

// Enum value exports (runtime values, not just types)
export {
  EntityPropertyType,
  EntityCategory,
  EntityRelationshipCardinality,
  EntityTypeRelationshipType,
  EntityTypeRequestDefinition,
  SchemaType,
  DataType,
  OptionSortingType,
  DeleteAction,
} from "@/lib/types/models";
