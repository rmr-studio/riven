// Re-export core entity model types from generated code

export type {
    // Core entity types
    Entity,
    EntityType,
    EntityCategory,
    EntityLink,

    // Attribute system
    EntityAttribute,
    EntityAttributePayload,
    EntityAttributePrimitivePayload,
    EntityAttributeRelationPayload,
    EntityAttributeRelationPayloadReference,
    EntityTypeAttributeColumn,

    // Relationship system
    EntityRelationshipDefinition,
    EntityRelationshipCardinality,

    // Schema types
    SchemaUUID,
    SchemaType,
    DataType,

    // Display types
    DisplayName,
    Icon,
    IconColour,
    IconType,

    // Impact analysis
    EntityImpactSummary,
    EntityTypeImpactResponse,
    EntityTypeRelationshipImpactAnalysis,
    EntityTypeRelationshipDataLossWarning,
    EntityTypeRelationshipDataLossReason,
    EntityTypeRelationshipType,
} from "@/lib/types/models";
