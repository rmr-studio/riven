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
import riven.core.models.workflow.node.config.WorkflowControlConfig
import riven.core.models.workflow.node.config.validation.ConfigValidationError
import riven.core.models.workflow.node.config.validation.ConfigValidationResult
import riven.core.models.workflow.node.service
import riven.core.service.workflow.state.EntityContextService
import riven.core.service.workflow.state.WorkflowNodeConfigValidationService
import riven.core.service.workflow.state.WorkflowNodeExpressionEvaluatorService
import riven.core.service.workflow.state.WorkflowNodeExpressionParserService
import java.util.*

private val log = KotlinLogging.logger {}

/**
 * Configuration for CONDITION control flow nodes.
 *
 * ## Configuration Properties
 *
 * @property expression SQL-like expression to evaluate (must return boolean)
 * @property contextEntityId Optional entity ID to load as evaluation context (template-enabled)
 * @property timeoutSeconds Optional timeout override in seconds
 *
 * ## Example Configuration
 *
 * ```json
 * {
 *   "version": 1,
 *   "type": "CONTROL_FLOW",
 *   "subType": "CONDITION",
 *   "expression": "entity.status == 'active' && entity.balance > 0",
 *   "contextEntityId": "{{ steps.fetch_account.output.entityId }}"
 * }
 * ```
 *
 * ## Output
 *
 * Returns map with:
 * - `conditionResult`: Boolean result of expression evaluation
 *
 * ## Expression Syntax
 *
 * Supports SQL-like syntax:
 * - Comparison: ==, !=, <, >, <=, >=
 * - Logical: &&, ||, !
 * - Property access: entity.field.nested
 * - Literals: 'string', 123, true, false, null
 *
 * ## DAG Coordination
 *
 * The conditionResult is used by the DAG coordinator to determine which
 * branch to execute next. Conditional edges in the workflow graph reference
 * this node's output to route execution flow.
 */
@Schema(
    name = "WorkflowConditionControlConfig",
    description = "Configuration for CONDITION control flow nodes."
)
@JsonTypeName("workflow_condition_control")
@JsonDeserialize(using = JsonDeserializer.None::class)
data class WorkflowConditionControlConfig(
    override val version: Int = 1,

    @Schema(
        description = "SQL-like expression to evaluate. Must return boolean.",
        example = "entity.status == 'active' && entity.balance > 0"
    )
    val expression: String,

    @Schema(
        description = "Optional entity ID to use as evaluation context. Can be a static UUID or template.",
        example = "{{ steps.fetch_account.output.entityId }}",
        nullable = true
    )
    val contextEntityId: String? = null,

    @Schema(
        description = "Optional timeout override in seconds",
        nullable = true
    )
    val timeoutSeconds: Long? = null

) : WorkflowControlConfig {

    override val type: WorkflowNodeType
        get() = WorkflowNodeType.CONTROL_FLOW

    override val subType: WorkflowControlType
        get() = WorkflowControlType.CONDITION

    /**
     * Validates this configuration.
     *
     * Checks:
     * - expression is not blank
     * - expression has valid syntax (parses without error)
     * - contextEntityId is valid UUID or template if provided
     * - timeout is non-negative if provided
     *
     * Note: Expression syntax is validated by attempting to parse it.
     * The ExpressionParserService must be available for full validation.
     */
    fun validate(
        validationService: WorkflowNodeConfigValidationService,
        workflowNodeExpressionParserService: WorkflowNodeExpressionParserService? = null
    ): ConfigValidationResult {
        val errors = mutableListOf<ConfigValidationError>()

        // Validate expression is not blank
        errors.addAll(validationService.validateRequiredString(expression, "expression"))

        // Validate expression syntax if parser available
        if (expression.isNotBlank() && workflowNodeExpressionParserService != null) {
            try {
                workflowNodeExpressionParserService.parse(expression)
            } catch (e: Exception) {
                errors.add(ConfigValidationError("expression", "Invalid expression syntax: ${e.message}"))
            }
        }

        // Validate contextEntityId if provided
        if (contextEntityId != null) {
            errors.addAll(validationService.validateTemplateOrUuid(contextEntityId, "contextEntityId"))
        }

        // Validate timeout
        errors.addAll(validationService.validateOptionalDuration(timeoutSeconds, "timeoutSeconds"))

        return ConfigValidationResult(errors)
    }

    override fun execute(
        context: WorkflowExecutionContext,
        inputs: Map<String, Any?>,
        services: NodeServiceProvider
    ): Map<String, Any?> {
        // Extract resolved inputs
        val resolvedExpression = inputs["expression"] as? String ?: expression
        val resolvedContextEntityId = inputs["contextEntityId"] as? String

        // Get services on-demand
        val entityContextService = services.service<EntityContextService>()
        val workflowNodeExpressionParserService = services.service<WorkflowNodeExpressionParserService>()
        val workflowNodeExpressionEvaluatorService = services.service<WorkflowNodeExpressionEvaluatorService>()

        // Resolve entity context if provided
        val evaluationContext: Map<String, Any?> = if (resolvedContextEntityId != null) {
            val entityId = UUID.fromString(resolvedContextEntityId)
            entityContextService.buildContext(entityId, context.workspaceId)
        } else {
            emptyMap()
        }

        // Parse and evaluate expression
        val ast = workflowNodeExpressionParserService.parse(resolvedExpression)
        val result = workflowNodeExpressionEvaluatorService.evaluate(ast, evaluationContext)

        // Validate boolean result
        if (result !is Boolean) {
            throw IllegalStateException(
                "CONDITION expression must evaluate to boolean, got: ${result?.let { it::class.simpleName } ?: "null"}"
            )
        }

        log.debug { "CONDITION evaluated: $resolvedExpression -> $result (context: ${evaluationContext.keys})" }

        // Return boolean for DAG branching
        return mapOf("conditionResult" to result)
    }
}
