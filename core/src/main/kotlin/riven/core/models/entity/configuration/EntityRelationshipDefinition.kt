package riven.core.models.entity.configuration

import riven.core.entity.util.AuditableModel
import riven.core.enums.common.IconColour
import riven.core.enums.common.IconType
import riven.core.enums.entity.EntityRelationshipCardinality
import riven.core.enums.entity.EntityTypeRelationshipType
import riven.core.models.common.Icon
import riven.core.models.entity.validation.ValidEntityRelationshipDefinition
import java.time.ZonedDateTime
import java.util.*

/**
 * Defines a relationship requirement for a RELATIONSHIP entity type.
 *
 * @property id Unique Id for each relationship definition
 * @property name Human-readable label for the relationship (e.g., "Candidate", "Job Posting", "Target Entity")
 * @property required True if this relationship must exist and have defined values
 * @property entityTypeKeys List of allowed entity type keys (e.g., ["candidate", "job"]) or null for polymorphic
 * @property allowPolymorphic True if this relationship can link to any entity type (polymorphic slot)
 * @property bidirectional True if the relationship is bidirectional
 *
 * Relationships allow for:
 *  1. Singular Entity Relationships
 *    - Normal relationships => Restricted to one specific entity type
 *  2. Polymorphic Entity Relationships
 *    - Relationship open to any entity type
 *  3. Strict Multi-Entity Type Relationships
 *    - Restricted to specific entity types
 *    - Example: Task.assignee → [Person, Team] (not polymorphic, just 2 specific types)
 *
 */
@ValidEntityRelationshipDefinition
data class EntityRelationshipDefinition(
    val id: UUID,
    val icon: Icon = Icon(
        icon = IconType.LINK,
        colour = IconColour.NEUTRAL
    ),

    var name: String,

    // Source context
    val relationshipType: EntityTypeRelationshipType,
    val sourceEntityTypeKey: String, // Linking to the source entity type
    val originRelationshipId: UUID? = null, // Linking to the relationship WITHIN the source entity type. Provided this is a REFERENCE

    // Relationship Target Specification
    var entityTypeKeys: List<String>? = null,
    var allowPolymorphic: Boolean = false,

    // Constraints
    val required: Boolean, // Required relationships are only enforced on RELATIONSHIP entity types
    var cardinality: EntityRelationshipCardinality,

    // Bidirectional config
    var bidirectional: Boolean = false,
    /**
     * Subset of Entity Types (located within in `entityTypeKeys` to maintain a bi-directional relationship for
     * Is required to be non-null when `bidirectional` is true
     */
    var bidirectionalEntityTypeKeys: List<String>? = null,
    var inverseName: String? = null, // Default Naming for Inverse Relationship Columns. Will populate `name` when creating an inverse relationship definition

    val protected: Boolean = false,
    override val createdAt: ZonedDateTime?,
    override val updatedAt: ZonedDateTime?,
    override val createdBy: UUID?,
    override val updatedBy: UUID?
) : AuditableModel()