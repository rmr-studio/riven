package riven.core.repository.workflow.projection

import riven.core.entity.workflow.WorkflowDefinitionEntity
import riven.core.entity.workflow.WorkflowDefinitionVersionEntity

/**
 * Projection for workflow definition with its published version.
 * Fetched in a single JOIN query to avoid N+1 queries.
 */
data class WorkflowDefinitionWithVersionProjection(
    val definition: WorkflowDefinitionEntity,
    val version: WorkflowDefinitionVersionEntity
)
