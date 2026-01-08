package riven.core.entity.workflow

import jakarta.persistence.*
import riven.core.entity.util.AuditableEntity
import java.util.*

@Entity
@Table(name = "workflow_edge")
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
) : AuditableEntity()