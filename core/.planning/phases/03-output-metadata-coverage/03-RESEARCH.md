# Phase 3: Output Metadata Coverage - Research

**Researched:** 2026-02-14
**Domain:** Kotlin data model extension and companion object metadata declaration
**Confidence:** HIGH

## Summary

Phase 3 adds outputMetadata declarations to six existing workflow node types that already have execute() implementations and corresponding NodeOutput types but lack companion object metadata. This is a straightforward, low-risk rollout following the exact pattern established in Phase 1 (CreateEntityActionConfig) and Phase 2 (QueryEntityActionConfig, BulkUpdateEntityActionConfig).

The infrastructure is complete: OutputFieldType enum exists, WorkflowNodeOutputField and WorkflowNodeOutputMetadata data classes are defined, registry reflection extracts companion outputMetadata, and the API exposes it. The validation test suite (OutputMetadataValidationTest) is parameterized and ready to validate new declarations.

This phase is purely additive - no changes to execution logic, no new dependencies, no architectural risk. Each node requires only adding a companion object property that mirrors its existing NodeOutput.toMap() keys.

**Primary recommendation:** Implement all six node outputMetadata declarations in a single plan. Group by pattern similarity to minimize context switching and enable batch verification.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Kotlin | 1.9+ | Primary language | Codebase standard, data classes with companion objects |
| Spring Boot | 3.x | DI framework | Existing service injection pattern via NodeServiceProvider |
| JUnit 5 | 5.10+ | Testing | Existing parameterized test infrastructure |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Jackson | 2.x | JSON serialization | Already integrated for polymorphic config deserialization |
| Kotlin Reflection | stdlib | Companion object introspection | Registry already uses kotlin-reflect for metadata extraction |

### Alternatives Considered
None - the infrastructure and patterns are fully established. This phase implements no new architecture.

## Architecture Patterns

### Recommended Project Structure
```
src/main/kotlin/riven/core/models/workflow/node/config/
├── actions/
│   ├── WorkflowUpdateEntityActionConfig.kt     # Add outputMetadata
│   ├── WorkflowDeleteEntityActionConfig.kt     # Add outputMetadata
│   ├── WorkflowHttpRequestActionConfig.kt      # Add outputMetadata
│   └── (CreateEntity, QueryEntity, BulkUpdate already have it)
└── controls/
    └── WorkflowConditionControlConfig.kt       # Add outputMetadata
```

### Pattern 1: Companion Object outputMetadata Declaration
**What:** Each WorkflowActionConfig/WorkflowControlConfig companion object declares a `val outputMetadata = WorkflowNodeOutputMetadata(...)` property mirroring its execute() return type's toMap() keys.

**When to use:** Required for every node type that returns a typed NodeOutput subclass (excludes UnsupportedNodeOutput for trigger nodes).

**Example:**
```kotlin
// From WorkflowCreateEntityActionConfig.kt (Phase 1 proof-of-concept)
companion object {
    val metadata = WorkflowNodeTypeMetadata(...)
    val configSchema: List<WorkflowNodeConfigField> = listOf(...)

    val outputMetadata = WorkflowNodeOutputMetadata(
        fields = listOf(
            WorkflowNodeOutputField(
                key = "entityId",
                label = "Entity ID",
                type = OutputFieldType.UUID,
                exampleValue = "550e8400-e29b-41d4-a716-446655440000"
            ),
            WorkflowNodeOutputField(
                key = "entityTypeId",
                label = "Entity Type ID",
                type = OutputFieldType.UUID,
                exampleValue = "660e8400-e29b-41d4-a716-446655440001"
            ),
            WorkflowNodeOutputField(
                key = "payload",
                label = "Entity Payload",
                type = OutputFieldType.MAP,
                description = "Entity attributes as UUID-keyed map",
                exampleValue = mapOf("770e8400-e29b-41d4-a716-446655440002" to "Example Value")
            )
        )
    )
}
```

### Pattern 2: OutputFieldType Mapping to Kotlin Types
**What:** Each OutputFieldType enum value maps to specific Kotlin runtime types validated by OutputMetadataValidationTest.

**Type mapping:**
| OutputFieldType | Kotlin Type | Example Value |
|----------------|-------------|---------------|
| UUID | java.util.UUID | UUID string in exampleValue |
| STRING | kotlin.String | "example" |
| BOOLEAN | kotlin.Boolean | true / false |
| NUMBER | kotlin.Number (Int, Long, Double) | 42 |
| MAP | kotlin.collections.Map<*, *> | mapOf("key" to "value") |
| LIST | kotlin.collections.List<*> | listOf(...) / emptyList() |
| OBJECT | Any non-primitive | Not validated (nullable OK) |
| ENTITY | Map<String, Any?> | Entity serialization format |
| ENTITY_LIST | List<Map<String, Any?>> | List of entity maps |

**Example values use native Kotlin constructors:**
```kotlin
exampleValue = mapOf("key" to "value")  // Not JSON string
exampleValue = listOf(mapOf(...))       // Native collections
exampleValue = 42                       // Native number
```

### Pattern 3: NodeOutput.toMap() Superset Rule
**What:** Declared outputMetadata keys must exist in NodeOutput.toMap(), but toMap() may include extra keys for internal/computed fields.

**Why:** Some NodeOutputs compute additional fields (e.g., HttpResponseOutput.success computed from statusCode). These don't need to be in the public outputMetadata API but are available for template access.

**Example:**
```kotlin
// HttpResponseOutput.toMap() returns:
mapOf(
    "statusCode" to statusCode,  // Declared in outputMetadata
    "headers" to headers,         // Declared in outputMetadata
    "body" to body,              // Declared in outputMetadata
    "url" to url,                // Declared in outputMetadata
    "method" to method,          // Declared in outputMetadata
    "success" to success         // Computed - OK to omit from outputMetadata
)
```

**Decision:** Computed fields MAY be omitted from outputMetadata if they're not part of the primary API contract. Focus outputMetadata on fields the frontend needs for node connection previews.

### Anti-Patterns to Avoid
- **Declaring keys not in toMap():** OutputMetadataValidationTest will fail. Only declare keys that exist in the corresponding NodeOutput.toMap() implementation.
- **Type mismatches:** Declaring `type = OutputFieldType.UUID` for a field that toMap() returns as String will fail validation.
- **JSON string exampleValues:** Use native Kotlin `mapOf()` / `listOf()` instead of JSON strings.
- **Nullable fields without nullable=true:** If toMap() can return null for a field, set `nullable = true` in WorkflowNodeOutputField.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Reflection for companion access | Custom introspection | kotlin-reflect members.find | Already integrated in registry, handles companion object access safely |
| Type validation | Manual instanceof checks | OutputMetadataValidationTest | Parameterized test suite already validates type mapping consistently |
| Example value generation | Runtime sampling | Static mapOf/listOf in declaration | Deterministic, safe, no execution required |

**Key insight:** The infrastructure is complete and battle-tested from Phase 1 and 2. Don't invent new patterns - copy the existing declarations verbatim and adapt field names.

## Common Pitfalls

### Pitfall 1: Forgetting to Update OutputMetadataValidationTest
**What goes wrong:** New outputMetadata declared but test suite still shows node as "missing outputMetadata (Phase 3 TODO)".
**Why it happens:** OutputMetadataValidationTest.nodeOutputTestCases() has null placeholders for Phase 3 nodes.
**How to avoid:** For each node, update the test case from `outputMetadata = null` to `outputMetadata = WorkflowXActionConfig.outputMetadata`.
**Warning signs:** Test runs show "WARNING: X missing outputMetadata" for nodes you just implemented.

### Pitfall 2: Using Different Field Names Than toMap() Keys
**What goes wrong:** Validation test fails with "Declared key 'x' not found in toMap()".
**Why it happens:** Copy-paste error or misreading the NodeOutput implementation.
**How to avoid:** Open the corresponding NodeOutput class (e.g., UpdateEntityOutput), copy the exact keys from toMap(), paste into outputMetadata declaration.
**Warning signs:** Test error message lists available keys that don't match declared keys.

### Pitfall 3: Incorrect entityTypeId Usage
**What goes wrong:** Setting entityTypeId to a static UUID when the node works with multiple entity types.
**Why it happens:** Misunderstanding the "dynamic entity type resolution" decision.
**How to avoid:** Set `entityTypeId = null` for ENTITY and ENTITY_LIST fields where the type is determined at runtime from node config. Only set a specific UUID if the node ALWAYS works with exactly one entity type (none of the Phase 3 nodes do).
**Warning signs:** Frontend shows wrong entity type suggestions for generic nodes like QueryEntity.

### Pitfall 4: Including Computed Fields Without Checking toMap()
**What goes wrong:** Declaring a field that seems logical but doesn't exist in toMap() implementation.
**Why it happens:** Assuming fields based on documentation instead of checking actual code.
**How to avoid:** ALWAYS cross-reference NodeOutput.toMap() implementation before declaring outputMetadata. If a field isn't in toMap(), it can't be in outputMetadata.
**Warning signs:** Test fails immediately on first run with "key not found" error.

## Code Examples

Verified patterns from existing implementations:

### Entity Action Output (from CreateEntityActionConfig - Phase 1)
```kotlin
// Source: WorkflowCreateEntityActionConfig.kt lines 144-167
val outputMetadata = WorkflowNodeOutputMetadata(
    fields = listOf(
        WorkflowNodeOutputField(
            key = "entityId",
            label = "Entity ID",
            type = OutputFieldType.UUID,
            exampleValue = "550e8400-e29b-41d4-a716-446655440000"
        ),
        WorkflowNodeOutputField(
            key = "entityTypeId",
            label = "Entity Type ID",
            type = OutputFieldType.UUID,
            exampleValue = "660e8400-e29b-41d4-a716-446655440001"
        ),
        WorkflowNodeOutputField(
            key = "payload",
            label = "Entity Payload",
            type = OutputFieldType.MAP,
            description = "Entity attributes as UUID-keyed map",
            exampleValue = mapOf("770e8400-e29b-41d4-a716-446655440002" to "Example Value")
        )
    )
)
```

### Query/List Output (from QueryEntityActionConfig - Phase 2)
```kotlin
// Source: WorkflowQueryEntityActionConfig.kt lines 240-272
val outputMetadata = WorkflowNodeOutputMetadata(
    fields = listOf(
        WorkflowNodeOutputField(
            key = "entities",
            label = "Matching Entities",
            type = OutputFieldType.ENTITY_LIST,
            description = "List of entities matching the query filters",
            entityTypeId = null,  // Dynamic - resolved from query.entityTypeId at runtime
            exampleValue = listOf(
                mapOf(
                    "id" to "550e8400-e29b-41d4-a716-446655440000",
                    "typeId" to "660e8400-e29b-41d4-a716-446655440001",
                    "payload" to mapOf("attr-uuid" to "Example Value")
                )
            )
        ),
        WorkflowNodeOutputField(
            key = "totalCount",
            label = "Total Count",
            type = OutputFieldType.NUMBER,
            description = "Total number of matching entities (before pagination limit)",
            exampleValue = 42
        ),
        WorkflowNodeOutputField(
            key = "hasMore",
            label = "Has More",
            type = OutputFieldType.BOOLEAN,
            description = "Whether more results exist beyond the system limit",
            exampleValue = false
        )
    )
)
```

### Bulk Operation Output (from BulkUpdateEntityActionConfig - Phase 2)
```kotlin
// Source: WorkflowBulkUpdateEntityActionConfig.kt lines 201-232
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
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No frontend node output preview | outputMetadata in registry | Phase 1 (completed) | Frontend can now display what each node produces |
| Manual template discovery | Declarative output schema | Phase 1 (completed) | Autocomplete for {{ steps.x.output.* }} |
| Null outputMetadata for most nodes | Full coverage across all node types | Phase 3 (this phase) | Complete metadata coverage for production use |

**Deprecated/outdated:**
- Phase 1 TODO comments about nodes needing outputMetadata - now being resolved systematically
- Test warnings about missing outputMetadata - will be eliminated by end of Phase 3

## Open Questions

None. This is a mechanical rollout of an established pattern. All architectural decisions were made in Phase 1.

## Sources

### Primary (HIGH confidence)
- /home/jared/dev/worktrees/workflows/core/src/main/kotlin/riven/core/models/workflow/node/config/actions/WorkflowCreateEntityActionConfig.kt - Phase 1 proof-of-concept implementation
- /home/jared/dev/worktrees/workflows/core/src/main/kotlin/riven/core/models/workflow/node/config/actions/WorkflowQueryEntityActionConfig.kt - Phase 2 implementation with ENTITY_LIST pattern
- /home/jared/dev/worktrees/workflows/core/src/main/kotlin/riven/core/models/workflow/node/config/actions/WorkflowBulkUpdateEntityActionConfig.kt - Phase 2 implementation with bulk operation pattern
- /home/jared/dev/worktrees/workflows/core/src/main/kotlin/riven/core/models/workflow/engine/state/NodeOutput.kt - Source of truth for all toMap() implementations
- /home/jared/dev/worktrees/workflows/core/src/test/kotlin/riven/core/models/workflow/node/config/OutputMetadataValidationTest.kt - Parameterized validation test suite
- /home/jared/dev/worktrees/workflows/core/.planning/phases/01-foundation-infrastructure/01-01-PLAN.md - Phase 1 plan showing infrastructure setup
- /home/jared/dev/worktrees/workflows/core/.planning/phases/02-query-bulk-update-execution/02-01-PLAN.md - Phase 2 plan showing outputMetadata rollout pattern

### Secondary (MEDIUM confidence)
None needed - all information verified from codebase.

### Tertiary (LOW confidence)
None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, using existing Kotlin/Spring infrastructure
- Architecture: HIGH - Exact pattern replicated 3 times already (CreateEntity, QueryEntity, BulkUpdateEntity)
- Pitfalls: HIGH - Test suite catches all common errors, validation is automated

**Research date:** 2026-02-14
**Valid until:** Stable - Core Kotlin language feature, established internal pattern

## Phase 3 Specific Findings

### Node Inventory
Six nodes require outputMetadata:

| Node Type | Output Class | toMap() Keys | Notes |
|-----------|--------------|--------------|-------|
| UPDATE_ENTITY | UpdateEntityOutput | entityId, updated, payload | Similar to CreateEntity pattern |
| DELETE_ENTITY | DeleteEntityOutput | entityId, deleted, impactedEntities | Simple boolean + count pattern |
| QUERY_ENTITY | QueryEntityOutput | entities, totalCount, hasMore | Already implemented in Phase 2, just needs test update |
| HTTP_REQUEST | HttpResponseOutput | statusCode, headers, body, url, method, success | Note: success is computed field in toMap() |
| CONDITION | ConditionOutput | result, conditionResult, evaluatedExpression | Note: conditionResult is backward compatibility alias |
| BULK_UPDATE_ENTITY | BulkUpdateEntityOutput | entitiesUpdated, entitiesFailed, failedEntityDetails, totalProcessed | Already implemented in Phase 2, just needs test update |

**IMPORTANT:** QueryEntity and BulkUpdateEntity already have outputMetadata declared (from Phase 2). Phase 3 only needs to update OutputMetadataValidationTest to reference them instead of null.

### Actual Work Required
- **Add outputMetadata:** 4 nodes (UpdateEntity, DeleteEntity, HttpRequest, Condition)
- **Update test only:** 2 nodes (QueryEntity, BulkUpdateEntity - already have outputMetadata)

### Test Suite Integration Pattern
```kotlin
// Current state (from OutputMetadataValidationTest.kt)
Arguments.of(
    OutputMetadataTestCase(
        nodeLabel = "UPDATE_ENTITY",
        outputMetadata = null,  // Change to: WorkflowUpdateEntityActionConfig.outputMetadata
        exampleOutput = UpdateEntityOutput(...)
    )
)
```

For QueryEntity and BulkUpdateEntity, the test case exists but references null instead of the actual companion property. Simple one-line fix per node.

### Implementation Grouping Strategy
Group nodes by pattern similarity to enable efficient copy-paste-adapt workflow:

**Group 1: Entity CRUD (similar to CreateEntity)**
- UpdateEntityActionConfig
- DeleteEntityActionConfig

**Group 2: External/Control (different pattern)**
- HttpRequestActionConfig (HTTP response pattern)
- ConditionControlConfig (control flow pattern)

**Group 3: Test Updates Only**
- QueryEntityActionConfig
- BulkUpdateEntityActionConfig

### Validation Checklist Per Node
1. Open NodeOutput class, copy exact toMap() keys
2. Map each key to correct OutputFieldType
3. Add companion object property using pattern from CreateEntity
4. Update test case from `null` to `WorkflowXActionConfig.outputMetadata`
5. Run `./gradlew test` - should pass with no warnings
6. Verify test output no longer shows "WARNING: X missing outputMetadata"
