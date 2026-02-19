package riven.core.entity.entity

import jakarta.persistence.*
import riven.core.entity.util.AuditableEntity
import riven.core.enums.entity.EntityRelationshipCardinality
import riven.core.models.entity.RelationshipTargetRule
import java.util.*

@Entity
@Table(
    name = "relationship_target_rules",
    indexes = [
        Index(name = "idx_target_rule_def", columnList = "relationship_definition_id"),
        Index(name = "idx_target_rule_type", columnList = "target_entity_type_id"),
    ]
)
data class RelationshipTargetRuleEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, columnDefinition = "uuid")
    val id: UUID? = null,

    @Column(name = "relationship_definition_id", nullable = false, columnDefinition = "uuid")
    val relationshipDefinitionId: UUID,

    @Column(name = "target_entity_type_id", nullable = true, columnDefinition = "uuid")
    val targetEntityTypeId: UUID?,

    @Column(name = "semantic_type_constraint", nullable = true)
    val semanticTypeConstraint: String?,

    @Enumerated(EnumType.STRING)
    @Column(name = "cardinality_override", nullable = true)
    val cardinalityOverride: EntityRelationshipCardinality?,

    @Column(name = "inverse_visible", nullable = false)
    var inverseVisible: Boolean = false,

    @Column(name = "inverse_name", nullable = true)
    var inverseName: String?,
) : AuditableEntity() {

    fun toModel(): RelationshipTargetRule {
        val id = requireNotNull(this.id) { "RelationshipTargetRuleEntity ID cannot be null" }
        return RelationshipTargetRule(
            id = id,
            relationshipDefinitionId = this.relationshipDefinitionId,
            targetEntityTypeId = this.targetEntityTypeId,
            semanticTypeConstraint = this.semanticTypeConstraint,
            cardinalityOverride = this.cardinalityOverride,
            inverseVisible = this.inverseVisible,
            inverseName = this.inverseName,
            createdAt = this.createdAt,
            updatedAt = this.updatedAt,
        )
    }
}
