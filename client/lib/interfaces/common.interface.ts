import { components } from "../types/types";

export type Address = components["schemas"]["Address"];
export type Condition = components["schemas"]["Condition"];
export type SchemaOptions = components["schemas"]["SchemaOptions"];
export type FormStructure = components["schemas"]["FormStructure"];
export type Icon = components["schemas"]["Icon"];

// Basic schema type that enforces string based key identification
export type Schema = components["schemas"]["SchemaString"];

// Schema that enforce UUID based keys for identification
export type SchemaUUID = components["schemas"]["SchemaUUID"];
