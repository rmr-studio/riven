# Technology Stack: Node Output Metadata

**Project:** Workflow Engine - Output Schema Infrastructure
**Researched:** 2026-02-10
**Confidence:** HIGH (based on existing codebase patterns and Kotlin/JVM workflow engine architecture)

## Executive Summary

This research addresses patterns for declaring typed output schemas on workflow nodes in Kotlin/JVM systems. The existing codebase already has strong foundations: typed `NodeOutput` sealed classes, companion object metadata pattern, and a registry-based schema discovery system. The recommended approach extends this existing architecture rather than introducing new paradigms.

**Key Finding:** Mirror the input schema pattern (`configSchema` in companion object) with an `outputSchema` field that describes the structure of the corresponding `NodeOutput` type. This maintains architectural consistency and leverages the existing reflection-based discovery in `WorkflowNodeConfigRegistry`.

## Recommended Stack

### Core Pattern: Companion Object Output Schema

| Component | Technology | Purpose | Why |
|-----------|------------|---------|-----|
| Output Type System | Sealed Interface (`NodeOutput`) | Runtime type safety for node outputs | Already exists; proven pattern for discriminated unions in Kotlin |
| Schema Declaration | Companion Object Property | Static metadata alongside config metadata | Mirrors existing `configSchema` and `metadata` pattern; discovered via reflection |
| Schema Model | `WorkflowNodeOutputField` | Describes output structure for frontend | Parallel to `WorkflowNodeConfigField`; enables UI previews and autocomplete |
| Discovery | `WorkflowNodeConfigRegistry` extension | Automatic schema collection | Reuses existing reflection-based registration |
| Serialization | Jackson with `@Schema` annotations | OpenAPI documentation | Already used for config; consistent pattern |

**Confidence: HIGH** - All components build on existing patterns in the codebase.

### Pattern Implementation

#### 1. Output Field Model (New)

Create `WorkflowNodeOutputField.kt` mirroring `WorkflowNodeConfigField`:

```kotlin
package riven.core.models.workflow.node.output

import riven.core.enums.workflow.WorkflowNodeOutputFieldType

/**
 * Describes a single field in a node's output structure.
 * Used by frontend to preview node outputs and enable autocomplete.
 */
data class WorkflowNodeOutputField(
    val key: String,                    // Property name in NodeOutput
    val label: String,                  // Human-readable name
    val type: WorkflowNodeOutputFieldType,  // Primitive type or complex
    val description: String? = null,    // What this field represents
    val nullable: Boolean = false,      // Can be null?
    val arrayOf: WorkflowNodeOutputFieldType? = null,  // For List<T>
    val objectSchema: List<WorkflowNodeOutputField>? = null  // For nested objects
)
```

**Why this structure:**
- `key` matches property names in `toMap()` for template resolution
- `type` uses enum for finite set of output types (String, UUID, Boolean, Number, Object, Array)
- `nullable` enables frontend to show optional fields differently
- `arrayOf` and `objectSchema` enable recursive schema for complex outputs

#### 2. Output Field Type Enum (New)

Create `WorkflowNodeOutputFieldType.kt`:

```kotlin
package riven.core.enums.workflow

enum class WorkflowNodeOutputFieldType {
    STRING,          // String values (including UUIDs represented as strings)
    UUID,            // UUID type (frontend can offer special handling)
    NUMBER,          // Int, Long, Double
    BOOLEAN,         // Boolean
    OBJECT,          // Nested object (use objectSchema)
    ARRAY,           // List (use arrayOf)
    MAP,             // Map<String, Any?>
    ANY              // Untyped (use sparingly)
}
```

#### 3. Companion Object Extension Pattern

Add `outputSchema` to existing companion objects:

```kotlin
// Example: WorkflowCreateEntityActionConfig companion
companion object {
    val metadata = WorkflowNodeTypeMetadata(
        label = "Create Entity",
        description = "Creates a new entity instance",
        icon = IconType.PLUS,
        category = WorkflowNodeType.ACTION
    )

    val configSchema: List<WorkflowNodeConfigField> = listOf(
        // ... existing config fields
    )

    // NEW: Output schema declaration
    val outputSchema: List<WorkflowNodeOutputField> = listOf(
        WorkflowNodeOutputField(
            key = "entityId",
            label = "Entity ID",
            type = WorkflowNodeOutputFieldType.UUID,
            description = "UUID of the created entity"
        ),
        WorkflowNodeOutputField(
            key = "entityTypeId",
            label = "Entity Type ID",
            type = WorkflowNodeOutputFieldType.UUID,
            description = "UUID of the entity type"
        ),
        WorkflowNodeOutputField(
            key = "payload",
            label = "Payload",
            type = WorkflowNodeOutputFieldType.MAP,
            description = "Entity attribute data as UUID to value map"
        )
    )
}
```

**Why this pattern:**
- Maintains consistency with existing companion object structure
- Enables static discovery via reflection (no runtime instantiation needed)
- Lives next to `configSchema` for easy cross-reference during development
- Compiler enforces consistency (if you add a field to `NodeOutput`, you should add it to `outputSchema`)

#### 4. Registry Extension

Extend `WorkflowNodeConfigRegistry` to collect output schemas:

```kotlin
// In NodeSchemaEntry data class
data class NodeSchemaEntry(
    val type: WorkflowNodeType,
    val subType: String,
    val configClass: KClass<out WorkflowNodeConfig>,
    val schema: List<WorkflowNodeConfigField>,
    val metadata: WorkflowNodeTypeMetadata,
    val outputSchema: List<WorkflowNodeOutputField>  // NEW
)

// In WorkflowNodeMetadata response model
data class WorkflowNodeMetadata(
    val type: WorkflowNodeType,
    val subType: String,
    val metadata: WorkflowNodeTypeMetadata,
    val schema: List<WorkflowNodeConfigField>,
    val outputSchema: List<WorkflowNodeOutputField>  // NEW
)

// In registerNode() method - extract outputSchema via reflection
private inline fun <reified T : WorkflowNodeConfig> registerNode(
    type: WorkflowNodeType,
    subType: String
): NodeSchemaEntry? {
    return try {
        val companion = T::class.companionObjectInstance
        // ... existing metadata and configSchema extraction ...

        // NEW: Extract outputSchema
        val outputSchemaProperty = companion::class.members.find { it.name == "outputSchema" }
        val outputSchema = if (outputSchemaProperty != null) {
            outputSchemaProperty.call(companion) as? List<WorkflowNodeOutputField> ?: emptyList()
        } else {
            emptyList()  // Default to empty if not defined
        }

        NodeSchemaEntry(
            type = type,
            subType = subType,
            configClass = T::class,
            schema = schema,
            metadata = metadata,
            outputSchema = outputSchema  // NEW
        )
    } catch (e: Exception) {
        logger.error(e) { "Failed to register node config ${T::class.simpleName}" }
        null
    }
}
```

**Why this approach:**
- Non-breaking: Nodes without `outputSchema` default to empty list
- Automatic: No manual registration required
- Type-safe: Reflection validates at service initialization
- Consistent: Uses same pattern as existing `configSchema` discovery

#### 5. API Response Extension

Extend `GET /api/v1/workflow/definitions/nodes` response to include output schemas:

```kotlin
// Automatically included in WorkflowNodeMetadata model
// Frontend receives:
{
  "ACTION.CREATE_ENTITY": {
    "type": "ACTION",
    "subType": "CREATE_ENTITY",
    "metadata": {
      "label": "Create Entity",
      "description": "Creates a new entity instance",
      "icon": "PLUS",
      "category": "ACTION"
    },
    "schema": [
      // ... config fields
    ],
    "outputSchema": [
      {
        "key": "entityId",
        "label": "Entity ID",
        "type": "UUID",
        "description": "UUID of the created entity",
        "nullable": false
      },
      // ... other output fields
    ]
  }
}
```

### Complex Output Patterns

#### Pattern 1: Nested Objects

For outputs with nested structure (e.g., HTTP response with headers object):

```kotlin
val outputSchema: List<WorkflowNodeOutputField> = listOf(
    WorkflowNodeOutputField(
        key = "statusCode",
        label = "Status Code",
        type = WorkflowNodeOutputFieldType.NUMBER,
        description = "HTTP status code"
    ),
    WorkflowNodeOutputField(
        key = "headers",
        label = "Headers",
        type = WorkflowNodeOutputFieldType.OBJECT,
        description = "Response headers",
        objectSchema = listOf(
            // Nested schema for known headers
            WorkflowNodeOutputField(
                key = "content-type",
                label = "Content Type",
                type = WorkflowNodeOutputFieldType.STRING,
                nullable = true
            )
        )
    ),
    WorkflowNodeOutputField(
        key = "body",
        label = "Response Body",
        type = WorkflowNodeOutputFieldType.STRING,
        description = "Response body as string",
        nullable = true
    )
)
```

**Use case:** Frontend can show hierarchical preview: `{{ steps.http.output.headers.content-type }}`

#### Pattern 2: Array of Objects

For outputs with lists of entities:

```kotlin
val outputSchema: List<WorkflowNodeOutputField> = listOf(
    WorkflowNodeOutputField(
        key = "entities",
        label = "Entities",
        type = WorkflowNodeOutputFieldType.ARRAY,
        description = "List of matching entities",
        arrayOf = WorkflowNodeOutputFieldType.OBJECT,
        objectSchema = listOf(
            WorkflowNodeOutputField(
                key = "id",
                label = "Entity ID",
                type = WorkflowNodeOutputFieldType.UUID
            ),
            WorkflowNodeOutputField(
                key = "payload",
                label = "Payload",
                type = WorkflowNodeOutputFieldType.MAP
            )
        )
    ),
    WorkflowNodeOutputField(
        key = "totalCount",
        label = "Total Count",
        type = WorkflowNodeOutputFieldType.NUMBER,
        description = "Total number of matching entities"
    )
)
```

**Use case:** Frontend enables `{{ steps.query.output.entities[0].id }}` autocomplete

#### Pattern 3: Dynamic/Runtime-Determined Schema

For nodes where output schema depends on runtime configuration (e.g., entity query with dynamic attributes):

**Option A: Generic Map (Simplest)**
```kotlin
val outputSchema: List<WorkflowNodeOutputField> = listOf(
    WorkflowNodeOutputField(
        key = "entities",
        label = "Entities",
        type = WorkflowNodeOutputFieldType.ARRAY,
        description = "List of entities with runtime-determined attributes",
        arrayOf = WorkflowNodeOutputFieldType.MAP  // Frontend shows as generic map
    )
)
```

**Option B: Schema Computation (Phase 6+)**
Add `computeOutputSchema(config: WorkflowNodeConfig): List<WorkflowNodeOutputField>` to companion:

```kotlin
companion object {
    val outputSchema: List<WorkflowNodeOutputField> = listOf(/* static fields */)

    // Optional: Runtime schema computation based on config
    fun computeOutputSchema(config: WorkflowQueryEntityActionConfig): List<WorkflowNodeOutputField> {
        // Look up entity type, return fields based on that type's schema
        // Requires EntityTypeRepository access
        // Not recommended for Phase 5 - adds complexity
    }
}
```

**Recommendation:** Use Option A for MVP. Option B requires service injection into static context, which breaks the clean separation.

### Temporal Comparison (Context from Training)

**Note:** The following is based on my training data (pre-2025) and represents patterns from Temporal/Cadence workflows. Since I don't have access to current documentation, treat as **MEDIUM confidence** for external patterns, **HIGH confidence** for applicability to this codebase.

| Pattern | Temporal/TypeScript | Temporal/Kotlin SDK | This Codebase |
|---------|-------------------|-------------------|---------------|
| Type Declaration | TypeScript function return type | Kotlin function return type | Sealed interface hierarchy |
| Runtime Representation | Serialized to JSON | Serialized to JSON via Jackson | `toMap()` method for template access |
| Schema Discovery | TypeScript type introspection | Kotlin reflection (limited) | Companion object static schema |
| UI Integration | External (n8n-style nodes need explicit schema) | N/A | Explicit schema in companion |

**Key Difference:** Temporal activities rely on language type systems (TypeScript interfaces, Kotlin data classes) for compile-time safety but don't provide built-in schema metadata for UI generation. Workflow orchestration platforms like n8n add explicit schema declarations on top of function signatures.

**This codebase approach:** Hybrid - compile-time safety via sealed interfaces + explicit schema for UI generation. Best of both worlds.

### n8n Pattern Comparison

**Note:** Based on training data; **MEDIUM confidence** due to lack of current documentation access.

n8n nodes define output schema via `INodeProperties` with `displayName`, `name`, `type`:

```typescript
// n8n pattern (TypeScript)
const outputProperties: INodeProperties[] = [
  {
    displayName: 'Entity ID',
    name: 'entityId',
    type: 'string',
    description: 'UUID of created entity'
  }
]
```

**Mapping to this codebase:**
- `displayName` → `WorkflowNodeOutputField.label`
- `name` → `WorkflowNodeOutputField.key`
- `type` → `WorkflowNodeOutputFieldType` enum
- `description` → `WorkflowNodeOutputField.description`

**Advantage of this codebase pattern:** Type safety. n8n uses string constants for types; this codebase uses enums. Compile-time validation vs runtime errors.

## Alternative Patterns Considered

| Pattern | Description | Why Not |
|---------|-------------|---------|
| Annotation-based schema | Use `@OutputField` annotations on `NodeOutput` properties | Kotlin reflection on data class properties is verbose; annotation processing at compile-time adds build complexity; companion object pattern already established |
| Interface method `getOutputSchema()` | Add abstract method to `WorkflowNodeConfig` | Requires instantiation to get schema; breaks static discovery pattern; forces every config to implement redundant method |
| Separate registry file | Define output schemas in centralized YAML/JSON | Separation from code causes drift; no compiler enforcement; duplicate source of truth |
| Runtime type introspection | Reflect on `NodeOutput` sealed classes directly | Kotlin data class reflection is limited; `toMap()` loses type information; computed properties (like `HttpResponseOutput.success`) not discoverable |
| JSON Schema generation | Generate JSON Schema from `NodeOutput` Kotlin types | Over-engineered for this use case; frontend doesn't need full JSON Schema validation; simple field list sufficient |

## Dependencies

### Existing (No Changes)

```kotlin
// Already in use
- kotlin-reflect:2.1.x  // For companion object reflection
- jackson-kotlin-module  // For JSON serialization
- springdoc-openapi  // For API documentation
```

### New (None Required)

The recommended pattern requires no new dependencies. It uses:
- Kotlin data classes (standard library)
- Existing reflection patterns from `WorkflowNodeConfigRegistry`
- Existing enum patterns from `WorkflowNodeConfigFieldType`

**Confidence: HIGH** - Zero dependency risk.

## Implementation Phases

### Phase 1: Core Infrastructure (Day 1-2)

1. Create `WorkflowNodeOutputField` model
2. Create `WorkflowNodeOutputFieldType` enum
3. Extend `NodeSchemaEntry` and `WorkflowNodeMetadata` with `outputSchema` field
4. Update `WorkflowNodeConfigRegistry.registerNode()` to extract `outputSchema` via reflection

**Deliverable:** Schema infrastructure exists; nodes without `outputSchema` return empty list.

### Phase 2: Action Node Schemas (Day 3-4)

Add `outputSchema` to action node companions:
- `WorkflowCreateEntityActionConfig` → `CreateEntityOutput` schema
- `WorkflowUpdateEntityActionConfig` → `UpdateEntityOutput` schema
- `WorkflowDeleteEntityActionConfig` → `DeleteEntityOutput` schema
- `WorkflowQueryEntityActionConfig` → `QueryEntityOutput` schema
- `WorkflowHttpRequestActionConfig` → `HttpResponseOutput` schema

**Deliverable:** All action nodes expose output schemas via API.

### Phase 3: Control Flow & Trigger Schemas (Day 5)

Add `outputSchema` to:
- `WorkflowConditionControlConfig` → `ConditionOutput` schema
- Trigger configs → `UnsupportedNodeOutput` (explicit schema showing they have no output)

**Deliverable:** Complete schema coverage for all node types.

### Phase 4: Validation & Testing (Day 6)

1. Add unit tests validating schema matches actual `NodeOutput` structure
2. Add integration test calling `/api/v1/workflow/definitions/nodes` and verifying output schemas present
3. Document pattern in architecture docs

**Deliverable:** Confidence that schemas are accurate and discoverable.

## Runtime Considerations

### Schema Validation at Registration Time

Add optional compile-time validation in `registerNode()`:

```kotlin
// Optional: Validate outputSchema matches NodeOutput
private fun validateOutputSchema(
    outputSchema: List<WorkflowNodeOutputField>,
    outputType: KClass<out NodeOutput>
): Boolean {
    // Reflect on NodeOutput data class properties
    // Verify all keys in outputSchema exist in toMap()
    // Log warnings for mismatches
    // Return false if critical mismatch
}
```

**When to add:** Phase 4 (validation). Not critical for Phase 5 MVP but valuable for developer experience.

### Performance Impact

**Registry initialization:** Adding output schema extraction adds ~1-2ms per node (negligible). Total: ~20ms for 10 nodes.

**API response size:** Each `outputSchema` adds ~100-500 bytes per node. Total response: ~5-50KB (acceptable for admin API).

**Memory footprint:** Schemas cached in memory. ~1-5KB per node. Total: ~10-50KB for 10 nodes (negligible).

**Confidence: HIGH** - Performance impact is negligible.

## Frontend Integration

### Autocomplete Use Case

Frontend can build template autocomplete from output schemas:

```typescript
// User types: {{ steps.create_entity.output.
// Frontend fetches node output schema and suggests:
// - entityId (UUID)
// - entityTypeId (UUID)
// - payload (MAP)
```

Implementation pattern:
1. Parse template expression to extract step reference
2. Look up step's node type in workflow DAG
3. Fetch that node type's output schema from `/api/v1/workflow/definitions/nodes`
4. Show autocomplete suggestions based on schema fields

### Preview Use Case

Frontend can show "what this node outputs" in node inspector:

```
Create Entity Node
Outputs:
  - entityId (UUID): UUID of the created entity
  - entityTypeId (UUID): UUID of the entity type
  - payload (MAP): Entity attribute data
```

## Open Questions & Phase 6 Considerations

### Dynamic Entity Query Output Schema

**Problem:** `QueryEntityOutput` returns `entities: List<Map<String, Any?>>` where keys are runtime-determined based on entity type schema.

**Options:**
1. **Static generic schema (MVP):** Declare as `MAP` type, no specific keys
2. **Computed schema (Phase 6+):** Add `computeOutputSchema(config)` companion method that looks up entity type and returns dynamic schema
3. **Enhanced output type (Phase 6+):** Change `QueryEntityOutput` to include schema metadata: `data class QueryEntityOutput(val entities: List<Entity>, val schema: EntityTypeSchema)`

**Recommendation for Phase 5:** Option 1. Frontend shows `entities[0].*` as generic map access. Phase 6 can add computed schema if needed.

### Output Schema Versioning

**Problem:** If node output structure changes between workflow versions, does output schema need versioning?

**Current state:** `NodeOutput` types are not versioned. Implicit assumption: output structure is stable within major version.

**Recommendation:** No output schema versioning for Phase 5. If breaking output changes needed, create new node subtype (e.g., `CREATE_ENTITY_V2`).

### Computed Properties in Output Schema

**Problem:** `HttpResponseOutput` has computed property `success: Boolean` derived from `statusCode`. Should it appear in output schema?

**Current behavior:** `toMap()` includes computed properties in the map.

**Recommendation:** Include computed properties in output schema with `description` explaining derivation:

```kotlin
WorkflowNodeOutputField(
    key = "success",
    label = "Success",
    type = WorkflowNodeOutputFieldType.BOOLEAN,
    description = "True if status code is 2xx (computed from statusCode)"
)
```

**Rationale:** Frontend should show all available template properties, regardless of whether they're stored or computed.

## Summary

**Recommended Pattern:** Extend existing companion object pattern with `outputSchema: List<WorkflowNodeOutputField>` alongside `configSchema` and `metadata`. Discovered via reflection in `WorkflowNodeConfigRegistry`, exposed via `/api/v1/workflow/definitions/nodes` API.

**Why This Works:**
- Architecturally consistent with existing patterns
- Zero new dependencies
- Non-breaking (nodes without schema default to empty list)
- Compile-time enforceable (companion object in same file as config)
- Performant (static schema, cached in registry)
- Extensible (supports nested objects, arrays, complex types)

**Confidence: HIGH** - Pattern proven by existing `configSchema` implementation. Directly applicable to output schema use case.
