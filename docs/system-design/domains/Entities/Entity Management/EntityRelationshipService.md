---
tags:
  - component/active
  - layer/service
  - architecture/component
Created: 2026-02-08
Updated: 2026-02-21
Domains:
  - "[[Entities]]"
---
# EntityRelationshipService

Part of [[Entity Management]]

## Purpose

Manages instance-level relationship links between entities. Responsible for diffing and persisting desired link state against current database state, enforcing cardinality constraints at write time, validating target entity types against definition rules, and resolving bidirectional visibility at read time without storing inverse rows. Additionally manages fallback 'connection' links between entities using a system-managed CONNECTED_ENTITIES definition, with its own CRUD operations, security annotations, and activity logging.

---

## Responsibilities

**Owns:**

- Diffing current vs. requested target IDs and computing additions and removals
- Deleting stale relationship rows from `entity_relationships`
- Validating new target entities against definition type rules and polymorphic flag
- Enforcing source-side cardinality (how many targets of a given type a source may hold)
- Enforcing target-side cardinality (whether a target is already claimed by another source)
- Inserting new `EntityRelationshipEntity` rows for validated additions
- Resolving inverse visibility at read time via repository UNION queries
- Grouping `EntityLink` projections by definition ID for single and batch reads
- Soft-deleting all relationships involving a set of entities (as source or target)
- Providing reverse lookups (target → source) for delete cascade orchestration in [[EntityService]]
- Creating, reading, updating, and soft-deleting fallback connection links via the `CONNECTED_ENTITIES` definition
- Workspace access control on connection operations via `@PreAuthorize`
- Activity logging for connection mutations (`Activity.ENTITY_CONNECTION`)
- Resolving fallback definition IDs via `EntityTypeRelationshipService`
- Duplicate connection detection (bidirectional — checks both forward and reverse)

**NOT responsible for:**

- Loading `RelationshipDefinition` from the database — the definition is passed in by the caller
- Storing inverse rows — bidirectional visibility is handled purely at query time
- Workspace access control for structured relationships — access is enforced by [[EntityService]] before delegating. Connection operations have their own `@PreAuthorize` annotations.
- Activity logging for structured relationships — mutations are logged by [[EntityService]]. Connection operations log their own activity.
- Impact tracking for cache invalidation — [[EntityService]] derives impacted entity IDs from `findByTargetIdIn` after calling this service

---

## Dependencies

### Internal

| Dependency | Purpose |
|---|---|
| `EntityRelationshipRepository` | All persistence operations: SELECT FOR UPDATE, insert, delete, projection queries |
| `EntityRepository` | `findAllById` to load and type-resolve new target entities before validation |
| `RelationshipDefinitionRepository` | Validates connection belongs to a CONNECTED_ENTITIES definition |
| `EntityTypeRelationshipService` | Resolves fallback CONNECTED_ENTITIES definition for entity types |
| `AuthTokenService` | Retrieves current user ID for connection activity logging |
| `ActivityService` | Logs connection CRUD operations |

### External

None. The service has no external integrations.

### Injected

```kotlin
class EntityRelationshipService(
    private val entityRelationshipRepository: EntityRelationshipRepository,
    private val entityRepository: EntityRepository,
    private val definitionRepository: RelationshipDefinitionRepository,
    private val entityTypeRelationshipService: EntityTypeRelationshipService,
    private val authTokenService: AuthTokenService,
    private val activityService: ActivityService,
    private val logger: KLogger,
)
```

---

## Consumed By

| Consumer | Methods Used | Reason |
|---|---|---|
| [[EntityService]] | `saveRelationships`, `findRelatedEntities` (both overloads), `findByTargetIdIn`, `archiveEntities` | Entity save, read hydration, delete cascade |
| [[EntityController]] | `createConnection`, `getConnections`, `updateConnection`, `deleteConnection` | Connection CRUD endpoints |

---

## Public Interface — Key Methods

### `saveRelationships`

```kotlin
@Transactional
fun saveRelationships(
    id: UUID,
    workspaceId: UUID,
    definitionId: UUID,
    definition: RelationshipDefinition,
    targetIds: List<UUID>,
)
```

**Purpose:** Atomically reconcile the relationship links for one source entity under one definition to match the requested target list.

**When to use:** Called by [[EntityService]] during entity create and update whenever a relationship field appears in the incoming payload.

**Side effects:**
- Acquires a pessimistic write lock (`SELECT FOR UPDATE`) on existing rows for the source+definition pair to serialize concurrent writes.
- Deletes rows for targets no longer in the request.
- Validates new target type IDs against definition rules.
- Enforces source-side and target-side cardinality against ALL final-state targets (retained + new).
- Inserts new `EntityRelationshipEntity` rows.

**Throws:**
- `IllegalArgumentException` — one or more requested target entity IDs do not exist in the database, or a target's type is not permitted by the definition rules.
- `InvalidRelationshipException` — source-side or target-side cardinality would be violated by the requested state.

**Returns:** Unit. Callers do not receive a result; they re-query via `findRelatedEntities` if needed.

---

### `findRelatedEntities(entityId, workspaceId)`

```kotlin
fun findRelatedEntities(entityId: UUID, workspaceId: UUID): Map<UUID, List<EntityLink>>
```

**Purpose:** Hydrate all relationship links visible to a single entity, keyed by definition ID.

**When to use:** Called during single-entity reads in [[EntityService]].

**Side effects:** None. Read-only.

**Throws:** Nothing beyond repository-level exceptions.

**Returns:** Map of `definitionId → List<EntityLink>`. Includes both forward links (entity is the source) and inverse-visible links (entity is the target and the matching target rule has `inverseVisible = true`). Returns an empty map when no links exist.

---

### `findRelatedEntities(entityIds, workspaceId)`

```kotlin
fun findRelatedEntities(entityIds: Set<UUID>, workspaceId: UUID): Map<UUID, Map<UUID, List<EntityLink>>>
```

**Purpose:** Batch hydration of relationship links for multiple entities.

**When to use:** Called during batch entity list reads in [[EntityService]] to avoid N+1 queries.

**Side effects:** None. Read-only.

**Throws:** Nothing beyond repository-level exceptions.

**Returns:** Nested map of `sourceEntityId → definitionId → List<EntityLink>`. Forward and inverse-visible links are merged. Entities with no links are absent from the outer map.

---

### `findByTargetIdIn`

```kotlin
fun findByTargetIdIn(ids: List<UUID>): Map<UUID, List<EntityRelationshipEntity>>
```

**Purpose:** Find all relationship rows where the given entities appear as targets. Used by [[EntityService]] to identify which other entities hold links to entities being deleted, enabling post-delete relationship response hydration.

**When to use:** Called during entity deletion to locate reverse pointers.

**Side effects:** None. Read-only.

**Returns:** Map of `targetId → List<EntityRelationshipEntity>`.

---

### `archiveEntities`

```kotlin
fun archiveEntities(ids: Collection<UUID>, workspaceId: UUID): List<EntityRelationshipEntity>
```

**Purpose:** Soft-delete all relationship rows where any of the given entities appear as source or target.

**When to use:** Called by [[EntityService]] after an entity is soft-deleted to clean up all associated links.

**Side effects:** Sets `deleted = true` and `deleted_at = CURRENT_TIMESTAMP` on all matching rows via a native UPDATE ... RETURNING query.

**Returns:** List of all `EntityRelationshipEntity` rows that were archived. The caller uses these to derive impacted entity IDs.

---

### Connection Operations

These methods manage fallback connections — lightweight links between entities that use the system-managed `CONNECTED_ENTITIES` definition. Unlike structured relationships (managed via `saveRelationships`), connections have their own `@PreAuthorize` and activity logging.

**Request/Response types:**

- `CreateConnectionRequest(targetEntityId: UUID, semanticContext: String, linkSource: SourceType)`
- `UpdateConnectionRequest(semanticContext: String)`
- `ConnectionResponse(id, sourceEntityId, targetEntityId, semanticContext, linkSource, createdAt, updatedAt)`

---

#### `createConnection(workspaceId, sourceEntityId, request): ConnectionResponse`

```kotlin
@Transactional
@PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
fun createConnection(
    workspaceId: UUID,
    sourceEntityId: UUID,
    request: CreateConnectionRequest,
): ConnectionResponse
```

**Purpose:** Creates a fallback connection between two entities using the CONNECTED_ENTITIES definition.

**When to use:** Called by [[EntityController]] when a user links two entities via the connections API.

**Side effects:**
- Resolves (or creates) the CONNECTED_ENTITIES fallback definition for the source entity's type via `EntityTypeRelationshipService.getOrCreateFallbackDefinition`
- Validates source and target entities exist
- Checks for duplicate connections in both directions (source→target AND target→source)
- Inserts a new `EntityRelationshipEntity` with `semanticContext` and `linkSource`
- Logs `Activity.ENTITY_CONNECTION / CREATE`

**Throws:**
- `NotFoundException` — source or target entity does not exist
- `ConflictException` — connection already exists between the two entities (in either direction)

**Returns:** `ConnectionResponse` with the created connection details.

---

#### `getConnections(workspaceId, entityId): List<ConnectionResponse>`

```kotlin
@PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
fun getConnections(workspaceId: UUID, entityId: UUID): List<ConnectionResponse>
```

**Purpose:** Returns all connections for an entity (forward + inverse) under the fallback definition.

**When to use:** Called by [[EntityController]] for the connections list endpoint.

**Side effects:** None. Read-only. Returns empty list if the entity type has no fallback definition.

**Returns:** List of `ConnectionResponse`. Includes both connections where the entity is source and where it is target.

---

#### `updateConnection(workspaceId, connectionId, request): ConnectionResponse`

```kotlin
@Transactional
@PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
fun updateConnection(
    workspaceId: UUID,
    connectionId: UUID,
    request: UpdateConnectionRequest,
): ConnectionResponse
```

**Purpose:** Updates the semantic context of an existing fallback connection.

**Side effects:**
- Validates the connection belongs to a CONNECTED_ENTITIES definition via `validateIsFallbackConnection`
- Saves updated entity with new `semanticContext`
- Logs `Activity.ENTITY_CONNECTION / UPDATE`

**Throws:**
- `NotFoundException` — connection does not exist in workspace
- `IllegalArgumentException` — connection does not belong to a CONNECTED_ENTITIES definition

---

#### `deleteConnection(workspaceId, connectionId)`

```kotlin
@Transactional
@PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
fun deleteConnection(workspaceId: UUID, connectionId: UUID)
```

**Purpose:** Soft-deletes a fallback connection.

**Side effects:**
- Validates the connection belongs to a CONNECTED_ENTITIES definition
- Calls `markDeleted()` and saves
- Logs `Activity.ENTITY_CONNECTION / DELETE`

**Throws:**
- `NotFoundException` — connection does not exist in workspace
- `IllegalArgumentException` — connection does not belong to a CONNECTED_ENTITIES definition

---

## Key Logic

### Diff-based save

`saveRelationships` does not blindly replace all rows. It computes the symmetric difference between the existing target ID set and the requested target ID set:

- `toAdd = requestedTargetIds - existingTargetIds`
- `toRemove = existingTargetIds - requestedTargetIds`

Removals are executed first. If there is nothing to add, the method returns early. This design preserves unchanged links and avoids redundant deletes and re-inserts on unchanged targets.

The pessimistic write lock (`findAllBySourceIdAndDefinitionIdForUpdate`) ensures concurrent requests for the same source+definition pair are serialized and do not both pass cardinality checks against a stale snapshot.

---

### Write-time cardinality enforcement — two axes

Cardinality is enforced across two independent axes. Both run only for NEW targets being added, but source-side enforcement considers ALL final-state targets (retained + new) to prevent circumventing limits through incremental additions.

**Source-side (how many targets of each type a source can hold):**

Groups all final targets by their entity type ID. For each type group, resolves the effective cardinality (rule override or definition default) and checks `count > maxSourceTargets()`. Relevant when `ONE_TO_ONE` or `MANY_TO_ONE`.

| Cardinality | `maxSourceTargets()` |
|---|---|
| `ONE_TO_ONE` | 1 |
| `MANY_TO_ONE` | 1 |
| `ONE_TO_MANY` | unlimited (`null`) |
| `MANY_TO_MANY` | unlimited (`null`) |

**Target-side (how many sources can link to a given target):**

For each NEW target only, resolves the effective cardinality and checks `maxTargetSources()`. If limited, queries `findByTargetIdAndDefinitionId` to detect an existing link from a different source.

| Cardinality | `maxTargetSources()` |
|---|---|
| `ONE_TO_ONE` | 1 |
| `ONE_TO_MANY` | 1 |
| `MANY_TO_ONE` | unlimited (`null`) |
| `MANY_TO_MANY` | unlimited (`null`) |

The effective cardinality for a given target type is resolved by `resolveCardinality`: the matching target rule's `cardinalityOverride` takes precedence over `definition.cardinalityDefault`. Per-type overrides only restrict their own type group — other types use the definition default independently.

---

### Target type validation

Before cardinality is enforced, `validateTargets` checks that each NEW target's entity type is permitted by the definition. For polymorphic definitions (`allowPolymorphic = true`), this check is skipped entirely. For non-polymorphic definitions, every new target must match a `RelationshipTargetRule` by exact `targetEntityTypeId`. Semantic constraint matching (matching by `semanticTypeConstraint`) is stubbed and returns no match at runtime until entity-type-level semantic metadata is implemented.

---

### Connection CRUD

Connection operations work through the same `entity_relationships` table as structured relationships, but use the system-managed `CONNECTED_ENTITIES` definition rather than user-defined relationship definitions.

**Fallback definition resolution:** When creating a connection, the service calls `entityTypeRelationshipService.getOrCreateFallbackDefinition(workspaceId, sourceEntity.typeId)` to resolve the definition. This handles lazy creation — if the entity type was published before the fallback definition feature existed, the definition is created on first use.

**Bidirectional duplicate detection:** Before creating a connection, the service checks for existing connections in BOTH directions. A connection from A→B and B→A are considered duplicates. This uses `findBySourceIdAndTargetIdAndDefinitionId` twice (once for each direction).

**Validation guard:** `validateIsFallbackConnection` ensures update and delete operations only affect connections (not structured relationships). It loads the relationship definition and checks `definition.systemType == SystemRelationshipType.CONNECTED_ENTITIES`.

---

### Inverse visibility at read time

There are no inverse rows stored in the database. Bidirectional visibility is resolved at query time in the repository using two separate native SQL queries:

- `findEntityLinksBySourceId` / `findEntityLinksBySourceIdIn` — forward links where the entity is the source.
- `findInverseEntityLinksByTargetId` / `findInverseEntityLinksByTargetIdIn` — inverse links where the entity is the target AND the matching `relationship_target_rules` row has `inverse_visible = true`.

In the inverse queries, `r.target_entity_id` is aliased as `sourceEntityId` in the projection to keep the `EntityLink` contract uniform from the consumer's perspective. The service merges both result lists and groups by `definitionId`.

---

## Data Access

### Entities Owned

| Entity | Table | Notes |
|---|---|---|
| `EntityRelationshipEntity` | `entity_relationships` | Insert and soft-delete. `SoftDeletable` (`deleted`, `deleted_at`). Workspace-scoped. |

### Queries

| Method | Query Type | Description |
|---|---|---|
| `findAllBySourceIdAndDefinitionIdForUpdate` | JPQL + `@Lock(PESSIMISTIC_WRITE)` | Acquires write lock on all rows for a source+definition pair to serialize concurrent cardinality checks |
| `deleteAllBySourceIdAndDefinitionIdAndTargetIdIn` | Spring Data derived | Deletes rows for stale targets by source, definition, and target ID list |
| `findEntityLinksBySourceId` | Native SQL | Joins `entity_relationships` → `entities` → `relationship_definitions`. Extracts label from JSONB payload using `identifier_key`. Returns `EntityLinkProjection`. |
| `findEntityLinksBySourceIdIn` | Native SQL | Batch variant of the above. Uses `ANY(:ids)` for PostgreSQL array binding. |
| `findInverseEntityLinksByTargetId` | Native SQL | LEFT JOINs `relationship_target_rules` and filters `(inverse_visible = true AND type match) OR system_type match`. Returns `EntityLinkProjection` with `target_entity_id` aliased as `sourceEntityId`. |
| `findInverseEntityLinksByTargetIdIn` | Native SQL | Batch variant. LEFT JOINs `relationship_target_rules` and `entities target_e` for type resolution per target. Includes system-type definitions without target rules. |
| `findByTargetIdIn` | JPQL | Returns all rows where `targetId` is in the provided list. Used for cascade-delete lookups. |
| `findByTargetIdAndDefinitionId` | JPQL | Returns existing rows linking a given target under a definition. Used for target-side cardinality enforcement. |
| `deleteEntities` | Native SQL (RETURNING) | Soft-deletes all rows where source or target is in the ID array. Returns affected rows. |
| `countByDefinitionId` | Spring Data derived | Count of all active links under a definition. Used by [[EntityTypeRelationshipService]] for impact analysis before definition deletion. |
| `findByIdAndWorkspaceId` | Spring Data derived | Loads single connection by ID within workspace for update/delete operations |
| `findByEntityIdAndDefinitionId` | JPQL `@Query` | Finds all relationships (source or target) for an entity under a specific definition. Used for connection listing. |
| `findBySourceIdAndTargetIdAndDefinitionId` | Spring Data derived | Checks for existing connection between two specific entities. Used for duplicate detection. |

---

## Error Handling

| Exception | Thrown When | HTTP Mapping |
|---|---|---|
| `IllegalArgumentException` | One or more `targetIds` resolve to non-existent entities; or a non-polymorphic definition rejects a target's type ID. | `400 Bad Request` via `@ControllerAdvice` |
| `InvalidRelationshipException` | Source-side cardinality exceeded (too many targets of a type); or target-side cardinality exceeded (target already linked by another source). | `400 Bad Request` via `@ControllerAdvice` |
| `ConflictException` | Connection already exists between two entities (checked bidirectionally) | `409 Conflict` via `@ControllerAdvice` |

All exceptions propagate to `ExceptionHandler` in `riven.core.exceptions`. This service does not catch and re-wrap.

---

## Observability

### Log Events

Structured relationship operations do not emit log events from this service (mutations are logged by [[EntityService]]).

Connection operations emit:
- `Activity.ENTITY_CONNECTION / CREATE` — connection created, with connectionId, targetEntityId, semanticContext
- `Activity.ENTITY_CONNECTION / UPDATE` — connection updated, with connectionId, semanticContext
- `Activity.ENTITY_CONNECTION / DELETE` — connection deleted, with connectionId
- INFO-level structured logs for each connection CRUD operation

---

## Gotchas & Edge Cases

> [!warning] Retained targets count against per-type cardinality
> Source-side cardinality is evaluated against ALL final targets (retained + new combined), not only the newly added ones. A request to add one target of a type already at its per-type limit will correctly fail, even though the net "addition" count for that type appears to be one. This prevents incremental circumvention of limits across multiple partial updates.

> [!warning] Cardinality is per-type, not total
> `ONE_TO_ONE` does not mean a source can have at most one target in total. It means a source can have at most one target of each distinct entity type. A source can simultaneously hold one TypeA target and one TypeB target under the same `ONE_TO_ONE` definition without violation.

> [!warning] Target-side enforcement only checks new targets
> `enforceTargetSideCardinality` queries `findByTargetIdAndDefinitionId` only for targets in `toAdd`. Retained targets are not re-checked. This is correct: a retained target that was previously linked by this source already passed target-side enforcement when it was first added.

> [!warning] Semantic constraint matching is not implemented
> `findMatchingRule` performs only exact `targetEntityTypeId` match. Rules with a `semanticTypeConstraint` but no `targetEntityTypeId` will never match any target at runtime. Non-polymorphic definitions with semantic-only rules will reject all targets until semantic metadata support is added.

> [!warning] Structured relationship methods have no workspace access control
> The structured relationship methods (`saveRelationships`, `findRelatedEntities`, etc.) have no `@PreAuthorize` annotations. They are internal methods called exclusively from [[EntityService]], which enforces workspace access before delegating. Connection methods (`createConnection`, `getConnections`, `updateConnection`, `deleteConnection`) DO have their own `@PreAuthorize` annotations and are called directly by [[EntityController]].

> [!warning] Connection duplicate check is bidirectional
> `createConnection` checks for existing connections in both directions (A→B and B→A). This means the order of source and target does not matter for uniqueness. Two separate queries are issued for this check.

> [!warning] Inverse queries changed from INNER JOIN to LEFT JOIN
> The inverse entity link queries (`findInverseEntityLinksByTargetId`, `findInverseEntityLinksByTargetIdIn`) now use LEFT JOIN on `relationship_target_rules` instead of INNER JOIN. This allows system-type definitions (which have no target rules) to appear in inverse results. The WHERE clause uses `(inverse_visible = true AND type match) OR system_type = :systemType`.

> [!warning] Inverse query aliasing
> In the inverse-link native SQL queries, `r.target_entity_id` is aliased as `sourceEntityId`. This means the `EntityLink.sourceEntityId` field for an inverse link reflects the entity being viewed (i.e. the target of the stored row), not the entity that created the stored row. Consumers group by `sourceEntityId` without needing to know which direction the link was originally stored.

### Known Limitations

| Limitation | Impact | Tracking |
|---|---|---|
| Semantic constraint matching stubbed | Non-polymorphic definitions with semantic-only rules cannot validate or enforce target types at runtime | Untracked — requires `EntityTypeSemanticMetadata` implementation |
| No total-target limit | Cardinality limits are per-type, not a global cap on total targets for a definition | By design, but undocumented in API responses |
| Target-side check is N queries | `enforceTargetSideCardinality` issues one query per new target. For bulk saves with many new targets this is suboptimal. | Untracked |

---

## Technical Debt

| Item | Location | Notes |
|---|---|---|
| Semantic constraint matching stubbed | `findMatchingRule` private method | Marked with a TODO comment. Blocked on entity-type-level semantic classification being implemented elsewhere in the Entities domain. |
| N+1 in target-side cardinality | `enforceTargetSideCardinality` | Issues one `findByTargetIdAndDefinitionId` query per new target. Could be batched into a single query returning all existing source links for a set of target IDs under a definition. |

---

## Testing

File: `src/test/kotlin/riven/core/service/entity/EntityRelationshipServiceTest.kt`

Test class: `EntityRelationshipServiceTest` — `@SpringBootTest` scoped to `EntityRelationshipService`, `AuthTokenService`, and `WorkspaceSecurity`. All repository dependencies are `@MockitoBean`.

**Coverage:**

| Scenario | Test |
|---|---|
| New links created | `saveRelationships - new links - creates rows` |
| Missing target entity throws | `saveRelationships - missing target entity - throws` |
| Stale links removed | `saveRelationships - remove links - deletes rows` |
| No-change is a no-op | `saveRelationships - no change - no operations` |
| `ONE_TO_ONE` source-side rejects second target of same type | `saveRelationships - enforces cardinality ONE_TO_ONE - rejects second link` |
| `MANY_TO_ONE` allows single target per source | `saveRelationships - enforces cardinality MANY_TO_ONE - allows multiple sources` |
| Polymorphic definition accepts any type | `saveRelationships - polymorphic - accepts any target type` |
| Non-polymorphic rejects unlisted type | `saveRelationships - non polymorphic - rejects unlisted target type` |
| Rule cardinality override beats definition default | `saveRelationships - cardinality override - uses rule override over default` |
| Per-type override does not restrict other types | `saveRelationships - mixed types - ONE_TO_ONE override only restricts that type` |
| `ONE_TO_ONE` target-side rejects already-claimed target | `saveRelationships - ONE_TO_ONE - rejects target already linked by another source` |
| `MANY_TO_MANY` does not check target-side exclusivity | `saveRelationships - MANY_TO_MANY - allows target linked by multiple sources` |
| Diff: add new, remove old in one call | `saveRelationships - diff logic - adds new and removes old in same call` |
| Empty targetIds removes all existing | `saveRelationships - empty targetIds - removes all existing links` |
| ONE_TO_ONE swap (remove 1, add 1) succeeds | `saveRelationships - cardinality with mixed add and remove - ONE_TO_ONE succeeds` |
| Retained targets count toward per-type limit | `saveRelationships - retained targets count toward per-type cardinality` |
| `ONE_TO_MANY` target-side: target already linked by another source | `saveRelationships - ONE_TO_MANY - rejects target already linked by another source` |
| `ONE_TO_MANY` allows multiple targets from same source | `saveRelationships - ONE_TO_MANY - allows multiple targets from same source` |
| Per-type ONE_TO_ONE default: different types each get their own limit | `saveRelationships - per-type default fallback - different types each get their own limit` |
| `MANY_TO_ONE` rejects two targets of same type | `saveRelationships - MANY_TO_ONE - rejects two targets of same type` |
| Forward read returns targets | `findRelatedEntities - forward - returns targets` |
| Inverse-visible links included | `findRelatedEntities - includes inverse-visible links` |
| Inverse-invisible links excluded (at repository level) | `findRelatedEntities - excludes inverse-invisible links` |
| Forward + inverse under same definition merged | `findRelatedEntities - merges forward and inverse under same definition` |

---

## Related

- [[EntityService]] — Primary consumer. Owns workspace access control, activity logging, and impact tracking around this service.
- [[EntityTypeRelationshipService]] — Manages `RelationshipDefinition` schema. Uses `countByDefinitionId` from `EntityRelationshipRepository` for impact analysis before definition deletion.
- [[Entity Management]] — Parent subdomain.
- [[Relationships]] — Type-level relationship definition domain.
- `EntityRelationshipRepository` — Repository interface containing the native SQL projection queries that drive inverse visibility.

---

## Changelog

| Date | Author | Description |
|---|---|---|
| 2026-02-08 | System | Initial document created |
| 2026-02-21 | System | Complete rewrite — removed bidirectional sync architecture (no inverse row storage), documented write-time cardinality enforcement (two-axis: source-side and target-side), target type validation, inverse visibility at read time via UNION repository queries, diff-based save logic, pessimistic write locking, and updated all method signatures and test coverage to reflect current implementation |
| 2026-03-01 | System | Added connection CRUD operations (createConnection, getConnections, updateConnection, deleteConnection) with own `@PreAuthorize` and activity logging. New dependencies: RelationshipDefinitionRepository, EntityTypeRelationshipService, AuthTokenService, ActivityService. Updated inverse queries from INNER JOIN to LEFT JOIN on target rules to support system-type definitions. |
