package riven.core.entity.workflow

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.*
import org.hibernate.annotations.Type
import riven.core.entity.util.AuditableEntity
import riven.core.enums.workflow.WorkflowNodeType
import java.util.*

@Entity
@Table(name = "workflow_node")
data class WorkflowNodeEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, columnDefinition = "uuid")
    val id: UUID? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    val type: WorkflowNodeType,

    @Column(name = "workspace_id", nullable = false, columnDefinition = "uuid")
    val workspaceId: UUID,

    @Column(name = "name", nullable = false)
    val name: String,

    @Column(name = "version", nullable = false)
    val version: Int = 1,

    @Type(JsonBinaryType::class)
    @Column(name = "description", columnDefinition = "jsonb")
    val description: String? = null,


    ) : AuditableEntity()