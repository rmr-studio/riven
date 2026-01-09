package riven.core.entity.workflow

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.*
import org.hibernate.annotations.Type
import riven.core.entity.util.AuditableEntity
import riven.core.models.common.SoftDeletable
import java.util.*

@Entity
@Table(
    name = "workflow_definition_versions",
    indexes = [
        Index(name = "idx_workflow_definition_versions_workspace_id", columnList = "workspace_id"),
        Index(
            name = "idx_workflow_definition_versions_definition",
            columnList = "workspace_id, workflow_definition_id"
        ),
    ]
)
data class WorkflowDefinitionVersionEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,

    @Column(name = "workspace_id", nullable = false, columnDefinition = "uuid")
    val workspaceId: UUID,

    @Column(name = "workflow_definition_id", nullable = false, columnDefinition = "uuid")
    val workflowDefinitionId: UUID,

    @Column(name = "version_number", nullable = false)
    val versionNumber: Int,

    @Type(JsonBinaryType::class)
    @Column(name = "workflow", nullable = false, columnDefinition = "jsonb")
    val workflow: Any,

    @Type(JsonBinaryType::class)
    @Column(name = "canvas", nullable = false, columnDefinition = "jsonb")
    val canvas: Any,

    @Column(name = "deleted", nullable = false)
    override var deleted: Boolean = false,

    @Column(name = "deleted_at", columnDefinition = "timestamptz")
    override var deletedAt: java.time.ZonedDateTime? = null


) : AuditableEntity(), SoftDeletable