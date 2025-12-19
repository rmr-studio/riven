package riven.core.enums.entity

enum class EntityTypeRelationshipType {
    REFERENCE, // The authoritative/owning definition
    ORIGIN; // An inverse pointer back to the ORIGIN definition. Located via `sourceEntityTypeKey`

}