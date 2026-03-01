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

Manages instance-level relationship links between entities. Responsible for diffing and persisting desired link state against current database state, enforcing cardinality constraints at write time, validating target entity types against definition rules, and resolving bidirectional visibility at read time without storing inverse rows.

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

**NOT responsible for:**

- Loading `RelationshipDefinition` from the database — the definition is passed in by the caller
- Storing inverse rows — bidirectional visibility is handled purely at query time
- Workspace access control — there is no `@PreAuthorize` on this service; access is enforced by [[EntityService]] before delegating
- Activity logging — mutations are logged by [[EntityService]]
- Impact tracking for cache invalidation — [[EntityService]] derives impacted entity IDs from `findByTargetIdIn` after calling this service

---

## Dependencies

### Internal

| Dependency | Purpose |
|---|---|
| `EntityRelationshipRepository` | All persistence operations: SELECT FOR UPDATE, insert, delete, projection queries |
| `EntityRepository` | `findAllById` to load and type-resolve new target entities before validation |
| `EntityTypeRepository` | `findSemanticGroupsByIds` — batch-resolve semantic group for target entity types during relationship validation |

### External

None. The service has no external integrations.

### Injected

```kotlin
class EntityRelationshipService(
    private val entityRelationshipRepository: EntityRelationshipRepository,
    private val entityRepository: EntityRepository,
    private val entityTypeRepository: EntityTypeRepository,
    private val logger: KLogger,
)
```

---

## Consumed By

| Consumer | Methods Used | Reason |
|---|---|---|
| [[EntityService]] | `saveRelationships`, `findRelatedEntities` (both overloads), `findByTargetIdIn`, `archiveEntities` | Entity save, read hydration, delete cascade |

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

For each NEW target only, resolves the effective cardinality and checks `maxTargetSources()`. If limited, the service first filters to only those targets needing enforcement, then batch-fetches all existing links via `findByTargetIdInAndDefinitionId` in a single query. Each target is validated against its existing links to detect an existing link from a different source.

| Cardinality | `maxTargetSources()` |
|---|---|
| `ONE_TO_ONE` | 1 |
| `ONE_TO_MANY` | 1 |
| `MANY_TO_ONE` | unlimited (`null`) |
| `MANY_TO_MANY` | unlimited (`null`) |

The effective cardinality for a given target type is resolved by `resolveCardinality`: the matching target rule's `cardinalityOverride` takes precedence over `definition.cardinalityDefault`. Per-type overrides only restrict their own type group — other types use the definition default independently.

---

### Target type validation

Before cardinality is enforced, `validateTargets` checks that each NEW target's entity type is permitted by the definition. For polymorphic definitions (`allowPolymorphic = true`), this check is skipped entirely. For non-polymorphic definitions, every new target must match a `RelationshipTargetRule` by:

1. **Exact type ID match** (takes precedence) — the rule's `targetEntityTypeId` matches the target's entity type ID.
2. **Semantic group constraint** — if no type ID rule matches, the target's `SemanticGroup` is compared against rules that have a `semanticTypeConstraint` but no `targetEntityTypeId`. Types with `UNCATEGORIZED` semantic group never match semantic rules — they must use explicit type ID rules.

Semantic groups are resolved in batch via `EntityTypeRepository.findSemanticGroupsByIds()` before validation begins, to avoid N+1 queries when validating multiple targets.

---

### Semantic group resolution

At the start of `saveRelationships`, after computing the final target set, the service resolves the `SemanticGroup` for each distinct entity type ID involved via `resolveSemanticGroups()`. This performs a single projection query (`EntityTypeRepository.findSemanticGroupsByIds`) that returns `(id, semanticGroup)` pairs without loading full entity rows. Any type ID not found in the result defaults to `UNCATEGORIZED`.

The resolved `semanticGroupByTypeId` map is threaded through `validateTargets`, `enforceCardinality`, `enforceSourceSideCardinality`, `enforceTargetSideCardinality`, `resolveCardinality`, and `findMatchingRule` — avoiding repeated lookups.

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
| `findInverseEntityLinksByTargetId` | Native SQL | Joins `relationship_target_rules` and filters `inverse_visible = true` and type match. Returns `EntityLinkProjection` with `target_entity_id` aliased as `sourceEntityId`. |
| `findInverseEntityLinksByTargetIdIn` | Native SQL | Batch variant. Joins `entities target_e` for type resolution per target. |
| `findByTargetIdIn` | JPQL | Returns all rows where `targetId` is in the provided list. Used for cascade-delete lookups. |
| `findByTargetIdInAndDefinitionId` | Spring Data derived | Batch variant: returns existing rows linking any of the given targets under a definition. Used for target-side cardinality enforcement. |
| `findSemanticGroupsByIds` | JPQL projection | Returns `(id, semanticGroup)` pairs for a set of entity type IDs. Used by `resolveSemanticGroups` to batch-resolve semantic groups before validation. Defined on `EntityTypeRepository`. |
| `deleteEntities` | Native SQL (RETURNING) | Soft-deletes all rows where source or target is in the ID array. Returns affected rows. |
| `countByDefinitionId` | Spring Data derived | Count of all active links under a definition. Used by [[EntityTypeRelationshipService]] for impact analysis before definition deletion. |

---

## Error Handling

| Exception | Thrown When | HTTP Mapping |
|---|---|---|
| `IllegalArgumentException` | One or more `targetIds` resolve to non-existent entities; or a non-polymorphic definition rejects a target's type ID. | `400 Bad Request` via `@ControllerAdvice` |
| `InvalidRelationshipException` | Source-side cardinality exceeded (too many targets of a type); or target-side cardinality exceeded (target already linked by another source). | `400 Bad Request` via `@ControllerAdvice` |

All exceptions propagate to `ExceptionHandler` in `riven.core.exceptions`. This service does not catch and re-wrap.

---

## Observability

### Log Events

This service does not emit structured log events. The `KLogger` is injected for future use. Mutations are logged via `activityService` in the calling [[EntityService]].

---

## Gotchas & Edge Cases

> [!warning] Retained targets count against per-type cardinality
> Source-side cardinality is evaluated against ALL final targets (retained + new combined), not only the newly added ones. A request to add one target of a type already at its per-type limit will correctly fail, even though the net "addition" count for that type appears to be one. This prevents incremental circumvention of limits across multiple partial updates.

> [!warning] Cardinality is per-type, not total
> `ONE_TO_ONE` does not mean a source can have at most one target in total. It means a source can have at most one target of each distinct entity type. A source can simultaneously hold one TypeA target and one TypeB target under the same `ONE_TO_ONE` definition without violation.

> [!warning] Target-side enforcement only checks new targets
> `enforceTargetSideCardinality` queries `findByTargetIdInAndDefinitionId` only for targets in `toAdd`. Retained targets are not re-checked. This is correct: a retained target that was previously linked by this source already passed target-side enforcement when it was first added.

> [!warning] UNCATEGORIZED types do not match semantic rules
> Entity types with `SemanticGroup.UNCATEGORIZED` will never match a semantic constraint rule. They can only be targeted by explicit `targetEntityTypeId` rules. This is by design — it prevents unclassified types from accidentally satisfying semantic constraints.

> [!warning] No workspace access control on this service
> `EntityRelationshipService` has no `@PreAuthorize` annotations. It is an internal service called exclusively from [[EntityService]], which enforces workspace access before delegating. Do not expose methods from this service directly to controllers.

> [!warning] Inverse query aliasing
> In the inverse-link native SQL queries, `r.target_entity_id` is aliased as `sourceEntityId`. This means the `EntityLink.sourceEntityId` field for an inverse link reflects the entity being viewed (i.e. the target of the stored row), not the entity that created the stored row. Consumers group by `sourceEntityId` without needing to know which direction the link was originally stored.

### Known Limitations

| Limitation | Impact | Tracking |
|---|---|---|
| No total-target limit | Cardinality limits are per-type, not a global cap on total targets for a definition | By design, but undocumented in API responses |

---

## Technical Debt

| Item | Location | Notes |
|---|---|---|
| None | - | Previous items (semantic matching stub, N+1 target-side queries) resolved by semantic group implementation |

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
| Semantic rule matches target with matching group | `saveRelationships - semantic rule matches target with matching group` |
| Semantic rule rejects target with non-matching group | `saveRelationships - semantic rule rejects target with non-matching group` |
| UNCATEGORIZED target does not match semantic rules | `saveRelationships - UNCATEGORIZED target does not match semantic rules` |
| Exact type ID rule takes precedence over semantic match | `saveRelationships - exact type ID rule takes precedence over semantic match` |

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
| 2026-03-01 | System | Semantic group matching implemented — `SemanticGroup` enum replaces stubbed semantic constraint matching. New `EntityTypeRepository` dependency for batch semantic group resolution. Target-side cardinality enforcement batch-optimized via `findByTargetIdInAndDefinitionId`. 4 new tests for semantic matching. |
