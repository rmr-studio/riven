import { Icon, SchemaUUID } from "@/lib/interfaces/common.interface";
import {
    components,
    EntityPropertyType,
    EntityRelationshipCardinality,
    EntityTypeRelationshipType,
} from "@/lib/types/types";

export type EntityType = components["schemas"]["EntityType"];
export type EntityTypeOrderingKey = components["schemas"]["EntityTypeOrderingKey"];
export type Entity = components["schemas"]["Entity"];
export type EntityRelationshipDefinition = components["schemas"]["EntityRelationshipDefinition"];

export interface EntityTypeAttributeData {
    // Persistent Hash map lookup uuid => Cannot be changed after creation. Also unique identifier for relationships
    id: string;
    // Human readable display name
    label: string;
    type: EntityPropertyType;
    protected?: boolean;
    required: boolean;
}

export interface RelationshipFormData extends EntityTypeAttributeData {
    entityTypeKeys: string[];

    relationshipType: EntityTypeRelationshipType;
    sourceEntityTypeKey: string;
    originRelationshipId?: string;

    allowPolymorphic: boolean;
    bidirectional: boolean;
    bidirectionalEntityTypeKeys?: string[];
    cardinality: EntityRelationshipCardinality;

    inverseName?: string;
    required: boolean;
}

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

export type TypeDefinitionRequest = components["schemas"]["TypeDefinitionRequest"];
export type SaveRelationshipDefinitionRequest =
    components["schemas"]["SaveRelationshipDefinitionRequest"];
export type SaveAttributeDefinitionRequest =
    components["schemas"]["SaveAttributeDefinitionRequest"];

export interface EntityAttributeDefinition {
    id: string;
    schema: SchemaUUID;
}
