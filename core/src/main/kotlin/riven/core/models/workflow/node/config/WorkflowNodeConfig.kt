package riven.core.models.workflow.node.config

import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import io.swagger.v3.oas.annotations.media.Schema
import riven.core.deserializer.WorkflowNodeConfigDeserializer
import riven.core.enums.workflow.WorkflowNodeType
import riven.core.models.common.json.JsonObject
import riven.core.models.workflow.engine.environment.WorkflowExecutionContext
import riven.core.models.workflow.node.NodeServiceProvider
import riven.core.models.workflow.node.config.validation.ConfigValidationResult

/**
 * Extensible configuration interface for workflow nodes.
 *
 * Controls the behavior of a workflow node during execution.
 * Subtypes are automatically discovered via [riven.core.configuration.openapi.WorkflowNodeConfigSchemaCustomizer].
 *
 * @property type Node type (ACTION, CONTROL_FLOW, etc.)
 * @property version Schema version for node configuration
 */
@Schema(
    description = "Polymorphic workflow node configuration. Discriminated by 'type' and 'subType' fields."
)
@JsonDeserialize(using = WorkflowNodeConfigDeserializer::class)
sealed interface WorkflowNodeConfig {
    val type: WorkflowNodeType
    val version: Int

    /**
     * Execute this node with given context and resolved inputs.
     *
     * Implementation contract:
     * - Actions: Return output map with action results
     * - Controls: Return map with control result (e.g., conditionResult: Boolean)
     * - Loops: Return map with aggregated iteration results (Phase 5+)
     * - Switch: Return map with selected branch (Phase 5+)
     *
     * @param context Workflow execution context with data registry
     * @param inputs Resolved inputs (templates already converted to values)
     * @param services Service provider for on-demand access to Spring services
     * @return Execution output map (structure varies by node type)
     * @throws Exception on execution failure (caught by activity implementation)
     */
    fun execute(
        context: WorkflowExecutionContext,
        inputs: JsonObject,
        services: NodeServiceProvider
    ): JsonObject

    fun validate(injector: NodeServiceProvider): ConfigValidationResult
}
