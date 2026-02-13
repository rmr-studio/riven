# Phase 2: Query & Bulk Update Execution - Research

**Researched:** 2026-02-13
**Domain:** Kotlin workflow node execution, entity query service integration, batch processing, error handling patterns
**Confidence:** HIGH

## Summary

Phase 2 implements two new workflow action nodes: QueryEntityNode (execute entity queries via EntityQueryService) and BulkUpdateEntityNode (apply identical updates to all matching entities). Both nodes integrate with the existing entity query system, support template resolution, and declare outputMetadata following Phase 1 patterns.

The codebase already has a complete entity query infrastructure in `EntityQueryService` that handles filter validation, SQL assembly, pagination, and result loading. QueryEntityNode is a thin integration layer that resolves templates in filter values, invokes the query service, and transforms results to NodeOutput format. BulkUpdateEntityNode embeds its own query config, iterates results, and applies updates via EntityService with configurable error handling.

The architecture follows established patterns: (1) WorkflowActionConfig for node configuration with template-enabled fields, (2) execute() method that resolves inputs and invokes domain services, (3) typed NodeOutput with toMap() for downstream template access, (4) companion object metadata following Phase 1 patterns. Template resolution uses the existing WorkflowNodeInputResolverService to resolve `{{ }}` expressions in filter values before query execution.

**Primary recommendation:** Reuse EntityQueryService as-is for query execution. Use FilterValue.Template for template-enabled filter values. Process bulk updates in batches with configurable error handling (FAIL_FAST or BEST_EFFORT). Follow existing UpdateEntityActionConfig pattern for field updates. Declare outputMetadata with ENTITY_LIST type and dynamic entity type resolution.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Query filter design
- Reuse the existing entity query system — same filter model the app uses for entity views/lists
- Template support in filter values — filters can reference upstream node outputs (e.g., `{{nodeId.fieldKey}}`)
- Template values resolved before query execution
- Condition logic matches whatever the existing query system supports (AND/OR groups, operators)
- No sorting support — order doesn't matter for workflow processing

#### Bulk update field mapping
- Field values support both static values and template references to upstream node outputs
- Any field that can be updated via regular UpdateEntity can be bulk updated
- Multiple fields can be updated per node — one BulkUpdateEntity node can set status, assignee, priority all at once
- Bulk update node has its own embedded query config — self-contained, no dependency on a separate QueryEntity node

#### Error handling semantics
- FAIL_FAST: When one entity fails to update, the node fails and the workflow stops. No rollback — entities updated before the failure stay updated. Output includes count of what succeeded before failure.
- BEST_EFFORT: Process all entities regardless of individual failures. Output includes entitiesUpdated count, entitiesFailed count, plus a list of failed entity IDs with error messages.
- Error handling mode is user-configurable — dropdown in the workflow editor node config (FAIL_FAST or BEST_EFFORT)

#### Query result limits
- System-wide default limit on query results (prevents runaway queries) — user cannot override
- hasMore in QueryEntityOutput indicates when more results exist beyond the limit
- Bulk update processes ALL matching entities regardless of any query limit — no cap on what gets updated
- Query node output includes full entity objects (all field values), not just IDs
- Bulk update processes entities in configurable batches for efficiency

### Claude's Discretion
- Exact system-wide query result limit value
- Batch size for bulk update processing
- Template syntax specifics (aligning with existing template system)
- How full entity objects are represented in query output
- Internal batching/pagination strategy for bulk update's "process all" behavior

</user_constraints>

## Standard Stack

The codebase already uses the exact stack required for this phase:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Kotlin | 2.1 | Primary language | Sealed interfaces, data classes, coroutines |
| Spring Boot | 3.5 | Application framework | @Service, @Transactional, dependency injection |
| EntityQueryService | (internal) | Entity querying | Already implements filter validation, SQL assembly, pagination |
| EntityService | (internal) | Entity CRUD | Already implements entity updates with validation |
| WorkflowNodeInputResolverService | (internal) | Template resolution | Already resolves `{{ }}` expressions from datastore |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Kotlin Coroutines | (Spring Boot managed) | Async processing | Already used in EntityQueryService for parallel query execution |
| Jackson Kotlin Module | (Spring Boot managed) | JSON serialization | Already handles FilterValue, QueryFilter polymorphic types |
| Spring JDBC | (Spring Boot managed) | Database access | Already used in EntityQueryService for parameterized queries |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| EntityQueryService | Custom query logic | EntityQueryService already has validation, SQL assembly, pagination—don't rebuild |
| FilterValue.Template | Custom template field | FilterValue already supports TEMPLATE type—reuse existing model |
| Batch iteration | Process all at once | Large result sets risk memory issues; batching provides control |
| FAIL_FAST/BEST_EFFORT enum | Boolean flag | Enum is more extensible (could add RETRY_FAILED later) |

**Installation:**
No new dependencies required—all libraries already in use.

## Architecture Patterns

### Recommended Project Structure
```
src/main/kotlin/riven/core/
├── models/workflow/node/config/actions/
│   ├── WorkflowQueryEntityActionConfig.kt         # EXISTING: Implement execute()
│   └── WorkflowBulkUpdateEntityActionConfig.kt    # NEW: Bulk update node config
├── models/workflow/engine/state/
│   ├── NodeOutput.kt                              # EXISTING: QueryEntityOutput exists, add BulkUpdateEntityOutput
├── enums/workflow/
│   ├── WorkflowActionType.kt                      # EXISTING: Has QUERY_ENTITY, add BULK_UPDATE_ENTITY
│   └── BulkUpdateErrorHandling.kt                 # NEW: FAIL_FAST vs BEST_EFFORT
├── service/entity/query/
│   └── EntityQueryService.kt                      # EXISTING: Reuse as-is
└── service/entity/
    └── EntityService.kt                           # EXISTING: Reuse saveEntity() for updates
```

### Pattern 1: Template Resolution in Filter Values

**What:** Resolve `{{ }}` template expressions in FilterValue.Template before query execution
**When to use:** QueryEntityNode and BulkUpdateEntityNode execute() methods
**Example:**
```kotlin
// Source: Combining FilterValue.Template with WorkflowNodeInputResolverService pattern
private fun resolveFilterTemplates(
    filter: QueryFilter?,
    dataStore: WorkflowDataStore,
    resolver: WorkflowNodeInputResolverService
): QueryFilter? {
    if (filter == null) return null

    return when (filter) {
        is QueryFilter.Attribute -> {
            when (val value = filter.value) {
                is FilterValue.Literal -> filter  // No resolution needed
                is FilterValue.Template -> {
                    // Resolve template expression to actual value
                    val resolvedValue = resolver.resolve(value.expression, dataStore)
                    filter.copy(value = FilterValue.Literal(resolvedValue))
                }
            }
        }
        is QueryFilter.And -> {
            filter.copy(
                conditions = filter.conditions.map {
                    resolveFilterTemplates(it, dataStore, resolver) ?: it
                }
            )
        }
        is QueryFilter.Or -> {
            filter.copy(
                conditions = filter.conditions.map {
                    resolveFilterTemplates(it, dataStore, resolver) ?: it
                }
            )
        }
        is QueryFilter.Relationship -> {
            // Relationship filters may have nested attribute filters
            when (val condition = filter.condition) {
                is RelationshipFilter.TargetMatches -> {
                    filter.copy(
                        condition = condition.copy(
                            filter = resolveFilterTemplates(condition.filter, dataStore, resolver)
                                ?: condition.filter
                        )
                    )
                }
                else -> filter  // Other relationship conditions don't have templates
            }
        }
    }
}
```

**Critical details:**
- `FilterValue.Template.expression` contains the template string (e.g., `"{{ steps.lookup.output.status }}"`)
- `WorkflowNodeInputResolverService.resolve()` handles template parsing and datastore lookup
- Replace template FilterValue with literal FilterValue containing resolved value
- Recursively walk filter tree (AND/OR groups, nested relationship filters)

### Pattern 2: Query Result Transformation to NodeOutput

**What:** Transform EntityQueryResult (domain model) to QueryEntityOutput (workflow output)
**When to use:** QueryEntityNode execute() method
**Example:**
```kotlin
// Source: Adapting EntityQueryResult to NodeOutput pattern
override fun execute(
    dataStore: WorkflowDataStore,
    inputs: Map<String, Any?>,
    services: NodeServiceProvider
): NodeOutput {
    val queryService = services.service<EntityQueryService>()
    val resolver = services.service<WorkflowNodeInputResolverService>()

    // Resolve templates in filter values
    val resolvedFilter = resolveFilterTemplates(query.filter, dataStore, resolver)
    val resolvedQuery = query.copy(filter = resolvedFilter)

    // Execute query via EntityQueryService
    val result = queryService.execute(
        query = resolvedQuery,
        workspaceId = dataStore.metadata.workspaceId,
        pagination = pagination ?: QueryPagination(limit = DEFAULT_QUERY_LIMIT)
    )

    // Transform Entity domain models to output maps
    val entityMaps = result.entities.map { entity ->
        mapOf(
            "id" to entity.id,
            "typeId" to entity.typeId,
            "payload" to entity.payload,
            "icon" to entity.icon,
            "identifier" to entity.identifier,
            "createdAt" to entity.createdAt,
            "updatedAt" to entity.updatedAt
        )
    }

    return QueryEntityOutput(
        entities = entityMaps,
        totalCount = result.totalCount.toInt(),
        hasMore = result.hasNextPage
    )
}
```

**Key details:**
- EntityQueryService returns `EntityQueryResult` with `List<Entity>` domain models
- Transform each Entity to Map<String, Any?> for template access
- Include core fields: id, typeId, payload, icon, identifier, timestamps
- hasMore comes from EntityQueryResult.hasNextPage

### Pattern 3: Batch Processing with Error Handling

**What:** Iterate query results in batches, apply updates, collect errors, respect error handling mode
**When to use:** BulkUpdateEntityNode execute() method
**Example:**
```kotlin
// Source: Combining EntityQueryService pagination with error handling pattern
override fun execute(
    dataStore: WorkflowDataStore,
    inputs: Map<String, Any?>,
    services: NodeServiceProvider
): NodeOutput {
    val queryService = services.service<EntityQueryService>()
    val entityService = services.service<EntityService>()
    val resolver = services.service<WorkflowNodeInputResolverService>()

    // Resolve templates in query filter
    val resolvedFilter = resolveFilterTemplates(queryConfig.filter, dataStore, resolver)
    val resolvedQuery = queryConfig.copy(filter = resolvedFilter)

    // Resolve field update values (support templates)
    val resolvedFieldUpdates = fieldUpdates.mapValues { (_, value) ->
        resolver.resolve(value, dataStore)
    }

    var offset = 0
    var entitiesUpdated = 0
    val failures = mutableListOf<EntityUpdateFailure>()

    // Iterate ALL results in batches
    while (true) {
        val batch = queryService.execute(
            query = resolvedQuery,
            workspaceId = dataStore.metadata.workspaceId,
            pagination = QueryPagination(limit = BULK_UPDATE_BATCH_SIZE, offset = offset)
        )

        if (batch.entities.isEmpty()) break

        // Process each entity in batch
        for (entity in batch.entities) {
            try {
                // Build SaveEntityRequest with field updates
                val saveRequest = SaveEntityRequest(
                    id = entity.id,
                    payload = resolvedFieldUpdates.mapKeys { UUID.fromString(it.key) }
                        .mapValues { (_, v) -> EntityAttributeRequest(EntityAttributePrimitivePayload(v, SchemaType.TEXT)) },
                    icon = null
                )

                entityService.saveEntity(
                    workspaceId = dataStore.metadata.workspaceId,
                    entityTypeId = entity.typeId,
                    saveRequest = saveRequest
                )

                entitiesUpdated++
            } catch (e: Exception) {
                when (errorHandling) {
                    BulkUpdateErrorHandling.FAIL_FAST -> {
                        throw WorkflowExecutionException(
                            "Bulk update failed on entity ${entity.id}: ${e.message}. " +
                            "Updated $entitiesUpdated entities before failure.",
                            e
                        )
                    }
                    BulkUpdateErrorHandling.BEST_EFFORT -> {
                        failures.add(EntityUpdateFailure(entity.id, e.message ?: "Unknown error"))
                    }
                }
            }
        }

        // Stop if last batch (no more results)
        if (!batch.hasNextPage) break

        offset += BULK_UPDATE_BATCH_SIZE
    }

    return BulkUpdateEntityOutput(
        entitiesUpdated = entitiesUpdated,
        entitiesFailed = failures.size,
        failures = if (failures.isNotEmpty()) failures else null
    )
}
```

**Key details:**
- Pagination loop processes ALL matching entities regardless of system query limit
- Each batch loads up to BULK_UPDATE_BATCH_SIZE entities
- FAIL_FAST: throw exception on first failure, include success count in message
- BEST_EFFORT: collect failures, continue processing, return summary
- No rollback semantics—updates persist even on failure

### Pattern 4: Error Handling Enum

**What:** Type-safe enum for error handling modes with clear semantics
**When to use:** BulkUpdateEntityActionConfig configuration field
**Example:**
```kotlin
// Source: Following WorkflowActionType enum pattern
enum class BulkUpdateErrorHandling {
    /**
     * Stop processing on first error.
     * Entities updated before the failure remain updated (no rollback).
     * Node execution fails with exception including success count.
     */
    FAIL_FAST,

    /**
     * Continue processing all entities regardless of individual failures.
     * Collect all failures and return summary with success/failure counts.
     * Node execution succeeds even if some entities fail.
     */
    BEST_EFFORT
}
```

**Jackson serialization:**
- Default enum serialization: `FAIL_FAST` → JSON `"FAIL_FAST"`
- Frontend renders as dropdown: ["Fail Fast", "Best Effort"]

### Pattern 5: Dynamic Entity Type in Output Metadata

**What:** Declare ENTITY_LIST output type with null entityTypeId to indicate dynamic resolution
**When to use:** QueryEntityNode and BulkUpdateEntityNode outputMetadata companion properties
**Example:**
```kotlin
// Source: Phase 1 dynamic entity type pattern
companion object {
    val outputMetadata = WorkflowNodeOutputMetadata(
        fields = listOf(
            WorkflowNodeOutputField(
                key = "entities",
                label = "Entities",
                type = OutputFieldType.ENTITY_LIST,
                description = "List of entities matching the query",
                nullable = false,
                entityTypeId = null,  // null = dynamic, resolved from node config at runtime
                exampleValue = listOf(
                    mapOf("id" to "uuid", "typeId" to "uuid", "payload" to mapOf<String, Any?>())
                )
            ),
            WorkflowNodeOutputField(
                key = "totalCount",
                label = "Total Count",
                type = OutputFieldType.NUMBER,
                nullable = false,
                exampleValue = 42
            ),
            WorkflowNodeOutputField(
                key = "hasMore",
                label = "Has More Results",
                type = OutputFieldType.BOOLEAN,
                description = "Whether more results exist beyond the current page",
                nullable = false,
                exampleValue = true
            )
        )
    )
}
```

**Frontend resolution:**
- Frontend sees `entityTypeId: null` for entities field
- Reads actual entity type from node config's `query.entityTypeId`
- Resolves entity type name from frontend's entity type cache
- Displays: "Entities (Client)" or "Entities (Project)" based on config

### Anti-Patterns to Avoid

- **Custom query logic:** Don't build custom entity filtering—EntityQueryService handles validation, SQL assembly, security
- **Processing all results at once:** Don't load entire result set into memory—use batching to control memory usage
- **Rollback on failure:** Don't attempt to undo updates on failure—workflow nodes don't support transactions across batches
- **Hardcoded batch size:** Don't inline batch size—use application property for operational flexibility
- **Ignoring filter templates:** Don't pass unresolved templates to EntityQueryService—resolve first to avoid SQL injection and errors

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Entity query validation | Custom filter validator | EntityQueryService.execute() | Already validates attribute IDs, relationship depth, operators |
| SQL query assembly | Manual SQL builder | EntityQueryAssembler (via EntityQueryService) | Handles parameterization, joins, pagination correctly |
| Template resolution | Custom `{{ }}` parser | WorkflowNodeInputResolverService.resolve() | Already handles steps/trigger/variables/loops prefixes, nested properties |
| Batch pagination | Manual offset/limit loop | QueryPagination with EntityQueryService | Already handles ordering, re-sorting by IDs, hasNextPage computation |
| Entity updates | Custom update logic | EntityService.saveEntity() | Already handles validation, relationships, audit logging, security |
| Filter tree traversal | Manual recursion | Sealed interface pattern matching | Kotlin when exhaustiveness ensures all filter types handled |

**Key insight:** This phase is primarily integration—wiring existing services together with template resolution. EntityQueryService and EntityService already handle the complex domain logic. The nodes are thin execution layers that resolve templates, invoke services, and transform results to NodeOutput format.

## Common Pitfalls

### Pitfall 1: Passing Unresolved Templates to EntityQueryService

**What goes wrong:** Templates like `{{ steps.x.output.y }}` reach EntityQueryService, causing validation errors or SQL injection risk
**Why it happens:** Forgetting to resolve FilterValue.Template before invoking queryService.execute()
**How to avoid:**
- Always call resolveFilterTemplates() before executing query
- Walk entire filter tree recursively to catch nested templates in AND/OR groups
- Test with templates in relationship filters (TargetMatches with nested attribute filters)
**Warning signs:** EntityQueryService throwing validation errors about invalid attribute values, templates appearing in SQL logs

### Pitfall 2: Query Result Limit vs Bulk Update "Process All"

**What goes wrong:** Bulk update only processes first page of results, leaving remaining entities un-updated
**Why it happens:** Confusing QueryEntityNode's single-page result with BulkUpdateEntityNode's "process all" requirement
**How to avoid:**
- QueryEntityNode: use default pagination (e.g., limit=100), return hasMore=true if more exist
- BulkUpdateEntityNode: iterate with pagination loop until hasNextPage=false
- Don't use same limit for both—query limit protects against runaway results, bulk update processes all
**Warning signs:** Bulk update count always equals query limit, users reporting "not all entities updated"

### Pitfall 3: Memory Exhaustion on Large Bulk Updates

**What goes wrong:** Loading 10,000+ entities at once causes OOM errors
**Why it happens:** Attempting to fetch all results in single query instead of batching
**How to avoid:**
- Use pagination loop: fetch batch, process batch, fetch next batch
- Recommended batch size: 50-100 entities per batch (configurable via application property)
- Each batch is a separate query—memory released between batches
**Warning signs:** OutOfMemoryError, JVM heap spikes during bulk update execution

### Pitfall 4: FAIL_FAST Without Success Count

**What goes wrong:** Node fails but user has no visibility into how many entities were updated before failure
**Why it happens:** Exception message doesn't include entitiesUpdated count
**How to avoid:**
- Include count in exception message: `"Updated $entitiesUpdated entities before failure"`
- Consider: return partial success output even on failure (requires changes to node execution contract)
- Log success count at WARN level before throwing exception
**Warning signs:** Users asking "how many succeeded?" after FAIL_FAST failure

### Pitfall 5: Entity Transformation Missing Fields

**What goes wrong:** Downstream templates reference `{{ steps.query.output.entities[0].createdAt }}` but field is null
**Why it happens:** Entity transformation to map omits fields that aren't always present (icon, identifier)
**How to avoid:**
- Include ALL Entity fields in transformation map, even if null
- Match fields in QueryEntityOutput.entities to Entity domain model structure
- Test template access to entity fields in integration tests
**Warning signs:** Template resolution warnings about missing properties, null values where data expected

### Pitfall 6: BulkUpdateEntityActionConfig Missing ENTITY_QUERY Field Type

**What goes wrong:** Frontend renders query config as JSON text area instead of visual query builder
**Why it happens:** Using WorkflowNodeConfigFieldType.JSON instead of .ENTITY_QUERY for query field
**How to avoid:**
- Set query field type to WorkflowNodeConfigFieldType.ENTITY_QUERY in configSchema
- This signals frontend to render the visual entity query builder component
- Matches pattern from WorkflowQueryEntityActionConfig
**Warning signs:** Frontend showing JSON editor for query config, users manually writing filter JSON

### Pitfall 7: Ignoring EntityService Validation Errors

**What goes wrong:** Bulk update silently fails for entities with invalid payload data
**Why it happens:** EntityService.saveEntity() throws validation exceptions not caught in BEST_EFFORT mode
**How to avoid:**
- Wrap saveEntity() calls in try/catch
- FAIL_FAST: propagate exception (include success count)
- BEST_EFFORT: catch exception, add to failures list with entity ID and error message
- Include validation errors in BulkUpdateEntityOutput.failures
**Warning signs:** Entities not updated but no failure count, missing error details in output

## Code Examples

Verified patterns from codebase research:

### QueryEntityNode Execute Implementation

```kotlin
// Source: Combining WorkflowQueryEntityActionConfig with EntityQueryService
override fun execute(
    dataStore: WorkflowDataStore,
    inputs: Map<String, Any?>,
    services: NodeServiceProvider
): NodeOutput {
    val queryService = services.service<EntityQueryService>()
    val resolver = services.service<WorkflowNodeInputResolverService>()

    logger.info { "Executing QUERY_ENTITY for type: ${query.entityTypeId}" }

    // Step 1: Resolve templates in filter values
    val resolvedFilter = resolveFilterTemplates(query.filter, dataStore, resolver)
    val resolvedQuery = query.copy(filter = resolvedFilter)

    // Step 2: Execute query via EntityQueryService
    val result = queryService.execute(
        query = resolvedQuery,
        workspaceId = dataStore.metadata.workspaceId,
        pagination = pagination ?: QueryPagination(limit = DEFAULT_QUERY_LIMIT),
        projection = projection
    )

    // Step 3: Transform Entity domain models to maps for template access
    val entityMaps = result.entities.map { entity ->
        mapOf(
            "id" to entity.id,
            "typeId" to entity.typeId,
            "payload" to entity.payload,
            "icon" to entity.icon,
            "identifier" to entity.identifier,
            "createdAt" to entity.createdAt,
            "updatedAt" to entity.updatedAt
        )
    }

    // Step 4: Return typed output
    return QueryEntityOutput(
        entities = entityMaps,
        totalCount = result.totalCount.toInt(),
        hasMore = result.hasNextPage
    )
}

companion object {
    private const val DEFAULT_QUERY_LIMIT = 100
}
```

### BulkUpdateEntityActionConfig Definition

```kotlin
// Source: Following WorkflowUpdateEntityActionConfig pattern
@Schema(
    name = "WorkflowBulkUpdateEntityActionConfig",
    description = "Configuration for BULK_UPDATE_ENTITY action nodes."
)
@JsonTypeName("workflow_bulk_update_entity_action")
@JsonDeserialize(using = JsonDeserializer.None::class)
data class WorkflowBulkUpdateEntityActionConfig(
    override val version: Int = 1,

    @param:Schema(
        description = "Query configuration to find entities to update."
    )
    val queryConfig: EntityQuery,

    @param:Schema(
        description = "Map of attribute UUID to value to update. Values support templates.",
        example = """{"status-uuid": "completed", "assignee-uuid": "{{ steps.lookup.output.userId }}"}"""
    )
    val fieldUpdates: Map<String, String>,

    @param:Schema(
        description = "Error handling mode: FAIL_FAST or BEST_EFFORT",
        defaultValue = "FAIL_FAST"
    )
    val errorHandling: BulkUpdateErrorHandling = BulkUpdateErrorHandling.FAIL_FAST,

    @param:Schema(
        description = "Optional timeout override in seconds",
        nullable = true
    )
    val timeoutSeconds: Long? = null

) : WorkflowActionConfig {

    override val type: WorkflowNodeType
        get() = WorkflowNodeType.ACTION

    override val subType: WorkflowActionType
        get() = WorkflowActionType.BULK_UPDATE_ENTITY

    override val config: Map<String, Any?>
        get() = mapOf(
            "queryConfig" to queryConfig,
            "fieldUpdates" to fieldUpdates,
            "errorHandling" to errorHandling.name,
            "timeoutSeconds" to timeoutSeconds
        )

    override val configSchema: List<WorkflowNodeConfigField>
        get() = Companion.configSchema

    companion object {
        val metadata = WorkflowNodeTypeMetadata(
            label = "Bulk Update Entities",
            description = "Updates all entities matching a query",
            icon = IconType.EDIT,
            category = WorkflowNodeType.ACTION
        )

        val configSchema: List<WorkflowNodeConfigField> = listOf(
            WorkflowNodeConfigField(
                key = "queryConfig",
                label = "Query",
                type = WorkflowNodeConfigFieldType.ENTITY_QUERY,
                required = true,
                description = "Query to find entities to update"
            ),
            WorkflowNodeConfigField(
                key = "fieldUpdates",
                label = "Field Updates",
                type = WorkflowNodeConfigFieldType.KEY_VALUE,
                required = true,
                description = "Attribute UUID to value mappings"
            ),
            WorkflowNodeConfigField(
                key = "errorHandling",
                label = "Error Handling",
                type = WorkflowNodeConfigFieldType.ENUM,
                required = true,
                description = "How to handle individual entity update failures"
            ),
            WorkflowNodeConfigField(
                key = "timeoutSeconds",
                label = "Timeout (seconds)",
                type = WorkflowNodeConfigFieldType.DURATION,
                required = false,
                description = "Optional timeout override"
            )
        )

        val outputMetadata = WorkflowNodeOutputMetadata(
            fields = listOf(
                WorkflowNodeOutputField(
                    key = "entitiesUpdated",
                    label = "Entities Updated",
                    type = OutputFieldType.NUMBER,
                    description = "Count of successfully updated entities",
                    nullable = false,
                    exampleValue = 15
                ),
                WorkflowNodeOutputField(
                    key = "entitiesFailed",
                    label = "Entities Failed",
                    type = OutputFieldType.NUMBER,
                    description = "Count of entities that failed to update",
                    nullable = false,
                    exampleValue = 2
                ),
                WorkflowNodeOutputField(
                    key = "failures",
                    label = "Failure Details",
                    type = OutputFieldType.LIST,
                    description = "List of failed entity IDs with error messages (BEST_EFFORT mode only)",
                    nullable = true,
                    exampleValue = listOf(
                        mapOf("entityId" to "uuid", "error" to "Validation failed")
                    )
                )
            )
        )
    }
}
```

### BulkUpdateEntityOutput Data Class

```kotlin
// Source: Following NodeOutput pattern from NodeOutput.kt
/**
 * Output from BULK_UPDATE_ENTITY action.
 *
 * @property entitiesUpdated Count of successfully updated entities
 * @property entitiesFailed Count of entities that failed to update
 * @property failures Optional list of failures with entity IDs and error messages
 */
data class BulkUpdateEntityOutput(
    val entitiesUpdated: Int,
    val entitiesFailed: Int,
    val failures: List<EntityUpdateFailure>? = null
) : NodeOutput {
    override fun toMap(): Map<String, Any?> = mapOf(
        "entitiesUpdated" to entitiesUpdated,
        "entitiesFailed" to entitiesFailed,
        "failures" to failures?.map { it.toMap() }
    )
}

/**
 * Details of a single entity update failure.
 *
 * @property entityId UUID of the entity that failed to update
 * @property error Error message describing the failure
 */
data class EntityUpdateFailure(
    val entityId: UUID,
    val error: String
) {
    fun toMap(): Map<String, Any?> = mapOf(
        "entityId" to entityId.toString(),
        "error" to error
    )
}
```

### Filter Template Resolution

```kotlin
// Source: Recursive filter tree traversal with template resolution
private fun resolveFilterTemplates(
    filter: QueryFilter?,
    dataStore: WorkflowDataStore,
    resolver: WorkflowNodeInputResolverService
): QueryFilter? {
    if (filter == null) return null

    return when (filter) {
        is QueryFilter.Attribute -> {
            when (val value = filter.value) {
                is FilterValue.Literal -> filter
                is FilterValue.Template -> {
                    val resolvedValue = resolver.resolve(value.expression, dataStore)
                    filter.copy(value = FilterValue.Literal(resolvedValue))
                }
            }
        }

        is QueryFilter.And -> {
            filter.copy(
                conditions = filter.conditions.map {
                    resolveFilterTemplates(it, dataStore, resolver) ?: it
                }
            )
        }

        is QueryFilter.Or -> {
            filter.copy(
                conditions = filter.conditions.map {
                    resolveFilterTemplates(it, dataStore, resolver) ?: it
                }
            )
        }

        is QueryFilter.Relationship -> {
            when (val condition = filter.condition) {
                is RelationshipFilter.TargetMatches -> {
                    filter.copy(
                        condition = condition.copy(
                            filter = resolveFilterTemplates(condition.filter, dataStore, resolver)
                                ?: condition.filter
                        )
                    )
                }
                is RelationshipFilter.TargetEquals -> {
                    // Resolve template entity IDs
                    val resolvedIds = condition.entityIds.map { id ->
                        val resolved = resolver.resolve(id, dataStore)
                        if (resolved is UUID) resolved.toString() else resolved as String
                    }
                    filter.copy(
                        condition = condition.copy(entityIds = resolvedIds)
                    )
                }
                else -> filter
            }
        }
    }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual SQL for queries | EntityQueryService with filter validation | Phase 5 (recent) | Type-safe queries, parameterization, security validation |
| Single large transaction | Batch processing with error collection | Spring Batch 4.0+ | Memory-efficient, better error visibility |
| Boolean error flags | Enum error handling modes | Modern API design | Extensible, self-documenting |
| Template strings in SQL | FilterValue.Template + pre-resolution | Security best practice 2020+ | Prevents SQL injection, type safety |
| Pagination via SQL OFFSET | EntityQueryService re-sorting by IDs | Best practice | Preserves order across batches |

**Deprecated/outdated:**
- Direct SQL concatenation for filters: Use EntityQueryService with QueryFilter hierarchy
- Processing all results in memory: Use pagination loop with batching
- Rollback attempts in workflow nodes: Workflows don't support distributed transactions—design for idempotency

## Open Questions

1. **Query result limit value**
   - What we know: System-wide default prevents runaway queries, user cannot override
   - What's unclear: Exact limit value (100? 500? 1000?)
   - Recommendation: Start with 100 for QueryEntityNode (matches typical UI pagination). Configure via application property `riven.workflow.query.default-limit=100` for flexibility.

2. **Bulk update batch size**
   - What we know: Process in batches to control memory usage
   - What's unclear: Optimal batch size (50? 100? 200?)
   - Recommendation: Start with 50 entities per batch. Configure via application property `riven.workflow.bulk-update.batch-size=50`. Monitor memory usage and adjust.

3. **Entity map representation**
   - What we know: Query output includes full entity objects for template access
   - What's unclear: Should payload be flattened or remain as nested UUID map?
   - Recommendation: Keep payload as-is (Map<UUID, Any?>). Frontend already handles this format. Flattening would complicate template resolution for nested values.

4. **Partial success on FAIL_FAST**
   - What we know: No rollback—entities updated before failure stay updated
   - What's unclear: Should we return partial output with success count, or just throw exception?
   - Recommendation: Throw exception with success count in message. Workflow execution stops, but message provides visibility. Consider: add optional partial result capture in Phase 3+.

## Sources

### Primary (HIGH confidence)
- Existing codebase patterns:
  - `/home/jared/dev/worktrees/workflows/core/src/main/kotlin/riven/core/service/entity/query/EntityQueryService.kt` - Query execution, validation, pagination
  - `/home/jared/dev/worktrees/workflows/core/src/main/kotlin/riven/core/models/entity/query/filter/FilterValue.kt` - Template support in filters
  - `/home/jared/dev/worktrees/workflows/core/src/main/kotlin/riven/core/service/workflow/state/WorkflowNodeInputResolverService.kt` - Template resolution pattern
  - `/home/jared/dev/worktrees/workflows/core/src/main/kotlin/riven/core/models/workflow/node/config/actions/WorkflowUpdateEntityActionConfig.kt` - Entity update pattern
  - `/home/jared/dev/worktrees/workflows/core/src/main/kotlin/riven/core/models/workflow/engine/state/NodeOutput.kt` - Output pattern, QueryEntityOutput exists

### Secondary (MEDIUM confidence)
- Configuration:
  - `/home/jared/dev/worktrees/workflows/core/src/main/resources/application.yml` - Query timeout property `riven.query.timeout-seconds: 10`
- Phase 1 research:
  - `/home/jared/dev/worktrees/workflows/core/.planning/phases/01-foundation-infrastructure/01-RESEARCH.md` - Output metadata pattern, dynamic entity types

### Tertiary (LOW confidence)
- Spring Batch best practices for large dataset processing (general knowledge, not specific to this codebase)
- Error handling patterns in workflow orchestration (general best practice)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All services exist, verified in codebase
- Architecture: HIGH - Patterns verified in existing WorkflowActionConfig implementations
- Pitfalls: MEDIUM - Inferred from query service patterns and batch processing best practices

**Research date:** 2026-02-13
**Valid until:** 2026-03-13 (30 days - stable internal services, unlikely to change)
