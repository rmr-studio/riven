# Feature Landscape: Workflow Node Output Metadata

**Domain:** Workflow engine node output introspection for frontend builder UI
**Researched:** 2026-02-10
**Confidence:** HIGH (based on existing codebase analysis and established workflow engine patterns)

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Static Output Field Declaration** | Frontend must know what fields a node produces to wire downstream nodes | Low | Parallel to existing `configSchema` pattern |
| **Field Name Declaration** | Frontend needs exact keys for template resolution ({{ steps.node.output.fieldName }}) | Low | Maps directly to NodeOutput.toMap() keys |
| **Field Type Declaration** | Frontend needs types for validation and UI rendering (string/number/boolean/uuid/object/array) | Medium | Requires type enum similar to WorkflowNodeConfigFieldType |
| **Registry Key Declaration** | Frontend must know what WorkflowDataStore keys a node writes (steps.nodeName, variables.varName) | Low | Documents what becomes available in dataStore after execution |
| **Output Schema in Node Metadata** | Schema must be available via `/api/v1/workflow/definitions/nodes` alongside configSchema | Low | Extend WorkflowNodeMetadata with outputSchema field |
| **Deterministic Field List** | Frontend needs predictable fields to show in dropdown/autocomplete | Low | No dynamic fields for MVP; all fields known at design time |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Conditional Field Availability** | Some fields only exist under certain conditions (e.g., HttpResponseOutput.body nullable) | Medium | Requires "conditional" or "nullable" flag on output field schema |
| **Nested Object Schema** | Declare structure of complex outputs (e.g., payload: Map<UUID, Any?>) | High | Allows frontend to show nested paths like {{ steps.x.output.payload.attributeId }} |
| **Human-Readable Labels** | Field descriptions for UI display ("Entity ID" not just "entityId") | Low | Parallel to WorkflowNodeConfigField label/description pattern |
| **Sample Value Hints** | Example values for output fields to guide template authoring | Low | Helps users understand output shape without running workflow |
| **Multiple Output Variants** | Some nodes produce different output shapes based on config (query returns list vs single entity) | High | Requires conditional output schema based on node config |
| **Computed Field Declaration** | Fields computed from others (e.g., HttpResponseOutput.success derived from statusCode) | Medium | Documents fields available in templates but not stored in primary output |
| **Array Element Type** | Declare type of array elements (entities: List<EntityPayload>) | Medium | Enables frontend to understand nested iteration and field access |

## Anti-Features

Features to explicitly NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Runtime Field Discovery** | Frontend can't wire nodes without knowing fields ahead of time | Declare all possible output fields statically in companion object |
| **Dynamic Schema Per Node Instance** | Makes UI unpredictable; same node type should always have same output shape | One output schema per node type, not per node instance |
| **Execution-Time Only Metadata** | Frontend needs schema before execution for wiring UI | Expose output schema via registry at design time |
| **Untyped "data" Field** | GenericMapOutput approach forces frontend to guess field structure | Every node type declares explicit typed output fields |
| **Complex Conditional Fields** | If field availability depends on runtime values, frontend can't wire reliably | For MVP, all fields always available (use null for unavailable) |
| **Nested Template Resolution in Schema** | Output schema shouldn't reference other node outputs | Schema describes THIS node's output shape, not resolved values |

## Feature Dependencies

```
Output Field Type Enum
    ↓
Static Output Field Declaration
    ↓
Output Schema in Node Metadata
    ↓
Registry Key Declaration
    ↓
[Frontend can wire nodes and show autocomplete]

Human-Readable Labels → enhances → Static Output Field Declaration
Conditional Field Availability → requires → Static Output Field Declaration
Nested Object Schema → requires → Field Type Declaration (OBJECT type)
Array Element Type → requires → Field Type Declaration (ARRAY type)
```

## MVP Recommendation

For MVP (frontend builder can wire nodes and show available fields), prioritize:

1. **Output Field Type Enum** - Define WorkflowNodeOutputFieldType (STRING, NUMBER, BOOLEAN, UUID, OBJECT, ARRAY, etc.)
2. **Static Output Field Declaration** - Each node companion object declares `outputSchema: List<WorkflowNodeOutputField>`
3. **Output Schema in Node Metadata** - Extend WorkflowNodeMetadata to include outputSchema field
4. **Registry Key Declaration** - Document what dataStore keys each node writes (e.g., "steps.{nodeName}.output")
5. **Field Name + Type + Label** - Minimum viable field definition with human-readable labels

Defer to post-MVP:
- **Conditional Field Availability** - Complex; for MVP assume all fields always present (nullable)
- **Nested Object Schema** - High complexity; for MVP declare payload as OBJECT without nested structure
- **Array Element Type** - Medium complexity; for MVP declare entities as ARRAY without element schema
- **Multiple Output Variants** - Requires config-dependent schema; too complex for MVP
- **Sample Value Hints** - Nice to have but not blocking for wiring functionality

## Implementation Pattern Recommendation

Based on existing codebase patterns:

### 1. Output Field Type Enum

```kotlin
enum class WorkflowNodeOutputFieldType {
    STRING,      // Simple string value
    NUMBER,      // Numeric value (Int, Long, Double)
    BOOLEAN,     // Boolean value
    UUID,        // UUID string
    OBJECT,      // Complex object (Map<String, Any?>)
    ARRAY,       // List of items
    NULL         // Explicitly nullable field
}
```

### 2. Output Field Declaration Model

```kotlin
data class WorkflowNodeOutputField(
    val key: String,                              // Field name in toMap() output
    val label: String,                            // Human-readable name
    val type: WorkflowNodeOutputFieldType,       // Field type
    val description: String? = null,             // Field description
    val nullable: Boolean = false,               // Whether field can be null
    val exampleValue: String? = null             // Example value for guidance
)
```

### 3. Companion Object Pattern

Each WorkflowNodeConfig companion already has `metadata` and `configSchema`. Add `outputSchema`:

```kotlin
companion object {
    val metadata = WorkflowNodeTypeMetadata(...)
    val configSchema: List<WorkflowNodeConfigField> = listOf(...)

    // NEW: Output schema declaration
    val outputSchema: List<WorkflowNodeOutputField> = listOf(
        WorkflowNodeOutputField(
            key = "entityId",
            label = "Entity ID",
            type = WorkflowNodeOutputFieldType.UUID,
            description = "UUID of the created entity"
        ),
        WorkflowNodeOutputField(
            key = "payload",
            label = "Entity Data",
            type = WorkflowNodeOutputFieldType.OBJECT,
            description = "Entity attribute values as map"
        )
    )
}
```

### 4. Extend WorkflowNodeMetadata Response

```kotlin
data class WorkflowNodeMetadata(
    val type: WorkflowNodeType,
    val subType: String,
    val metadata: WorkflowNodeTypeMetadata,
    val schema: List<WorkflowNodeConfigField>,
    val outputSchema: List<WorkflowNodeOutputField>  // NEW
)
```

### 5. Registry Key Documentation Pattern

Add to companion object or metadata:

```kotlin
val registryKeys: List<String> = listOf(
    "steps.{nodeName}.output",      // Primary output data
    "steps.{nodeName}.metadata"     // Execution metadata (timestamp, duration, etc.)
)
```

## Validation Against Existing NodeOutput Implementations

| NodeOutput Type | Fields | Type Mapping |
|-----------------|--------|--------------|
| CreateEntityOutput | entityId: UUID | UUID |
| | entityTypeId: UUID | UUID |
| | payload: Map<UUID, Any?> | OBJECT |
| UpdateEntityOutput | entityId: UUID | UUID |
| | updated: Boolean | BOOLEAN |
| | payload: Map<UUID, Any?> | OBJECT |
| DeleteEntityOutput | entityId: UUID | UUID |
| | deleted: Boolean | BOOLEAN |
| | impactedEntities: Int | NUMBER |
| QueryEntityOutput | entities: List<Map<String, Any?>> | ARRAY |
| | totalCount: Int | NUMBER |
| | hasMore: Boolean | BOOLEAN |
| HttpResponseOutput | statusCode: Int | NUMBER |
| | headers: Map<String, String> | OBJECT |
| | body: String? | STRING (nullable) |
| | url: String | STRING |
| | method: String | STRING |
| | success: Boolean | BOOLEAN (computed) |
| ConditionOutput | result: Boolean | BOOLEAN |
| | conditionResult: Boolean | BOOLEAN (alias) |
| | evaluatedExpression: String | STRING |

**Pattern observation:** All existing outputs have 2-6 fields, all primitive types or simple collections. This validates the LOW-MEDIUM complexity assessment for static field declaration.

## Type System Edge Cases

| Case | Resolution |
|------|------------|
| Computed fields (HttpResponseOutput.success) | Declare in outputSchema; computed in toMap() |
| Nullable fields (HttpResponseOutput.body) | Use `nullable: true` flag |
| Map with UUID keys (payload: Map<UUID, Any?>) | Declare as OBJECT; nested schema deferred |
| List of complex objects (QueryEntityOutput.entities) | Declare as ARRAY; element type deferred |
| Backward compat aliases (conditionResult = result) | Declare both fields in schema |
| Template-resolved values | Schema describes output shape, not resolved values |

## Sources

- **HIGH confidence:** Direct analysis of existing codebase
  - /home/jared/dev/worktrees/workflows/core/src/main/kotlin/riven/core/models/workflow/engine/state/NodeOutput.kt
  - /home/jared/dev/worktrees/workflows/core/src/main/kotlin/riven/core/models/workflow/node/config/WorkflowNodeConfigField.kt
  - /home/jared/dev/worktrees/workflows/core/src/main/kotlin/riven/core/service/workflow/WorkflowNodeConfigRegistry.kt
- **MEDIUM confidence:** Workflow engine patterns from training data (n8n, Zapier, Temporal patterns)
  - Static schema declaration is universal across visual workflow builders
  - Runtime introspection insufficient for design-time wiring UI
  - Type system for template validation standard in low-code platforms
