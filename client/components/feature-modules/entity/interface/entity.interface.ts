import { SchemaOptions } from "@/lib/interfaces/common.interface";
import {
    components,
    DataFormat,
    DataType,
    EntityPropertyType,
    EntityRelationshipCardinality,
    SchemaType,
} from "@/lib/types/types";

export type EntityType = components["schemas"]["EntityType"];
export type EntityTypeOrderingKey = components["schemas"]["EntityTypeOrderingKey"];
export type Entity = components["schemas"]["Entity"];
export type EntityRelationshipDefinition = components["schemas"]["EntityRelationshipDefinition"];

export interface EntityTypeAttributeData {
    // Persistent Hash map lookup key => Cannot be changed after creation. Also unique identifier for relationships
    key: string;
    // Human readable display name
    label: string;
    type: EntityPropertyType;
    protected?: boolean;
    required: boolean;
}

export interface RelationshipFormData extends EntityTypeAttributeData {
    cardinality: EntityRelationshipCardinality;
    minOccurs?: number;
    maxOccurs?: number;
    entityTypeKeys: string[];
    allowPolymorphic: boolean;
    bidirectional: boolean;
    bidirectionalEntityTypeKeys?: string[];
    inverseName?: string;
    required: boolean;
    targetAttributeName: string | undefined;
}

export interface AttributeFormData extends EntityTypeAttributeData {
    // Key to the relevant schema type
    schemaKey: SchemaType;
    dataType: DataType;
    dataFormat?: DataFormat;
    required: boolean;
    unique: boolean;
    options?: SchemaOptions;
    protected?: boolean;
}

export type CreateEntityTypeRequest = components["schemas"]["CreateEntityTypeRequest"];

export const isAttributeType = (
    data: AttributeFormData | RelationshipFormData
): data is AttributeFormData => {
    return data.type === EntityPropertyType.ATTRIBUTE;
};

export const isRelationshipType = (
    data: AttributeFormData | RelationshipFormData
): data is RelationshipFormData => {
    return data.type === EntityPropertyType.RELATIONSHIP;
};

// Export overlap detection types
export type {
    RelationshipOverlap,
    OverlapResolution,
    OverlapDetectionResult,
} from "../hooks/use-relationship-overlap-detection";
