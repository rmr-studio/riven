import {
    Condition,
    FormStructure,
    Icon,
    SchemaOptions,
    SchemaString,
    SchemaUUID,
} from "@/lib/types";

export type { Condition, FormStructure, Icon, SchemaOptions, SchemaUUID };

// Basic schema type that enforces string based key identification
export type Schema = SchemaString;

// Custom local type (not in OpenAPI spec)
export interface Address {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
}
