package riven.core.entity.workflow

import jakarta.persistence.*
import riven.core.entity.util.AuditableEntity
import riven.core.models.common.SoftDeletable
import riven.core.models.workflow.WorkflowEdge
import riven.core.models.workflow.WorkflowNode
import java.time.ZonedDateTime
import java.util.*

@Entity
@Table(
    name = "workflow_edges",
    indexes = [
        Index(name = "idx_workflow_edges_source_node_id", columnList = "workspace_id, source_node_id"),
        Index(name = "idx_workflow_edges_target_node_id", columnList = "workspace_id, target_node_id"),
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
) : AuditableEntity(), SoftDeletable{
    fun toModel(source: WorkflowNode, target: WorkflowNode): WorkflowEdge{
        val id = requireNotNull(this.id) { "WorkflowEdgeEntity id cannot be null when converting to model." }
        return WorkflowEdge(
            id = id,
            label = this.label,
            source = source,
            target = target
        )
    }
}