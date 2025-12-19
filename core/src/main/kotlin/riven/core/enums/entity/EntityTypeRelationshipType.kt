package riven.core.enums.entity

enum class EntityRelationshipType {
    REFERENCE, // The authoritative/owning definition
    ORIGIN; // An inverse pointer back to the ORIGIN definition. Located via `sourceEntityTypeKey`

}