package riven.core.repository.workflow

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import riven.core.entity.workflow.WorkflowDefinitionEntity
import java.util.UUID

/**
 * Repository for accessing WorkflowDefinitionEntity instances.
 *
 * Provides standard CRUD operations and custom queries for workflow definitions.
 */
@Repository
interface WorkflowDefinitionRepository : JpaRepository<WorkflowDefinitionEntity, UUID> {

    /**
     * Find workflow definitions by workspace.
     *
     * @param workspaceId Workspace context
     * @return List of workflow definitions in the workspace
     */
    fun findByWorkspaceId(workspaceId: UUID): List<WorkflowDefinitionEntity>

    /**
     * Find a workflow definition by workspace and name.
     *
     * @param workspaceId Workspace context
     * @param name Workflow definition name
     * @return The workflow definition if found
     */
    fun findByWorkspaceIdAndName(workspaceId: UUID, name: String): WorkflowDefinitionEntity?
}
