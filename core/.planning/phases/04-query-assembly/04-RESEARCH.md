# Phase 4: Query Assembly - Research

**Researched:** 2026-02-07
**Domain:** SQL query assembly, pagination, projection, response models
**Confidence:** HIGH

## Summary

This phase assembles complete SELECT queries from the SqlFragment outputs of Phases 2-3 (attribute and relationship filter visitors), adding pagination (LIMIT/OFFSET), default ordering (ORDER BY created_at DESC, id ASC), workspace_id filtering, and a total count query. It also introduces input validation for pagination parameters and a response model carrying the result list, totalCount, and hasNextPage.

The codebase already has all the SQL generation infrastructure needed: `SqlFragment` (immutable composition), `ParameterNameGenerator` (unique naming), `AttributeFilterVisitor` (tree traversal producing SqlFragment), `AttributeSqlGenerator`, `RelationshipSqlGenerator`, and `QueryFilterValidator`. Phase 4 builds on top of these to produce two complete parameterized SQL strings (data query + count query) and a validated pagination/projection model.

The assembler is a pure function: it takes an EntityQuery, QueryPagination, QueryProjection, and workspaceId, produces two SqlFragments (data + count), and returns them. It does not execute SQL -- that belongs to Phase 5. The response model (`EntityQueryResult`) is a simple data class holding `List<Entity>`, `totalCount: Long`, `hasNextPage: Boolean`, and the `QueryProjection` passthrough.

**Primary recommendation:** Implement an `EntityQueryAssembler` class that composes the WHERE clause from visitor output, wraps it in a complete SELECT with workspace_id filtering, default ORDER BY, and LIMIT/OFFSET. Generate a separate COUNT query with the same WHERE clause but no ORDER BY or LIMIT/OFFSET. Add pagination validation (limit 1-500, offset >= 0). Create `EntityQueryResult` data class for the response.

## Standard Stack

No new dependencies required. All patterns use existing codebase infrastructure from Phases 1-3.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Spring Data JPA | 3.5.3 (via `spring-boot-starter-data-jpa`) | Provides `NamedParameterJdbcTemplate` transitively | Already available; will be used for execution in Phase 5 |
| Kotlin stdlib | 2.1.21 | Data classes, sealed interfaces | Codebase standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Jackson | 2.17.x (via Spring Boot) | JSON serialization for response | Already used throughout |
| SpringDoc OpenAPI | 2.8.6 | `@Schema` annotations on response model | Existing pattern |

**Installation:** No new dependencies needed. `spring-boot-starter-data-jpa` transitively includes Spring JDBC which provides `NamedParameterJdbcTemplate`. The assembler itself is pure Kotlin with no Spring dependency -- only the executor (Phase 5) needs Spring.

## Architecture Patterns

### Recommended Project Structure
```
src/main/kotlin/riven/core/service/entity/query/
    SqlFragment.kt                    # Existing (Phase 2)
    ParameterNameGenerator.kt         # Existing (Phase 2)
    AttributeSqlGenerator.kt          # Existing (Phase 2)
    AttributeFilterVisitor.kt         # Existing (Phase 2, extended in Phase 3)
    RelationshipSqlGenerator.kt       # Existing (Phase 3)
    QueryFilterValidator.kt           # Existing (Phase 3)
    EntityQueryAssembler.kt           # NEW: Assembles complete SELECT + COUNT queries

src/main/kotlin/riven/core/models/entity/query/
    EntityQuery.kt                    # Existing (Phase 1)
    QueryFilter.kt                    # Existing (Phase 1)
    RelationshipCondition.kt          # Existing (Phase 1)
    QueryPagination.kt                # Existing (Phase 1) - may need validation constants
    QueryProjection.kt                # Existing (Phase 1)
    EntityQueryResult.kt              # NEW: Response model with entities + totalCount + hasNextPage
```

### Pattern 1: Query Assembler as Pure Composition
**What:** The assembler takes the WHERE clause SqlFragment from the visitor and wraps it in a complete SELECT statement with all clauses. It produces two SqlFragments: one for the data query (with ORDER BY, LIMIT, OFFSET) and one for the count query (just SELECT COUNT(*) with same WHERE).
**When to use:** Always -- this is the single entry point for building complete queries from filter output.

**Example:**
```kotlin
class EntityQueryAssembler(
    private val filterVisitor: AttributeFilterVisitor
) {
    fun assemble(
        entityTypeId: UUID,
        workspaceId: UUID,
        filter: QueryFilter?,
        pagination: QueryPagination,
        paramGen: ParameterNameGenerator
    ): AssembledQuery {
        // 1. Build WHERE clause from filter
        val filterFragment = filter?.let { filterVisitor.visit(it, paramGen) }

        // 2. Build base WHERE conditions (workspace + type + not deleted)
        val baseFragment = buildBaseWhereClause(entityTypeId, workspaceId, paramGen)

        // 3. Combine base + filter
        val whereFragment = if (filterFragment != null) {
            baseFragment.and(filterFragment)
        } else {
            baseFragment
        }

        // 4. Build data query (SELECT * ... ORDER BY ... LIMIT ... OFFSET)
        val dataQuery = buildDataQuery(whereFragment, pagination, paramGen)

        // 5. Build count query (SELECT COUNT(*) ... no ORDER BY, no LIMIT)
        val countQuery = buildCountQuery(whereFragment)

        return AssembledQuery(dataQuery, countQuery)
    }
}
```

### Pattern 2: Separate Data and Count Queries
**What:** Two separate SQL queries rather than a window function (`COUNT(*) OVER()`).
**When to use:** Per CONTEXT.md decision -- totalCount always returned.
**Why chosen over window function:**
- Window functions compute count per row, adding overhead proportional to page size
- Separate count query with identical WHERE clause is simpler to reason about
- COUNT query without ORDER BY or LIMIT is cheaper (no sorting, no row fetching)
- PostgreSQL can optimize COUNT(*) differently than data retrieval
- Easier to test independently

**Data query shape:**
```sql
SELECT e.*
FROM entities e
WHERE e.workspace_id = :ws_0
  AND e.type_id = :type_1
  AND e.deleted = false
  AND {filter WHERE clause from visitor}
ORDER BY e.created_at DESC, e.id ASC
LIMIT :limit_2
OFFSET :offset_3
```

**Count query shape:**
```sql
SELECT COUNT(*)
FROM entities e
WHERE e.workspace_id = :ws_0
  AND e.type_id = :type_1
  AND e.deleted = false
  AND {filter WHERE clause from visitor}
```

### Pattern 3: Pagination Validation as Standalone Logic
**What:** Validate pagination parameters (limit, offset) before assembly. Reject invalid values with descriptive errors.
**When to use:** Before any SQL generation.
**Why separate:** Validation is a cross-cutting concern. The assembler should not need to handle invalid inputs.

**Validation rules:**
- `limit` must be >= 1 and <= 500 (max cap)
- `offset` must be >= 0
- Negative limit or offset throws `IllegalArgumentException` with descriptive message
- Limit > 500 throws `IllegalArgumentException` (not silently clamped)
- Default limit: 100, default offset: 0

### Pattern 4: hasNextPage Computation
**What:** Compute `hasNextPage` from `totalCount`, `offset`, and `limit`.
**When to use:** After both data and count queries execute (Phase 5), but the logic belongs in the result model.

```kotlin
val hasNextPage = (offset + limit) < totalCount
```

This is computed at result assembly time, not during SQL generation.

### Anti-Patterns to Avoid
- **Window function for count:** `COUNT(*) OVER()` computes per-row, adds to data query complexity. Use separate count query.
- **ORDER BY on count query:** Unnecessary overhead; COUNT doesn't need ordering.
- **LIMIT/OFFSET on count query:** Defeats the purpose of getting total count.
- **Silently clamping limit to 500:** CONTEXT.md says throw validation error, not clamp.
- **Putting workspace_id filtering in the visitor:** Workspace filtering is a query-level concern, not a filter-level concern. The assembler adds it.
- **Mutable assembly state:** Keep the assembler stateless. All state flows through parameters and return values.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WHERE clause composition | Manual string building | SqlFragment.and() composition | Already proven in Phases 2-3 |
| Parameter uniqueness | Manual counter in assembler | Shared ParameterNameGenerator | One generator per query tree ensures uniqueness |
| Filter tree traversal | Duplicate visitor logic | Existing AttributeFilterVisitor | Already handles all filter types |
| Pagination defaults | Scattered default logic | QueryPagination data class defaults | Already has `limit = 100`, `offset = 0` |
| hasNextPage calculation | Complex logic | `(offset + limit) < totalCount` | Simple arithmetic, no edge cases |

**Key insight:** The assembler is thin. Most complexity is already handled by Phases 2-3. The assembler's job is mechanical: wrap the visitor output in SELECT/FROM/WHERE/ORDER BY/LIMIT/OFFSET boilerplate and add workspace_id + type_id + deleted filters.

## Common Pitfalls

### Pitfall 1: Parameter Name Collision Between Base Conditions and Filter
**What goes wrong:** The assembler generates parameter names (e.g., `ws_0`, `type_1`) that collide with names generated by the filter visitor (e.g., `eq_0`, `rel_1`).
**Why it happens:** If the assembler and visitor use separate ParameterNameGenerator instances, counters start at 0 independently.
**How to avoid:** Use a SINGLE ParameterNameGenerator instance for the entire query tree. Create it in the assembler, pass it to the visitor, and use it for base conditions too. All parameter names share the same counter.
**Warning signs:** `NamedParameterJdbcTemplate` binding errors, duplicate parameter names in SQL.

### Pitfall 2: Missing deleted = false in Base WHERE
**What goes wrong:** Query returns soft-deleted entities.
**Why it happens:** The entities table uses soft deletion (`deleted = false` and conditional indexes `WHERE deleted = false`). If the base WHERE clause omits this, deleted entities appear in results.
**How to avoid:** Always include `e.deleted = false` in the base WHERE clause. This matches the existing `EntityRepository` patterns which all include `deleted = false`.
**Warning signs:** Queries returning more entities than expected, including archived entities.

### Pitfall 3: ORDER BY Created_at Without Timezone Awareness
**What goes wrong:** Non-deterministic ordering when entities have identical `created_at` values.
**Why it happens:** `created_at` is `TIMESTAMP WITH TIME ZONE` but multiple entities can be created in the same transaction/millisecond.
**How to avoid:** Per CONTEXT.md, use `ORDER BY e.created_at DESC, e.id ASC` -- the `id ASC` tiebreaker ensures deterministic pagination even with identical timestamps.
**Warning signs:** Entities appearing on multiple pages or missing from pagination.

### Pitfall 4: Count Query Returning Incorrect Total After Offset
**What goes wrong:** Count query includes OFFSET, returning a reduced count instead of total.
**Why it happens:** Accidentally applying pagination to the count query.
**How to avoid:** The count query uses only the WHERE clause -- NO ORDER BY, NO LIMIT, NO OFFSET. It must return the total matching entities regardless of pagination position.
**Warning signs:** totalCount changing as user pages through results.

### Pitfall 5: Negative Offset Producing Valid SQL
**What goes wrong:** PostgreSQL accepts `OFFSET -1` and treats it as `OFFSET 0`, masking validation bugs.
**Why it happens:** No input validation before SQL generation.
**How to avoid:** Validate pagination parameters before assembly. Per CONTEXT.md: negative limit or offset throws validation error with descriptive message.
**Warning signs:** Tests passing with negative offsets.

### Pitfall 6: workspace_id Not in Relationship Subqueries
**What goes wrong:** Someone adds workspace_id filtering to relationship EXISTS subqueries, breaking the established pattern from Phase 3.
**Why it happens:** Over-zealous security concern.
**How to avoid:** Per Phase 3 CONTEXT.md and RelationshipSqlGenerator documentation: workspace isolation is on the root query only. Relationship subqueries do not include workspace_id. The FK constraints and RLS provide sufficient isolation.
**Warning signs:** Duplicate workspace_id filtering, unnecessary parameters.

## Code Examples

### AssembledQuery Return Type
```kotlin
// Source: Architecture decision from ARCHITECTURE.md
package riven.core.service.entity.query

/**
 * Result of query assembly: contains both the data query and count query
 * as separate SqlFragments ready for execution.
 */
data class AssembledQuery(
    val dataQuery: SqlFragment,
    val countQuery: SqlFragment
)
```

### Base WHERE Clause Construction
```kotlin
// Source: entities table schema (schema.sql lines 313-330)
private fun buildBaseWhereClause(
    entityTypeId: UUID,
    workspaceId: UUID,
    paramGen: ParameterNameGenerator
): SqlFragment {
    val wsParam = paramGen.next("ws")
    val typeParam = paramGen.next("type")

    return SqlFragment(
        sql = "e.workspace_id = :$wsParam AND e.type_id = :$typeParam AND e.deleted = false",
        parameters = mapOf(
            wsParam to workspaceId,
            typeParam to entityTypeId
        )
    )
}
```

### Data Query Assembly
```kotlin
// Source: CONTEXT.md decisions on ordering and pagination
private fun buildDataQuery(
    whereFragment: SqlFragment,
    pagination: QueryPagination,
    paramGen: ParameterNameGenerator
): SqlFragment {
    val limitParam = paramGen.next("limit")
    val offsetParam = paramGen.next("offset")

    val sql = buildString {
        append("SELECT e.*\n")
        append("FROM entities e\n")
        append("WHERE ${whereFragment.sql}\n")
        append("ORDER BY e.created_at DESC, e.id ASC\n")
        append("LIMIT :$limitParam OFFSET :$offsetParam")
    }

    return SqlFragment(
        sql = sql,
        parameters = whereFragment.parameters + mapOf(
            limitParam to pagination.limit,
            offsetParam to pagination.offset
        )
    )
}
```

### Count Query Assembly
```kotlin
// Source: CONTEXT.md - no ORDER BY or LIMIT on count query
private fun buildCountQuery(
    whereFragment: SqlFragment
): SqlFragment {
    val sql = buildString {
        append("SELECT COUNT(*)\n")
        append("FROM entities e\n")
        append("WHERE ${whereFragment.sql}")
    }

    return SqlFragment(
        sql = sql,
        parameters = whereFragment.parameters
    )
}
```

### Pagination Validation
```kotlin
// Source: CONTEXT.md pagination limits decisions
fun validatePagination(pagination: QueryPagination) {
    require(pagination.limit >= 1) {
        "Limit must be at least 1, was: ${pagination.limit}"
    }
    require(pagination.limit <= MAX_LIMIT) {
        "Limit must not exceed $MAX_LIMIT, was: ${pagination.limit}"
    }
    require(pagination.offset >= 0) {
        "Offset must be non-negative, was: ${pagination.offset}"
    }
}

companion object {
    const val MAX_LIMIT = 500
}
```

### EntityQueryResult Response Model
```kotlin
// Source: CONTEXT.md decisions on response structure
package riven.core.models.entity.query

import riven.core.models.entity.Entity

/**
 * Result of an entity query execution.
 *
 * @property entities List of matching entities for the current page (may be empty)
 * @property totalCount Total number of matching entities across all pages
 * @property hasNextPage Whether more results exist beyond the current page
 * @property projection The projection used for the query (passthrough for callers)
 */
data class EntityQueryResult(
    val entities: List<Entity>,
    val totalCount: Long,
    val hasNextPage: Boolean,
    val projection: QueryProjection?
)
```

### Full Assembler Integration
```kotlin
// Source: Architecture patterns + CONTEXT.md decisions
class EntityQueryAssembler(
    private val filterVisitor: AttributeFilterVisitor
) {
    fun assemble(
        entityTypeId: UUID,
        workspaceId: UUID,
        filter: QueryFilter?,
        pagination: QueryPagination,
        paramGen: ParameterNameGenerator
    ): AssembledQuery {
        // Build base conditions (workspace + type + not deleted)
        val baseFragment = buildBaseWhereClause(entityTypeId, workspaceId, paramGen)

        // Build filter conditions (may be null if no filter)
        val filterFragment = filter?.let { filterVisitor.visit(it, paramGen) }

        // Combine: base AND filter (or just base if no filter)
        val whereFragment = if (filterFragment != null) {
            baseFragment.and(filterFragment)
        } else {
            baseFragment
        }

        // Build both queries
        val dataQuery = buildDataQuery(whereFragment, pagination, paramGen)
        val countQuery = buildCountQuery(whereFragment)

        return AssembledQuery(dataQuery, countQuery)
    }
}
```

## Existing Codebase Inventory (Phases 1-3)

### Query Models (Phase 1)
| File | Key Fields | Notes |
|------|-----------|-------|
| `EntityQuery.kt` | `entityTypeId: UUID`, `filter: QueryFilter?`, `maxDepth: Int = 3` | Root query definition |
| `QueryPagination.kt` | `limit: Int = 100`, `offset: Int = 0`, `orderBy: List<OrderByClause>?` | Already has defaults; orderBy ignored per CONTEXT.md |
| `QueryProjection.kt` | `includeAttributes: List<UUID>?`, `includeRelationships: List<UUID>?`, `expandRelationships: Boolean` | Hints only -- always return full Entity |
| `QueryFilter.kt` | Sealed: `Attribute`, `Relationship`, `And`, `Or` + `FilterOperator` enum + `FilterValue` sealed | Complete filter AST |
| `RelationshipCondition.kt` | Sealed: `Exists`, `NotExists`, `TargetEquals`, `TargetMatches`, `TargetTypeMatches`, `CountMatches` | Complete relationship condition set |

### Service Layer (Phases 2-3)
| File | Purpose | Key API |
|------|---------|---------|
| `SqlFragment.kt` | Immutable SQL + params | `and()`, `or()`, `wrap()`, `ALWAYS_TRUE`, `ALWAYS_FALSE` |
| `ParameterNameGenerator.kt` | Unique param names | `next(prefix): String` |
| `AttributeSqlGenerator.kt` | JSONB attribute SQL | `generate(attributeId, operator, value, paramGen, entityAlias)` |
| `AttributeFilterVisitor.kt` | Filter tree traversal | `visit(filter, paramGen, entityAlias): SqlFragment` |
| `RelationshipSqlGenerator.kt` | EXISTS subquery SQL | `generate(relationshipId, condition, paramGen, entityAlias, nestedFilterVisitor)` |
| `QueryFilterValidator.kt` | Eager validation | `validate(filter, relationshipDefs, maxDepth): List<QueryFilterException>` |

### Database Schema (entities table)
```sql
CREATE TABLE entities (
    id             UUID PRIMARY KEY,
    workspace_id   UUID NOT NULL,           -- FK, filtered by assembler
    type_id        UUID NOT NULL,           -- FK, filtered by assembler
    deleted        BOOLEAN NOT NULL DEFAULT FALSE,  -- filtered by assembler
    type_key       TEXT NOT NULL,            -- denormalized, not used in query
    identifier_key UUID NOT NULL,           -- not used in query
    payload        JSONB NOT NULL,           -- filtered by visitor (Phases 2-3)
    icon_type      TEXT NOT NULL,            -- returned in SELECT *
    icon_colour    TEXT NOT NULL,            -- returned in SELECT *
    created_at     TIMESTAMPTZ,             -- used in ORDER BY
    updated_at     TIMESTAMPTZ,             -- returned in SELECT *
    created_by     UUID,                    -- returned in SELECT *
    updated_by     UUID,                    -- returned in SELECT *
    deleted_at     TIMESTAMPTZ              -- not used (deleted = false covers it)
);

-- Relevant indexes:
CREATE INDEX idx_entities_workspace_id ON entities (workspace_id) WHERE deleted = false;
CREATE INDEX idx_entities_type_id ON entities (type_id) WHERE deleted = false;
CREATE INDEX idx_entities_payload_gin ON entities USING gin (payload jsonb_path_ops)
    WHERE deleted = false AND deleted_at IS NULL;
```

## Workspace_id Filtering Decision

**Belongs in the assembler (Phase 4), not deferred to Phase 5.**

Rationale:
1. The assembler produces complete SQL ready for execution -- workspace_id is part of the WHERE clause
2. Phase 5's executor simply runs the SQL and maps results; it should not modify the query
3. The existing pattern from Phase 3 (RelationshipSqlGenerator) explicitly states "workspace isolation is on the root query only" -- the assembler IS the root query builder
4. This matches EXEC-04 from the roadmap: "Enforce workspace_id filtering on all queries"

The assembler adds `e.workspace_id = :ws_0` to the base WHERE clause. This is the ONLY place workspace_id filtering occurs in the entire query tree.

## Total Count Implementation Decision

**Use separate COUNT query** (not window function).

Rationale:
1. Simpler SQL -- data query stays clean
2. COUNT query can be optimized independently by PostgreSQL
3. No per-row overhead from window functions
4. Both queries share the same WHERE clause SqlFragment (single generation, dual use)
5. Trivial to test independently
6. The assembler generates both queries; Phase 5's executor runs them (potentially in parallel)

The `buildCountQuery` method reuses the identical `whereFragment` from `buildDataQuery` but wraps it in `SELECT COUNT(*) FROM entities e WHERE ...` without ORDER BY or LIMIT/OFFSET.

## Response Model Design

**`EntityQueryResult` in `riven.core.models.entity.query` package.**

```kotlin
data class EntityQueryResult(
    val entities: List<Entity>,
    val totalCount: Long,
    val hasNextPage: Boolean,
    val projection: QueryProjection?
)
```

Key design decisions per CONTEXT.md:
- `entities` is `List<Entity>`, not `List<EntityEntity>` -- full domain objects
- `totalCount` is always present (no opt-out)
- `hasNextPage` is computed: `(offset + limit) < totalCount`
- `projection` is passed through so callers can see what projection was applied
- Empty result: `entities = emptyList(), totalCount = 0, hasNextPage = false`

This model lives in the query models package alongside EntityQuery, not in `models/response/` -- it is a domain query result, not an API response DTO. Phase 5 or the controller layer may wrap it in an API response if needed.

## Existing Native SQL Patterns

The codebase uses Spring Data JPA `@Query(nativeQuery = true)` extensively. Key patterns observed:

1. **Named parameters with `:paramName`** -- all native queries use named parameters (`:ids`, `:workspaceId`, `:typeId`, etc.)
2. **No JdbcTemplate usage** -- the codebase currently only uses JPA repositories with native queries. The ShedLock configuration is the only place that creates a JdbcTemplate (for lock management).
3. **Phase 5 will introduce NamedParameterJdbcTemplate** -- since the assembler produces SQL with named parameters (`:ws_0`, `:eq_1`, etc.), Phase 5 will need `NamedParameterJdbcTemplate` for execution. Spring Data JPA includes `spring-jdbc` transitively, so `NamedParameterJdbcTemplate` is already available.

**Important:** The SqlFragment uses named parameters (`:paramName`), NOT positional parameters (`?`). This matches the codebase convention from JPA native queries and is compatible with `NamedParameterJdbcTemplate`.

## Open Questions

1. **Should the assembler be a Spring @Service or a plain class?**
   - What we know: The assembler depends on `AttributeFilterVisitor`, which depends on `AttributeSqlGenerator` and `RelationshipSqlGenerator`. The SQL generator needs `ObjectMapper` (already a Spring bean).
   - What's unclear: Whether to wire via constructor injection or manual instantiation.
   - Recommendation: Make it a `@Service` with constructor injection of `AttributeFilterVisitor`. This follows the codebase pattern (all services use constructor injection) and allows Phase 5's `EntityQueryService` to inject it.

2. **SELECT e.* vs explicit column list?**
   - What we know: CONTEXT.md says "always return full Entity" and projection is hints-only.
   - What's unclear: Whether `SELECT e.*` is safe for future schema evolution.
   - Recommendation: Use `SELECT e.*` for simplicity. The result mapper (Phase 5) will map whatever columns exist. If columns are added to the table, they'll be ignored by the mapper unless explicitly handled.

3. **Should pagination validation live in the assembler or be separate?**
   - What we know: CONTEXT.md says throw validation error for invalid values.
   - What's unclear: Whether validation is a method on the assembler or a separate concern.
   - Recommendation: Add validation as a private method in the assembler called at the start of `assemble()`. It's simple enough to not need its own class, and it ensures invalid inputs never reach SQL generation.

## Sources

### Primary (HIGH confidence)
- `/home/jared/dev/worktrees/entity-query/core/schema.sql` - Authoritative database schema (entities table definition, indexes)
- `/home/jared/dev/worktrees/entity-query/core/src/main/kotlin/riven/core/service/entity/query/SqlFragment.kt` - Immutable fragment composition API
- `/home/jared/dev/worktrees/entity-query/core/src/main/kotlin/riven/core/service/entity/query/AttributeFilterVisitor.kt` - Filter visitor API (visit method signature)
- `/home/jared/dev/worktrees/entity-query/core/src/main/kotlin/riven/core/service/entity/query/ParameterNameGenerator.kt` - Parameter naming API
- `/home/jared/dev/worktrees/entity-query/core/src/main/kotlin/riven/core/models/entity/query/QueryPagination.kt` - Existing pagination model with defaults
- `/home/jared/dev/worktrees/entity-query/core/src/main/kotlin/riven/core/models/entity/query/QueryProjection.kt` - Existing projection model
- `/home/jared/dev/worktrees/entity-query/core/src/main/kotlin/riven/core/models/entity/query/EntityQuery.kt` - Root query model
- `/home/jared/dev/worktrees/entity-query/core/src/main/kotlin/riven/core/models/entity/Entity.kt` - Entity domain model
- `/home/jared/dev/worktrees/entity-query/core/.planning/phases/04-query-assembly/04-CONTEXT.md` - User decisions constraining implementation
- `/home/jared/dev/worktrees/entity-query/core/.planning/research/ARCHITECTURE.md` - Architecture patterns (SqlQueryBuilder, data flow)

### Secondary (MEDIUM confidence)
- `/home/jared/dev/worktrees/entity-query/core/src/main/kotlin/riven/core/repository/entity/EntityRepository.kt` - Existing query patterns (all include `deleted = false`)
- `/home/jared/dev/worktrees/entity-query/core/src/main/kotlin/riven/core/entity/entity/EntityEntity.kt` - JPA entity column mapping
- `/home/jared/dev/worktrees/entity-query/core/src/main/kotlin/riven/core/service/entity/EntityService.kt` - Existing entity retrieval patterns
- `/home/jared/dev/worktrees/entity-query/core/.planning/phases/03-relationship-filter-implementation/03-RESEARCH.md` - Workspace isolation strategy

### Tertiary (LOW confidence)
- None - all findings verified against codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, uses existing infrastructure
- Architecture: HIGH - Assembler pattern directly follows ARCHITECTURE.md SqlQueryBuilder spec
- SQL shape: HIGH - Verified against entities table schema, indexes, and existing query patterns
- Pagination validation: HIGH - Rules explicitly stated in CONTEXT.md
- Response model: HIGH - Fields and behavior explicitly stated in CONTEXT.md
- Pitfalls: HIGH - Based on direct codebase analysis and Phase 2-3 patterns

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (stable domain - SQL assembly patterns are well-established)
