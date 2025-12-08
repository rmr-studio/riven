package riven.core.enums.entity

/**
 * Defines the category of an entity type.
 *
 * - STANDARD: Standalone entities that can exist independently or have relationships
 * - RELATIONSHIP: Entities that MUST connect 2+ other entities with metadata
 */
enum class EntityCategory {
    /**
     * Standard entities can exist standalone or link to other entities.
     * Examples: Candidate, Company, Job, Invoice, Project
     */
    STANDARD,

    /**
     * Relationship entities MUST connect 2 or more other entities.
     * Examples: Placement (connects Job + Candidate + Company),
     *           Application (connects Job + Candidate),
     *           Comment (connects User + Target Entity)
     */
    RELATIONSHIP
}
