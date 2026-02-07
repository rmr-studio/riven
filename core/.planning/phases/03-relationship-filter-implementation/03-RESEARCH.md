# Phase 3: Relationship Filter Implementation - Research

**Researched:** 2026-02-07
**Domain:** PostgreSQL EXISTS subqueries, relationship traversal SQL generation, filter tree validation
**Confidence:** HIGH

## Summary

This phase implements relationship-based entity filtering by generating parameterized EXISTS/NOT EXISTS subqueries against the `entity_relationships` table. The phase builds on Phase 2's established patterns (SqlFragment, ParameterNameGenerator, AttributeFilterVisitor) and extends them for relationship conditions: EXISTS, NOT_EXISTS, TargetEquals, TargetMatches, and TargetTypeMatches.

The implementation has three distinct concerns: (1) eager validation of the filter tree before any SQL is generated (depth limits, relationship ID validation, type branch validation), (2) SQL generation for each RelationshipCondition variant using EXISTS subqueries correlated to the outer entity, and (3) extending the existing visitor pattern to dispatch relationship filters alongside attribute filters.

The `entity_relationships` table already has the exact schema needed: `source_entity_id` (the entity being filtered), `relationship_field_id` (maps to `QueryFilter.Relationship.relationshipId`), `target_entity_id` (the related entity), `target_entity_type_id` (for type-aware filtering), plus `deleted` flag and `workspace_id`. Existing indexes on `(workspace_id, source_entity_id)` support the correlated subquery pattern.

**Primary recommendation:** Implement a `RelationshipSqlGenerator` class that produces SqlFragment for each RelationshipCondition variant, a `QueryFilterValidator` class that walks the filter tree eagerly to collect all validation errors, and extend the existing `AttributeFilterVisitor` (or create a composed `QueryFilterVisitor`) to dispatch relationship filters to the generator.

## Standard Stack

No new dependencies required. All patterns use existing codebase infrastructure from Phase 2.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| NamedParameterJdbcTemplate | Spring Boot 3.5.3 | Named parameter binding in generated SQL | Already established in Phase 2 patterns |
| Jackson ObjectMapper | 2.17.x | JSON serialization for nested filter fragments | Already used by AttributeSqlGenerator |
| Kotlin stdlib | 2.1.21 | Sealed interfaces, data classes, extension functions | Codebase standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Spring Data JPA | 3.5.3 | EntityTypeRepository for validation lookups | Validate relationshipId against entity type definitions |

**Installation:** No new dependencies needed.

## Architecture Patterns

### Recommended Project Structure
```
src/main/kotlin/riven/core/service/entity/query/
    SqlFragment.kt                    # Existing (Phase 2)
    ParameterNameGenerator.kt         # Existing (Phase 2)
    AttributeSqlGenerator.kt          # Existing (Phase 2)
    AttributeFilterVisitor.kt         # Modified: replace relationship placeholder
    RelationshipSqlGenerator.kt       # NEW: EXISTS subquery generation
    QueryFilterValidator.kt           # NEW: Eager validation pass
src/main/kotlin/riven/core/exceptions/query/
    QueryFilterException.kt           # Extended: relationship-specific exceptions
```

### Pattern 1: EXISTS Subquery for Relationship Filtering
**What:** Use `EXISTS (SELECT 1 FROM entity_relationships ...)` correlated to the outer entity for relationship conditions. Use `NOT EXISTS` for negation.
**When to use:** All relationship conditions (EXISTS, NOT_EXISTS, TargetEquals, TargetMatches, TargetTypeMatches).
**Why:** EXISTS short-circuits on first match (semi-join optimization), avoids row duplication that JOINs cause, composes cleanly with AND/OR, and works with the existing `idx_entity_relationships_source` composite index.

**Example (EXISTS):**
```kotlin
// RelationshipCondition.Exists
// Input: QueryFilter.Relationship(relationshipId = relId, condition = Exists)
SqlFragment(
    sql = """EXISTS (
    SELECT 1 FROM entity_relationships r_0
    WHERE r_0.source_entity_id = e.id
      AND r_0.relationship_field_id = :rel_0
      AND r_0.deleted = false
)""",
    parameters = mapOf("rel_0" to relId)
)
```

**Example (NOT_EXISTS):**
```kotlin
// RelationshipCondition.NotExists
SqlFragment(
    sql = """NOT EXISTS (
    SELECT 1 FROM entity_relationships r_0
    WHERE r_0.source_entity_id = e.id
      AND r_0.relationship_field_id = :rel_0
      AND r_0.deleted = false
)""",
    parameters = mapOf("rel_0" to relId)
)
```

### Pattern 2: TargetEquals via IN Predicate in EXISTS
**What:** Filter relationships where `target_entity_id` is in a specified set of entity IDs.
**When to use:** RelationshipCondition.TargetEquals with a list of entity ID strings.

**Example:**
```kotlin
// TargetEquals(entityIds = ["uuid-1", "uuid-2"])
SqlFragment(
    sql = """EXISTS (
    SELECT 1 FROM entity_relationships r_0
    WHERE r_0.source_entity_id = e.id
      AND r_0.relationship_field_id = :rel_0
      AND r_0.target_entity_id IN (:te_1)
      AND r_0.deleted = false
)""",
    parameters = mapOf(
        "rel_0" to relId,
        "te_1" to listOf(UUID("uuid-1"), UUID("uuid-2"))
    )
)
```

### Pattern 3: TargetMatches via Nested Subquery with JOIN
**What:** For TargetMatches, the EXISTS subquery JOINs to the target `entities` table and applies the nested filter on the target entity's payload. The nested filter is processed recursively by the same visitor.
**When to use:** RelationshipCondition.TargetMatches with a nested QueryFilter.
**Why:** This is where relationship depth tracking matters. Each TargetMatches nesting increments the depth counter toward maxDepth.

**Example:**
```kotlin
// TargetMatches(filter = Attribute(statusId, EQUALS, Literal("Active")))
SqlFragment(
    sql = """EXISTS (
    SELECT 1 FROM entity_relationships r_0
    JOIN entities t_0 ON r_0.target_entity_id = t_0.id AND t_0.deleted = false
    WHERE r_0.source_entity_id = e.id
      AND r_0.relationship_field_id = :rel_0
      AND r_0.deleted = false
      AND t_0.payload @> :eq_1::jsonb
)""",
    parameters = mapOf(
        "rel_0" to relId,
        "eq_1" to """{"status-uuid": {"value": "Active"}}"""
    )
)
```

**Critical:** Inside the nested filter SQL, the table alias for the target entity (`t_0`) must replace the outer entity alias (`e`). The AttributeSqlGenerator currently generates SQL referencing `e.payload`. For nested TargetMatches, the generator needs to reference the target entity's payload instead. This requires either:
- (A) Parameterizing the entity alias in AttributeSqlGenerator (e.g., passing `tableAlias = "t_0"`)
- (B) Using SqlFragment.wrap() or string replacement to substitute aliases after generation

**Recommendation:** Option (A) - add an optional `entityAlias: String = "e"` parameter to AttributeSqlGenerator.generate(). This is clean, explicit, and doesn't require post-hoc string manipulation.

### Pattern 4: TargetTypeMatches with OR-Branched Type Predicates
**What:** For polymorphic relationships, generate one EXISTS subquery with OR branches for each TypeBranch. Each branch checks `target_entity_type_id = :typeId` and optionally applies that branch's filter.
**When to use:** RelationshipCondition.TargetTypeMatches.

**Example:**
```kotlin
// TargetTypeMatches(branches = [
//   TypeBranch(entityTypeId = clientTypeId, filter = Attribute(tierId, EQUALS, "Premium")),
//   TypeBranch(entityTypeId = partnerTypeId, filter = null)  // type match only
// ])
SqlFragment(
    sql = """EXISTS (
    SELECT 1 FROM entity_relationships r_0
    JOIN entities t_0 ON r_0.target_entity_id = t_0.id AND t_0.deleted = false
    WHERE r_0.source_entity_id = e.id
      AND r_0.relationship_field_id = :rel_0
      AND r_0.deleted = false
      AND (
          (t_0.type_id = :ttm_type_1 AND t_0.payload @> :eq_2::jsonb)
          OR
          (t_0.type_id = :ttm_type_3)
      )
)""",
    parameters = mapOf(
        "rel_0" to relId,
        "ttm_type_1" to clientTypeId,
        "eq_2" to """{"tier-uuid": {"value": "Premium"}}""",
        "ttm_type_3" to partnerTypeId
    )
)
```

**Key:** Uses `type_id` (UUID) not `type_key` (String) per CONTEXT.md decision. Branches without a filter just check type match. OR semantics across branches per REL-07.

### Pattern 5: Eager Validation Pass Before SQL Generation
**What:** Walk the entire filter tree before generating any SQL to collect all validation errors.
**When to use:** Always, before any SQL generation in the query pipeline.

**Validation checks:**
1. Relationship depth: global counter incremented at each `QueryFilter.Relationship` node. Throw if exceeds maxDepth.
2. Relationship ID validity: each `relationshipId` must exist in the entity type's relationship definitions.
3. TargetTypeMatches branch validity: each branch's `entityTypeId` must be a valid target for the referenced relationship.
4. Empty branches: caught by model-level init block, but validator provides richer error context.

**Error collection pattern:**
```kotlin
class QueryFilterValidator {
    fun validate(
        filter: QueryFilter,
        entityType: EntityType,
        maxDepth: Int
    ): List<QueryFilterValidationError>
}
```

Returns a list of all errors found. Caller throws a single exception containing the full list.

### Pattern 6: Subquery Alias Generation
**What:** Use parameterized aliases for relationship subquery tables to avoid conflicts in nested queries.
**When to use:** Every relationship subquery.

**Strategy:** Use the same ParameterNameGenerator counter for alias suffixes:
- Relationship table alias: `r_{counter}` (e.g., `r_0`, `r_3`, `r_7`)
- Target entity alias: `t_{counter}` (e.g., `t_0`, `t_3`, `t_7`)

This ensures uniqueness across nested TargetMatches. Each level of nesting gets its own aliases from the shared counter.

### Anti-Patterns to Avoid
- **JOINing entity_relationships in the main query:** Causes row duplication for entities with multiple relationships. Use EXISTS subqueries exclusively.
- **Workspace_id filtering in subqueries:** Per CONTEXT.md, workspace isolation is on the root query only. The entity_relationships table's existing workspace_id column is not needed in subquery WHERE clauses since the root entity is already workspace-scoped, and FK constraints ensure relationship integrity.
- **String-replacing table aliases in generated SQL:** Fragile and error-prone. Pass aliases as parameters to generators instead.
- **Separate validation and generation passes with different tree walks:** Use a single tree walk pattern (visitor) that can be reused for both validation and generation to keep logic consistent.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Unique subquery aliases | Manual counter per generator | Reuse ParameterNameGenerator.next() for aliases | Already exists, proven unique across query tree |
| Relationship definition lookup | Direct repository calls per filter node | Pass pre-loaded Map<UUID, EntityRelationshipDefinition> | Avoids N+1 DB calls during validation/generation |
| OR composition for TypeBranch list | Manual string concatenation | SqlFragment.or() reduce pattern from Phase 2 | Already implemented, handles parenthesization |
| Depth tracking | Manual counter passed through stack | Explicit depth parameter in visitor (same as Phase 2) | Consistent with AttributeFilterVisitor pattern |

**Key insight:** The relationship filter implementation reuses almost all patterns from Phase 2 (SqlFragment composition, ParameterNameGenerator, visitor pattern, when-expression dispatch). The new complexity is entirely in SQL shape (EXISTS subqueries with JOINs) and validation (relationship ID + type branch checks).

## Common Pitfalls

### Pitfall 1: Table Alias Collision in Nested TargetMatches
**What goes wrong:** A TargetMatches inside another TargetMatches generates the same alias (e.g., both use `r` and `target`), causing SQL ambiguity errors.
**Why it happens:** Each nesting level generates its own EXISTS subquery with correlated tables, and naive aliasing reuses the same names.
**How to avoid:** Generate unique aliases using ParameterNameGenerator (e.g., `r_0`/`t_0` at depth 0, `r_5`/`t_5` at depth 1). The counter ensures uniqueness.
**Warning signs:** PostgreSQL error "table name X specified more than once" or ambiguous column references.

### Pitfall 2: Entity Alias Mismatch in Nested Filters
**What goes wrong:** A nested filter inside TargetMatches generates SQL referencing `e.payload` (the outer entity alias) instead of `t_0.payload` (the target entity in the subquery).
**Why it happens:** AttributeSqlGenerator hardcodes `e.payload` references. When the same generator is reused for nested filters, it references the wrong table.
**How to avoid:** Parameterize the entity alias in AttributeSqlGenerator (add `entityAlias: String = "e"` parameter). Pass the target alias when generating nested filter SQL.
**Warning signs:** Queries returning incorrect results or SQL errors about missing column references.

### Pitfall 3: Missing deleted = false Check on Target Entities
**What goes wrong:** Relationship subqueries match soft-deleted target entities, returning incorrect results.
**Why it happens:** The `entity_relationships` table has its own `deleted` flag, but the target `entities` table also has one. Both must be checked.
**How to avoid:** When JOINing to entities for TargetMatches/TargetTypeMatches, always include `AND t.deleted = false` in the JOIN condition. For simple EXISTS/TargetEquals that only touch entity_relationships, `r.deleted = false` suffices.
**Warning signs:** Queries returning relationships to deleted entities.

### Pitfall 4: Forgetting to Validate TargetTypeMatches Branch Types Against Relationship
**What goes wrong:** A query specifies a TargetTypeMatches branch for an entity type that isn't actually a valid target for the relationship, generating SQL that can never match (silent failure).
**Why it happens:** The validator doesn't cross-reference branch entityTypeIds against the relationship definition's `entityTypeKeys`.
**How to avoid:** During eager validation, load the relationship definition and verify each branch's `entityTypeId` is in the relationship's `entityTypeKeys` or `allowPolymorphic` is true. Reject with descriptive error.
**Warning signs:** Queries that should return results but return empty sets.

### Pitfall 5: Depth Counter Applied to AND/OR Instead of Relationship Traversal
**What goes wrong:** The maxDepth counter is incremented for AND/OR nesting (like Phase 2's maxNestingDepth) instead of for relationship traversals only, causing premature depth limit errors.
**Why it happens:** Confusion between two different depth concerns: (1) AND/OR nesting depth (Phase 2's maxNestingDepth = 10), and (2) relationship traversal depth (EntityQuery.maxDepth = 3). These are separate counters for separate concerns.
**How to avoid:** The relationship depth counter only increments when processing a `QueryFilter.Relationship` node. AND/OR nesting depth is tracked separately (already handled by Phase 2). Both limits must be enforced independently.
**Warning signs:** Depth limit errors on simple queries with 2-3 levels of AND/OR but no relationship nesting.

### Pitfall 6: N+1 Database Lookups During Validation
**What goes wrong:** Each relationship filter node triggers a separate database query to load the relationship definition and entity type, causing N+1 performance issues.
**Why it happens:** Validator fetches relationship definitions lazily as it encounters each node.
**How to avoid:** Pre-load the entity type (with its relationships) once before validation. Pass a `Map<UUID, EntityRelationshipDefinition>` built from `entityType.relationships` to the validator. No additional DB calls needed during the tree walk.
**Warning signs:** Validation taking unexpectedly long on complex filter trees, high DB query counts.

## Code Examples

### EXISTS Subquery Base Pattern
```kotlin
// Source: entity_relationships schema + CONTEXT.md decisions
// The base EXISTS subquery structure used by all relationship conditions
fun generateExistsBase(
    relationshipId: UUID,
    paramGen: ParameterNameGenerator,
    innerCondition: SqlFragment? = null,
    negate: Boolean = false
): SqlFragment {
    val relParam = paramGen.next("rel")
    val aliasId = paramGen.next("a")
    val relAlias = "r_$aliasId"

    val prefix = if (negate) "NOT EXISTS" else "EXISTS"

    val innerSql = buildString {
        append("$prefix (\n")
        append("    SELECT 1 FROM entity_relationships $relAlias\n")
        append("    WHERE $relAlias.source_entity_id = e.id\n")
        append("      AND $relAlias.relationship_field_id = :$relParam\n")
        append("      AND $relAlias.deleted = false")
        if (innerCondition != null) {
            append("\n      AND ${innerCondition.sql}")
        }
        append("\n)")
    }

    val params = mutableMapOf<String, Any?>(relParam to relationshipId)
    if (innerCondition != null) {
        params.putAll(innerCondition.parameters)
    }

    return SqlFragment(innerSql, params)
}
```

### TargetMatches with Nested Filter
```kotlin
// Source: ARCHITECTURE.md pattern + CONTEXT.md depth tracking
fun generateTargetMatches(
    relationshipId: UUID,
    nestedFilter: QueryFilter,
    paramGen: ParameterNameGenerator,
    currentDepth: Int,
    maxDepth: Int,
    entityAlias: String  // outer entity alias for correlation
): SqlFragment {
    val relParam = paramGen.next("rel")
    val aliasId = paramGen.next("a")
    val relAlias = "r_$aliasId"
    val targetAlias = "t_$aliasId"

    // Recursively generate the nested filter SQL with the target alias
    val nestedFragment = visitFilter(nestedFilter, paramGen, currentDepth + 1, maxDepth, targetAlias)

    val sql = buildString {
        append("EXISTS (\n")
        append("    SELECT 1 FROM entity_relationships $relAlias\n")
        append("    JOIN entities $targetAlias ON $relAlias.target_entity_id = $targetAlias.id")
        append(" AND $targetAlias.deleted = false\n")
        append("    WHERE $relAlias.source_entity_id = $entityAlias.id\n")
        append("      AND $relAlias.relationship_field_id = :$relParam\n")
        append("      AND $relAlias.deleted = false\n")
        append("      AND ${nestedFragment.sql}\n")
        append(")")
    }

    return SqlFragment(
        sql = sql,
        parameters = mapOf(relParam to relationshipId) + nestedFragment.parameters
    )
}
```

### TargetTypeMatches with OR Branches
```kotlin
// Source: CONTEXT.md TargetTypeMatches semantics
fun generateTargetTypeMatches(
    relationshipId: UUID,
    branches: List<TypeBranch>,
    paramGen: ParameterNameGenerator,
    currentDepth: Int,
    maxDepth: Int,
    entityAlias: String
): SqlFragment {
    val relParam = paramGen.next("rel")
    val aliasId = paramGen.next("a")
    val relAlias = "r_$aliasId"
    val targetAlias = "t_$aliasId"

    // Generate OR branch for each TypeBranch
    val branchFragments = branches.map { branch ->
        val typeParam = paramGen.next("ttm_type")
        val typeCondition = SqlFragment(
            "$targetAlias.type_id = :$typeParam",
            mapOf(typeParam to branch.entityTypeId)
        )

        if (branch.filter != null) {
            // Branch with filter: type match AND filter match
            val filterFragment = visitFilter(branch.filter, paramGen, currentDepth + 1, maxDepth, targetAlias)
            typeCondition.and(filterFragment)
        } else {
            // Branch without filter: type match only
            typeCondition
        }
    }

    // Combine branches with OR semantics
    val combinedBranches = branchFragments.reduce { acc, fragment -> acc.or(fragment) }

    val sql = buildString {
        append("EXISTS (\n")
        append("    SELECT 1 FROM entity_relationships $relAlias\n")
        append("    JOIN entities $targetAlias ON $relAlias.target_entity_id = $targetAlias.id")
        append(" AND $targetAlias.deleted = false\n")
        append("    WHERE $relAlias.source_entity_id = $entityAlias.id\n")
        append("      AND $relAlias.relationship_field_id = :$relParam\n")
        append("      AND $relAlias.deleted = false\n")
        append("      AND ${combinedBranches.sql}\n")
        append(")")
    }

    return SqlFragment(
        sql = sql,
        parameters = mapOf(relParam to relationshipId) + combinedBranches.parameters
    )
}
```

### QueryFilterValidator (Eager Validation)
```kotlin
// Source: CONTEXT.md - eager validation, collect all errors, single tree walk
class QueryFilterValidator {

    data class ValidationContext(
        val relationshipDefinitions: Map<UUID, EntityRelationshipDefinition>,
        val maxDepth: Int,
        val errors: MutableList<QueryFilterValidationError> = mutableListOf()
    )

    fun validate(
        filter: QueryFilter,
        entityType: EntityType,
        maxDepth: Int
    ): List<QueryFilterValidationError> {
        val definitions = entityType.relationships
            ?.associateBy { it.id }
            ?: emptyMap()
        val context = ValidationContext(definitions, maxDepth)
        walkFilter(filter, context, currentDepth = 0)
        return context.errors
    }

    private fun walkFilter(
        filter: QueryFilter,
        context: ValidationContext,
        currentDepth: Int
    ) {
        when (filter) {
            is QueryFilter.Attribute -> { /* no relationship validation needed */ }
            is QueryFilter.Relationship -> {
                // Check depth
                if (currentDepth >= context.maxDepth) {
                    context.errors.add(
                        RelationshipDepthExceeded(currentDepth + 1, context.maxDepth)
                    )
                }
                // Check relationship exists
                val definition = context.relationshipDefinitions[filter.relationshipId]
                if (definition == null) {
                    context.errors.add(
                        InvalidRelationshipReference(filter.relationshipId)
                    )
                }
                // Check condition-specific validation
                validateCondition(filter.condition, definition, context, currentDepth + 1)
            }
            is QueryFilter.And -> filter.conditions.forEach { walkFilter(it, context, currentDepth) }
            is QueryFilter.Or -> filter.conditions.forEach { walkFilter(it, context, currentDepth) }
        }
    }

    private fun validateCondition(
        condition: RelationshipCondition,
        definition: EntityRelationshipDefinition?,
        context: ValidationContext,
        newDepth: Int
    ) {
        when (condition) {
            is RelationshipCondition.Exists -> { /* no additional validation */ }
            is RelationshipCondition.NotExists -> { /* no additional validation */ }
            is RelationshipCondition.TargetEquals -> { /* entityIds validated at model level */ }
            is RelationshipCondition.TargetMatches -> {
                walkFilter(condition.filter, context, newDepth)
            }
            is RelationshipCondition.TargetTypeMatches -> {
                // Validate branch types against relationship targets
                if (definition != null && !definition.allowPolymorphic) {
                    val validKeys = definition.entityTypeKeys ?: emptyList()
                    // Note: branch uses entityTypeId (UUID), need key-to-id resolution
                    // Validation needs access to entity type ID mapping
                }
                condition.branches.forEach { branch ->
                    branch.filter?.let { walkFilter(it, context, newDepth) }
                }
            }
            is RelationshipCondition.CountMatches -> { /* Phase 3 scope - not in requirements */ }
        }
    }
}
```

### Exception Hierarchy Extensions
```kotlin
// Source: existing QueryFilterException sealed class pattern
// Add to exceptions/query/QueryFilterException.kt

class InvalidRelationshipReferenceException(
    val relationshipId: UUID,
    val reason: String
) : QueryFilterException("Relationship $relationshipId: $reason")

class RelationshipDepthExceededException(
    val depth: Int,
    val maxDepth: Int
) : QueryFilterException("Relationship traversal depth $depth exceeds maximum $maxDepth")

class InvalidTypeBranchException(
    val entityTypeId: UUID,
    val relationshipId: UUID,
    val reason: String
) : QueryFilterException(
    "Type branch $entityTypeId for relationship $relationshipId: $reason"
)

class QueryValidationException(
    val validationErrors: List<QueryFilterException>
) : QueryFilterException(
    "Query validation failed with ${validationErrors.size} error(s): " +
    validationErrors.joinToString("; ") { it.message ?: "unknown" }
)
```

## Workspace Isolation Strategy

Per CONTEXT.md: "Workspace_id filtering on the root query only."

**Why this is safe:**
1. The root entity query already filters `e.workspace_id = :workspaceId`
2. `entity_relationships` has a FK from `source_entity_id` to `entities`, so if the source entity is in the correct workspace, the relationship must be too
3. `entity_relationships` has a FK from `target_entity_id` to `entities`, so target entities are guaranteed to exist
4. RLS provides a safety net at the database level

**What the subqueries do NOT need:**
- No `r.workspace_id = :workspaceId` in EXISTS subqueries
- No `t.workspace_id = :workspaceId` on target entity JOINs

**What the root query DOES need (handled by Phase 4):**
- `WHERE e.workspace_id = :workspaceId` on the main entities table

## Entity Alias Parameterization Strategy

The AttributeSqlGenerator currently hardcodes `e.payload` references. For nested relationship filters, the target entity uses a different alias (e.g., `t_0`).

**Recommended approach:**
Add an `entityAlias` parameter to the generator and visitor:

```kotlin
// AttributeSqlGenerator
fun generate(
    attributeId: UUID,
    operator: FilterOperator,
    value: Any?,
    paramGen: ParameterNameGenerator,
    entityAlias: String = "e"  // NEW: defaults to root entity
): SqlFragment
```

All SQL generation replaces hardcoded `e.` with `$entityAlias.`:
- `e.payload @> :eq_0::jsonb` becomes `$entityAlias.payload @> :eq_0::jsonb`
- `e.payload ? :key` becomes `$entityAlias.payload ? :key`

This is a backward-compatible change (default = "e" preserves existing behavior).

## Depth Tracking Architecture

Two separate depth concerns must be tracked independently:

| Concern | Counter | Limit | Incremented When |
|---------|---------|-------|-----------------|
| AND/OR nesting depth | Phase 2's `depth` param | `maxNestingDepth = 10` | Entering AND/OR conditions |
| Relationship traversal depth | New `relationshipDepth` param | `EntityQuery.maxDepth` (1-10, default 3) | Processing `QueryFilter.Relationship` |

**Implementation:** The visitor tracks both counters. AND/OR nesting uses the existing mechanism. Relationship depth is a new counter passed through `visitRelationship` -> nested filter processing.

The eager validator (QueryFilterValidator) checks relationship depth upfront before any SQL generation. The visitor also checks during generation as a safety net.

## Database Schema Reference

### entity_relationships Table
```sql
CREATE TABLE entity_relationships (
    id                    UUID PRIMARY KEY,
    workspace_id          UUID NOT NULL,     -- FK to workspaces
    source_entity_id      UUID NOT NULL,     -- FK to entities (the entity being filtered)
    source_entity_type_id UUID NOT NULL,     -- FK to entity_types
    target_entity_id      UUID NOT NULL,     -- FK to entities (the related entity)
    target_entity_type_id UUID NOT NULL,     -- FK to entity_types
    relationship_field_id UUID NOT NULL,     -- Maps to EntityRelationshipDefinition.id
    deleted               BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at            TIMESTAMPTZ,
    -- UNIQUE (source_entity_id, relationship_field_id, target_entity_id)
);
```

### Relevant Indexes
```sql
-- Supports EXISTS subquery: WHERE r.source_entity_id = e.id AND ...
CREATE INDEX idx_entity_relationships_source
    ON entity_relationships (workspace_id, source_entity_id)
    WHERE deleted = false AND deleted_at IS NULL;

-- Supports reverse lookups (not needed for this phase)
CREATE INDEX idx_entity_relationships_target
    ON entity_relationships (workspace_id, target_entity_id)
    WHERE deleted = false AND deleted_at IS NULL;
```

**Note:** There is no index specifically on `relationship_field_id`. For EXISTS subqueries that filter on both `source_entity_id` and `relationship_field_id`, the composite index on `(workspace_id, source_entity_id)` helps with the source entity correlation, but adding an index on `(source_entity_id, relationship_field_id)` could improve performance. This is an optimization concern for later phases.

### Key Column Mappings
| Query Model | Database Column | Notes |
|-------------|----------------|-------|
| `QueryFilter.Relationship.relationshipId` | `entity_relationships.relationship_field_id` | UUID match |
| `RelationshipCondition.TargetEquals.entityIds` | `entity_relationships.target_entity_id` | UUID IN list |
| `TypeBranch.entityTypeId` | `entity_relationships.target_entity_type_id` | UUID match |
| Root entity correlation | `entity_relationships.source_entity_id = e.id` | Correlated subquery |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JOIN + DISTINCT for filtering | EXISTS subquery (semi-join) | PostgreSQL 8.0+ optimized | No row duplication, short-circuit |
| Separate validation pass | Eager validation in single walk | Best practice | Fail fast with complete errors |
| Hardcoded table aliases | Parameterized aliases from counter | Phase 3 design | Supports arbitrary nesting |

**Deprecated/outdated:**
- None - EXISTS subquery pattern is well-established and stable in PostgreSQL

## Open Questions

1. **EntityAlias refactoring scope**
   - What we know: AttributeSqlGenerator needs an `entityAlias` parameter for nested relationship filters. This is a backward-compatible change.
   - What's unclear: Whether to modify AttributeSqlGenerator directly or create a wrapper. The visitor also needs to propagate the alias.
   - Recommendation: Modify AttributeSqlGenerator.generate() directly with `entityAlias: String = "e"` default. Minimal change, fully backward-compatible.

2. **TargetTypeMatches branch validation - key-to-ID resolution**
   - What we know: TypeBranch uses `entityTypeId` (UUID) and the relationship definition uses `entityTypeKeys` (List<String>). Validation needs to verify that branch entity types are valid targets.
   - What's unclear: How to resolve entity type key to ID for validation. Options: (a) pass a Map<String, UUID> of key-to-ID mappings, (b) pass a Map<UUID, String> of ID-to-key mappings, (c) query entity types on demand.
   - Recommendation: Pre-load a Map<UUID, EntityType> of all entity types referenced by the relationship's `entityTypeKeys`, pass to validator. This avoids N+1 lookups and enables both key and ID validation.

3. **CountMatches implementation scope**
   - What we know: CountMatches is defined in the RelationshipCondition sealed interface but is not listed in the phase requirements (REL-01 through REL-08).
   - What's unclear: Whether CountMatches should be stubbed (like Phase 2 stubbed relationships) or left as-is.
   - Recommendation: Add a placeholder that throws UnsupportedOperationException, matching Phase 2's pattern. Keep it out of scope for this phase.

## Sources

### Primary (HIGH confidence)
- `/home/jared/dev/worktrees/entity-query/core/schema.sql` - Authoritative database schema with entity_relationships table definition
- `/home/jared/dev/worktrees/entity-query/core/src/main/kotlin/riven/core/entity/entity/EntityRelationshipEntity.kt` - JPA entity mapping confirming column names
- `/home/jared/dev/worktrees/entity-query/core/src/main/kotlin/riven/core/repository/entity/EntityRelationshipRepository.kt` - Existing query patterns on entity_relationships
- `/home/jared/dev/worktrees/entity-query/core/src/main/kotlin/riven/core/service/entity/query/AttributeFilterVisitor.kt` - Phase 2 visitor pattern to extend
- `/home/jared/dev/worktrees/entity-query/core/src/main/kotlin/riven/core/service/entity/query/SqlFragment.kt` - Immutable fragment composition
- `/home/jared/dev/worktrees/entity-query/core/src/main/kotlin/riven/core/service/entity/query/AttributeSqlGenerator.kt` - Attribute SQL generation patterns
- `/home/jared/dev/worktrees/entity-query/core/src/main/kotlin/riven/core/models/entity/query/RelationshipCondition.kt` - RelationshipCondition sealed interface
- `/home/jared/dev/worktrees/entity-query/core/src/main/kotlin/riven/core/models/entity/configuration/EntityRelationshipDefinition.kt` - Relationship definition model
- `/home/jared/dev/worktrees/entity-query/core/.planning/phases/03-relationship-filter-implementation/03-CONTEXT.md` - User decisions constraining implementation
- `/home/jared/dev/worktrees/entity-query/core/.planning/research/ARCHITECTURE.md` - Architecture patterns and EXISTS subquery examples

### Secondary (MEDIUM confidence)
- [Percona: SQL Optimizations - IN vs EXISTS vs JOIN](https://www.percona.com/blog/sql-optimizations-in-postgresql-in-vs-exists-vs-any-all-vs-join/) - EXISTS semi-join optimization
- [Crunchy Data: Joins or Subquery in PostgreSQL](https://www.crunchydata.com/blog/joins-or-subquery-in-postgresql-lessons-learned) - Practical EXISTS vs JOIN comparison
- [PostgreSQL: Subquery Expressions](https://www.postgresql.org/docs/current/functions-subquery.html) - Official EXISTS documentation
- [pganalyze: Optimize Correlated Subqueries](https://pganalyze.com/blog/5mins-postgres-optimize-subqueries) - Subquery optimization patterns

### Tertiary (LOW confidence)
- None - all findings verified against codebase and official sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, reuses Phase 2 infrastructure entirely
- Architecture: HIGH - EXISTS subquery pattern verified against existing codebase queries (EntityRelationshipRepository) and official PostgreSQL docs
- SQL generation patterns: HIGH - Based on actual entity_relationships schema columns and indexes
- Validation approach: HIGH - CONTEXT.md explicitly specifies eager validation with error collection
- Entity alias strategy: MEDIUM - Recommended approach is clean but requires refactoring existing code; actual implementation may reveal edge cases
- Pitfalls: HIGH - Based on direct codebase analysis and Phase 2 experience

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (stable domain - PostgreSQL subquery patterns are well-established)
