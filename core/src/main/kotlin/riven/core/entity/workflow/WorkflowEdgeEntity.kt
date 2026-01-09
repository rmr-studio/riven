package riven.core.entity.workflow

import jakarta.persistence.*
import riven.core.entity.util.AuditableEntity
import riven.core.models.common.SoftDeletable
import java.time.ZonedDateTime
import java.util.*

@Entity
@Table(
    name = "workflow_edges",
    indexes = [
        Index(name = "idx_workflow_edges_source_node_id", columnList = "workflow_id, source_node_id"),
        Index(name = "idx_workflow_edges_target_node_id", columnList = "workflow_id, target_node_id"),
    ]
)

data class WorkflowEdgeEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, columnDefinition = "uuid")
    val id: UUID? = null,

    @Column(name = "workspace_id", nullable = false)
    val workspaceId: UUID,

    @Column(name = "source_node_id", nullable = false, columnDefinition = "uuid")
    val sourceNodeId: UUID,

    @Column(name = "target_node_id", nullable = false, columnDefinition = "uuid")
    val targetNodeId: UUID,

    @Column(name = "label", nullable = true)
    val label: String? = null,

    @Column(name = "deleted", columnDefinition = "boolean default false")
    override var deleted: Boolean = false,

    @Column(name = "deleted_at", nullable = true)
    override var deletedAt: ZonedDateTime? = null
) : AuditableEntity(), SoftDeletable