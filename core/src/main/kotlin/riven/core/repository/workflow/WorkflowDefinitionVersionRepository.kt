package riven.core.repository.workflow

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import riven.core.entity.workflow.WorkflowDefinitionVersionEntity
import java.util.UUID

/**
 * Repository for accessing WorkflowDefinitionVersionEntity instances.
 *
 * Workflow versions contain the actual DAG structure (nodes and edges).
 */
@Repository
interface WorkflowDefinitionVersionRepository : JpaRepository<WorkflowDefinitionVersionEntity, UUID> {

    /**
     * Find all versions for a workflow definition.
     *
     * @param workflowDefinitionId Workflow definition ID
     * @return List of versions ordered by version number descending
     */
    fun findByWorkflowDefinitionIdOrderByVersionNumberDesc(workflowDefinitionId: UUID): List<WorkflowDefinitionVersionEntity>

    /**
     * Find a specific version of a workflow definition.
     *
     * @param workflowDefinitionId Workflow definition ID
     * @param versionNumber Version number
     * @return The workflow version if found
     */
    fun findByWorkflowDefinitionIdAndVersionNumber(workflowDefinitionId: UUID, versionNumber: Int): WorkflowDefinitionVersionEntity?
}
