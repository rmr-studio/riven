package riven.core.entity.entity

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.*
import org.hibernate.annotations.Type
import java.time.ZonedDateTime
import java.util.*

@Entity
@Table(
    name = "archived_entities",
    indexes = [
        Index(name = "idx_archived_entities_organisation_id", columnList = "organisation_id"),
        Index(name = "idx_archived_entities_type_id", columnList = "type_id"),

    ]
)
data class ArchivedEntityEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, columnDefinition = "uuid")
    val id: UUID? = null,

    @Column(name = "organisation_id", nullable = false)
    val organisationId: UUID,

    @Column(name = "archived_at", nullable = false)
    val archivedAt: ZonedDateTime,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type_id", nullable = false)
    val type: EntityTypeEntity,

    @Column(name = "type_version", nullable = false)
    var typeVersion: Int,

    @Column(name = "name", nullable = true)
    var name: String? = null,

    @Type(JsonBinaryType::class)
    @Column(name = "payload", columnDefinition = "jsonb", nullable = false)
    var payload: Map<String, Any>,
)