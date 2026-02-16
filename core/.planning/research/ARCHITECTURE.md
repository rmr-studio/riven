# Architecture Patterns: Workflow Node Output Metadata

**Domain:** Workflow node sealed interface hierarchy
**Researched:** 2026-02-10

## Recommended Architecture

Output metadata should follow the existing companion object pattern used for `configSchema` and `metadata`, stored alongside them in each node config's companion object and exposed through the existing `WorkflowNodeConfigRegistry` and REST endpoint.

### Component Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│ WorkflowNodeConfig (sealed interface)                       │
│ ├─ execute() → NodeOutput                                   │
│ ├─ validate() → ConfigValidationResult                      │
│ ├─ config: JsonObject                                       │
│ └─ configSchema: List<WorkflowNodeConfigField>             │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ implemented by
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Concrete Config (e.g., WorkflowUpdateEntityActionConfig)   │
│ - Data class with config properties                         │
│ - execute() implementation returning typed NodeOutput       │
│                                                              │
│ companion object {                                           │
│   val metadata: WorkflowNodeTypeMetadata                    │
│   val configSchema: List<WorkflowNodeConfigField>          │
│   val outputMetadata: WorkflowNodeOutputMetadata  ← NEW     │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ registered in
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ WorkflowNodeConfigRegistry                                  │
│ - Discovers companion objects via reflection                │
│ - Caches NodeSchemaEntry with outputMetadata ← ENHANCED     │
│ - Exposes via getAllNodes()                                 │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ consumed by
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ WorkflowDefinitionController                                │
│ GET /api/v1/workflow/definitions/nodes                      │
│ - Returns WorkflowNodeMetadata with outputMetadata          │
│ - Frontend consumes for output preview and wiring           │
└─────────────────────────────────────────────────────────────┘
```

### Data Model Structure

**New data classes:**

```kotlin
/**
 * Metadata describing a node's output structure.
 * Lives in companion object alongside configSchema and metadata.
 */
data class WorkflowNodeOutputMetadata(
    val outputType: String,              // NodeOutput type name (e.g., "UpdateEntityOutput")
    val fields: List<OutputFieldMetadata>, // Field definitions
    val registryKeys: List<String>        // What keys it stores in datastore
)

/**
 * Describes a single field in the output.
 */
data class OutputFieldMetadata(
    val key: String,                      // Field name (e.g., "entityId")
    val label: String,                    // Human-readable label
    val type: OutputFieldType,            // Type for UI rendering
    val description: String?              // Optional description
)

/**
 * Output field types for frontend rendering.
 */
enum class OutputFieldType {
    UUID,           // Single UUID value
    STRING,         // Text value
    BOOLEAN,        // Boolean flag
    NUMBER,         // Numeric value
    MAP,            // Key-value map
    LIST,           // Array of items
    OBJECT          // Complex nested object
}
```

**Enhanced registry entry:**

```kotlin
data class NodeSchemaEntry(
    val type: WorkflowNodeType,
    val subType: String,
    val configClass: KClass<out WorkflowNodeConfig>,
    val schema: List<WorkflowNodeConfigField>,      // Input schema
    val metadata: WorkflowNodeTypeMetadata,
    val outputMetadata: WorkflowNodeOutputMetadata? // Output schema (nullable for backward compat)
)
```

**Enhanced API response:**

```kotlin
data class WorkflowNodeMetadata(
    val type: WorkflowNodeType,
    val subType: String,
    val metadata: WorkflowNodeTypeMetadata,
    val schema: List<WorkflowNodeConfigField>,       // Input schema
    val outputMetadata: WorkflowNodeOutputMetadata?  // Output schema
)
```

## Integration Points

### 1. Companion Object Declaration (Node Config Layer)

Each concrete config declares output metadata in companion object:

```kotlin
@Schema(name = "WorkflowUpdateEntityActionConfig")
data class WorkflowUpdateEntityActionConfig(...) : WorkflowActionConfig {

    companion object {
        val metadata = WorkflowNodeTypeMetadata(...)
        val configSchema: List<WorkflowNodeConfigField> = listOf(...)

        val outputMetadata = WorkflowNodeOutputMetadata(
            outputType = "UpdateEntityOutput",
            fields = listOf(
                OutputFieldMetadata(
                    key = "entityId",
                    label = "Entity ID",
                    type = OutputFieldType.UUID,
                    description = "UUID of the updated entity"
                ),
                OutputFieldMetadata(
                    key = "updated",
                    label = "Updated",
                    type = OutputFieldType.BOOLEAN,
                    description = "Whether the update was successful"
                ),
                OutputFieldMetadata(
                    key = "payload",
                    label = "Payload",
                    type = OutputFieldType.MAP,
                    description = "Entity data after update"
                )
            ),
            registryKeys = listOf("steps.{nodeName}.output")
        )
    }
}
```

### 2. Registry Discovery (Service Layer)

`WorkflowNodeConfigRegistry.registerNode<T>()` enhanced to extract output metadata:

```kotlin
private inline fun <reified T : WorkflowNodeConfig> registerNode(
    type: WorkflowNodeType,
    subType: String
): NodeSchemaEntry? {
    val companion = T::class.companionObjectInstance ?: return null

    // Existing extraction
    val schema = extractProperty<List<WorkflowNodeConfigField>>(companion, "configSchema")
    val metadata = extractProperty<WorkflowNodeTypeMetadata>(companion, "metadata")

    // NEW: Extract output metadata (optional for backward compatibility)
    val outputMetadata = try {
        extractProperty<WorkflowNodeOutputMetadata>(companion, "outputMetadata")
    } catch (e: Exception) {
        logger.debug { "No outputMetadata found for ${T::class.simpleName}" }
        null
    }

    return NodeSchemaEntry(
        type = type,
        subType = subType,
        configClass = T::class,
        schema = schema,
        metadata = metadata,
        outputMetadata = outputMetadata
    )
}
```

### 3. API Exposure (Controller Layer)

Existing endpoint automatically includes output metadata:

```kotlin
// WorkflowDefinitionController.kt
@GetMapping("/nodes")
fun getNodeDefinitions(): ResponseEntity<Map<String, WorkflowNodeMetadata>> {
    val schemas = workflowNodeConfigRegistry.getAllNodes()
    return ResponseEntity.ok(schemas)
}

// Response shape (enhanced):
{
  "ACTION.UPDATE_ENTITY": {
    "type": "ACTION",
    "subType": "UPDATE_ENTITY",
    "metadata": {
      "label": "Update Entity",
      "description": "Updates an existing entity instance",
      "icon": "PENCIL",
      "category": "ACTION"
    },
    "schema": [ /* input config fields */ ],
    "outputMetadata": {
      "outputType": "UpdateEntityOutput",
      "fields": [
        {
          "key": "entityId",
          "label": "Entity ID",
          "type": "UUID",
          "description": "UUID of the updated entity"
        },
        {
          "key": "updated",
          "label": "Updated",
          "type": "BOOLEAN",
          "description": "Whether the update was successful"
        },
        {
          "key": "payload",
          "label": "Payload",
          "type": "MAP",
          "description": "Entity data after update"
        }
      ],
      "registryKeys": ["steps.{nodeName}.output"]
    }
  }
}
```

### 4. Frontend Consumption (Consumer Layer)

Frontend uses output metadata for:

**Output Preview in Node Inspector:**
```typescript
// When user clicks a node, show what it outputs
function NodeOutputPreview({ nodeType }: Props) {
  const nodeMetadata = useNodeMetadata(nodeType);

  return (
    <div className="output-preview">
      <h3>Output Fields</h3>
      {nodeMetadata.outputMetadata.fields.map(field => (
        <div key={field.key}>
          <strong>{field.label}</strong> ({field.type})
          <p>{field.description}</p>
        </div>
      ))}
    </div>
  );
}
```

**Template Path Suggestions:**
```typescript
// When user types {{ in downstream node config
function TemplateAutocomplete({ workflowNodes }: Props) {
  const suggestions = workflowNodes.flatMap(node =>
    node.outputMetadata.fields.map(field => ({
      path: `steps.${node.name}.output.${field.key}`,
      label: `${node.name} > ${field.label}`,
      type: field.type
    }))
  );

  return <Autocomplete options={suggestions} />;
}
```

**Visual Wiring Validation:**
```typescript
// When user connects nodes, validate compatible types
function validateConnection(source: Node, target: Node, targetField: string) {
  const outputField = source.outputMetadata.fields.find(f => f.key === targetField);
  const inputField = target.schema.find(f => f.key === targetField);

  return isTypeCompatible(outputField.type, inputField.type);
}
```

## Data Flow

### Registration Time (Startup)

```
1. Spring Boot initializes WorkflowNodeConfigRegistry
2. Registry calls registerAllNodes()
3. For each node config class:
   a. Reflect into companion object
   b. Extract metadata, configSchema, outputMetadata
   c. Cache in NodeSchemaEntry
4. Registry ready for API queries
```

### API Request Time (Runtime)

```
1. Frontend: GET /api/v1/workflow/definitions/nodes
2. Controller: workflowNodeConfigRegistry.getAllNodes()
3. Registry: Map entries to WorkflowNodeMetadata (includes outputMetadata)
4. Controller: Return JSON with input schema + output schema
5. Frontend: Render node palette with output previews
```

### Execution Time (No Change)

```
1. Node executes: config.execute() → NodeOutput
2. NodeOutput.toMap() converts to Map<String, Any?>
3. StepOutput wraps NodeOutput with metadata
4. WorkflowDataStore stores StepOutput by node name
5. Template resolution accesses via {{ steps.nodeName.output.field }}
```

**Output metadata is purely declarative — execution behavior unchanged.**

## Patterns to Follow

### Pattern 1: Mirror NodeOutput Structure

**What:** Output metadata fields should exactly match NodeOutput data class properties.

**Why:** Ensures frontend preview matches runtime reality. No surprises during template resolution.

**Example:**

```kotlin
// NodeOutput definition
data class UpdateEntityOutput(
    val entityId: UUID,
    val updated: Boolean,
    val payload: Map<UUID, Any?>
) : NodeOutput

// Companion object metadata mirrors this
val outputMetadata = WorkflowNodeOutputMetadata(
    outputType = "UpdateEntityOutput",
    fields = listOf(
        OutputFieldMetadata(key = "entityId", ...),   // Matches property
        OutputFieldMetadata(key = "updated", ...),    // Matches property
        OutputFieldMetadata(key = "payload", ...)     // Matches property
    ),
    registryKeys = listOf("steps.{nodeName}.output")
)
```

### Pattern 2: Registry Keys Document Storage Points

**What:** `registryKeys` field lists where this node's data appears in WorkflowDataStore.

**Why:** Frontend needs to know how to construct template paths. Different nodes may store data at different locations.

**Common patterns:**

```kotlin
// Standard output (most nodes)
registryKeys = listOf("steps.{nodeName}.output")
// Resolves to: {{ steps.updateEntity.output.entityId }}

// Control flow nodes may expose additional paths
registryKeys = listOf(
    "steps.{nodeName}.output",
    "steps.{nodeName}.conditionResult"  // Backward compat alias
)

// Loop nodes create scoped context
registryKeys = listOf(
    "steps.{nodeName}.output",
    "loops.{nodeName}.currentItem",
    "loops.{nodeName}.currentIndex"
)

// Variable setters modify variables namespace
registryKeys = listOf(
    "steps.{nodeName}.output",
    "variables.{variableName}"
)
```

### Pattern 3: Nullable for Incremental Adoption

**What:** `outputMetadata` is nullable in `NodeSchemaEntry` and `WorkflowNodeMetadata`.

**Why:** Allows adding output metadata to nodes incrementally. Nodes without metadata still work; frontend gracefully handles null.

**Adoption path:**

```
Phase 1: Add outputMetadata to high-value nodes (entity actions)
Phase 2: Add to control flow nodes
Phase 3: Add to remaining nodes (triggers, utilities)
```

### Pattern 4: OutputFieldType for UI Rendering

**What:** `OutputFieldType` enum provides semantic types, not just JSON primitives.

**Why:** Frontend needs to know how to render and validate. `UUID` implies validation pattern, `MAP` implies nested display, etc.

**Type mapping:**

```kotlin
UUID       → UUID validation, display as monospace, click to copy
STRING     → Text display, multiline if long
BOOLEAN    → Badge/pill UI (true/false)
NUMBER     → Numeric display, formatting
MAP        → Nested key-value display, expandable
LIST       → Array display, indexed items
OBJECT     → Nested object display, property viewer
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Output Metadata on WorkflowNodeConfig Interface

**What goes wrong:** Adding `val outputMetadata: WorkflowNodeOutputMetadata` to the `WorkflowNodeConfig` sealed interface.

**Why bad:**
- Forces every concrete config to implement as instance property or override getter
- Can't be static (requires instantiation to access)
- Breaks registration pattern (registry needs schema without creating instances)
- Couples runtime config with compile-time metadata

**Instead:** Keep in companion object as static property, extracted via reflection.

### Anti-Pattern 2: Deriving Metadata from NodeOutput at Runtime

**What goes wrong:** Instantiating NodeOutput to reflect properties and generate metadata dynamically.

**Why bad:**
- Requires executing node to discover output shape
- Can't generate metadata at registration time
- Loses type information (reflection on sealed interface is limited)
- No way to add labels/descriptions (only raw property names)
- Frontend can't preview outputs before execution

**Instead:** Declare metadata statically in companion object, mirror NodeOutput structure manually.

### Anti-Pattern 3: Separate Output Metadata Registry

**What goes wrong:** Creating `WorkflowNodeOutputMetadataRegistry` separate from `WorkflowNodeConfigRegistry`.

**Why bad:**
- Duplicates registration logic
- Two sources of truth for node types
- Maintenance burden (must update both registries)
- API requires two endpoints or complex joins

**Instead:** Extend existing `WorkflowNodeConfigRegistry` to include output metadata in `NodeSchemaEntry`.

### Anti-Pattern 4: Embedding Output Metadata in configSchema

**What goes wrong:** Adding output fields to `configSchema: List<WorkflowNodeConfigField>` with a flag like `isOutput: Boolean`.

**Why bad:**
- `WorkflowNodeConfigField` is for **input** configuration (user-editable fields)
- Output metadata is **declarative** (describes execution result, not configuration)
- Semantic confusion between "fields user configures" vs "fields node outputs"
- Frontend needs to filter `configSchema` by `isOutput` flag everywhere

**Instead:** Separate `configSchema` (inputs) from `outputMetadata` (outputs) with distinct types.

### Anti-Pattern 5: Storing Output Type as Class Reference

**What goes wrong:** `val outputType: KClass<out NodeOutput>` instead of `val outputType: String`.

**Why bad:**
- Requires importing NodeOutput sealed interface hierarchy in model layer
- JSON serialization of `KClass` is complex/unreliable
- Frontend receives internal class names instead of semantic types
- Tight coupling between config and output domains

**Instead:** Use string name of NodeOutput type (`"UpdateEntityOutput"`), optionally validated against known types.

## Build Order Implications

Output metadata sits at intersection of multiple concerns. Build order matters:

### Phase 1: Data Model (No External Dependencies)

**Order:** First
**Components:**
- `OutputFieldMetadata` data class
- `OutputFieldType` enum
- `WorkflowNodeOutputMetadata` data class

**Why first:** Pure data classes with no dependencies. Required by companion objects and registry.

**Files:**
```
models/workflow/node/config/WorkflowNodeOutputMetadata.kt
models/workflow/node/config/OutputFieldMetadata.kt
enums/workflow/OutputFieldType.kt
```

### Phase 2: Companion Object Declarations (Depends on Phase 1)

**Order:** Second
**Components:**
- Add `val outputMetadata = WorkflowNodeOutputMetadata(...)` to each node config companion object

**Why second:** Requires data model from Phase 1. Each node can declare independently (no interdependencies).

**Incremental:** Can add to high-value nodes first (entity actions), expand later.

**Files:** Update existing node config files:
```
models/workflow/node/config/actions/WorkflowUpdateEntityActionConfig.kt
models/workflow/node/config/actions/WorkflowCreateEntityActionConfig.kt
models/workflow/node/config/actions/WorkflowQueryEntityActionConfig.kt
... (add to others incrementally)
```

### Phase 3: Registry Enhancement (Depends on Phase 1-2)

**Order:** Third
**Components:**
- Enhance `NodeSchemaEntry` to include `outputMetadata: WorkflowNodeOutputMetadata?`
- Enhance `WorkflowNodeMetadata` to include `outputMetadata: WorkflowNodeOutputMetadata?`
- Update `WorkflowNodeConfigRegistry.registerNode<T>()` to extract outputMetadata from companion object

**Why third:** Requires data model (Phase 1) and companion declarations (Phase 2) to exist.

**Files:**
```
service/workflow/WorkflowNodeConfigRegistry.kt
```

### Phase 4: API Exposure (Depends on Phase 1-3)

**Order:** Fourth
**Components:**
- No changes needed (existing endpoint automatically serializes enhanced `WorkflowNodeMetadata`)
- Optionally add tests to verify output metadata appears in response

**Why fourth:** Existing `GET /api/v1/workflow/definitions/nodes` endpoint automatically includes new fields via updated `WorkflowNodeMetadata`.

**Files:**
```
controller/workflow/WorkflowDefinitionController.kt (no changes)
```

### Dependency Graph

```
Phase 1: Data Model
    ↓
Phase 2: Companion Objects (per-node, independent)
    ↓
Phase 3: Registry Enhancement
    ↓
Phase 4: API Exposure (automatic)
```

**Critical path:** Phase 1 → Phase 3
**Parallelizable:** Individual companion object updates in Phase 2

## Validation Strategy

### Compile-Time Validation

**Mirror check:** Manual discipline to ensure `outputMetadata.fields` match `NodeOutput` data class properties.

**Tooling opportunity (future):** Annotation processor to validate at compile time:
```kotlin
@ValidateOutputMetadata(UpdateEntityOutput::class)
companion object {
    val outputMetadata = ...  // Verified to match UpdateEntityOutput properties
}
```

### Runtime Validation

**Registry registration:** Log warning if outputMetadata extraction fails (non-fatal).

```kotlin
val outputMetadata = try {
    extractProperty<WorkflowNodeOutputMetadata>(companion, "outputMetadata")
} catch (e: Exception) {
    logger.debug { "No outputMetadata found for ${T::class.simpleName}" }
    null  // Graceful degradation
}
```

### Integration Testing

**Test each node's output metadata:**

```kotlin
@Test
fun `UpdateEntityActionConfig declares output metadata matching NodeOutput`() {
    val entry = registry.getAllEntries()
        .find { it.subType == "UPDATE_ENTITY" }

    assertNotNull(entry?.outputMetadata)
    assertEquals("UpdateEntityOutput", entry.outputMetadata.outputType)

    val fieldKeys = entry.outputMetadata.fields.map { it.key }
    assertContainsExactly(fieldKeys, listOf("entityId", "updated", "payload"))
}
```

## Scalability Considerations

### At 10 Nodes

**Approach:** Manual declaration of output metadata per node.
**Complexity:** Low — straightforward companion object additions.

### At 50 Nodes

**Approach:** Same pattern, potentially introduce helper functions for common output types.

```kotlin
// Helper for common UUID + payload outputs
fun entityOutputMetadata(actionVerb: String) = WorkflowNodeOutputMetadata(
    outputType = "${actionVerb}EntityOutput",
    fields = listOf(
        OutputFieldMetadata(key = "entityId", label = "Entity ID", type = OutputFieldType.UUID),
        OutputFieldMetadata(key = "payload", label = "Payload", type = OutputFieldType.MAP)
    ),
    registryKeys = listOf("steps.{nodeName}.output")
)
```

**Complexity:** Medium — helpers reduce boilerplate.

### At 100+ Nodes

**Approach:** Consider annotation processor to auto-generate output metadata from NodeOutput classes.

```kotlin
// Theoretical future enhancement
@GenerateOutputMetadata(CreateEntityOutput::class)
companion object {
    // outputMetadata auto-generated from CreateEntityOutput properties
}
```

**Complexity:** High — requires build tooling, but scales indefinitely.

**Current recommendation:** Manual declaration scales to 50+ nodes easily. Delay automation until proven pain point.

## Related Patterns

### Pattern: Companion Object Metadata

**Source:** Existing pattern in codebase for `configSchema` and `metadata`.

**Why it works:**
- Static access without instantiation
- Discoverable via reflection
- Type-safe with compile-time checking
- Single source of truth (companion object is singleton per class)

### Pattern: Registry + Controller Exposure

**Source:** Existing `WorkflowNodeConfigRegistry` → `WorkflowDefinitionController` flow.

**Why it works:**
- Registry centralizes discovery logic
- Controller provides REST access
- OpenAPI docs auto-generated from data classes
- Single endpoint for all node metadata

### Pattern: Sealed Interface + Companion Objects

**Source:** Kotlin sealed interface best practice.

**Why it works:**
- Sealed interface enforces exhaustive type checking
- Companion objects provide class-level properties
- Reflection-based registration enables open-closed principle (add nodes without changing registry logic)

## Source Hierarchy

**HIGH confidence:** Architecture derived from existing codebase patterns.

**Sources:**
- `/core/src/main/kotlin/riven/core/models/workflow/node/config/WorkflowNodeConfig.kt` — Sealed interface definition
- `/core/src/main/kotlin/riven/core/service/workflow/WorkflowNodeConfigRegistry.kt` — Registration pattern
- `/core/src/main/kotlin/riven/core/controller/workflow/WorkflowDefinitionController.kt` — API exposure
- `/core/src/main/kotlin/riven/core/models/workflow/engine/state/NodeOutput.kt` — Output type system
- `/docs/system-design/domains/Workflows/Node Execution/WorkflowNodeConfig.md` — Architecture documentation

**Confidence rationale:** Output metadata integrates with proven patterns already in production. No novel architectural decisions required — straightforward extension of existing companion object + registry + API pattern.
