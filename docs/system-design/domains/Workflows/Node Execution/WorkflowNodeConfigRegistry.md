---
tags:
  - layer/configuration
  - component/active
  - architecture/component
Created: 2026-02-08
Updated: 2026-02-08
---
# WorkflowNodeConfigRegistry

Part of [[Node Execution]]

## Purpose

Registry service that discovers and caches all workflow node configuration schemas at startup, providing static access to config schemas for all node types without requiring instantiation.

---

## Responsibilities

- Discover node config classes via Kotlin reflection
- Extract `configSchema` and `metadata` from companion objects
- Cache schema entries in-memory on first access (lazy initialization)
- Provide schema lookup by node type, subtype, or full key
- Return `WorkflowNodeMetadata` for API responses (schema + metadata, no config class)

---

## Dependencies

- Node config classes — Each with companion object containing `configSchema` and `metadata`
- Kotlin reflection — `KClass.companionObjectInstance` for companion access

## Used By

- Workflow API controllers — Return available node types with schemas
- Node config validation — Lookup expected fields for a node type
- Frontend — Discover node types and render dynamic forms

---

## Key Logic

**Registration pattern:**

Each node config class defines:

```kotlin
companion object {
    val configSchema: List<WorkflowNodeConfigField> = listOf(...)
    val metadata: WorkflowNodeTypeMetadata = WorkflowNodeTypeMetadata(...)
}
```

Registry extracts these via reflection in `registerNode<T>()` and caches as `NodeSchemaEntry`.

**Lazy initialization:**

Registry entries built on first access (`by lazy`). Single initialization at startup, cached for lifetime of application.

**Schema entry structure:**

```kotlin
data class NodeSchemaEntry(
    type: WorkflowNodeType,        // ACTION, TRIGGER, CONTROL_FLOW, etc.
    subType: String,               // CREATE_ENTITY, WEBHOOK, CONDITION, etc.
    configClass: KClass<...>,      // Actual config class (not exposed in API)
    schema: List<WorkflowNodeConfigField>,
    metadata: WorkflowNodeTypeMetadata
)
```

---

## Public Methods

### `getAllNodes(): Map<String, WorkflowNodeMetadata>`

Returns all registered node types as map: `"ACTION.CREATE_ENTITY" -> WorkflowNodeMetadata`.

### `getAllEntries(): List<NodeSchemaEntry>`

Returns all schema entries with full metadata (including config class).

### `getSchemasByType(type: WorkflowNodeType): List<NodeSchemaEntry>`

Filters schema entries by node type (e.g., all ACTION nodes).

### `getSchema(type: String, subType: String): List<WorkflowNodeConfigField>?`

Returns schema fields for specific node type and subtype. Null if not found.

### `getSchemaByKey(key: String): List<WorkflowNodeConfigField>?`

Returns schema fields for node key (e.g., "ACTION.CREATE_ENTITY"). Null if not found.

---

## Gotchas

- **Explicit registration required:** New node types must be added to `registerAllNodes()`. Not automatic classpath scanning. Ensures type safety and compile-time checking.
- **Companion object requirement:** Each config class MUST have companion object with `configSchema` and `metadata`. If missing, logs warning and skips registration.
- **Reflection performance:** Uses Kotlin reflection to extract companion members. Only runs once at startup (lazy init), so minimal performance impact.
- **Adding new nodes:** To add node type:
  1. Create config class with companion object (schema + metadata)
  2. Add `registerNode<YourConfigClass>(type, subType)` to `registerAllNodes()`
  3. Schema automatically available via registry

---

## Related

- Node config classes — WorkflowCreateEntityActionConfig, WorkflowConditionControlConfig, etc.
- [[Node Execution]] — Parent subdomain
