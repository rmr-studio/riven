# Phase 1: Foundation Infrastructure - Research

**Researched:** 2026-02-13
**Domain:** Kotlin data modeling, Spring Boot reflection-based registry, REST API design
**Confidence:** HIGH

## Summary

Phase 1 establishes the infrastructure for workflow node output metadata by creating data classes for output field definitions, extracting metadata from companion objects via Kotlin reflection, and exposing it through the existing node-schemas REST endpoint. This follows the exact same pattern already established in the codebase for `configSchema` and `metadata` extraction.

The codebase already has a mature reflection-based registry system in `WorkflowNodeConfigRegistry` that discovers companion object properties (`metadata` and `configSchema`) via Kotlin reflection at startup. This phase extends that proven pattern to also extract `outputMetadata`, leveraging the same reflection infrastructure, error handling, and caching mechanisms.

The architecture is straightforward: (1) define immutable data classes for output field metadata, (2) add companion object properties to nodes, (3) extract via reflection using existing registry patterns, (4) expose via existing REST endpoint. No novel patterns required—this is purely extending an established system.

**Primary recommendation:** Follow the existing `WorkflowNodeConfigRegistry.registerNode<T>()` pattern exactly. Use Kotlin data classes with immutable properties, nullable fields only when semantically meaningful (not for optional-but-defaultable values), and JUnit 5 parameterized tests for validation across all node types.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Output field modeling
- MAP and OBJECT types stay opaque — no inner schema/child definitions
- Add ENTITY and ENTITY_LIST as first-class OutputFieldType values, with an entityTypeId property on WorkflowNodeOutputField for entity type reference
- Entity type is dynamic (depends on node config) — outputMetadata declares type as ENTITY/ENTITY_LIST with entityType marked as "dynamic"; frontend resolves the actual entity type from the node's configuration at render time
- exampleValue on ALL field types, including JSON snippets for complex types (MAP, OBJECT, ENTITY)
- nullable defaults to false — only declare nullable=true when a field can actually be null
- outputMetadata is an ordered List<WorkflowNodeOutputField> — declaration order is display order for the frontend
- description is optional (nullable) — only provide when the field name isn't self-explanatory
- label is required — every field must have a human-readable display name

#### Registry extraction
- outputMetadata follows the same companion object pattern as metadata and configSchema — standard companion property extracted via reflection
- outputMetadata is optional during rollout — registry returns null for nodes that haven't declared it yet (Phase 3 fills in the rest)
- Registry caches extracted outputMetadata at startup alongside other metadata
- If reflection fails to find outputMetadata on a companion, log a warning and continue — don't fail app startup

#### API response shape
- outputMetadata is a sibling field alongside metadata and configSchema in the node-schemas endpoint response
- Nodes without outputMetadata return outputMetadata: null (field present but null, not omitted)
- Entity references return entityTypeId only (UUID) — frontend resolves the name from its own entity type cache

#### Validation strategy
- Tests validate keys AND types — check that declared OutputFieldType matches the actual Kotlin type returned by toMap()
- toMap() keys must be a superset of outputMetadata keys (extra internal keys allowed, but every declared key must exist)
- Include a test that flags/lists all node types WITHOUT outputMetadata as warnings — acts as a TODO tracker for Phase 3 rollout

### Claude's Discretion
- exampleValue serialization format (native types vs strings) — pick what's most natural for Kotlin/Jackson
- Test structure (parameterized vs per-node) — pick based on existing test patterns
- Exact OutputFieldType enum values and naming

### Specific Ideas
- Entity type support is critical — queries return typed entity lists (e.g., User[]), not generic lists. The frontend needs to know which entity type's fields are available for downstream wiring.
- "Dynamic" entity type pattern: outputMetadata declares the field as ENTITY_LIST with a marker that the actual type comes from the node's configuration, not the metadata itself.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope

</user_constraints>

## Standard Stack

The codebase already uses the exact stack required for this phase:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Kotlin | 2.1 | Primary language | Already in use; data classes, sealed interfaces, companion objects |
| kotlin-reflect | (matches Kotlin version) | Reflection API | Already used in WorkflowNodeConfigRegistry for companion object property extraction |
| Spring Boot | 3.5 | Application framework | Already in use; @Service components, dependency injection |
| Jackson Kotlin Module | (Spring Boot managed) | JSON serialization | Already in use; automatic enum serialization, null handling |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| JUnit 5 | (Spring Boot managed) | Testing framework | Already in use; @ParameterizedTest for testing all node types |
| kotlin-logging | Already in use | Structured logging | Already used in WorkflowNodeConfigRegistry |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Kotlin reflection | Annotation processors | Annotation processing is compile-time; this needs runtime discovery for extensibility |
| Data classes | Regular classes | Data classes provide automatic equals/hashCode/toString/copy for metadata |
| JUnit 5 @ParameterizedTest | Individual test methods per node | Parameterized tests reduce duplication and ensure consistent validation across all nodes |

**Installation:**
No new dependencies required—all libraries already in use.

## Architecture Patterns

### Recommended Project Structure
```
src/main/kotlin/riven/core/
├── models/workflow/node/
│   ├── config/
│   │   ├── WorkflowNodeOutputField.kt           # NEW: Output field definition
│   │   ├── WorkflowNodeOutputMetadata.kt        # NEW: Wrapper for output metadata
│   │   └── actions/
│   │       └── WorkflowCreateEntityActionConfig.kt  # MODIFIED: Add outputMetadata companion property
│   └── engine/state/
│       └── NodeOutput.kt                        # EXISTING: toMap() keys must match metadata
├── enums/workflow/
│   └── OutputFieldType.kt                       # NEW: Enum for field types
└── service/workflow/
    └── WorkflowNodeConfigRegistry.kt            # MODIFIED: Extract outputMetadata via reflection
```

### Pattern 1: Immutable Data Classes for Metadata

**What:** Kotlin data classes with `val` properties for all metadata definitions
**When to use:** All metadata models (WorkflowNodeOutputField, WorkflowNodeOutputMetadata)
**Example:**
```kotlin
// Source: Existing pattern in WorkflowNodeConfigField.kt and WorkflowNodeTypeMetadata.kt
data class WorkflowNodeOutputField(
    val key: String,
    val label: String,
    val type: OutputFieldType,
    val description: String? = null,        // nullable = optional, no default value
    val nullable: Boolean = false,          // not-nullable with default = required but defaults to false
    val exampleValue: Any? = null,          // nullable = optional
    val entityTypeId: UUID? = null          // nullable = only for ENTITY/ENTITY_LIST types
)
```

**Key distinction:**
- `description: String? = null` — field is optional (may be omitted entirely)
- `nullable: Boolean = false` — field is required but defaults to false (always present in JSON)

### Pattern 2: Companion Object Property Extraction via Reflection

**What:** Extract typed properties from companion objects using `KClass.companionObjectInstance` and `members.find()`
**When to use:** Registry initialization to discover metadata from node config classes
**Example:**
```kotlin
// Source: WorkflowNodeConfigRegistry.kt lines 214-263
private inline fun <reified T : WorkflowNodeConfig> registerNode(
    type: WorkflowNodeType,
    subType: String
): NodeSchemaEntry? {
    return try {
        val companion = T::class.companionObjectInstance
        if (companion == null) {
            logger.warn { "No companion object found for ${T::class.simpleName}" }
            return null
        }

        // Extract outputMetadata (NEW - follows same pattern as configSchema)
        val outputMetadataProperty = companion::class.members.find { it.name == "outputMetadata" }
        val outputMetadata = outputMetadataProperty?.call(companion) as? WorkflowNodeOutputMetadata

        // outputMetadata is optional - no warning if null, just return null
        // (Phase 3 will fill in missing nodes)

        NodeSchemaEntry(
            type = type,
            subType = subType,
            configClass = T::class,
            schema = schema,
            metadata = metadata,
            outputMetadata = outputMetadata  // NEW field
        )
    } catch (e: Exception) {
        logger.error(e) { "Failed to register node config ${T::class.simpleName}" }
        null
    }
}
```

**Critical details:**
- `companionObjectInstance` returns the singleton companion instance
- `members.find { it.name == "propertyName" }` locates the property
- `call(companion)` invokes the getter
- Cast result to expected type with safe cast (`as?`) to handle missing/wrong type gracefully
- Log warnings but continue—don't fail app startup

### Pattern 3: Nullable vs Default Values in API Design

**What:** Use nullable types (`T?`) for truly optional fields; use non-nullable with defaults (`T = value`) for required fields with sensible defaults
**When to use:** All data class parameter definitions
**Example:**
```kotlin
// Source: API design best practices + existing codebase patterns
data class WorkflowNodeOutputField(
    val key: String,                        // Required, no default
    val label: String,                      // Required, no default
    val type: OutputFieldType,              // Required, no default
    val description: String? = null,        // OPTIONAL: null means "not provided"
    val nullable: Boolean = false,          // REQUIRED with DEFAULT: false means "field value is non-nullable"
    val exampleValue: Any? = null,          // OPTIONAL: null means "no example provided"
    val entityTypeId: UUID? = null          // OPTIONAL: null means "not an entity type" OR "dynamic"
)
```

**Semantic difference:**
- `description: String? = null` — "This field may or may not have a description"
- `nullable: Boolean = false` — "This field always has a nullable flag, which defaults to false"

The first is about whether the property exists; the second is about the property's default value.

### Pattern 4: Enum Naming for JSON Serialization

**What:** Use SCREAMING_SNAKE_CASE for enum values; Jackson serializes them as-is by default
**When to use:** All enum definitions
**Example:**
```kotlin
// Source: Existing pattern in WorkflowNodeConfigFieldType.kt
enum class OutputFieldType {
    UUID,
    STRING,
    BOOLEAN,
    NUMBER,
    MAP,
    LIST,
    OBJECT,
    ENTITY,           // NEW: Single entity reference
    ENTITY_LIST       // NEW: List of entities of same type
}
```

**Jackson behavior:**
- Default serialization: `OutputFieldType.ENTITY_LIST` → JSON `"ENTITY_LIST"`
- No annotations needed unless custom serialization required
- Frontend will receive exact enum name as string

### Pattern 5: Ordered Lists for Display Order

**What:** Use `List<T>` (not Set or Map) when order matters for UI rendering
**When to use:** Any metadata that drives UI display order
**Example:**
```kotlin
// Source: User decision + existing WorkflowNodeConfigField pattern
data class WorkflowNodeOutputMetadata(
    val fields: List<WorkflowNodeOutputField>  // Order = display order
)

// In companion object:
companion object {
    val outputMetadata = WorkflowNodeOutputMetadata(
        fields = listOf(
            WorkflowNodeOutputField(key = "entityId", label = "Entity ID", type = OutputFieldType.UUID),
            WorkflowNodeOutputField(key = "entityTypeId", label = "Entity Type", type = OutputFieldType.UUID),
            WorkflowNodeOutputField(key = "payload", label = "Payload", type = OutputFieldType.MAP)
        )
    )
}
```

**Why List:**
- Lists preserve insertion order
- Frontend displays fields in declared order
- Matches existing pattern for `configSchema: List<WorkflowNodeConfigField>`

### Anti-Patterns to Avoid

- **Using mutable collections:** Don't use `MutableList` or `var` properties in data classes—metadata is immutable
- **Reflection in service methods:** Only use reflection at startup initialization, never in request-handling code paths
- **Failing startup on missing metadata:** During gradual rollout, missing `outputMetadata` is expected—log warnings, don't throw exceptions
- **Over-annotating Jackson:** Jackson Kotlin module handles data classes automatically; don't add `@JsonProperty` unless customizing names

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Companion object property access | Custom annotation processor | `KClass.companionObjectInstance` + `members.find()` | Existing pattern in WorkflowNodeConfigRegistry; runtime discovery enables extensibility |
| JSON serialization of data classes | Manual ObjectMapper config | Jackson Kotlin Module (already included) | Handles nullability, default values, enum serialization automatically |
| Validation across all node types | Individual test per node | JUnit 5 `@ParameterizedTest` with `@MethodSource` | Reduces duplication; ensures all nodes validated consistently; existing pattern in codebase |
| Property reflection error handling | Try-catch per property | Existing `registerNode<T>()` pattern | Logs warnings, returns null entry, continues—proven resilient pattern |
| Type-safe Any? handling | Custom serialization | Jackson's polymorphic serialization | Already configured; handles `Map<String, Any?>` correctly |

**Key insight:** This phase extends an existing, proven system. The reflection pattern, error handling, and caching are already battle-tested in production. Don't reinvent—follow the exact same patterns for consistency and reliability.

## Common Pitfalls

### Pitfall 1: Reflection Performance in Request Path

**What goes wrong:** Putting reflection calls inside service methods or request handlers causes performance degradation
**Why it happens:** Reflection has overhead; `companionObjectInstance` and `members.find()` should only run at startup
**How to avoid:**
- Extract all metadata during registry initialization (in `registerAllNodes()`)
- Cache extracted metadata in `NodeSchemaEntry` data class
- Service methods and endpoints only access pre-cached data
**Warning signs:** Reflection calls in `WorkflowNodeConfigRegistry.getAllNodes()` or controller methods

### Pitfall 2: Nullable Semantics Confusion

**What goes wrong:** Using `nullable: Boolean` field value to determine if `description: String?` should be null
**Why it happens:** Confusing "is this property present?" with "can this field's value be null?"
**How to avoid:**
- `description: String? = null` — property is optional (may be omitted from data class entirely)
- `nullable: Boolean = false` — property is required, describes whether the OUTPUT FIELD VALUE can be null
- Example: `WorkflowNodeOutputField(key = "body", type = STRING, nullable = true)` means the HTTP response body CAN be null, not that the nullable property is null
**Warning signs:** Setting `nullable = true` on the WorkflowNodeOutputField itself instead of on the field property

### Pitfall 3: Missing toMap() Keys

**What goes wrong:** outputMetadata declares fields that don't exist in NodeOutput.toMap(), breaking template resolution
**Why it happens:** Metadata declared but implementation doesn't include key in toMap() result
**How to avoid:**
- Write parameterized tests that instantiate each NodeOutput subclass and verify toMap() keys
- Test should assert: `metadata.fields.map { it.key }.all { it in output.toMap().keys }`
- Allow toMap() to have EXTRA keys (internal/computed fields like HttpResponseOutput.success)
**Warning signs:** Test failures when validating QueryEntityOutput or other node outputs

### Pitfall 4: Jackson Default Value Handling

**What goes wrong:** Frontend sends `{"nullable": null}` and Jackson uses null instead of default value `false`
**Why it happens:** Jackson distinguishes between missing fields (use default) and explicit null (set to null)
**How to avoid:**
- Use non-nullable types with defaults for required fields: `val nullable: Boolean = false`
- Jackson will reject explicit null for non-nullable types—frontend must omit field or provide value
- For truly optional fields, use nullable types: `val description: String? = null`
**Warning signs:** Frontend getting null values for fields that should have defaults

### Pitfall 5: Sealed Class Exhaustiveness in Tests

**What goes wrong:** Adding new NodeOutput subclass but forgetting to add it to test validation
**Why it happens:** Kotlin's `when` expression exhaustiveness only applies at compile-time; test data sources are runtime
**How to avoid:**
- Use parameterized tests with `@MethodSource` that enumerates ALL NodeOutput subclasses
- Include a dedicated test that lists all nodes WITHOUT outputMetadata (TODO tracker for Phase 3)
- Make the test fail explicitly if a new node type is unhandled
**Warning signs:** New node types passing validation without actual testing

### Pitfall 6: Entity Type Dynamic Resolution

**What goes wrong:** Setting `entityTypeId` to a static UUID when it should be marked "dynamic"
**Why it happens:** Misunderstanding that QueryEntity returns entities of type determined by config, not metadata
**How to avoid:**
- For nodes where entity type comes from config (QueryEntity, CreateEntity): use a marker pattern or null entityTypeId to indicate "dynamic"
- Frontend resolves actual entity type from node's configuration at render time
- outputMetadata declares the SHAPE (ENTITY_LIST), not the specific type (User vs Client)
**Warning signs:** outputMetadata includes specific entityTypeId when node can query any entity type

## Code Examples

Verified patterns from codebase and research:

### Data Class Definition

```kotlin
// Source: Following WorkflowNodeConfigField.kt pattern
package riven.core.models.workflow.node.config

import riven.core.enums.workflow.OutputFieldType
import java.util.UUID

data class WorkflowNodeOutputField(
    val key: String,
    val label: String,
    val type: OutputFieldType,
    val description: String? = null,
    val nullable: Boolean = false,
    val exampleValue: Any? = null,
    val entityTypeId: UUID? = null  // Only for ENTITY/ENTITY_LIST types
)

data class WorkflowNodeOutputMetadata(
    val fields: List<WorkflowNodeOutputField>
)
```

### Enum Definition

```kotlin
// Source: Following WorkflowNodeConfigFieldType.kt pattern
package riven.core.enums.workflow

enum class OutputFieldType {
    UUID,
    STRING,
    BOOLEAN,
    NUMBER,
    MAP,
    LIST,
    OBJECT,
    ENTITY,
    ENTITY_LIST
}
```

### Companion Object Declaration

```kotlin
// Source: Extending existing WorkflowCreateEntityActionConfig pattern
companion object {
    val metadata = WorkflowNodeTypeMetadata(
        label = "Create Entity",
        description = "Creates a new entity instance",
        icon = IconType.PLUS,
        category = WorkflowNodeType.ACTION
    )

    val configSchema: List<WorkflowNodeConfigField> = listOf(
        WorkflowNodeConfigField(
            key = "entityTypeId",
            label = "Entity Type",
            type = WorkflowNodeConfigFieldType.ENTITY_TYPE,
            required = true
        ),
        // ... other fields
    )

    // NEW: Output metadata following same pattern
    val outputMetadata = WorkflowNodeOutputMetadata(
        fields = listOf(
            WorkflowNodeOutputField(
                key = "entityId",
                label = "Entity ID",
                type = OutputFieldType.UUID,
                description = "UUID of the created entity",
                nullable = false,
                exampleValue = "550e8400-e29b-41d4-a716-446655440000"
            ),
            WorkflowNodeOutputField(
                key = "entityTypeId",
                label = "Entity Type ID",
                type = OutputFieldType.UUID,
                nullable = false,
                exampleValue = "660e8400-e29b-41d4-a716-446655440001"
            ),
            WorkflowNodeOutputField(
                key = "payload",
                label = "Entity Payload",
                type = OutputFieldType.MAP,
                description = "Entity attributes as UUID to value map",
                nullable = false,
                exampleValue = mapOf(
                    "770e8400-e29b-41d4-a716-446655440002" to "Example Value"
                )
            )
        )
    )
}
```

### Registry Extraction Extension

```kotlin
// Source: WorkflowNodeConfigRegistry.kt registerNode<T>() pattern
private inline fun <reified T : WorkflowNodeConfig> registerNode(
    type: WorkflowNodeType,
    subType: String
): NodeSchemaEntry? {
    return try {
        val companion = T::class.companionObjectInstance
        if (companion == null) {
            logger.warn { "No companion object found for ${T::class.simpleName}" }
            return null
        }

        val schemaProperty = companion::class.members.find { it.name == "configSchema" }
        if (schemaProperty == null) {
            logger.warn { "No configSchema property found in companion of ${T::class.simpleName}" }
            return null
        }

        @Suppress("UNCHECKED_CAST")
        val schema = schemaProperty.call(companion) as? List<WorkflowNodeConfigField>
        if (schema == null) {
            logger.warn { "configSchema is null or wrong type for ${T::class.simpleName}" }
            return null
        }

        val metadataProperty = companion::class.members.find { it.name == "metadata" }
        if (metadataProperty == null) {
            logger.warn { "No metadata property found in companion of ${T::class.simpleName}" }
            return null
        }

        val metadata = metadataProperty.call(companion) as? WorkflowNodeTypeMetadata
        if (metadata == null) {
            logger.warn { "metadata is null or wrong type for ${T::class.simpleName}" }
            return null
        }

        // NEW: Extract outputMetadata (optional during rollout)
        val outputMetadataProperty = companion::class.members.find { it.name == "outputMetadata" }
        val outputMetadata = outputMetadataProperty?.call(companion) as? WorkflowNodeOutputMetadata
        // No warning if null - Phase 3 will fill in missing nodes

        logger.debug { "Registered ${T::class.simpleName}: $type.$subType with ${schema.size} fields" }

        NodeSchemaEntry(
            type = type,
            subType = subType,
            configClass = T::class,
            schema = schema,
            metadata = metadata,
            outputMetadata = outputMetadata  // NEW field - nullable during rollout
        )
    } catch (e: Exception) {
        logger.error(e) { "Failed to register node config ${T::class.simpleName}" }
        null
    }
}
```

### API Response Model Extension

```kotlin
// Source: WorkflowNodeConfigRegistry.kt WorkflowNodeMetadata pattern
data class WorkflowNodeMetadata(
    val type: WorkflowNodeType,
    val subType: String,
    val metadata: WorkflowNodeTypeMetadata,
    val schema: List<WorkflowNodeConfigField>,
    val outputMetadata: WorkflowNodeOutputMetadata? = null  // NEW field - nullable during rollout
)

fun getAllNodes(): Map<String, WorkflowNodeMetadata> {
    return entries.associate {
        "${it.type}.${it.subType}" to WorkflowNodeMetadata(
            type = it.type,
            subType = it.subType,
            metadata = it.metadata,
            schema = it.schema,
            outputMetadata = it.outputMetadata  // NEW field
        )
    }
}
```

### Parameterized Test for Validation

```kotlin
// Source: Following EntityActionConfigValidationTest.kt nested class pattern
// Adapted with JUnit 5 @ParameterizedTest for all NodeOutput types
package riven.core.models.workflow.node.config

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.MethodSource
import riven.core.models.workflow.engine.state.*
import riven.core.service.workflow.WorkflowNodeConfigRegistry
import java.util.UUID

class NodeOutputMetadataValidationTest(
    private val registry: WorkflowNodeConfigRegistry
) {

    @ParameterizedTest
    @MethodSource("nodeOutputTestCases")
    fun `outputMetadata keys match NodeOutput toMap keys`(testCase: NodeOutputTestCase) {
        // Get metadata from registry
        val nodeMetadata = registry.getAllNodes()["${testCase.nodeType}.${testCase.subType}"]
        assertNotNull(nodeMetadata, "Node ${testCase.nodeType}.${testCase.subType} not registered")

        val outputMetadata = nodeMetadata!!.outputMetadata
        if (outputMetadata == null) {
            // Phase 3 will fill in - log warning but don't fail
            println("WARNING: ${testCase.nodeType}.${testCase.subType} missing outputMetadata")
            return
        }

        // Validate declared keys exist in toMap()
        val outputMap = testCase.exampleOutput.toMap()
        val declaredKeys = outputMetadata.fields.map { it.key }

        for (key in declaredKeys) {
            assertTrue(
                key in outputMap.keys,
                "Declared key '$key' not found in ${testCase.exampleOutput::class.simpleName}.toMap()"
            )
        }

        // Validate types match (basic check)
        for (field in outputMetadata.fields) {
            val value = outputMap[field.key]
            // Type validation logic here
            // UUID -> value is UUID
            // STRING -> value is String
            // BOOLEAN -> value is Boolean
            // etc.
        }
    }

    companion object {
        @JvmStatic
        fun nodeOutputTestCases() = listOf(
            NodeOutputTestCase(
                nodeType = "ACTION",
                subType = "CREATE_ENTITY",
                exampleOutput = CreateEntityOutput(
                    entityId = UUID.randomUUID(),
                    entityTypeId = UUID.randomUUID(),
                    payload = emptyMap()
                )
            ),
            NodeOutputTestCase(
                nodeType = "ACTION",
                subType = "UPDATE_ENTITY",
                exampleOutput = UpdateEntityOutput(
                    entityId = UUID.randomUUID(),
                    updated = true,
                    payload = emptyMap()
                )
            ),
            // ... all other node types
        )
    }

    data class NodeOutputTestCase(
        val nodeType: String,
        val subType: String,
        val exampleOutput: NodeOutput
    )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual property access via Java reflection | Kotlin reflection with `companionObjectInstance` | Kotlin 1.1+ | Type-safe property access; better null safety |
| Mutable metadata collections | Immutable data classes with `val` | Kotlin standard | Thread-safe by default; safe for singleton Spring services |
| @JsonProperty annotations everywhere | Jackson Kotlin Module defaults | Jackson 2.9+ | Less boilerplate; automatic null handling and default values |
| Individual test methods per node | JUnit 5 @ParameterizedTest | JUnit 5 (2017+) | DRY tests; easy to add new node types |
| Runtime type checking with `is` | Sealed interfaces with exhaustive `when` | Kotlin 1.5+ | Compile-time exhaustiveness checking for node hierarchies |

**Deprecated/outdated:**
- Java reflection for companion objects: Use Kotlin reflection (`KClass.companionObjectInstance`) for better type safety
- `lateinit var` for metadata: Use `val` with lazy initialization or object declaration—metadata is immutable

## Open Questions

Things that couldn't be fully resolved:

1. **Dynamic entity type representation**
   - What we know: QueryEntity returns entities of type determined by config.entityTypeId, not static metadata
   - What's unclear: How to represent "dynamic" in outputMetadata—null entityTypeId? Magic marker value? Special type?
   - Recommendation: Use `entityTypeId: UUID? = null` with null meaning "dynamic—resolve from node config". Document this convention in WorkflowNodeOutputField kdoc.

2. **exampleValue serialization for complex types**
   - What we know: Jackson handles `Any?` polymorphically; can serialize Map, List, primitives
   - What's unclear: Should complex examples be JSON strings or native Kotlin objects?
   - Recommendation: Use native Kotlin types (`mapOf()`, `listOf()`) for examples—Jackson serializes them correctly. More ergonomic for companion object declarations.

3. **Type validation depth**
   - What we know: Should validate that OutputFieldType.UUID matches actual UUID in toMap()
   - What's unclear: How deep to validate? Just type check or also validate list element types, map value types?
   - Recommendation: Start with shallow validation (key exists, top-level type matches). Deep validation (list element types, map structure) is Phase 2+ if needed.

## Sources

### Primary (HIGH confidence)
- Existing codebase patterns:
  - `/home/jared/dev/worktrees/workflows/core/src/main/kotlin/riven/core/service/workflow/WorkflowNodeConfigRegistry.kt` - Reflection pattern lines 214-263
  - `/home/jared/dev/worktrees/workflows/core/src/main/kotlin/riven/core/models/workflow/node/config/WorkflowNodeConfigField.kt` - Data class pattern
  - `/home/jared/dev/worktrees/workflows/core/src/main/kotlin/riven/core/models/workflow/engine/state/NodeOutput.kt` - toMap() contract
  - `/home/jared/dev/worktrees/workflows/core/src/test/kotlin/riven/core/models/workflow/engine/state/NodeOutputTest.kt` - Test patterns

### Secondary (MEDIUM confidence)
- [Kotlin Reflection with Companion Objects | Baeldung](https://www.baeldung.com/kotlin/java-reflection-companion-objects) - Companion object property access via kotlin-reflect
- [Spring Singleton Bean Thread Safety | Baeldung](https://www.baeldung.com/spring-singleton-concurrent-requests) - Stateless singleton best practices
- [Kotlin Data Class Optional Fields | Baeldung](https://www.baeldung.com/kotlin/data-class-optional-fields) - Nullable vs default value semantics
- [Jackson Enum Serialization | Baeldung](https://www.baeldung.com/jackson-serialize-enums) - Default enum serialization behavior
- [JUnit 5 Parameterized Tests | Baeldung](https://www.baeldung.com/kotlin/junit-5-kotlin) - @ParameterizedTest with @MethodSource in Kotlin

### Tertiary (LOW confidence)
- [Kotlin Nullable Generics and Default Values | Medium](https://medium.com/nerd-for-tech/kotlin-nullable-generics-and-default-values-a9d95549eac5) - Generic type handling patterns
- [Polymorphic JSON Parsing with Kotlin and Jackson | Medium](https://medium.com/@js_9757/polymorphic-json-parsing-with-kotlin-and-jackson-b7a8549fef9c) - Any? serialization patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use, verified in codebase
- Architecture: HIGH - Existing WorkflowNodeConfigRegistry pattern proven in production
- Pitfalls: MEDIUM - Inferred from best practices and existing test patterns; some edge cases may emerge during implementation

**Research date:** 2026-02-13
**Valid until:** 2026-03-13 (30 days - stable tech stack, unlikely to change)
