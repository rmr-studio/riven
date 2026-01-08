package riven.core.entity.workflow.execution

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.*
import org.hibernate.annotations.Type
import riven.core.enums.workflow.WorkflowStatus
import riven.core.enums.workflow.WorkflowTriggerType
import riven.core.models.workflow.execution.WorkflowExecutionRecord
import java.time.ZonedDateTime
import java.util.*

@Entity
@Table(name = "workflow_execution_records")
data class WorkflowExecutionEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, columnDefinition = "uuid")
    val id: UUID? = null,

    @Column(name = "workspace_id", nullable = false, columnDefinition = "uuid")
    val workspaceId: UUID,

    @Column(name = "workflow_definition_id", nullable = false, columnDefinition = "uuid")
    val workflowDefinitionId: UUID,
    @Column(name = "workflow_definition_version_id", nullable = false, columnDefinition = "uuid")
    val workflowVersionId: UUID,

    @Column(name = "engine_workflow_id", nullable = false, columnDefinition = "uuid")
    val engineWorkflowId: UUID,
    @Column(name = "engine_run_id", nullable = false, columnDefinition = "uuid")
    val engineRunId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    val status: WorkflowStatus,

    @Enumerated(EnumType.STRING)
    @Column(name = "trigger_type", nullable = false)
    val triggerType: WorkflowTriggerType,


    @Column(name = "started_at", nullable = false, columnDefinition = "timestamptz")
    val startedAt: ZonedDateTime,
    @Column(name = "completed_at", columnDefinition = "timestamptz")
    val completedAt: ZonedDateTime?,
    @Column(name = "duration", nullable = false, columnDefinition = "bigint")
    val durationMs: Long,

    @Type(JsonBinaryType::class)
    @Column(name = "error", columnDefinition = "jsonb")
    val error: Any?,

    @Type(JsonBinaryType::class)
    @Column(name = "input", columnDefinition = "jsonb")
    val input: Any?,

    @Type(JsonBinaryType::class)
    @Column(name = "output", columnDefinition = "jsonb")
    val output: Any?
) {
    fun toModel(): WorkflowExecutionRecord {
        val id: UUID = requireNotNull(this.id)
        return WorkflowExecutionRecord(
            id = id,
            workspaceId = this.workspaceId,
            workflowDefinitionId = this.workflowDefinitionId,
            workflowVersionId = this.workflowVersionId,
            engineWorkflowId = this.engineWorkflowId,
            engineRunId = this.engineRunId,
            status = this.status,
            startedAt = this.startedAt,
            completedAt = this.completedAt,
            duration = java.time.Duration.ofMillis(this.durationMs),
            input = this.input,
            output = this.output,
            error = this.error,
            triggerType = this.triggerType
        )
    }
}