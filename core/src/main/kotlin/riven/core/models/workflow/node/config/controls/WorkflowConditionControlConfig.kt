package riven.core.models.workflow.node.config.controls

import com.fasterxml.jackson.annotation.JsonTypeName
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import io.github.oshai.kotlinlogging.KotlinLogging
import io.swagger.v3.oas.annotations.media.Schema
import riven.core.enums.workflow.WorkflowControlType
import riven.core.enums.workflow.WorkflowNodeType
import riven.core.models.workflow.engine.environment.WorkflowExecutionContext
import riven.core.models.workflow.node.NodeServiceProvider
import riven.core.models.workflow.node.service
import riven.core.service.workflow.EntityContextService
import riven.core.service.workflow.ExpressionEvaluatorService
import riven.core.service.workflow.ExpressionParserService
import riven.core.models.workflow.node.config.WorkflowControlConfig
import java.util.*

private val log = KotlinLogging.logger {}

/**
 * Configuration for CONDITION control flow nodes.
 *
 * ## Configuration
 *
 * Required inputs:
 * - `expression`: String expression to evaluate (must return boolean)
 *
 * Optional inputs:
 * - `contextEntityId`: String UUID of entity to use as evaluation context
 *
 * ## Output
 *
 * Returns map with:
 * - `conditionResult`: Boolean result of expression evaluation
 *
 * ## Example Configuration
 *
 * ```json
 * {
 *   "expression": "entity.status == 'active' && entity.balance > 0",
 *   "contextEntityId": "{{ steps.fetch_account.output.entityId }}"
 * }
 * ```
 *
 * The expression is evaluated using ExpressionEvaluatorService.
 * If contextEntityId is provided, entity data is loaded and made available
 * in the evaluation context.
 *
 * ## DAG Coordination (Phase 5)
 *
 * The conditionResult is used by the DAG coordinator to determine which
 * branch to execute next. Conditional edges in the workflow graph reference
 * this node's output to route execution flow.
 *
 * ## Future Control Types
 *
 * This pattern extends to other control nodes:
 * - SWITCH: Returns `selectedBranch` key
 * - LOOP: Returns `iterations` count and `results` list
 * - PARALLEL: Returns `results` map of branch outputs
 */
@Schema(
    name = "WorkflowConditionControlConfig",
    description = "Configuration for CONDITION control flow nodes."
)
@JsonTypeName("workflow_condition_control")
@JsonDeserialize(using = JsonDeserializer.None::class)
data class WorkflowConditionControlConfig(
    override val version: Int,
    val name: String,
    val config: Map<String, Any?>
) : WorkflowControlConfig {

    override val type: WorkflowNodeType
        get() = WorkflowNodeType.CONTROL_FLOW

    override val subType: WorkflowControlType
        get() = WorkflowControlType.CONDITION

    override fun execute(
        context: WorkflowExecutionContext,
        inputs: Map<String, Any?>,
        services: NodeServiceProvider
    ): Map<String, Any?> {
        // Extract inputs (already resolved)
        val expression = inputs["expression"] as String
        val contextEntityId = inputs["contextEntityId"] as? String

        // Get services on-demand
        val entityContextService = services.service<EntityContextService>()
        val expressionParserService = services.service<ExpressionParserService>()
        val expressionEvaluatorService = services.service<ExpressionEvaluatorService>()

        // Resolve entity context if provided
        val evaluationContext: Map<String, Any?> = if (contextEntityId != null) {
            val entityId = UUID.fromString(contextEntityId)
            entityContextService.buildContext(entityId, context.workspaceId)
        } else {
            emptyMap()
        }

        // Parse and evaluate expression
        val ast = expressionParserService.parse(expression)
        val result = expressionEvaluatorService.evaluate(ast, evaluationContext)

        // Validate boolean result
        if (result !is Boolean) {
            throw IllegalStateException(
                "CONDITION expression must evaluate to boolean, got: ${result?.let { it::class.simpleName } ?: "null"}"
            )
        }

        log.debug { "CONDITION evaluated: $expression -> $result (context: ${evaluationContext.keys})" }

        // Return boolean for DAG branching
        return mapOf("conditionResult" to result)
    }
}
