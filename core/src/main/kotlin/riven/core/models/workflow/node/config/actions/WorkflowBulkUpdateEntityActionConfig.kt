package riven.core.models.workflow.node.config.actions

import com.fasterxml.jackson.annotation.JsonTypeName
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import io.github.oshai.kotlinlogging.KotlinLogging
import io.swagger.v3.oas.annotations.media.Schema
import kotlinx.coroutines.runBlocking
import riven.core.enums.common.icon.IconType
import riven.core.enums.common.validation.SchemaType
import riven.core.enums.workflow.BulkUpdateErrorHandling
import riven.core.enums.workflow.OutputFieldType
import riven.core.enums.workflow.WorkflowActionType
import riven.core.enums.workflow.WorkflowNodeConfigFieldType
import riven.core.enums.workflow.WorkflowNodeType
import riven.core.models.entity.payload.EntityAttributePrimitivePayload
import riven.core.models.entity.payload.EntityAttributeRequest
import riven.core.models.entity.query.EntityQuery
import riven.core.models.entity.query.filter.FilterValue
import riven.core.models.entity.query.filter.QueryFilter
import riven.core.models.entity.query.filter.RelationshipFilter
import riven.core.models.entity.query.pagination.QueryPagination
import riven.core.models.request.entity.SaveEntityRequest
import riven.core.models.workflow.engine.state.BulkUpdateEntityOutput
import riven.core.models.workflow.engine.state.NodeOutput
import riven.core.models.workflow.engine.state.WorkflowDataStore
import riven.core.models.workflow.node.NodeServiceProvider
import riven.core.models.workflow.node.config.WorkflowActionConfig
import riven.core.models.workflow.node.config.WorkflowNodeConfigField
import riven.core.models.workflow.node.config.WorkflowNodeOutputField
import riven.core.models.workflow.node.config.WorkflowNodeOutputMetadata
import riven.core.models.workflow.node.config.WorkflowNodeTypeMetadata
import riven.core.models.workflow.node.config.validation.ConfigValidationError
import riven.core.models.workflow.node.config.validation.ConfigValidationResult
import riven.core.models.workflow.node.service
import riven.core.service.entity.EntityService
import riven.core.service.entity.query.EntityQueryService
import riven.core.service.workflow.state.WorkflowNodeConfigValidationService
import riven.core.service.workflow.state.WorkflowNodeInputResolverService
import java.util.*

private val log = KotlinLogging.logger {}

private const val BULK_UPDATE_BATCH_SIZE = 50
private const val QUERY_PAGE_SIZE = 100

/**
 * Configuration for BULK_UPDATE_ENTITY action nodes.
 *
 * Applies identical field updates to all entities matching a query.
 *
 * ## Configuration Properties
 *
 * @property query Embedded query definition to find entities for bulk update
 * @property payload Map of attribute updates to apply to each matching entity (template-enabled values)
 * @property errorHandling Error handling mode (FAIL_FAST or BEST_EFFORT)
 * @property pagination Optional pagination for the embedded query
 * @property timeoutSeconds Optional timeout override in seconds
 *
 * ## Example Configuration
 *
 * ```json
 * {
 *   "version": 1,
 *   "type": "ACTION",
 *   "subType": "BULK_UPDATE_ENTITY",
 *   "query": {
 *     "entityTypeId": "client-type-uuid",
 *     "filter": {
 *       "type": "ATTRIBUTE",
 *       "attributeId": "status-uuid",
 *       "operator": "EQUALS",
 *       "value": { "kind": "LITERAL", "value": "Pending" }
 *     }
 *   },
 *   "payload": {
 *     "status-uuid": "Active",
 *     "updated-by-uuid": "{{ trigger.userId }}"
 *   },
 *   "errorHandling": "BEST_EFFORT"
 * }
 * ```
 *
 * ## Output
 *
 * Returns map with:
 * - `entitiesUpdated`: Count of entities successfully updated
 * - `entitiesFailed`: Count of entities that failed to update
 * - `failedEntityDetails`: List of failed entity IDs with error messages
 * - `totalProcessed`: Total entities attempted
 */
@Schema(
    name = "WorkflowBulkUpdateEntityActionConfig",
    description = "Configuration for BULK_UPDATE_ENTITY action nodes that apply identical field updates to all entities matching a query."
)
@JsonTypeName("workflow_bulk_update_entity_action")
@JsonDeserialize(using = JsonDeserializer.None::class)
data class WorkflowBulkUpdateEntityActionConfig(
    override val version: Int = 1,

    @param:Schema(
        description = "Query to find entities for bulk update. Self-contained query configuration."
    )
    val query: EntityQuery,

    @param:Schema(
        description = "Map of attribute updates to apply to each matching entity. Keys are attribute UUID strings, values support templates.",
        example = """{"attr-uuid": "New Value", "status-uuid": "{{ steps.x.output.status }}"}"""
    )
    val payload: Map<String, String> = emptyMap(),

    @param:Schema(
        description = "Error handling mode for individual entity update failures.",
        defaultValue = "FAIL_FAST"
    )
    val errorHandling: BulkUpdateErrorHandling = BulkUpdateErrorHandling.FAIL_FAST,

    @param:Schema(
        description = "Optional pagination for the embedded query to limit entities processed.",
        nullable = true
    )
    val pagination: QueryPagination? = null,

    @param:Schema(
        description = "Optional timeout override in seconds.",
        nullable = true
    )
    val timeoutSeconds: Long? = null

) : WorkflowActionConfig {

    override val type: WorkflowNodeType
        get() = WorkflowNodeType.ACTION

    override val subType: WorkflowActionType
        get() = WorkflowActionType.BULK_UPDATE_ENTITY

    /**
     * Returns typed fields as a map for template resolution.
     * Used by WorkflowCoordinationService to resolve templates before execution.
     */
    override val config: Map<String, Any?>
        get() = mapOf(
            "entityTypeId" to query.entityTypeId.toString(),
            "filter" to query.filter,
            "payload" to payload,
            "errorHandling" to errorHandling.name,
            "pagination" to pagination,
            "timeoutSeconds" to timeoutSeconds
        )

    override val configSchema: List<WorkflowNodeConfigField>
        get() = Companion.configSchema

    companion object {
        val metadata = WorkflowNodeTypeMetadata(
            label = "Bulk Update Entities",
            description = "Applies identical updates to all entities matching a query",
            icon = IconType.LAYERS,
            category = WorkflowNodeType.ACTION
        )

        val configSchema: List<WorkflowNodeConfigField> = listOf(
            WorkflowNodeConfigField(
                key = "query",
                label = "Entity Query",
                type = WorkflowNodeConfigFieldType.ENTITY_QUERY,
                required = true,
                description = "Query to find entities for bulk update"
            ),
            WorkflowNodeConfigField(
                key = "payload",
                label = "Payload",
                type = WorkflowNodeConfigFieldType.KEY_VALUE,
                required = true,
                description = "Map of attribute updates to apply to each entity"
            ),
            WorkflowNodeConfigField(
                key = "errorHandling",
                label = "Error Handling",
                type = WorkflowNodeConfigFieldType.ENUM,
                required = true,
                description = "How to handle individual entity update failures"
            ),
            WorkflowNodeConfigField(
                key = "pagination",
                label = "Pagination",
                type = WorkflowNodeConfigFieldType.JSON,
                required = false,
                description = "Optional pagination to limit entities processed"
            ),
            WorkflowNodeConfigField(
                key = "timeoutSeconds",
                label = "Timeout (seconds)",
                type = WorkflowNodeConfigFieldType.DURATION,
                required = false,
                description = "Optional timeout override in seconds"
            )
        )

        val outputMetadata = WorkflowNodeOutputMetadata(
            fields = listOf(
                WorkflowNodeOutputField(
                    key = "entitiesUpdated",
                    label = "Entities Updated",
                    type = OutputFieldType.NUMBER,
                    description = "Count of entities successfully updated",
                    exampleValue = 25
                ),
                WorkflowNodeOutputField(
                    key = "entitiesFailed",
                    label = "Entities Failed",
                    type = OutputFieldType.NUMBER,
                    description = "Count of entities that failed to update",
                    exampleValue = 0
                ),
                WorkflowNodeOutputField(
                    key = "failedEntityDetails",
                    label = "Failed Entity Details",
                    type = OutputFieldType.LIST,
                    description = "Details of failed entity updates with entityId and error",
                    exampleValue = emptyList<Map<String, Any?>>()
                ),
                WorkflowNodeOutputField(
                    key = "totalProcessed",
                    label = "Total Processed",
                    type = OutputFieldType.NUMBER,
                    description = "Total entities attempted",
                    exampleValue = 25
                )
            )
        )
    }

    /**
     * Validates this configuration.
     *
     * Checks:
     * - query.filter structure is valid (recursive validation)
     * - payload values have valid template syntax
     * - pagination values are non-negative if present
     * - timeout is non-negative if provided
     *
     * @param injector Spring managed provider to inject services into model
     * @return Validation result with any errors
     */
    override fun validate(injector: NodeServiceProvider): ConfigValidationResult {
        val validationService = injector.service<WorkflowNodeConfigValidationService>()
        val errors = mutableListOf<ConfigValidationError>()

        // Validate filter if present
        query.filter?.let { filter ->
            errors.addAll(validateFilter(filter, "query.filter", validationService))
        }

        // Validate payload templates
        errors.addAll(validationService.validateTemplateMap(payload, "payload"))

        // Validate pagination if present
        pagination?.let { paging ->
            if (paging.limit < 0) {
                errors.add(ConfigValidationError("pagination.limit", "Limit must be non-negative"))
            }
            if (paging.offset < 0) {
                errors.add(ConfigValidationError("pagination.offset", "Offset must be non-negative"))
            }
        }

        // Validate timeout
        errors.addAll(validationService.validateOptionalDuration(timeoutSeconds, "timeoutSeconds"))

        return ConfigValidationResult(errors)
    }

    /**
     * Recursively validates a QueryFilter structure.
     *
     * Walks the filter tree validating FilterValue.Template syntax and
     * RelationshipFilter conditions at each level.
     */
    private fun validateFilter(
        filter: QueryFilter,
        path: String,
        validationService: WorkflowNodeConfigValidationService
    ): List<ConfigValidationError> {
        return when (filter) {
            is QueryFilter.Attribute -> {
                validateFilterValue(filter.value, "$path.value", validationService)
            }

            is QueryFilter.Relationship -> {
                validateRelationshipCondition(filter.condition, "$path.condition", validationService)
            }

            is QueryFilter.And -> {
                if (filter.conditions.isEmpty()) {
                    listOf(ConfigValidationError(path, "AND filter must have at least one condition"))
                } else {
                    filter.conditions.flatMapIndexed { index, condition ->
                        validateFilter(condition, "$path.conditions[$index]", validationService)
                    }
                }
            }

            is QueryFilter.Or -> {
                if (filter.conditions.isEmpty()) {
                    listOf(ConfigValidationError(path, "OR filter must have at least one condition"))
                } else {
                    filter.conditions.flatMapIndexed { index, condition ->
                        validateFilter(condition, "$path.conditions[$index]", validationService)
                    }
                }
            }
        }
    }

    /**
     * Validates a FilterValue (literal or template).
     */
    private fun validateFilterValue(
        value: FilterValue,
        path: String,
        validationService: WorkflowNodeConfigValidationService
    ): List<ConfigValidationError> {
        return when (value) {
            is FilterValue.Literal -> emptyList()
            is FilterValue.Template -> validationService.validateTemplateSyntax(value.expression, path)
        }
    }

    /**
     * Validates a RelationshipFilter condition.
     */
    private fun validateRelationshipCondition(
        condition: RelationshipFilter,
        path: String,
        validationService: WorkflowNodeConfigValidationService
    ): List<ConfigValidationError> {
        return when (condition) {
            is RelationshipFilter.Exists -> emptyList()
            is RelationshipFilter.NotExists -> emptyList()

            is RelationshipFilter.TargetEquals -> {
                if (condition.entityIds.isEmpty()) {
                    listOf(ConfigValidationError(path, "TARGET_EQUALS must specify at least one entity ID"))
                } else {
                    condition.entityIds.flatMapIndexed { index, id ->
                        validationService.validateTemplateOrUuid(id, "$path.entityIds[$index]")
                    }
                }
            }

            is RelationshipFilter.TargetMatches -> {
                validateFilter(condition.filter, "$path.filter", validationService)
            }

            is RelationshipFilter.TargetTypeMatches -> {
                if (condition.branches.isEmpty()) {
                    listOf(ConfigValidationError(path, "TARGET_TYPE_MATCHES must specify at least one branch"))
                } else {
                    condition.branches.flatMapIndexed { index, branch ->
                        branch.filter?.let { validateFilter(it, "$path.branches[$index].filter", validationService) }
                            ?: emptyList()
                    }
                }
            }

            is RelationshipFilter.CountMatches -> {
                if (condition.count < 0) {
                    listOf(ConfigValidationError(path, "Count must be non-negative"))
                } else {
                    emptyList()
                }
            }
        }
    }

    override fun execute(
        dataStore: WorkflowDataStore,
        inputs: Map<String, Any?>,
        services: NodeServiceProvider
    ): NodeOutput {
        log.info { "Executing BULK_UPDATE_ENTITY for type: ${query.entityTypeId}, errorHandling: $errorHandling" }

        // Get required services
        val entityQueryService = services.service<EntityQueryService>()
        val entityService = services.service<EntityService>()
        val inputResolver = services.service<WorkflowNodeInputResolverService>()
        val workspaceId = dataStore.metadata.workspaceId

        // Resolve template FilterValues in query.filter (reuse pattern from QueryEntityActionConfig)
        val resolvedFilter = query.filter?.let { filter ->
            resolveFilterTemplates(filter, dataStore, inputResolver)
        }

        // Resolve payload templates - extract the resolved payload map from inputs
        @Suppress("UNCHECKED_CAST")
        val resolvedPayload = inputs["payload"] as? Map<*, *> ?: emptyMap<String, Any?>()

        // Query ALL matching entities using pagination loop
        val allEntityIds = mutableListOf<UUID>()
        var currentOffset = 0
        var hasNextPage = true

        log.info { "Querying all matching entities with pagination (page size: $QUERY_PAGE_SIZE)" }

        while (hasNextPage) {
            val pageQuery = EntityQuery(
                entityTypeId = query.entityTypeId,
                filter = resolvedFilter,
                maxDepth = query.maxDepth
            )

            val pagePagination = QueryPagination(
                limit = QUERY_PAGE_SIZE,
                offset = currentOffset
            )

            val pageResult = runBlocking {
                entityQueryService.execute(
                    query = pageQuery,
                    workspaceId = workspaceId,
                    pagination = pagePagination,
                    projection = null
                )
            }

            // Accumulate entity IDs
            allEntityIds.addAll(pageResult.entities.map { it.id })

            // Check if there are more pages
            hasNextPage = pageResult.hasNextPage
            currentOffset += QUERY_PAGE_SIZE

            log.debug { "Fetched page with ${pageResult.entities.size} entities, total so far: ${allEntityIds.size}" }
        }

        log.info { "Found ${allEntityIds.size} total entities to update" }

        if (allEntityIds.isEmpty()) {
            log.info { "No entities found matching query, returning zero counts" }
            return BulkUpdateEntityOutput(
                entitiesUpdated = 0,
                entitiesFailed = 0,
                failedEntityDetails = emptyList(),
                totalProcessed = 0
            )
        }

        // Process entities in batches
        var entitiesUpdated = 0
        var entitiesFailed = 0
        val failedDetails = mutableListOf<Map<String, Any?>>()

        log.info { "Processing ${allEntityIds.size} entities in batches of $BULK_UPDATE_BATCH_SIZE" }

        for (batch in allEntityIds.chunked(BULK_UPDATE_BATCH_SIZE)) {
            for (entityId in batch) {
                try {
                    // Get existing entity to determine type
                    val existingEntity = entityService.getEntity(entityId)

                    // Map resolved payload to proper format (same as UpdateEntityActionConfig)
                    @Suppress("UNCHECKED_CAST")
                    val entityPayload = resolvedPayload.mapKeys { (key, _) ->
                        UUID.fromString(key as String)
                    }.mapValues { (_, value) ->
                        EntityAttributeRequest(
                            EntityAttributePrimitivePayload(
                                value = value,
                                schemaType = SchemaType.TEXT  // Default to TEXT
                            )
                        )
                    }

                    // Update entity via EntityService
                    val saveRequest = SaveEntityRequest(
                        id = entityId,
                        payload = entityPayload,
                        icon = null
                    )

                    entityService.saveEntity(
                        workspaceId,
                        existingEntity.typeId,
                        saveRequest
                    )

                    entitiesUpdated++

                } catch (e: Exception) {
                    when (errorHandling) {
                        BulkUpdateErrorHandling.FAIL_FAST -> {
                            log.error { "FAIL_FAST: Entity $entityId update failed: ${e.message}" }
                            // Return immediately with what succeeded so far
                            return BulkUpdateEntityOutput(
                                entitiesUpdated = entitiesUpdated,
                                entitiesFailed = 1,
                                failedEntityDetails = listOf(
                                    mapOf(
                                        "entityId" to entityId.toString(),
                                        "error" to (e.message ?: "Unknown error")
                                    )
                                ),
                                totalProcessed = entitiesUpdated + 1
                            )
                        }
                        BulkUpdateErrorHandling.BEST_EFFORT -> {
                            log.warn { "BEST_EFFORT: Entity $entityId update failed: ${e.message}" }
                            entitiesFailed++
                            failedDetails.add(
                                mapOf(
                                    "entityId" to entityId.toString(),
                                    "error" to (e.message ?: "Unknown error")
                                )
                            )
                        }
                    }
                }
            }
        }

        val totalProcessed = entitiesUpdated + entitiesFailed
        log.info { "BULK_UPDATE_ENTITY complete: $entitiesUpdated updated, $entitiesFailed failed, $totalProcessed total" }

        return BulkUpdateEntityOutput(
            entitiesUpdated = entitiesUpdated,
            entitiesFailed = entitiesFailed,
            failedEntityDetails = failedDetails,
            totalProcessed = totalProcessed
        )
    }

    /**
     * Recursively resolves template FilterValues in the filter tree.
     *
     * Walks the filter structure and replaces any FilterValue.Template with
     * FilterValue.Literal containing the resolved value.
     *
     * @param filter The filter to resolve templates in
     * @param dataStore Workflow datastore for template resolution
     * @param resolver Service to resolve template expressions
     * @return Filter with all templates resolved to literals
     */
    private fun resolveFilterTemplates(
        filter: QueryFilter,
        dataStore: WorkflowDataStore,
        resolver: WorkflowNodeInputResolverService
    ): QueryFilter {
        return when (filter) {
            is QueryFilter.Attribute -> {
                val resolvedValue = when (val value = filter.value) {
                    is FilterValue.Literal -> value
                    is FilterValue.Template -> {
                        val resolved = resolver.resolve(value.expression, dataStore)
                        FilterValue.Literal(resolved)
                    }
                }
                filter.copy(value = resolvedValue)
            }

            is QueryFilter.And -> {
                filter.copy(
                    conditions = filter.conditions.map { condition ->
                        resolveFilterTemplates(condition, dataStore, resolver)
                    }
                )
            }

            is QueryFilter.Or -> {
                filter.copy(
                    conditions = filter.conditions.map { condition ->
                        resolveFilterTemplates(condition, dataStore, resolver)
                    }
                )
            }

            is QueryFilter.Relationship -> {
                val resolvedCondition = resolveRelationshipConditionTemplates(
                    filter.condition,
                    dataStore,
                    resolver
                )
                filter.copy(condition = resolvedCondition)
            }
        }
    }

    /**
     * Resolves templates in relationship filter conditions.
     *
     * Handles template resolution for different relationship condition types.
     *
     * @param condition The relationship condition to resolve templates in
     * @param dataStore Workflow datastore for template resolution
     * @param resolver Service to resolve template expressions
     * @return Relationship condition with all templates resolved
     */
    private fun resolveRelationshipConditionTemplates(
        condition: RelationshipFilter,
        dataStore: WorkflowDataStore,
        resolver: WorkflowNodeInputResolverService
    ): RelationshipFilter {
        return when (condition) {
            is RelationshipFilter.Exists -> condition
            is RelationshipFilter.NotExists -> condition

            is RelationshipFilter.TargetEquals -> {
                val resolvedIds = condition.entityIds.map { id ->
                    resolver.resolve(id, dataStore)?.toString() ?: id
                }
                condition.copy(entityIds = resolvedIds)
            }

            is RelationshipFilter.TargetMatches -> {
                condition.copy(
                    filter = resolveFilterTemplates(condition.filter, dataStore, resolver)
                )
            }

            is RelationshipFilter.TargetTypeMatches -> {
                val resolvedBranches = condition.branches.map { branch ->
                    branch.copy(
                        filter = branch.filter?.let { resolveFilterTemplates(it, dataStore, resolver) }
                    )
                }
                condition.copy(branches = resolvedBranches)
            }

            is RelationshipFilter.CountMatches -> condition
        }
    }
}
