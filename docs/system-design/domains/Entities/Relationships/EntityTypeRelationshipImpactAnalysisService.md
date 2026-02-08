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
# EntityTypeRelationshipImpactAnalysisService

Part of [[Relationships]]

---

## Purpose

Analyzes the impact of relationship definition changes on the entity type ecosystem and existing entity data, providing warnings about potential data loss, affected entity types, and column modifications before destructive operations are committed.

---

## Responsibilities

**What this component owns:**
- Analyzing relationship diff for impact on entity types and data
- Detecting affected entity types from relationship changes
- Identifying potential data loss scenarios
- Detecting cardinality changes that could cause data truncation
- Determining if impacts are "notable" (require user confirmation)

**Explicitly NOT responsible for:**
- Executing relationship changes (delegated to EntityTypeRelationshipService)
- Modifying entity type definitions
- Cleaning up entity data
- Counting actual affected entity records (not yet implemented)

---

## Dependencies

### Internal Dependencies

| Component | Purpose | Coupling |
|---|---|---|
| EntityTypeRepository | Loads entity types affected by relationship changes | Medium |
| EntityRepository | Intended for counting affected entities (not yet implemented) | Low |

### External Dependencies

| Service/Library | Purpose | Failure Impact |
|---|---|---|
| None | N/A | N/A |

### Injected Dependencies

```kotlin
@Service
class EntityTypeRelationshipImpactAnalysisService(
    private val entityTypeRepository: EntityTypeRepository,
    private val entityRepository: EntityRepository
)
```

---

## Consumed By

| Component | How It Uses This | Notes |
|---|---|---|
| EntityTypeService | Calls analyze() before applying relationship updates to warn users | Provides "what breaks?" feedback |

---

## Public Interface

### Key Methods

#### `analyze(workspaceId: UUID, sourceEntityType: EntityTypeEntity, diff: EntityTypeRelationshipDiff): EntityTypeRelationshipImpactAnalysis`

- **Purpose:** Analyzes a relationship diff to determine impacts on entity types and data
- **When to use:** Before applying relationship changes, to warn users about consequences
- **Side effects:**
  - Loads affected entity types from database
  - Analyzes removals and modifications for data loss warnings
- **Throws:** None
- **Returns:** EntityTypeRelationshipImpactAnalysis with affected types, warnings, removed/modified columns

> [!warning] Stub Implementation
> The current implementation returns an empty result at line 27-32, bypassing all analysis logic below. The INTENDED algorithm (lines 35-70) is unreachable code. This service is not yet functional.

**INTENDED Algorithm (not currently executed):**
1. Load all entity types affected by diff (sources and targets)
2. Analyze each removed relationship for data loss
3. Analyze each modified relationship for:
   - Bidirectional target changes (column removals)
   - Inverse name changes (column renames)
   - Cardinality restrictions (data loss warnings)
4. Return aggregated impact analysis

#### `hasNotableImpacts(impact: EntityTypeRelationshipImpactAnalysis): Boolean`

- **Purpose:** Determines if analysis contains impacts requiring user confirmation
- **When to use:** After analyze() to decide whether to prompt user
- **Side effects:** None
- **Throws:** None
- **Returns:** True if any entity types affected, data loss warnings exist, or columns removed

---

## Key Logic

### Impact Data Model

The service returns `EntityTypeRelationshipImpactAnalysis` containing:

| Field | Type | Purpose |
|---|---|---|
| affectedEntityTypes | List\<String\> | Entity type keys that will be modified by the change |
| dataLossWarnings | List\<EntityTypeRelationshipDataLossWarning\> | Warnings about potential data loss with reason and estimated count |
| columnsRemoved | List\<EntityImpactSummary\> | Entity types where relationship columns will be removed |
| columnsModified | List\<EntityImpactSummary\> | Entity types where relationship columns will be renamed/changed |

### Data Loss Warning Reasons

| Reason | When | Severity |
|---|---|---|
| RELATIONSHIP_DELETED | Removing a relationship with existing entity data | High |
| CARDINALITY_RESTRICTION | Changing cardinality to more restrictive (e.g., MANY_TO_MANY → ONE_TO_ONE) | High |

### Restrictive Cardinality Changes

Cardinality changes that could cause data loss (lines 189-197):

| From | To | Impact |
|---|---|---|
| MANY_TO_MANY | ONE_TO_MANY, MANY_TO_ONE, ONE_TO_ONE | Multi-value data must be truncated to single value |
| ONE_TO_MANY | ONE_TO_ONE | Multiple related entities must be reduced to one |
| MANY_TO_ONE | ONE_TO_ONE | Multiple sources must be reduced to one |

### Modification Impact Analysis (Intended)

**BIDIRECTIONAL_TARGETS_CHANGED:**
- Removed targets → columns deleted from those entity types
- Added targets → columns added (handled by EntityTypeRelationshipService)

**INVERSE_NAME_CHANGED:**
- Target entity types get column renames
- Only affects REFERENCE relationships using default inverse name

**CARDINALITY_CHANGED:**
- Restrictive changes → data loss warning
- Entity type affected by cardinality constraint change

---

## Error Handling

### Errors Thrown

| Error/Exception | When | Expected Handling |
|---|---|---|
| None | Service is defensive | N/A |

### Errors Handled

| Error/Exception | Source | Recovery Strategy |
|---|---|---|
| None internally | N/A | All errors propagate to caller |

---

## Gotchas & Edge Cases

> [!warning] Service is Currently a Stub
> The entire analysis algorithm (lines 35-70) is unreachable due to early return at line 27-32. This service was scaffolded for future implementation once entity data modeling is complete. The comment "Todo. Will need to flesh this out later once entity data has been modelled and implemented. Not really top priority" indicates this is known technical debt.

> [!warning] Entity Data Counting Not Implemented
> Lines 154-156 show commented-out code for counting affected entities. The actual data loss estimation (estimatedImpactCount) is always null because entity data repository doesn't exist yet.

> [!warning] Commented-Out Logic
> Large blocks of analysis logic are commented out (lines 96-100, 138-163) indicating planned but unfinished implementation. This suggests the data model is defined but the analysis is deferred pending entity data implementation.

### Known Limitations

| Limitation | Impact | Severity |
|---|---|---|
| Returns empty result | No impact warnings shown to users before destructive operations | Critical |
| No entity data counting | Cannot estimate number of entities affected | High |
| Analysis logic unreachable | All defined analysis scenarios are non-functional | High |
| ORIGIN/REFERENCE removal stubs | Functions declared but empty (lines 171-178) | Medium |

### Thread Safety / Concurrency

Service is stateless and thread-safe.

---

## Technical Debt

| Issue | Impact | Effort | Ticket |
|---|---|---|
| Stub implementation with early return | No impact analysis for users | High | Line 25-32 comment |
| Entity data model not implemented | Cannot analyze actual data impact | Very High | Prerequisite for service functionality |
| Entity counting not implemented | No estimated impact counts | High | Lines 154-156 |
| ORIGIN/REFERENCE removal analysis stubs | Incomplete coverage of removal scenarios | Medium | Lines 171-178 |
| Commented-out logic blocks | Code written but disabled | Medium | Lines 96-100, 138-163 |

---

## Testing

### Unit Test Coverage

- **Location:** Not specified
- **Key scenarios to test (when implemented):**
  - Removal of relationship with entity data → data loss warning
  - Cardinality restriction → data loss warning with reason
  - Bidirectional targets changed → affected entity types list
  - Inverse name changed → column modification list
  - hasNotableImpacts() returns true when warnings exist
  - hasNotableImpacts() returns false for empty analysis

### How to Test Manually

**Current State:** Service returns empty result, so no manual testing possible.

**When Implemented:**
1. Create entity types with relationships and populate entity data
2. Attempt to delete a relationship → verify data loss warning appears
3. Change cardinality from MANY_TO_MANY to ONE_TO_ONE → verify restriction warning
4. Remove bidirectional target → verify affected entity type listed
5. Change inverse name → verify column modification listed

---

## Related

- [[EntityTypeRelationshipService]] - Executes relationship changes after impact analysis
- [[EntityTypeService]] - Coordinates analysis and relationship updates
- [[Relationships]] - Parent subdomain
- [[EntityTypeRelationshipImpactAnalysis]] - Return data model
- [[EntityTypeRelationshipDataLossWarning]] - Warning data model

---

## Changelog

| Date | Change | Reason |
|---|---|---|
| 2026-02-08 | Initial documentation | Phase 2 Plan 2 - Entities domain Relationships subdomain component docs |
