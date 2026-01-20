package riven.core.repository.workflow

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import riven.core.entity.workflow.execution.WorkflowExecutionEntity
import riven.core.enums.workflow.WorkflowStatus
import riven.core.repository.workflow.projection.ExecutionSummaryProjection
import java.util.*

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

    /**
     * Fetch execution summary with all node executions and their associated workflow nodes
     * in a single query using a 3-way JOIN.
     *
     * Returns an array for each node execution row:
     * - [0]: WorkflowExecutionEntity
     * - [1]: WorkflowExecutionNodeEntity (or null if no node executions)
     * - [2]: WorkflowNodeEntity (or null if node was deleted)
     *
     * The execution is repeated in each row; callers should deduplicate.
     *
     * @param executionId The workflow execution ID
     * @return List of arrays containing [execution, nodeExecution, node]
     */
    @Query(
        """
        SELECT new riven.core.repository.workflow.projection.ExecutionSummaryProjection(e, ne, n)
        FROM WorkflowExecutionEntity e
        LEFT JOIN WorkflowExecutionNodeEntity ne ON ne.workflowExecutionId = e.id
        LEFT JOIN WorkflowNodeEntity n ON n.id = ne.nodeId AND n.deleted = false
        WHERE e.id = :executionId
        ORDER BY ne.sequenceIndex ASC
        """
    )
    fun findExecutionWithNodesByExecutionId(executionId: UUID): List<ExecutionSummaryProjection>
}
