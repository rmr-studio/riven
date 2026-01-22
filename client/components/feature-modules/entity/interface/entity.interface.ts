import { Icon, SchemaUUID } from "@/lib/interfaces/common.interface";
import {
    CreateEntityTypeRequest,
    DataType,
    DeleteAttributeDefinitionRequest,
    DeleteEntityResponse,
    DeleteRelationshipDefinitionRequest,
    DeleteTypeDefinitionRequest,
    Entity,
    EntityAttribute,
    EntityAttributePayload,
    EntityAttributePrimitivePayload,
    EntityAttributeRelationPayload,
    EntityAttributeRelationPayloadReference,
    EntityAttributeRequest,
    EntityLink,
    EntityPropertyType,
    EntityRelationshipCardinality,
    EntityRelationshipDefinition,
    EntityType,
    EntityTypeAttributeColumn,
    EntityTypeImpactResponse,
    SaveAttributeDefinitionRequest,
    SaveEntityRequest,
    SaveEntityResponse,
    SaveRelationshipDefinitionRequest,
    SaveTypeDefinitionRequest,
    SchemaType,
} from "@/lib/types";

export type {
    CreateEntityTypeRequest,
    DeleteAttributeDefinitionRequest,
    DeleteEntityResponse,
    DeleteRelationshipDefinitionRequest,
    DeleteTypeDefinitionRequest,
    Entity,
    EntityAttribute,
    EntityAttributePayload,
    EntityAttributePrimitivePayload,
    EntityAttributeRelationPayload,
    EntityAttributeRelationPayloadReference,
    EntityAttributeRequest,
    EntityLink,
    EntityRelationshipDefinition,
    EntityType,
    EntityTypeAttributeColumn,
    EntityTypeImpactResponse,
    SaveAttributeDefinitionRequest,
    SaveEntityRequest,
    SaveEntityResponse,
    SaveRelationshipDefinitionRequest,
    SaveTypeDefinitionRequest,
};

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

export const isRelationshipPayload = (
    payload: EntityAttributePayload
): payload is EntityAttributeRelationPayload => {
    return payload.type === EntityPropertyType.Relationship;
};

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
