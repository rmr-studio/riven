package riven.core.service.util.factory.workflow

import riven.core.entity.workflow.WorkflowDefinitionEntity
import riven.core.entity.workflow.WorkflowDefinitionVersionEntity
import riven.core.entity.workflow.execution.WorkflowExecutionEntity
import riven.core.entity.workflow.execution.WorkflowExecutionNodeEntity
import riven.core.enums.common.icon.IconColour
import riven.core.enums.common.icon.IconType
import riven.core.enums.workflow.WorkflowDefinitionStatus
import riven.core.enums.workflow.WorkflowStatus
import riven.core.enums.workflow.WorkflowTriggerType
import java.time.ZonedDateTime
import java.util.*

/**
 * Factory for creating workflow-related test data.
 */
object WorkflowFactory {

    /**
     * Create a WorkflowDefinitionEntity for testing.
     */
    fun createDefinition(
        id: UUID = UUID.randomUUID(),
        workspaceId: UUID,
        name: String = "Test Workflow",
        description: String? = null,
        versionNumber: Int = 1,
        status: WorkflowDefinitionStatus = WorkflowDefinitionStatus.DRAFT,
        iconColour: IconColour = IconColour.NEUTRAL,
        iconType: IconType = IconType.WORKFLOW,
        tags: List<String> = emptyList(),
        deleted: Boolean = false,
        deletedAt: ZonedDateTime? = null
    ): WorkflowDefinitionEntity {
        return WorkflowDefinitionEntity(
            id = id,
            workspaceId = workspaceId,
            name = name,
            description = description,
            versionNumber = versionNumber,
            status = status,
            iconColour = iconColour,
            iconType = iconType,
            tags = tags,
            deleted = deleted,
            deletedAt = deletedAt
        )
    }

    /**
     * Create a WorkflowDefinitionVersionEntity for testing.
     */
    fun createVersion(
        id: UUID = UUID.randomUUID(),
        workspaceId: UUID,
        workflowDefinitionId: UUID,
        versionNumber: Int = 1,
        workflow: Any = emptyMap<String, Any>(),
        canvas: Any = emptyMap<String, Any>(),
        deleted: Boolean = false,
        deletedAt: ZonedDateTime? = null
    ): WorkflowDefinitionVersionEntity {
        return WorkflowDefinitionVersionEntity(
            id = id,
            workspaceId = workspaceId,
            workflowDefinitionId = workflowDefinitionId,
            versionNumber = versionNumber,
            workflow = workflow,
            canvas = canvas,
            deleted = deleted,
            deletedAt = deletedAt
        )
    }

    /**
     * Create a WorkflowExecutionEntity for testing.
     */
    fun createExecution(
        id: UUID = UUID.randomUUID(),
        workspaceId: UUID,
        workflowDefinitionId: UUID,
        workflowVersionId: UUID = UUID.randomUUID(),
        engineWorkflowId: UUID = UUID.randomUUID(),
        engineRunId: UUID = UUID.randomUUID(),
        status: WorkflowStatus = WorkflowStatus.RUNNING,
        triggerType: WorkflowTriggerType = WorkflowTriggerType.FUNCTION,
        startedAt: ZonedDateTime = ZonedDateTime.now(),
        completedAt: ZonedDateTime? = null,
        durationMs: Long = 0,
        error: Any? = null,
        input: Any? = null,
        output: Any? = null
    ): WorkflowExecutionEntity {
        return WorkflowExecutionEntity(
            id = id,
            workspaceId = workspaceId,
            workflowDefinitionId = workflowDefinitionId,
            workflowVersionId = workflowVersionId,
            engineWorkflowId = engineWorkflowId,
            engineRunId = engineRunId,
            status = status,
            triggerType = triggerType,
            startedAt = startedAt,
            completedAt = completedAt,
            durationMs = durationMs,
            error = error,
            input = input,
            output = output
        )
    }

    /**
     * Create a WorkflowExecutionNodeEntity for testing.
     */
    fun createNodeExecution(
        id: UUID = UUID.randomUUID(),
        workspaceId: UUID,
        workflowExecutionId: UUID,
        nodeId: UUID,
        sequenceIndex: Int = 0,
        status: WorkflowStatus = WorkflowStatus.COMPLETED,
        startedAt: ZonedDateTime = ZonedDateTime.now(),
        completedAt: ZonedDateTime? = ZonedDateTime.now(),
        durationMs: Long = 100,
        attempt: Int = 1,
        error: Any = emptyMap<String, Any>(),
        input: Any? = null,
        output: Any? = null
    ): WorkflowExecutionNodeEntity {
        return WorkflowExecutionNodeEntity(
            id = id,
            workspaceId = workspaceId,
            workflowExecutionId = workflowExecutionId,
            nodeId = nodeId,
            sequenceIndex = sequenceIndex,
            status = status,
            startedAt = startedAt,
            completedAt = completedAt,
            durationMs = durationMs,
            attempt = attempt,
            error = error,
            input = input,
            output = output
        )
    }
}
