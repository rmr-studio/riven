package riven.core.repository.workflow

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import riven.core.entity.workflow.execution.WorkflowExecutionEntity
import riven.core.enums.workflow.WorkflowStatus
import java.util.UUID

/**
 * Repository for accessing WorkflowExecutionEntity instances.
 *
 * Provides standard CRUD operations and custom queries for workflow execution records.
 */
@Repository
interface WorkflowExecutionRepository : JpaRepository<WorkflowExecutionEntity, UUID> {

    /**
     * Find all workflow executions for a workspace.
     *
     * @param workspaceId Workspace context
     * @return List of workflow executions ordered by started time descending
     */
    fun findByWorkspaceIdOrderByStartedAtDesc(workspaceId: UUID): List<WorkflowExecutionEntity>

    /**
     * Find all workflow executions for a specific workflow definition.
     *
     * @param workflowDefinitionId Workflow definition ID
     * @return List of executions ordered by started time descending
     */
    fun findByWorkflowDefinitionIdOrderByStartedAtDesc(workflowDefinitionId: UUID): List<WorkflowExecutionEntity>

    /**
     * Find workflow executions by status.
     *
     * @param workspaceId Workspace context
     * @param status Workflow status filter
     * @return List of executions matching status
     */
    fun findByWorkspaceIdAndStatus(workspaceId: UUID, status: WorkflowStatus): List<WorkflowExecutionEntity>

    /**
     * Find all workflow executions for a specific workflow definition within a workspace.
     *
     * @param workflowDefinitionId Workflow definition ID
     * @param workspaceId Workspace context for access verification
     * @return List of executions ordered by started time descending
     */
    fun findByWorkflowDefinitionIdAndWorkspaceIdOrderByStartedAtDesc(
        workflowDefinitionId: UUID,
        workspaceId: UUID
    ): List<WorkflowExecutionEntity>
}
