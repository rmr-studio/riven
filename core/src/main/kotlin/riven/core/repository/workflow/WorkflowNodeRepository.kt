package riven.core.repository.workflow

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import riven.core.entity.workflow.WorkflowNodeEntity
import java.util.UUID

/**
 * Repository for accessing WorkflowNodeEntity instances.
 *
 * Provides standard CRUD operations and custom queries for workflow nodes.
 */
@Repository
interface WorkflowNodeRepository : JpaRepository<WorkflowNodeEntity, UUID> {

    /**
     * Find a workflow node by workspace and key.
     *
     * @param workspaceId Workspace context
     * @param key Node key identifier
     * @return The workflow node entity if found
     */
    fun findByWorkspaceIdAndKey(workspaceId: UUID, key: String): WorkflowNodeEntity?

    /**
     * Find all workflow nodes for a workspace.
     *
     * @param workspaceId Workspace context
     * @return List of workflow nodes in the workspace
     */
    fun findByWorkspaceId(workspaceId: UUID): List<WorkflowNodeEntity>
}
