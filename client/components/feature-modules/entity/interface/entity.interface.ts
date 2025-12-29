import { Icon, SchemaUUID } from "@/lib/interfaces/common.interface";
import {
    components,
    DataType,
    EntityPropertyType,
    EntityRelationshipCardinality,
    SchemaType,
} from "@/lib/types/types";

export type EntityType = components["schemas"]["EntityType"];
export type EntityTypeOrderingKey = components["schemas"]["EntityTypeOrderingKey"];
export type Entity = components["schemas"]["Entity"];
export type EntityRelationshipDefinition = components["schemas"]["EntityRelationshipDefinition"];

export interface EntityTypeDefinition {
    id: string;
    type: EntityPropertyType;
    definition: EntityAttributeDefinition | EntityRelationshipDefinition;
}

export const isRelationshipDefinition = (
    attribute: EntityRelationshipDefinition | EntityAttributeDefinition
): attribute is EntityRelationshipDefinition => {
    return !("schema" in attribute);
};

export const isAttributeDefinition = (
    attribute: EntityRelationshipDefinition | EntityAttributeDefinition
): attribute is EntityAttributeDefinition => {
    return "schema" in attribute;
};

export type CreateEntityTypeRequest = components["schemas"]["CreateEntityTypeRequest"];

export enum RelationshipLimit {
    SINGULAR,
    MANY,
}

export interface EntityRelationshipCandidate {
    icon: Icon;
    name: string;
    key: string;
    existingRelationship: EntityRelationshipDefinition;
}

// Export overlap detection types
export type {
    OverlapDetectionResult,
    OverlapResolution,
    RelationshipOverlap,
} from "../hooks/use-relationship-overlap-detection";

export type EntityTypeImpactResponse = components["schemas"]["EntityTypeImpactResponse"];

export type SaveTypeDefinitionRequest = components["schemas"]["SaveTypeDefinitionRequest"];
export type SaveRelationshipDefinitionRequest =
    components["schemas"]["SaveRelationshipDefinitionRequest"];
export type SaveAttributeDefinitionRequest =
    components["schemas"]["SaveAttributeDefinitionRequest"];

export type DeleteTypeDefinitionRequest = components["schemas"]["DeleteTypeDefinitionRequest"];
export type DeleteAttributeDefinitionRequest =
    components["schemas"]["DeleteAttributeDefinitionRequest"];
export type DeleteRelationshipDefinitionRequest =
    components["schemas"]["DeleteRelationshipDefinitionRequest"];

export interface EntityAttributeDefinition {
    id: string;
    schema: SchemaUUID;
}

export interface EntityTypeAttributeRow {
    // Persistent Hash map lookup uuid => Cannot be changed after creation. Also unique identifier for relationships
    id: string;
    // Human readable display name
    label: string;
    type: EntityPropertyType;
    protected?: boolean;
    required: boolean;
    schemaType: SchemaType | "RELATIONSHIP";
    additionalConstraints: string[];
    dataType?: DataType;
    unique?: boolean;
    // Relationship-specific fields (optional for attributes)
    cardinality?: EntityRelationshipCardinality;
    entityTypeKeys?: string[];
    allowPolymorphic?: boolean;
    bidirectional?: boolean;
}

/**
 * Props interface for entity field widgets
 * Used for rendering inline editable fields in draft rows
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
 * Props interface for relationship picker component
 * Used for selecting related entities in draft rows
 */
export interface RelationshipPickerProps {
    relationship: EntityRelationshipDefinition;
    value: string | string[] | null;
    onChange: (value: string | string[] | null) => void;
    onBlur: () => void;
    errors?: string[];
    disabled?: boolean;
}

export type EntityAttributePrimitivePayload =
    components["schemas"]["EntityAttributePrimitivePayload"];
export type EntityAttributeRelationPayloadReference =
    components["schemas"]["EntityAttributeRelationPayloadReference"];
export type SaveEntityRequest = components["schemas"]["SaveEntityRequest"];
export type SaveEntityResponse = components["schemas"]["SaveEntityResponse"];
export type EntityAttributeRequest = components["schemas"]["EntityAttributeRequest"];
