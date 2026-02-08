---
tags:
  - component/active
  - layer/service
  - architecture/component
Created: 2026-02-08
Updated: 2026-02-08
Domains:
  - "[[Entities]]"
---
# EntityTypeRelationshipService

Part of [[Relationships]]

---

## Purpose

Manages bidirectional relationship definitions between entity types, ensuring ORIGIN and REFERENCE relationships remain synchronized across entity types when creating, updating, or deleting relationships.

---

## Responsibilities

**What this component owns:**
- Creating and updating entity type relationship definitions
- Synchronizing bidirectional ORIGIN/REFERENCE relationship pairs
- Validating relationship integrity (naming collisions, inverse matching, cardinality)
- Cascading relationship updates when targets change
- Handling relationship removal with cascade deletion of inverse relationships
- Managing polymorphic and multi-entity-type relationships

**Explicitly NOT responsible for:**
- Analyzing impact of relationship changes on entity data (delegated to EntityTypeRelationshipImpactAnalysisService)
- Managing actual entity relationship data/records (deferred - see TODOs at lines 542-547, 598-603, 723-724, 1010-1022, 1075-1080)
- Enforcing required relationships (only enforced on RELATIONSHIP entity types)
- Orchestrating user confirmation flows (handled by EntityTypeService)

---

## Dependencies

### Internal Dependencies

| Component | Purpose | Coupling |
|---|---|---|
| EntityTypeRepository | Loads and persists entity type definitions | High |
| ActivityService | Logs relationship CRUD operations | Medium |
| AuthTokenService | Retrieves current user ID for activity logging | Low |

### External Dependencies

| Service/Library | Purpose | Failure Impact |
|---|---|---|
| Spring Transaction Manager | Ensures atomic relationship updates | Data corruption if transactions fail |

### Injected Dependencies

```kotlin
@Service
class EntityTypeRelationshipService(
    private val entityTypeRepository: EntityTypeRepository,
    private val activityService: ActivityService,
    private val authTokenService: AuthTokenService
)
```

---

## Consumed By

| Component | How It Uses This | Notes |
|---|---|---|
| EntityTypeService | Coordinates relationship updates with impact analysis | Main entry point for relationship changes |

---

## Public Interface

### Key Methods

#### `createRelationships(definitions: List<SaveRelationshipDefinitionRequest>, workspaceId: UUID): List<EntityTypeEntity>`

- **Purpose:** Creates new relationship definitions and automatically creates inverse REFERENCE relationships for bidirectional ORIGIN relationships
- **When to use:** When adding new relationships to entity types
- **Side effects:**
  - Loads entity types from database
  - Creates ORIGIN relationship on source entity type
  - Creates REFERENCE relationships on target entity types (if bidirectional)
  - Updates ORIGIN relationships when REFERENCE is added (bidirectional sync)
  - Saves all affected entity types
  - Validates entire relationship environment after save
- **Throws:** IllegalArgumentException if referenced entity types don't exist or validation fails

#### `updateRelationships(workspaceId: UUID, diff: EntityTypeRelationshipDiff): Map<String, EntityTypeEntity>`

- **Purpose:** Applies a diff of relationship changes (added, removed, modified) atomically
- **When to use:** When modifying multiple relationships in a single transaction
- **Side effects:**
  - Processes added, removed, and modified relationships
  - Cascades changes to inverse relationships
  - Saves all affected entity types
  - Validates CREATE/DELETE/UPDATE operations appropriately
- **Throws:** IllegalArgumentException or IllegalStateException if validation fails

#### `removeRelationships(workspaceId: UUID, relationships: List<EntityTypeRelationshipDeleteRequest>): Map<String, EntityTypeEntity>`

- **Purpose:** Removes relationship definitions with cascade deletion of inverse relationships
- **When to use:** When deleting relationships from entity types
- **Side effects:**
  - Validates removal won't orphan relationships
  - Removes ORIGIN relationship and all inverse REFERENCE relationships (if bidirectional)
  - Removes REFERENCE relationship and updates ORIGIN relationship (removes from bidirectionalEntityTypeKeys)
  - Logs activity for each removal
  - Saves all affected entity types
- **Throws:** IllegalStateException if protected relationships are removed or if inverse relationships aren't properly cleaned up

#### `modifyRelationships(workspaceId: UUID, diffs: List<EntityTypeRelationshipModification>, save: Boolean): List<EntityTypeEntity>`

- **Purpose:** Handles specific modification types (inverse name change, cardinality change, bidirectional enabled/disabled, targets changed)
- **When to use:** When updating existing relationship definitions
- **Side effects:**
  - Updates source relationship
  - Propagates changes to inverse REFERENCE relationships based on change type
  - Creates or removes inverse relationships when bidirectionality changes
- **Throws:** Validation errors if modification violates constraints

---

## Key Logic

### ORIGIN/REFERENCE Bidirectional Sync Algorithm

The service maintains bidirectional relationships using an ORIGIN/REFERENCE pattern:

**ORIGIN Relationship:**
- Lives on the "owning" entity type
- Defines: target entity types, cardinality, inverse name
- Contains `bidirectionalEntityTypeKeys` (subset of `entityTypeKeys`)

**REFERENCE Relationship:**
- Lives on target entity types
- Points back to ORIGIN via `originRelationshipId`
- Has inverted cardinality (ONE_TO_MANY becomes MANY_TO_ONE)
- Uses ORIGIN's `inverseName` or collision-resolved variant

```mermaid
flowchart TB
    subgraph "Create Bidirectional ORIGIN"
        A[Create ORIGIN on Task] -->|bidirectionalEntityTypeKeys = [Person]| B[Auto-create REFERENCE on Person]
        B -->|originRelationshipId points back| A
    end

    subgraph "Create Bidirectional REFERENCE"
        C[Create REFERENCE on Team] -->|originRelationshipId = Task.assignee| D[Update ORIGIN on Task]
        D -->|Add Team to bidirectionalEntityTypeKeys| C
    end

    subgraph "Delete ORIGIN"
        E[Delete ORIGIN from Task] -->|Cascade| F[Delete all REFERENCE relationships]
        F -->|From Person, Team| E
    end

    subgraph "Delete REFERENCE"
        G[Delete REFERENCE from Person] -->|Update| H[Remove Person from ORIGIN.bidirectionalEntityTypeKeys]
    end
```

### Validation Rules

| Field/Input | Rule | Error |
|---|---|---|
| Relationship names | Must be unique within entity type | "Multiple relationships with name '{name}'" |
| ORIGIN bidirectional | Must have `inverseName` and `bidirectionalEntityTypeKeys` | "Bidirectional relationship must have inverseName defined" |
| ORIGIN bidirectional (non-polymorphic) | `bidirectionalEntityTypeKeys` must be subset of `entityTypeKeys` | "Target '{key}' not in entityTypeKeys" |
| REFERENCE | Must have `originRelationshipId` and `entityTypeKeys` pointing to origin | "REFERENCE must have originRelationshipId defined" |
| REFERENCE validation | Source entity type must match ORIGIN's source | "Source mismatch between REFERENCE and ORIGIN" |
| DELETE ORIGIN | All inverse REFERENCE relationships must be removed first | "Inverse REFERENCE '{name}' still exists in '{key}'" |
| DELETE REFERENCE | ORIGIN must not include this entity type in bidirectionalEntityTypeKeys | "ORIGIN still includes '{key}' in bidirectionalEntityTypeKeys" |
| Protected relationships | Cannot be deleted | "Cannot remove protected relationship" |

### Modification Handling

The service handles five change types:

**INVERSE_NAME_CHANGED:**
- Updates REFERENCE relationships still using default inverse name
- Skips manually renamed REFERENCE relationships
- Applies collision resolution if new name conflicts

**CARDINALITY_CHANGED:**
- Updates ORIGIN cardinality
- Inverts and applies to all inverse REFERENCE relationships
- TODO: Handle entity data migration for restrictive changes (lines 1010-1022)

**BIDIRECTIONAL_ENABLED:**
- Creates inverse REFERENCE relationships for all `bidirectionalEntityTypeKeys`

**BIDIRECTIONAL_DISABLED:**
- Removes all inverse REFERENCE relationships
- TODO: Clean up entity payload data (lines 1075-1080)

**BIDIRECTIONAL_TARGETS_CHANGED:**
- Removes REFERENCE relationships for removed targets
- Creates REFERENCE relationships for added targets

---

## Data Access

### Entities Owned

| Entity | Operations | Notes |
|---|---|---|
| EntityTypeEntity | CRUD | Modifies `relationships` array and `columns` order |

### Queries

| Query | Purpose | Performance Notes |
|---|---|---|
| `findByworkspaceIdAndKeyIn(workspaceId, keys)` | Batch load all affected entity types | Efficient for multi-type updates |

---

## Error Handling

### Errors Thrown

| Error/Exception | When | Expected Handling |
|---|---|---|
| IllegalArgumentException | Referenced entity types don't exist, validation failure | User-facing error message |
| IllegalStateException | Protected relationship deletion, orphaned inverse relationships | User-facing error message indicating system constraint |

### Errors Handled

| Error/Exception | Source | Recovery Strategy |
|---|---|---|
| None internally | N/A | All errors propagate to caller |

---

## Observability

### Log Events

| Event | Level | When | Key Fields |
|---|---|---|
| Activity.ENTITY_RELATIONSHIP | INFO | Relationship removal | relationshipId, relationshipName, relationshipType, sourceEntityType, bidirectional, targetEntityTypes |

---

## Gotchas & Edge Cases

> [!warning] ORIGIN vs REFERENCE Terminology
> Despite the naming, ORIGIN is the "authoritative" relationship definition, while REFERENCE points back to it. The comments at EntityTypeRelationshipType.kt lines 4-5 have this backwards.

> [!warning] Collision Resolution for Inverse Names
> When creating REFERENCE relationships, the service resolves name collisions by appending numbers ("Inverse Name 2", "Inverse Name 3"). This means the actual REFERENCE name may differ from the ORIGIN's inverseName.

> [!warning] Polymorphic Relationship Validation
> When `allowPolymorphic=true`, `entityTypeKeys` can be null, but `bidirectionalEntityTypeKeys` must still be explicitly provided for bidirectional relationships.

> [!warning] Protected Relationships
> Protected relationships (system-managed) cannot be deleted. This is enforced at lines 566-571 and 644-649.

### Known Limitations

| Limitation | Impact | Severity |
|---|---|---|
| No entity data cleanup | Removing relationships doesn't delete actual relationship data from entity records | High |
| No cardinality data migration | Restrictive cardinality changes don't migrate existing multi-value data | High |
| No bidirectional data cleanup | Disabling bidirectional doesn't remove inverse relationship data from entities | Medium |
| Required relationships not enforced broadly | Only enforced on RELATIONSHIP entity types, not regular entity types | Medium |

### Thread Safety / Concurrency

Service is stateless and thread-safe. Uses `@Transactional` for atomicity. Concurrent modifications to same entity type relationships could cause last-write-wins behavior - consider optimistic locking if this becomes an issue.

---

## Technical Debt

| Issue | Impact | Effort | Ticket |
|---|---|---|
| Entity data cleanup not implemented | Orphaned relationship data after removal | High | Lines 542-547, 598-603, 723-724 |
| Cardinality data migration TODO | Data loss on restrictive cardinality changes | High | Lines 1010-1022 |
| Bidirectional disable cleanup TODO | Orphaned inverse data when bidirectional disabled | Medium | Lines 1075-1080 |
| Impact analysis deferred | No data loss warnings before destructive operations | Medium | See EntityTypeRelationshipImpactAnalysisService |

---

## Testing

### Unit Test Coverage

- **Location:** Not specified
- **Key scenarios to cover:**
  - Create ORIGIN with bidirectional → verify REFERENCE created
  - Create REFERENCE → verify ORIGIN updated with bidirectionalEntityTypeKeys
  - Delete ORIGIN → verify all REFERENCE relationships deleted
  - Delete REFERENCE → verify ORIGIN bidirectionalEntityTypeKeys updated
  - Modify inverse name → verify REFERENCE names updated (default only)
  - Modify cardinality → verify REFERENCE cardinality inverted
  - Enable/disable bidirectional → verify REFERENCE creation/deletion
  - Validation failures for orphaned relationships

### How to Test Manually

1. Create entity types (e.g., Task, Person, Team)
2. Create bidirectional ORIGIN relationship on Task pointing to Person
3. Verify REFERENCE relationship auto-created on Person
4. Create bidirectional REFERENCE on Team pointing back to Task.assignee
5. Verify Task.assignee now has Team in bidirectionalEntityTypeKeys
6. Delete Task.assignee → verify cascade deletion of Person/Team REFERENCE relationships
7. Test validation errors by attempting to delete ORIGIN without removing REFERENCE first

---

## Related

- [[EntityTypeRelationshipImpactAnalysisService]] - Analyzes impact of relationship changes
- [[EntityTypeService]] - Coordinates relationship updates with impact analysis
- [[Relationships]] - Parent subdomain
- [[EntityRelationshipDefinition]] - Core data model
- [[EntityTypeReferenceRelationshipBuilder]] - Builds inverse REFERENCE relationships

---

## Changelog

| Date | Change | Reason |
|---|---|---|
| 2026-02-08 | Initial documentation | Phase 2 Plan 2 - Entities domain Relationships subdomain component docs |
