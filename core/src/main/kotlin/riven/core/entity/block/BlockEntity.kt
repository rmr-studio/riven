package riven.core.entity.block

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.*
import org.hibernate.annotations.Type
import riven.core.entity.util.AuditableEntity
import riven.core.models.block.Block
import riven.core.models.block.metadata.Metadata
import riven.core.models.common.SoftDeletable
import java.time.ZonedDateTime
import java.util.*

@Entity
@Table(name = "blocks")
data class BlockEntity(

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, columnDefinition = "uuid")
    val id: UUID? = null,

    @Column(name = "workspace_id", nullable = false)
    val workspaceId: UUID,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type_id", nullable = false)
    val type: BlockTypeEntity,

    @Column(name = "name", nullable = true)
    var name: String? = null,

    @Type(JsonBinaryType::class)
    @Column(name = "payload", columnDefinition = "jsonb", nullable = false)
    var payload: Metadata,

    @Column(name = "deleted", columnDefinition = "boolean default false")
    override var deleted: Boolean = false,

    @Column(name = "deleted_at", nullable = true)
    override var deletedAt: ZonedDateTime? = null
) : AuditableEntity(), SoftDeletable {

    fun toModel(audit: Boolean = false): Block {
        val id = requireNotNull(this.id) { "BlockEntity ID cannot be null when converting to model" }
        return Block(
            id = id,
            workspaceId = this.workspaceId,
            type = this.type.toModel(),
            name = this.name,
            payload = this.payload,
            deleted = this.deleted,
            validationErrors = this.payload.meta.validationErrors.ifEmpty { null },
            createdAt = if (audit) this.createdAt else null,
            updatedAt = if (audit) this.updatedAt else null,
            createdBy = if (audit) this.createdBy else null,
            updatedBy = if (audit) this.updatedBy else null,
        )
    }


}

