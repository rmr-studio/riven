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
# EntityTypeRelationshipService

Part of [[Relationships]]

---

## Purpose

Manages the full lifecycle of relationship definitions between entity types. Handles CRUD for type-level relationship configuration stored in the `relationship_definitions` and `relationship_target_rules` tables, including semantic metadata lifecycle hooks and two-pass impact confirmation for destructive operations.

---

## Responsibilities

**What this component owns:**
- Creating `RelationshipDefinitionEntity` records with their associated `RelationshipTargetRuleEntity` records
- Updating existing relationship definitions and diffing their target rules (add / remove / update in a single pass)
- Deleting relationship definitions using the two-pass impact pattern: returning a `DeleteDefinitionImpact` when confirmed data exists, then executing soft-delete of the definition and associated relationship links on confirmation
- Hard-deleting target rules on definition deletion (configuration data, not user data)
- Soft-deleting entity relationship links (`EntityRelationshipEntity`) when their definition is deleted
- Resolving which relationship definitions an entity type participates in, including both forward (type is source) and inverse-visible (type is target with `inverseVisible = true` on the target rule)
- Triggering `EntityTypeSemanticMetadataService` lifecycle hooks on create and delete
- Logging activity for all create, update, and delete mutations

**Explicitly NOT responsible for:**
- Managing actual entity relationship instance data (entity-to-entity links); that is owned by [[EntityRelationshipService]]
- Enforcing cardinality at link-creation time; that is owned by [[EntityRelationshipService]]
- Orchestrating the save flow for an entire entity type definition; that is coordinated by [[EntityTypeService]]
- Building or validating JSON schemas for attributes; handled by [[EntityTypeAttributeService]]

---

## Dependencies

### Internal Dependencies

| Component | Purpose | Coupling |
|---|---|---|
| [[RelationshipDefinitionRepository]] | CRUD for `relationship_definitions` | High |
| [[RelationshipTargetRuleRepository]] | CRUD for `relationship_target_rules` | High |
| EntityRelationshipRepository | Count and soft-delete link records on definition deletion | Medium |
| [[ActivityService]] | Logs relationship CRUD operations | Medium |
| [[AuthTokenService]] | Retrieves current user ID for activity logging | Low |
| [[EntityTypeSemanticMetadataService]] | Initialize and clean up semantic metadata for relationship definitions | Medium |

### External Dependencies

| Service/Library | Purpose | Failure Impact |
|---|---|---|
| Spring Transaction Manager | Ensures atomic multi-step mutations (save definition + rules + soft-delete links + semantic cleanup) | Data corruption if transactions fail |
| Spring Security (`@PreAuthorize`) | Workspace access control on every public method | Unauthorized access if annotation is absent |

### Injected Dependencies

```kotlin
@Service
class EntityTypeRelationshipService(
    private val definitionRepository: RelationshipDefinitionRepository,
    private val targetRuleRepository: RelationshipTargetRuleRepository,
    private val entityRelationshipRepository: EntityRelationshipRepository,
    private val activityService: ActivityService,
    private val authTokenService: AuthTokenService,
    private val semanticMetadataService: EntityTypeSemanticMetadataService,
    private val logger: KLogger,
)
```

---

## Consumed By

| Component | How It Uses This | Notes |
|---|---|---|
| [[EntityTypeService]] | Delegates create/update/delete of relationship definitions during `saveEntityTypeDefinition` and `deleteEntityType` | Primary orchestrator; calls this service within its own transaction |
| [[EntityService]] | Calls `getDefinitionsForEntityType` to validate and resolve definition IDs during entity payload saves | Read-only usage; does not trigger mutations |

---

## Public Interface

### Key Methods

---

#### `createRelationshipDefinition(workspaceId, sourceEntityTypeId, request): RelationshipDefinition`

```kotlin
@Transactional
@PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
fun createRelationshipDefinition(
    workspaceId: UUID,
    sourceEntityTypeId: UUID,
    request: SaveRelationshipDefinitionRequest,
): RelationshipDefinition
```

- **Purpose:** Creates a new relationship definition and its target rules, then initializes semantic metadata for the definition.
- **When to use:** When a new relationship is being added to an entity type schema. Called by `EntityTypeService.handleSaveRelationshipDefinition` when the definition ID does not yet exist in the database.
- **Side effects:**
  - Saves a `RelationshipDefinitionEntity` to `relationship_definitions`
  - Saves one or more `RelationshipTargetRuleEntity` records to `relationship_target_rules`
  - Calls `semanticMetadataService.initializeForTarget(...)` with `targetType = RELATIONSHIP`
  - Logs `Activity.ENTITY_RELATIONSHIP / CREATE` to the activity audit trail
- **Throws:** Nothing directly; `requireNotNull` on the saved definition ID will throw `IllegalStateException` if the repository returns null (should not occur in practice).
- **Returns:** Hydrated `RelationshipDefinition` model including the saved target rules.

---

#### `updateRelationshipDefinition(workspaceId, definitionId, request): RelationshipDefinition`

```kotlin
@Transactional
@PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
fun updateRelationshipDefinition(
    workspaceId: UUID,
    definitionId: UUID,
    request: SaveRelationshipDefinitionRequest,
): RelationshipDefinition
```

- **Purpose:** Updates the definition's mutable fields (`name`, `iconType`, `iconColour`, `allowPolymorphic`, `cardinalityDefault`) and diffs its target rules to reflect the current request state.
- **When to use:** When an existing relationship definition is being modified. Called by `EntityTypeService.handleSaveRelationshipDefinition` when the definition ID already exists.
- **Side effects:**
  - Saves the updated `RelationshipDefinitionEntity`
  - Performs target rule diff: deletes removed rules, saves updated and new rules
  - Logs `Activity.ENTITY_RELATIONSHIP / UPDATE` to the activity audit trail
- **Throws:** `NotFoundException` (via `ServiceUtil.findOrThrow`) if the definition does not exist in the workspace.
- **Returns:** Hydrated `RelationshipDefinition` model with the post-diff target rules.

---

#### `deleteRelationshipDefinition(workspaceId, definitionId, impactConfirmed): DeleteDefinitionImpact?`

```kotlin
@Transactional
@PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
fun deleteRelationshipDefinition(
    workspaceId: UUID,
    definitionId: UUID,
    impactConfirmed: Boolean,
): DeleteDefinitionImpact?
```

- **Purpose:** Deletes a relationship definition using the two-pass impact pattern. On the first pass (when existing links are found and `impactConfirmed = false`), returns a `DeleteDefinitionImpact` describing how many entity relationship links will be affected. On the second pass (`impactConfirmed = true`) or when no links exist, executes the full deletion.
- **When to use:** When removing a relationship from an entity type schema (via `EntityTypeService`). Also called directly during `EntityTypeService.deleteEntityType` with `impactConfirmed = true` to cascade-delete all definitions.
- **Side effects (when deletion executes):**
  - Soft-deletes all `EntityRelationshipEntity` records with the given `definitionId`
  - Soft-deletes the `RelationshipDefinitionEntity`
  - Hard-deletes all `RelationshipTargetRuleEntity` records for the definition
  - Calls `semanticMetadataService.deleteForTarget(...)` with `targetType = RELATIONSHIP`
  - Logs `Activity.ENTITY_RELATIONSHIP / DELETE` to the activity audit trail
- **Throws:**
  - `NotFoundException` (via `ServiceUtil.findOrThrow`) if the definition does not exist in the workspace
  - `IllegalStateException` if the definition is `protected = true`
- **Returns:** `DeleteDefinitionImpact` if the caller must confirm, `null` if deletion was executed.

---

#### `getDefinitionsForEntityType(workspaceId, entityTypeId): List<RelationshipDefinition>`

```kotlin
@PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
fun getDefinitionsForEntityType(
    workspaceId: UUID,
    entityTypeId: UUID,
): List<RelationshipDefinition>
```

- **Purpose:** Returns all relationship definitions an entity type participates in. This includes both forward definitions (the type is the `sourceEntityTypeId`) and inverse-visible definitions (the type appears as a `targetEntityTypeId` in a `RelationshipTargetRuleEntity` where `inverseVisible = true`).
- **When to use:** When rendering the full relationship view for an entity type in the schema editor, or when validating relationship payloads during entity saves (called by `EntityService`).
- **Side effects:** None. Read-only.
- **Throws:** Nothing. Returns an empty list if no definitions exist.
- **Returns:** Concatenation of forward models and inverse-visible models, each hydrated with their target rules. The returned list is not deduplicated — a definition can appear in both forward and inverse sets if the type is both the source and a target of the same definition.

---

#### `getDefinitionById(workspaceId, definitionId): RelationshipDefinition`

```kotlin
@PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
fun getDefinitionById(
    workspaceId: UUID,
    definitionId: UUID,
): RelationshipDefinition
```

- **Purpose:** Retrieves a single relationship definition by ID, hydrated with its target rules.
- **When to use:** When a specific definition must be fetched by ID for display or validation.
- **Side effects:** None. Read-only.
- **Throws:** `NotFoundException` (via `ServiceUtil.findOrThrow`) if the definition does not exist in the workspace.
- **Returns:** Hydrated `RelationshipDefinition` model.

---

## Key Logic

### Target Rule Diffing

The `diffTargetRules` private method reconciles the persisted target rules for a definition against the rules supplied in an update request. The algorithm is:

1. Load all existing `RelationshipTargetRuleEntity` records for the definition, indexed by ID.
2. Collect the set of IDs present in the request.
3. Any existing rules whose IDs are **not** in the request are deleted (hard-delete — configuration data).
4. For each requested rule:
   - If it carries an ID that matches an existing rule: update the existing entity (copy with new field values).
   - If it carries no ID or an unrecognized ID: create a new `RelationshipTargetRuleEntity`.
5. Save all updated/new rules with `saveAll`.

Rules without an ID in the request are always treated as new. This means the client must echo back the ID of an existing rule to preserve it on update.

---

### Two-Pass Impact Pattern

`deleteRelationshipDefinition` follows the established impact-confirmation pattern used elsewhere in the service layer for destructive operations:

**Pass 1 — impact check (`impactConfirmed = false`):**
```
count = entityRelationshipRepository.countByDefinitionId(definitionId)
if (count > 0) return DeleteDefinitionImpact(definitionId, name, count)
```

**Pass 2 — execution (`impactConfirmed = true` or `count == 0`):**
```
executeDeletion(entity, definitionId, workspaceId, userId)
return null
```

The caller (typically `EntityTypeService`) is responsible for surfacing the `DeleteDefinitionImpact` to the client and re-invoking with `impactConfirmed = true` after user acknowledgement.

---

### Inverse Visibility Resolution

`getDefinitionsForEntityType` resolves two sources of definitions:

**Forward definitions:** `definitionRepository.findByWorkspaceIdAndSourceEntityTypeId(workspaceId, entityTypeId)` — definitions where the entity type is the authoritative source.

**Inverse-visible definitions:** Target rules are first fetched with `targetRuleRepository.findInverseVisibleByTargetEntityTypeId(entityTypeId)` (rules with `inverseVisible = true` pointing to this type). The definition IDs from those rules are then used to load the parent `RelationshipDefinitionEntity` records via `findAllById`.

Both sets are hydrated with their full target rules and returned as a combined list. Inverse visibility is a per-rule flag (`inverseVisible: Boolean`) on `RelationshipTargetRuleEntity`, not a property of the definition itself.

---

### Semantic Metadata Lifecycle

Relationship definitions have associated semantic metadata managed by [[EntityTypeSemanticMetadataService]]:

| Event | Call | Effect |
|---|---|---|
| Definition created | `semanticMetadataService.initializeForTarget(sourceEntityTypeId, workspaceId, RELATIONSHIP, definitionId)` | Creates an empty semantic metadata record for the relationship |
| Definition deleted | `semanticMetadataService.deleteForTarget(sourceEntityTypeId, RELATIONSHIP, definitionId)` | Hard-deletes the semantic metadata record |

Both hooks execute within the same `@Transactional` boundary as the triggering mutation.

---

### Deletion Order Within `executeDeletion`

The deletion steps are sequenced to preserve data integrity:

1. Soft-delete entity relationship links (`entityRelationshipRepository.softDeleteByDefinitionId`)
2. Soft-delete the definition entity (`definitionRepository.save` with `deleted = true`)
3. Hard-delete target rules (`targetRuleRepository.deleteByRelationshipDefinitionId`)
4. Clean up semantic metadata (`semanticMetadataService.deleteForTarget`)
5. Log activity

Target rules are hard-deleted because they are schema configuration data, not user-generated data. Entity relationship links are soft-deleted to preserve auditability.

---

## Data Access

### Entities Owned

| Entity | Table | Operations | Notes |
|---|---|---|---|
| `RelationshipDefinitionEntity` | `relationship_definitions` | Create, Read, Update, Soft-delete | Extends `AuditableSoftDeletableEntity`; has `protected` flag |
| `RelationshipTargetRuleEntity` | `relationship_target_rules` | Create, Read, Update, Hard-delete | Extends `AuditableEntity` (not soft-deletable — config data) |

### Queries Used

| Repository | Method | Purpose | Notes |
|---|---|---|---|
| `RelationshipDefinitionRepository` | `findByWorkspaceIdAndSourceEntityTypeId` | Load all forward definitions for a type | Used in `getDefinitionsForEntityType` |
| `RelationshipDefinitionRepository` | `findByIdAndWorkspaceId` | Single definition lookup scoped to workspace | Used in update, delete, and `getDefinitionById` |
| `RelationshipDefinitionRepository` | `findAllById` | Batch load inverse definitions by ID list | Used in `getDefinitionsForEntityType` after rule lookup |
| `RelationshipTargetRuleRepository` | `findByRelationshipDefinitionId` | Load all rules for a single definition | Used in diff, hydration |
| `RelationshipTargetRuleRepository` | `findByRelationshipDefinitionIdIn` | Batch load rules for multiple definitions | Used in `getDefinitionsForEntityType` hydration |
| `RelationshipTargetRuleRepository` | `findInverseVisibleByTargetEntityTypeId` | Find rules with `inverseVisible = true` targeting a type | Used in inverse visibility resolution |
| `RelationshipTargetRuleRepository` | `deleteByRelationshipDefinitionId` | Hard-delete all rules for a definition | Used in `executeDeletion` |
| `EntityRelationshipRepository` | `countByDefinitionId` | Count active links for impact analysis | Used in impact check pass |
| `EntityRelationshipRepository` | `softDeleteByDefinitionId` | Bulk soft-delete all links for a definition | Native SQL `@Modifying` query |

---

## Error Handling

### Errors Thrown

| Exception | When | HTTP Mapping |
|---|---|---|
| `NotFoundException` | Definition not found by ID + workspace in `findOrThrow` | 404 Not Found |
| `IllegalStateException` | Attempt to delete a `protected = true` definition | 400 Bad Request (via `@ControllerAdvice`) |

### Errors Handled

| Exception | Source | Recovery Strategy |
|---|---|---|
| None | N/A | All errors propagate to `@ControllerAdvice` |

---

## Observability

### Log Events

| Event | Level | When | Key Fields |
|---|---|---|---|
| `Activity.ENTITY_RELATIONSHIP / CREATE` | INFO | Definition created | `relationshipId`, `relationshipName`, `sourceEntityTypeId` |
| `Activity.ENTITY_RELATIONSHIP / UPDATE` | INFO | Definition updated | `relationshipId`, `relationshipName`, `sourceEntityTypeId` |
| `Activity.ENTITY_RELATIONSHIP / DELETE` | INFO | Definition deleted (execution pass only) | `relationshipId`, `relationshipName`, `sourceEntityTypeId` |
| Structured log: "Created relationship definition..." | INFO | After successful create | definition name, ID, source entity type ID |
| Structured log: "Updated relationship definition..." | INFO | After successful update | definition name, ID |
| Structured log: "Deleted relationship definition..." | INFO | After successful deletion | definition name, ID |

Activity log `entityType` is always `ApplicationEntityType.ENTITY_TYPE` with `entityId` set to `sourceEntityTypeId`.

---

## Gotchas & Edge Cases

> [!warning] Impact check does NOT fire when called during entity type deletion
> `EntityTypeService.deleteEntityType` calls `deleteRelationshipDefinition` with `impactConfirmed = true` unconditionally for all definitions on the type. This bypasses the two-pass pattern. Any associated entity relationship links are soft-deleted silently as part of the cascade. This is intentional — the entity type deletion itself is guarded by its own impact-confirmation flow.

> [!warning] Target rules are hard-deleted — no soft-delete trail
> `RelationshipTargetRuleEntity` does not extend `SoftDeletable`. Rules removed during a diff or a definition deletion are permanently gone. If a rollback is needed, re-creation from the client request is the only recovery path.

> [!warning] Definition can appear in both forward and inverse lists
> If an entity type is both the `sourceEntityTypeId` of a definition AND a `targetEntityTypeId` with `inverseVisible = true` in the same definition's rules (self-referential relationship), `getDefinitionsForEntityType` will return the definition twice — once in `forwardModels` and once in `inverseModels`. Callers should be aware of this and deduplicate if required.

> [!warning] Rule ID must be echoed to preserve it on update
> During `updateRelationshipDefinition`, target rules with no `id` in the request are always created as new. A rule that was previously saved will be deleted if its ID is not included in the update request's `targetRules` list. Clients must read and echo back existing rule IDs to preserve them.

> [!warning] Polymorphic definitions may have zero target rules
> When `allowPolymorphic = true`, target rules are optional. `buildTargetRuleEntities` will produce an empty list and `saveAll` will be a no-op. The definition is valid with no rules.

### Known Limitations

| Limitation | Impact | Severity |
|---|---|---|
| No deduplication in `getDefinitionsForEntityType` | Self-referential definitions appear twice in the result | Low — uncommon pattern but possible |
| No validation that `targetEntityTypeId` in rules refers to a real entity type | Orphaned rule references if entity type is deleted without cascade | Medium |
| Soft-deleted definition link count includes links soft-deleted in prior runs | `countByDefinitionId` may overcount if the query includes soft-deleted rows | Low — needs query audit if this causes issues |

---

## Technical Debt

| Issue | Impact | Effort |
|---|---|---|
| No validation that `targetEntityTypeId` exists in the workspace before saving rules | Can create rules pointing to deleted or foreign entity types | Medium |
| `getDefinitionsForEntityType` issues two `findByRelationshipDefinitionIdIn` calls (one for forward, one for inverse) | Extra query when both sets share definitions; minor N+1 risk | Low |
| `diffTargetRules` uses unrecognized request IDs as "new" rather than throwing | Silent data corruption if a stale client sends an old ID not in the DB | Low |

---

## Testing

### Unit Test Coverage

- **Location:** `src/test/kotlin/riven/core/service/entity/type/EntityTypeRelationshipServiceTest.kt`
- **Framework:** JUnit 5, `mockito-kotlin` (`whenever` / `verify`)
- **Auth context:** `@WithUserPersona` with `WorkspaceRoles.OWNER`

| Scenario | Covered |
|---|---|
| Create with single target rule | Yes |
| Create with multiple target rules | Yes |
| Create polymorphic (empty rules) | Yes |
| Create with semantic type constraint | Yes |
| Update: change name | Yes |
| Update: add target rule | Yes |
| Update: remove target rule (diff deletes) | Yes |
| Update: change cardinality default | Yes |
| Delete: no instance data — executes immediately | Yes |
| Delete: instance data present, not confirmed — returns impact | Yes |
| Delete: protected definition — throws `IllegalStateException` | Yes |
| Delete: soft-deletes associated links when confirmed | Yes |
| Read: returns both forward and inverse-visible definitions | Yes |

### How to Test Manually

1. Create two entity types (e.g., Task and Person) via `POST /api/v1/workspaces/{id}/entity-types`.
2. Save a relationship definition on Task pointing to Person via `POST /api/v1/workspaces/{id}/entity-types/{id}` (include a `relationships` entry in the save request).
3. Verify the definition appears for Task via a read of the entity type schema.
4. Set `inverseVisible = true` on the target rule and re-save. Verify the definition appears in `getDefinitionsForEntityType` for Person (inverse-visible lookup).
5. Create entity instances of both types and link them via the relationship.
6. Attempt to delete the relationship definition without `impactConfirmed`. Verify a `DeleteDefinitionImpact` is returned with `impactedLinkCount > 0`.
7. Re-issue deletion with `impactConfirmed = true`. Verify definition is soft-deleted and links are soft-deleted.
8. Attempt to delete a `protected = true` definition and confirm a 400 is returned.

---

## Related

- [[Relationships]] — Parent subdomain
- [[EntityTypeService]] — Orchestrates entity type saves and delegates here for relationship mutations
- [[EntityRelationshipService]] — Manages entity-to-entity link instance data (downstream consumer of definitions)
- [[EntityTypeSemanticMetadataService]] — Initialized and cleaned up by this service on definition lifecycle events
- `RelationshipDefinitionEntity` — JPA entity for `relationship_definitions`
- `RelationshipTargetRuleEntity` — JPA entity for `relationship_target_rules`
- `DeleteDefinitionImpact` — Data class returned from the first pass of the delete flow

---

## Changelog

| Date | Change | Reason |
|---|---|---|
| 2026-02-08 | Initial documentation | Phase 2 Plan 2 — Entities domain Relationships subdomain component docs |
| 2026-02-19 | Added `EntityTypeSemanticMetadataService` dependency and lifecycle hooks for relationship metadata | Semantic Metadata Foundation |
| 2026-02-21 | Complete rewrite — removed ORIGIN/REFERENCE bidirectional sync architecture, replaced with `relationship_definitions` + `relationship_target_rules` table model; documented two-pass impact pattern, target rule diff algorithm, inverse visibility resolution, new dependencies, and full test coverage table | Entity relationships architecture migration |
