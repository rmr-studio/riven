package riven.core.models.workflow.engine.datastore

import java.util.UUID

/**
 * Sealed interface for typed node execution outputs.
 *
 * Each action/control type has a corresponding output class with typed fields.
 * The toMap() method enables template resolution to access properties dynamically.
 */
sealed interface NodeOutput {
    /**
     * Convert output to map for template property access.
     * Keys match property names, enabling {{ steps.node.output.propertyName }} resolution.
     */
    fun toMap(): Map<String, Any?>
}

// =============================================================================
// Entity Action Outputs
// =============================================================================

/**
 * Output from CREATE_ENTITY action.
 *
 * @property entityId UUID of the created entity
 * @property entityTypeId UUID of the entity type
 * @property payload Entity data as attribute UUID to value map
 */
data class CreateEntityOutput(
    val entityId: UUID,
    val entityTypeId: UUID,
    val payload: Map<UUID, Any?>
) : NodeOutput {
    override fun toMap(): Map<String, Any?> = mapOf(
        "entityId" to entityId,
        "entityTypeId" to entityTypeId,
        "payload" to payload
    )
}

/**
 * Output from UPDATE_ENTITY action.
 *
 * @property entityId UUID of the updated entity
 * @property updated Whether the update was successful
 * @property payload Entity data after update as attribute UUID to value map
 */
data class UpdateEntityOutput(
    val entityId: UUID,
    val updated: Boolean,
    val payload: Map<UUID, Any?>
) : NodeOutput {
    override fun toMap(): Map<String, Any?> = mapOf(
        "entityId" to entityId,
        "updated" to updated,
        "payload" to payload
    )
}

/**
 * Output from DELETE_ENTITY action.
 *
 * @property entityId UUID of the deleted entity
 * @property deleted Whether the deletion was successful
 * @property impactedEntities Count of entities affected by cascade delete
 */
data class DeleteEntityOutput(
    val entityId: UUID,
    val deleted: Boolean,
    val impactedEntities: Int
) : NodeOutput {
    override fun toMap(): Map<String, Any?> = mapOf(
        "entityId" to entityId,
        "deleted" to deleted,
        "impactedEntities" to impactedEntities
    )
}

/**
 * Output from QUERY_ENTITY action.
 *
 * @property entities List of entity payload maps matching the query
 * @property totalCount Total number of matching entities (before pagination)
 * @property hasMore Whether more results exist beyond the current page
 */
data class QueryEntityOutput(
    val entities: List<Map<String, Any?>>,
    val totalCount: Int,
    val hasMore: Boolean
) : NodeOutput {
    override fun toMap(): Map<String, Any?> = mapOf(
        "entities" to entities,
        "totalCount" to totalCount,
        "hasMore" to hasMore
    )
}

// =============================================================================
// HTTP Action Output
// =============================================================================

/**
 * Output from HTTP_REQUEST action.
 *
 * @property statusCode HTTP response status code
 * @property headers Response headers as key-value map
 * @property body Response body as string (null if empty)
 * @property url Requested URL
 * @property method HTTP method used
 */
data class HttpResponseOutput(
    val statusCode: Int,
    val headers: Map<String, String>,
    val body: String?,
    val url: String,
    val method: String
) : NodeOutput {
    /** Computed property: true if status code is 2xx */
    val success: Boolean get() = statusCode in 200..299

    override fun toMap(): Map<String, Any?> = mapOf(
        "statusCode" to statusCode,
        "headers" to headers,
        "body" to body,
        "url" to url,
        "method" to method,
        "success" to success
    )
}

// =============================================================================
// Control Flow Outputs
// =============================================================================

/**
 * Output from CONDITION control flow node.
 *
 * @property result Boolean result of the condition expression
 * @property evaluatedExpression The expression that was evaluated
 */
data class ConditionOutput(
    val result: Boolean,
    val evaluatedExpression: String
) : NodeOutput {
    override fun toMap(): Map<String, Any?> = mapOf(
        "result" to result,
        "conditionResult" to result,  // Backward compatibility with current usage
        "evaluatedExpression" to evaluatedExpression
    )
}
