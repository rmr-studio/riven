import { Icon, SchemaUUID } from "@/lib/interfaces/common.interface";
import { components, EntityPropertyType } from "@/lib/types/types";

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

export type TypeDefinitionRequest = components["schemas"]["TypeDefinitionRequest"];
export type SaveRelationshipDefinitionRequest =
    components["schemas"]["SaveRelationshipDefinitionRequest"];
export type SaveAttributeDefinitionRequest =
    components["schemas"]["SaveAttributeDefinitionRequest"];

export interface EntityAttributeDefinition {
    id: string;
    schema: SchemaUUID;
}
