package riven.core.service.util.factory.workflow

import riven.core.entity.workflow.WorkflowDefinitionEntity
import riven.core.entity.workflow.WorkflowDefinitionVersionEntity
import riven.core.enums.common.icon.IconColour
import riven.core.enums.common.icon.IconType
import riven.core.enums.workflow.WorkflowDefinitionStatus
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
}
