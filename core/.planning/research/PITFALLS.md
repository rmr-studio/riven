# Domain Pitfalls: Node Output Metadata

**Domain:** Workflow Engine Metadata Infrastructure
**Researched:** 2026-02-10

## Critical Pitfalls

Mistakes that cause maintenance burden or broken functionality.

### Pitfall 1: Schema-Runtime Mismatch

**What goes wrong:** Developer adds field to `NodeOutput` data class but forgets to update companion object `outputSchema`.

**Example:**
```kotlin
// Developer adds new field to runtime type
data class UpdateEntityOutput(
    val entityId: UUID,
    val updated: Boolean,
    val payload: Map<UUID, Any?>,
    val modifiedAt: Instant  // NEW FIELD
) : NodeOutput {
    override fun toMap(): Map<String, Any?> = mapOf(
        "entityId" to entityId,
        "updated" to updated,
        "payload" to payload,
        "modifiedAt" to modifiedAt  // NEW in map
    )
}

// But companion object schema remains outdated
companion object {
    val outputSchema = listOf(
        WorkflowNodeOutputField(key = "entityId", ...),
        WorkflowNodeOutputField(key = "updated", ...),
        WorkflowNodeOutputField(key = "payload", ...)
        // MISSING: modifiedAt
    )
}
```

**Consequences:**
- Frontend doesn't show `modifiedAt` in output preview
- Template autocomplete doesn't suggest `{{ steps.update.output.modifiedAt }}`
- Users can't discover the field exists
- Works at runtime but invisible in UI

**Prevention:**
1. Add unit test validating schema keys match `toMap()` keys
2. Code review checklist: "If NodeOutput changed, did outputSchema change?"
3. Consider validation warning in `WorkflowNodeConfigRegistry.registerNode()`

**Detection:**
```kotlin
@Test
fun `outputSchema matches NodeOutput toMap keys`() {
    val output = UpdateEntityOutput(/*...*/)
    val schemaKeys = UpdateEntityActionConfig.outputSchema.map { it.key }.toSet()
    val runtimeKeys = output.toMap().keys

    assertEquals(schemaKeys, runtimeKeys)
}
```

### Pitfall 2: Template Resolution Path Mismatch

**What goes wrong:** `outputSchema` declares field keys that don't match how data is actually stored in `WorkflowDataStore`.

**Example:**
```kotlin
// Schema declares key as camelCase
val outputSchema = listOf(
    WorkflowNodeOutputField(
        key = "entityId",  // camelCase
        label = "Entity ID",
        type = WorkflowNodeOutputFieldType.UUID
    )
)

// But toMap() uses snake_case (typo or inconsistency)
override fun toMap(): Map<String, Any?> = mapOf(
    "entity_id" to entityId,  // snake_case — MISMATCH
    "updated" to updated
)
```

**Consequences:**
- Frontend suggests `{{ steps.update.output.entityId }}` (from schema)
- Runtime template resolution fails: key "entityId" not found in map
- Templates silently return null or throw resolution errors
- Users see field in UI but can't use it

**Prevention:**
1. Enforce consistent naming convention: all keys camelCase
2. Unit test validates schema keys exist in `toMap()` output
3. Integration test executes node and verifies template resolution

**Detection:**
```kotlin
@Test
fun `schema keys are accessible via toMap`() {
    val output = UpdateEntityOutput(/*...*/)
    val outputMap = output.toMap()
    val schemaKeys = UpdateEntityActionConfig.outputSchema.map { it.key }

    schemaKeys.forEach { key ->
        assertTrue(outputMap.containsKey(key), "Schema key '$key' not in toMap()")
    }
}
```

### Pitfall 3: Dynamic Schema Assumptions

**What goes wrong:** Declaring static schema for outputs with runtime-determined structure.

**Example:**
```kotlin
// QueryEntityOutput returns entities with attributes determined by entity type
data class QueryEntityOutput(
    val entities: List<Map<String, Any?>>,  // Structure varies by entity type
    val totalCount: Int,
    val hasMore: Boolean
) : NodeOutput

// Schema attempts to be specific but can't predict runtime structure
val outputSchema = listOf(
    WorkflowNodeOutputField(
        key = "entities",
        type = WorkflowNodeOutputFieldType.ARRAY,
        arrayOf = WorkflowNodeOutputFieldType.OBJECT,
        objectSchema = listOf(
            WorkflowNodeOutputField(key = "name", type = STRING),      // Wrong assumption
            WorkflowNodeOutputField(key = "email", type = STRING),     // Entity might not have these
            WorkflowNodeOutputField(key = "status", type = STRING)     // Overly specific
        )
    )
)
```

**Consequences:**
- Frontend shows wrong fields in autocomplete
- Users expect `entities[0].name` but entity type has different attributes
- Schema becomes misleading rather than helpful

**Prevention:**
1. Use generic types for runtime-determined structures: `MAP` instead of `OBJECT` with specific schema
2. Document in description that structure is dynamic
3. Consider Phase 6 enhancement for computed schemas if needed

**Correct approach:**
```kotlin
val outputSchema = listOf(
    WorkflowNodeOutputField(
        key = "entities",
        label = "Entities",
        type = WorkflowNodeOutputFieldType.ARRAY,
        arrayOf = WorkflowNodeOutputFieldType.MAP,  // Generic map, no specific schema
        description = "List of entities with attributes determined by entity type schema"
    ),
    WorkflowNodeOutputField(key = "totalCount", ...),
    WorkflowNodeOutputField(key = "hasMore", ...)
)
```

## Moderate Pitfalls

Mistakes that cause confusion but are recoverable.

### Pitfall 1: Overly Verbose Descriptions

**What goes wrong:** Output field descriptions contain implementation details instead of user-facing explanations.

**Example:**
```kotlin
// BAD: Technical jargon
WorkflowNodeOutputField(
    key = "entityId",
    label = "Entity ID",
    type = WorkflowNodeOutputFieldType.UUID,
    description = "Primary key UUID from entities table auto-generated via PostgreSQL uuid_generate_v4() function"
)

// GOOD: User-focused
WorkflowNodeOutputField(
    key = "entityId",
    label = "Entity ID",
    type = WorkflowNodeOutputFieldType.UUID,
    description = "Unique identifier of the created entity"
)
```

**Consequences:**
- Frontend users are confused by technical details they don't need
- Descriptions clutter UI without adding value
- Implementation details leak to user-facing layer

**Prevention:** Write descriptions from user perspective: "What can I do with this field?" not "How is it implemented?"

### Pitfall 2: Missing Nullable Indicators

**What goes wrong:** Not marking fields as nullable when they can be null at runtime.

**Example:**
```kotlin
// Runtime type allows null
data class HttpResponseOutput(
    val statusCode: Int,
    val headers: Map<String, String>,
    val body: String?,  // Nullable
    val url: String,
    val method: String
) : NodeOutput

// Schema declares as non-nullable
val outputSchema = listOf(
    WorkflowNodeOutputField(
        key = "body",
        label = "Response Body",
        type = WorkflowNodeOutputFieldType.STRING,
        nullable = false  // WRONG: Should be true
    )
)
```

**Consequences:**
- Frontend expects `body` always present
- Template resolution might fail when `body` is null
- Users surprised by null values when schema said non-null

**Prevention:** Review `NodeOutput` data class for nullable types (`String?`, `Int?`, etc.) and mark corresponding schema fields `nullable = true`.

### Pitfall 3: Inconsistent Type Granularity

**What goes wrong:** Using different levels of type specificity across similar fields.

**Example:**
```kotlin
// Inconsistent: some UUIDs declared as STRING, others as UUID
val outputSchema = listOf(
    WorkflowNodeOutputField(key = "entityId", type = UUID),        // Specific
    WorkflowNodeOutputField(key = "entityTypeId", type = STRING),  // Generic — inconsistent
    WorkflowNodeOutputField(key = "workspaceId", type = UUID)      // Specific
)
```

**Consequences:**
- Frontend can't consistently validate or render UUID fields
- Users confused why some IDs have UUID UI treatment and others don't

**Prevention:** Use specific types (`UUID`, not `STRING`) for all UUIDs. Be consistent across all schema declarations.

## Minor Pitfalls

Small mistakes that are easily fixed.

### Pitfall 1: Copy-Paste Errors in Labels

**What goes wrong:** Copying companion object from another node and forgetting to update labels.

**Example:**
```kotlin
// Copied from WorkflowCreateEntityActionConfig but not updated
companion object {
    val outputSchema = listOf(
        WorkflowNodeOutputField(
            key = "entityId",
            label = "Created Entity ID",  // Says "Created" but this is UPDATE node
            type = WorkflowNodeOutputFieldType.UUID
        )
    )
}
```

**Consequences:** Confusing labels in frontend (minor UX issue).

**Prevention:** Review labels match node's action verb (Create → "Created Entity", Update → "Updated Entity", etc.).

### Pitfall 2: Redundant Descriptions

**What goes wrong:** Description just restates the label without adding information.

**Example:**
```kotlin
// BAD: Redundant
WorkflowNodeOutputField(
    key = "entityId",
    label = "Entity ID",
    description = "The entity ID"  // Adds nothing
)

// BETTER: Informative
WorkflowNodeOutputField(
    key = "entityId",
    label = "Entity ID",
    description = "Unique identifier for referencing this entity in other nodes"
)

// ACCEPTABLE: Omit if obvious
WorkflowNodeOutputField(
    key = "entityId",
    label = "Entity ID",
    description = null  // Label is self-explanatory
)
```

**Prevention:** Only add description if it provides additional context. Omit if label is self-explanatory.

### Pitfall 3: Forgetting to Register Node After Adding Schema

**What goes wrong:** Adding `outputSchema` to companion object but node not registered in `WorkflowNodeConfigRegistry.registerAllNodes()`.

**Example:**
```kotlin
// New node config with outputSchema
data class WorkflowNewActionConfig(...) : WorkflowActionConfig {
    companion object {
        val metadata = WorkflowNodeTypeMetadata(...)
        val configSchema = listOf(...)
        val outputSchema = listOf(...)  // Added
    }
}

// But WorkflowNodeConfigRegistry.registerAllNodes() doesn't include it
private fun registerAllNodes(): List<NodeSchemaEntry> {
    return listOfNotNull(
        registerNode<WorkflowCreateEntityActionConfig>(...),
        registerNode<WorkflowUpdateEntityActionConfig>(...),
        // Missing: registerNode<WorkflowNewActionConfig>(...)
    )
}
```

**Consequences:**
- Node appears in codebase but not in `/api/v1/workflow/definitions/nodes` response
- Frontend can't use the node
- Silent failure: no error, just missing

**Prevention:**
- Add new nodes to `registerAllNodes()` immediately after creating config class
- Integration test verifying all known action types appear in API response

**Detection:**
```kotlin
@Test
fun `all action config classes are registered`() {
    val registeredSubTypes = registry.getSchemasByType(WorkflowNodeType.ACTION)
        .map { it.subType }
        .toSet()

    val expectedSubTypes = setOf(
        "CREATE_ENTITY", "UPDATE_ENTITY", "DELETE_ENTITY",
        "QUERY_ENTITY", "HTTP_REQUEST", "NEW_ACTION"  // Add new ones here
    )

    assertEquals(expectedSubTypes, registeredSubTypes)
}
```

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Entity Query Implementation | Assuming query result attributes match static schema | Use generic `MAP` type for entity payloads; document that structure is runtime-determined |
| Template Resolution | Schema keys don't match `toMap()` keys | Add unit test validating key parity; use consistent camelCase naming |
| API Documentation | OpenAPI generates incorrect schemas for nested objectSchema | Ensure `@Schema` annotations on `WorkflowNodeOutputField` are correct; test generated OpenAPI spec |
| Frontend Integration | Frontend expects computed properties not in schema | Include ALL properties from `toMap()` in schema, even computed ones |

## Validation Checklist

Before marking output schema work complete:

- [ ] Every `NodeOutput` property has matching schema entry
- [ ] Schema keys match `toMap()` keys exactly (unit test)
- [ ] Nullable fields marked `nullable = true` in schema
- [ ] All UUID types use `WorkflowNodeOutputFieldType.UUID` (not `STRING`)
- [ ] Labels are concise and action-specific (not copy-pasted)
- [ ] Descriptions add value or are omitted (not redundant)
- [ ] Node registered in `WorkflowNodeConfigRegistry.registerAllNodes()`
- [ ] API response includes output schema (integration test)
- [ ] Dynamic structures use generic types (`MAP`, not overly specific `OBJECT`)

## Recovery Strategies

### If Schema-Runtime Mismatch Discovered

1. Update companion object `outputSchema` to match current `NodeOutput` structure
2. Add missing test to catch future mismatches
3. No runtime changes needed (schema is metadata only)

**Impact:** Low. Fix is adding schema fields; no breaking changes.

### If Template Path Mismatch Discovered

1. Fix `toMap()` keys to match schema (breaking change) OR
2. Update schema keys to match `toMap()` (non-breaking)

**Recommendation:** Option 2 if templates already deployed. Option 1 for new nodes.

**Impact:** Medium. May require updating existing workflow definitions if fixing `toMap()`.

### If Dynamic Schema Incorrectly Specific

1. Change schema to generic type (`MAP` instead of `OBJECT` with specific fields)
2. Update description to explain runtime-determined structure
3. Consider Phase 6 computed schema feature if frontend needs specificity

**Impact:** Low. Makes schema less specific but more accurate.

## Sources

**HIGH confidence** - All pitfalls derived from:
- Existing codebase patterns (companion object registration, reflection-based discovery)
- Common Kotlin data class + reflection pitfalls
- Template resolution system architecture (WorkflowDataStore, NodeOutput.toMap())
- Similar metadata system (`configSchema`) lessons learned

No external sources needed; pitfalls are architectural implications of chosen patterns.
