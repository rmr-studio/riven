package riven.core.models.workflow

import riven.core.models.workflow.node.WorkflowNode
import java.util.UUID

/**
 * Complete workflow graph containing nodes and edges.
 *
 * Represents the DAG structure of a workflow definition,
 * including all nodes and their connections (edges).
 *
 * @property workflowDefinitionId The workflow definition this graph belongs to
 * @property nodes All nodes in the workflow graph
 * @property edges All edges connecting the nodes
 */
data class WorkflowGraph(
    val workflowDefinitionId: UUID,
    val nodes: List<WorkflowNode>,
    val edges: List<WorkflowEdge>
)
