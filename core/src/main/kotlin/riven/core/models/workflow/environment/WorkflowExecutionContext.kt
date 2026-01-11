package riven.core.models.workflow.environment

import java.time.Instant
import java.util.*

/**
 * Execution context for a workflow run, separating control plane from data plane.
 *
 * ## Architectural Principles
 *
 * **Separation of Concerns:**
 * - **Control Plane (metadata):** Workflow-level orchestration metadata (execution ID, workspace, etc.)
 * - **Data Plane (dataRegistry):** Node execution outputs, the single source of truth for data flow
 *
 * This separation ensures:
 * 1. Temporal workflow context remains clean (only orchestration concerns)
 * 2. Data registry acts as the "state machine" for node-to-node communication
 * 3. Template resolution ({{ steps.nodeName.output }}) queries dataRegistry, not workflow metadata
 *
 * ## Why dataRegistry is Mutable
 *
 * The dataRegistry is intentionally mutable because it's built up during workflow execution:
 * - Each node execution adds a new entry to the registry
 * - Registry grows as the workflow progresses through the DAG
 * - In Phase 5, the DAG coordinator will pass this context between nodes
 *
 * However, individual NodeExecutionData entries are immutable once stored (execution is atomic).
 *
 * ## Data Flow (Phase 4.1 Foundation)
 *
 * Current state (single-node execution):
 * - Context initialized with empty dataRegistry
 * - Node executes, output captured
 * - Output stored in dataRegistry with node name as key
 *
 * Future state (Phase 5 - sequential workflows):
 * - DAG coordinator passes context between nodes
 * - Node N+1 accesses outputs from nodes 1..N via dataRegistry
 * - Template engine resolves {{ steps.nodeX.output }} from registry
 *
 * @property workflowExecutionId UUID of the workflow execution record
 * @property workspaceId Workspace context for security/multi-tenancy
 * @property metadata Control plane: workflow-level orchestration metadata
 * @property dataRegistry Data plane: node outputs keyed by node name (mutable, grows during execution)
 */
data class WorkflowExecutionContext(
    val workflowExecutionId: UUID,
    val workspaceId: UUID,
    val metadata: Map<String, Any?>,
    val dataRegistry: MutableMap<String, NodeExecutionData>
)