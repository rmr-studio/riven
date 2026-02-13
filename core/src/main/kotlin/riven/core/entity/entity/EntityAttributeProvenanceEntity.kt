package riven.core.entity.entity

import jakarta.persistence.*
import riven.core.enums.integration.SourceType
import java.time.ZonedDateTime
import java.util.*

/**
 * JPA entity for attribute-level provenance tracking.
 * Tracks the source of individual entity attributes for multi-source entities.
 */
@Entity
@Table(
    name = "entity_attribute_provenance",
    uniqueConstraints = [UniqueConstraint(columnNames = ["entity_id", "attribute_id"])]
)
data class EntityAttributeProvenanceEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "uuid")
    val id: UUID? = null,

    @Column(name = "entity_id", nullable = false)
    val entityId: UUID,

    @Column(name = "attribute_id", nullable = false)
    val attributeId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false)
    val sourceType: SourceType,

    @Column(name = "source_integration_id")
    val sourceIntegrationId: UUID? = null,

    @Column(name = "source_external_field")
    val sourceExternalField: String? = null,

    @Column(name = "last_updated_at", nullable = false)
    var lastUpdatedAt: ZonedDateTime = ZonedDateTime.now(),

    @Column(name = "override_by_user", nullable = false)
    var overrideByUser: Boolean = false,

    @Column(name = "override_at")
    var overrideAt: ZonedDateTime? = null
)
