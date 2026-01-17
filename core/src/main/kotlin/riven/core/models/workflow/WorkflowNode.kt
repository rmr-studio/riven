package riven.core.models.workflow

import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import org.springframework.web.reactive.function.client.WebClient
import riven.core.deserializer.WorkflowNodeDeserializer
import riven.core.enums.workflow.WorkflowNodeType
import riven.core.models.workflow.engine.environment.WorkflowExecutionContext
import riven.core.service.entity.EntityService
import riven.core.service.workflow.EntityContextService
import riven.core.service.workflow.ExpressionEvaluatorService
import riven.core.service.workflow.ExpressionParserService
import java.util.*

/**
 * Sealed interface for all workflow node types.
 *
 * ## Polymorphic Execution Model
 *
 * Each node type implements its own execute() method using the strategy pattern.
 * This eliminates external type switching and makes the system easily extensible.
 *
 * ## Execution Contract
 *
 * All nodes implement execute(context, inputs, services) with the following responsibilities:
 *
 * **Actions (CREATE_ENTITY, HTTP_REQUEST, etc.):**
 * - Execute the action's business logic
 * - Return output map with action results
 * - Example: CREATE_ENTITY returns mapOf("entityId" to uuid, "payload" to data)
 *
 * **Controls (CONDITION, SWITCH, etc.):**
 * - Evaluate control logic
 * - Return map with control result
 * - Example: CONDITION returns mapOf("conditionResult" to boolean)
 *
 * **Future node types:**
 * - LOOP: Returns mapOf("iterations" to count, "results" to list)
 * - SWITCH: Returns mapOf("selectedBranch" to branchKey)
 * - PARALLEL: Returns mapOf("results" to map of branch outputs)
 *
 * ## Inputs vs. Execution
 *
 * **Before execute():**
 * - InputResolverService resolves all templates in config
 * - Templates like {{ steps.fetch_leads.output.email }} converted to actual values
 *
 * **During execute():**
 * - Node receives resolved inputs (no templates)
 * - Node focuses purely on business logic
 * - Services injected for external operations
 *
 * ## Error Handling
 *
 * Nodes throw exceptions on failure:
 * - WorkflowNodeActivitiesImpl catches exceptions
 * - Converts to FAILED status with error message
 * - Stores in data registry for debugging
 *
 * ## Example Implementations
 *
 * **Action Node (CREATE_ENTITY):**
 * ```kotlin
 * override fun execute(
 *     context: WorkflowExecutionContext,
 *     inputs: Map<String, Any?>,
 *     services: NodeExecutionServices
 * ): Map<String, Any?> {
 *     val entityTypeId = UUID.fromString(inputs["entityTypeId"] as String)
 *     val payload = inputs["payload"] as Map<*, *>
 *
 *     val entity = services.entityService.saveEntity(...)
 *
 *     return mapOf(
 *         "entityId" to entity.id,
 *         "payload" to entity.payload
 *     )
 * }
 * ```
 *
 * **Control Node (CONDITION):**
 * ```kotlin
 * override fun execute(
 *     context: WorkflowExecutionContext,
 *     inputs: Map<String, Any?>,
 *     services: NodeExecutionServices
 * ): Map<String, Any?> {
 *     val expression = inputs["expression"] as String
 *     val ast = services.expressionParserService.parse(expression)
 *     val result = services.expressionEvaluatorService.evaluate(ast, emptyMap())
 *
 *     return mapOf("conditionResult" to result)
 * }
 * ```
 *
 * **Future Loop Node (Phase 5+):**
 * ```kotlin
 * override fun execute(
 *     context: WorkflowExecutionContext,
 *     inputs: Map<String, Any?>,
 *     services: NodeExecutionServices
 * ): Map<String, Any?> {
 *     val items = inputs["items"] as List<*>
 *     val results = items.mapIndexed { index, item ->
 *         // Store loop iteration data in context for {{ loop.name.item }}
 *         // DAG coordinator will execute loop body nodes (Phase 5)
 *         // Collect and aggregate results
 *     }
 *     return mapOf(
 *         "iterations" to results.size,
 *         "results" to results
 *     )
 * }
 * ```
 *
 * @property id Node identifier
 * @property type Node type (ACTION, CONTROL_FLOW, etc.)
 * @property version Schema version for node configuration
 */
@JsonDeserialize(using = WorkflowNodeDeserializer::class)
sealed interface WorkflowNode {
    val id: UUID
    val type: WorkflowNodeType
    val version: Int

    val workspaceId: UUID

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
     * @param services Dependencies needed for execution (EntityService, WebClient, etc.)
     * @return Execution output map (structure varies by node type)
     * @throws Exception on execution failure (caught by activity implementation)
     */
    fun execute(
        context: WorkflowExecutionContext,
        inputs: Map<String, Any?>,
        services: NodeExecutionServices
    ): Map<String, Any?>
}

/**
 * Dependencies injected into node execution.
 *
 * This data class provides nodes with access to external services
 * without creating direct Spring dependencies in domain models.
 *
 * Services are injected by WorkflowNodeActivitiesImpl from its
 * constructor-injected dependencies.
 *
 * @property entityService Entity CRUD operations (for entity actions)
 * @property webClient HTTP client (for HTTP_REQUEST actions)
 * @property expressionEvaluatorService Expression evaluation (for CONDITION controls)
 * @property expressionParserService Expression parsing (for CONDITION controls)
 * @property entityContextService Entity context resolution (for expression evaluation)
 */
data class NodeExecutionServices(
    val entityService: EntityService,
    val webClient: WebClient,
    val expressionEvaluatorService: ExpressionEvaluatorService,
    val expressionParserService: ExpressionParserService,
    val entityContextService: EntityContextService
)