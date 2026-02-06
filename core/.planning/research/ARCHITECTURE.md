# Architecture Patterns: Entity Query System

**Domain:** SQL Query Builder for Dynamic Entity Filtering
**Researched:** 2026-02-01
**Confidence:** HIGH (based on existing codebase patterns + established query builder architectures)

## Executive Summary

The Entity Query System translates a filter tree AST (AND/OR/Attribute/Relationship conditions) into parameterized SQL for execution against PostgreSQL. Based on research into jOOQ, Kotlin Exposed, Spring Data Specifications, and the existing codebase patterns, this document recommends a **Visitor-based SQL generation architecture** with clear component boundaries.

The architecture follows the principle that **the filter tree is already an AST** - the `QueryFilter` sealed hierarchy in `WorkflowQueryEntityActionConfig.kt` provides the input structure. The query system traverses this AST to produce SQL fragments and parameter bindings.

## Recommended Architecture

```
+-------------------+     +--------------------+     +-------------------+
|   QueryFilter     | --> | FilterSqlVisitor   | --> | SqlFragment       |
|   (Input AST)     |     | (Tree Traversal)   |     | (SQL + Params)    |
+-------------------+     +--------------------+     +-------------------+
                                   |
                                   v
                          +--------------------+
                          | SqlQueryBuilder    |
                          | (Assembly)         |
                          +--------------------+
                                   |
                                   v
                          +--------------------+
                          | QueryExecutor      |
                          | (JDBC Execution)   |
                          +--------------------+
                                   |
                                   v
                          +--------------------+
                          | ResultMapper       |
                          | (Entity Hydration) |
                          +--------------------+
```

## Component Breakdown

### 1. SqlFragment (Data Structure)

**Purpose:** Immutable container for SQL text with associated parameter bindings.

**Responsibilities:**
- Hold SQL string with `?` placeholders
- Hold ordered list of parameter values
- Support composition (combining fragments)

**Boundaries:**
- Pure data structure, no logic
- Does not execute SQL
- Does not know about entity types or relationships

**Example:**
```kotlin
data class SqlFragment(
    val sql: String,
    val parameters: List<Any?>
) {
    fun and(other: SqlFragment): SqlFragment = ...
    fun or(other: SqlFragment): SqlFragment = ...
    fun wrap(prefix: String, suffix: String): SqlFragment = ...
}
```

**Build Order:** Phase 1 - Foundation (no dependencies)

---

### 2. FilterSqlVisitor (Tree Traversal)

**Purpose:** Traverse `QueryFilter` AST and produce `SqlFragment` for each node.

**Responsibilities:**
- Visit each filter type (Attribute, Relationship, And, Or)
- Generate appropriate SQL for each filter operator
- Handle JSONB attribute access with UUID keys
- Generate subqueries for relationship conditions
- Collect parameters in traversal order

**Boundaries:**
- Knows filter structure (`QueryFilter` sealed hierarchy)
- Knows SQL dialect (PostgreSQL JSONB operators)
- Does NOT know about pagination, ordering, or projection
- Does NOT execute queries

**Key Methods:**
```kotlin
interface FilterSqlVisitor {
    fun visit(filter: QueryFilter): SqlFragment
    fun visitAttribute(filter: QueryFilter.Attribute): SqlFragment
    fun visitRelationship(filter: QueryFilter.Relationship): SqlFragment
    fun visitAnd(filter: QueryFilter.And): SqlFragment
    fun visitOr(filter: QueryFilter.Or): SqlFragment
}
```

**Subcomponents:**

| Component | Purpose |
|-----------|---------|
| `AttributeOperatorMapper` | Maps `FilterOperator` to SQL operators |
| `JsonbAccessBuilder` | Generates `payload->>'uuid'::text` expressions |
| `RelationshipSubqueryBuilder` | Generates EXISTS/IN subqueries for relationships |

**Build Order:** Phase 2 - Depends on SqlFragment

---

### 3. SqlQueryBuilder (Assembly)

**Purpose:** Assemble complete SELECT query from components.

**Responsibilities:**
- Compose SELECT clause (with optional projection)
- Compose FROM clause with base table
- Integrate WHERE clause from FilterSqlVisitor output
- Add ORDER BY clause from pagination config
- Add LIMIT/OFFSET from pagination config
- Generate COUNT query variant for total count

**Boundaries:**
- Orchestrates filter visitor
- Knows about EntityType schema for projection
- Knows about pagination/ordering structure
- Does NOT execute queries

**Key Methods:**
```kotlin
class SqlQueryBuilder(
    private val filterVisitor: FilterSqlVisitor
) {
    fun buildSelectQuery(
        entityTypeId: UUID,
        filter: QueryFilter?,
        pagination: QueryPagination?,
        projection: QueryProjection?
    ): SqlFragment

    fun buildCountQuery(
        entityTypeId: UUID,
        filter: QueryFilter?
    ): SqlFragment
}
```

**Build Order:** Phase 3 - Depends on FilterSqlVisitor

---

### 4. QueryExecutor (JDBC Execution)

**Purpose:** Execute SQL fragments against database with proper parameter binding.

**Responsibilities:**
- Create PreparedStatement from SqlFragment
- Bind parameters with correct JDBC types
- Execute query and return ResultSet
- Handle connection management (via Spring JdbcTemplate or EntityManager)
- Apply timeout limits

**Boundaries:**
- Knows about JDBC/JPA
- Knows about parameter type mapping
- Does NOT know about filter structure
- Does NOT map results to domain objects

**Key Methods:**
```kotlin
class QueryExecutor(
    private val jdbcTemplate: JdbcTemplate  // or EntityManager
) {
    fun executeQuery(fragment: SqlFragment): List<Map<String, Any?>>
    fun executeCount(fragment: SqlFragment): Long
}
```

**Build Order:** Phase 4 - Depends on SqlFragment (not SqlQueryBuilder)

---

### 5. ResultMapper (Entity Hydration)

**Purpose:** Transform raw query results into domain Entity objects.

**Responsibilities:**
- Map JDBC result rows to EntityEntity
- Parse JSONB payload
- Optionally hydrate relationships (if projection.expandRelationships)
- Apply projection filtering

**Boundaries:**
- Knows about Entity domain model
- Knows about EntityType schema
- Does NOT know about SQL generation
- Does NOT know about filter structure

**Key Methods:**
```kotlin
class ResultMapper(
    private val entityTypeService: EntityTypeService
) {
    fun mapToEntities(
        rows: List<Map<String, Any?>>,
        projection: QueryProjection?
    ): List<Entity>
}
```

**Build Order:** Phase 4 - Independent of SQL generation

---

### 6. EntityQueryService (Orchestrator)

**Purpose:** High-level service coordinating query execution.

**Responsibilities:**
- Validate query inputs
- Resolve template expressions in filters
- Coordinate builder -> executor -> mapper pipeline
- Handle pagination response (entities, totalCount, hasMore)
- Apply workspace scoping

**Boundaries:**
- Public API for query execution
- Knows about all subcomponents
- Handles transactional boundaries

**Key Methods:**
```kotlin
@Service
class EntityQueryService(
    private val queryBuilder: SqlQueryBuilder,
    private val executor: QueryExecutor,
    private val mapper: ResultMapper
) {
    fun query(
        workspaceId: UUID,
        request: EntityQuery,
        pagination: QueryPagination?,
        projection: QueryProjection?
    ): EntityQueryResult
}
```

**Build Order:** Phase 5 - Depends on all other components

---

## Data Flow

### Query Execution Flow

```
1. EntityQueryService.query() receives request
   |
   v
2. Validate inputs (entityTypeId exists, filter structure valid)
   |
   v
3. SqlQueryBuilder.buildSelectQuery()
   |-- FilterSqlVisitor traverses QueryFilter tree
   |   |-- visitAttribute() -> SqlFragment("payload->>'uuid' = ?", [value])
   |   |-- visitRelationship() -> SqlFragment("EXISTS (SELECT 1 FROM ...)", [...])
   |   |-- visitAnd() -> child1.and(child2)
   |   +-- visitOr() -> child1.or(child2)
   |
   +-- Compose final SELECT with WHERE, ORDER BY, LIMIT
   |
   v
4. QueryExecutor.executeQuery(fragment)
   |-- Create PreparedStatement
   |-- Bind parameters
   |-- Execute and return raw rows
   |
   v
5. ResultMapper.mapToEntities(rows, projection)
   |-- Parse JSONB payloads
   |-- Apply projection filtering
   |-- Optionally hydrate relationships
   |
   v
6. Return EntityQueryResult { entities, totalCount, hasMore }
```

### SQL Generation Detail (Attribute Filter)

```kotlin
// Input
QueryFilter.Attribute(
    attributeId = UUID("abc-123"),
    operator = FilterOperator.EQUALS,
    value = FilterValue.Literal("Active")
)

// FilterSqlVisitor.visitAttribute()
// 1. Generate JSONB access: payload->>'abc-123'
// 2. Map operator: EQUALS -> "="
// 3. Add parameter placeholder

// Output
SqlFragment(
    sql = "(payload->>'abc-123') = ?",
    parameters = listOf("Active")
)
```

### SQL Generation Detail (Relationship Filter with TARGET_MATCHES)

```kotlin
// Input: Find Projects where related Client has tier = "Premium"
QueryFilter.Relationship(
    relationshipId = UUID("client-rel-id"),
    condition = RelationshipCondition.TargetMatches(
        filter = QueryFilter.Attribute(
            attributeId = UUID("tier-attr-id"),
            operator = FilterOperator.EQUALS,
            value = FilterValue.Literal("Premium")
        )
    )
)

// FilterSqlVisitor.visitRelationship()
// 1. Recursively visit nested filter for target entity
// 2. Build EXISTS subquery joining entity_relationships

// Output
SqlFragment(
    sql = """
        EXISTS (
            SELECT 1 FROM entity_relationships r
            JOIN entities target ON r.target_entity_id = target.id
            WHERE r.source_entity_id = e.id
              AND r.relationship_field_id = ?
              AND r.deleted = false
              AND target.deleted = false
              AND (target.payload->>'tier-attr-id') = ?
        )
    """,
    parameters = listOf(UUID("client-rel-id"), "Premium")
)
```

---

## Patterns to Follow

### Pattern 1: Visitor for AST Traversal

**What:** Use visitor pattern to traverse the `QueryFilter` sealed hierarchy.

**When:** Processing each node type requires different SQL generation logic.

**Why:**
- Separates traversal logic from data structure
- New filter types only require new visit methods
- Matches existing codebase pattern (Expression.kt uses sealed classes)

**Example:**
```kotlin
sealed interface FilterSqlVisitor {
    fun visit(filter: QueryFilter): SqlFragment = when (filter) {
        is QueryFilter.Attribute -> visitAttribute(filter)
        is QueryFilter.Relationship -> visitRelationship(filter)
        is QueryFilter.And -> visitAnd(filter)
        is QueryFilter.Or -> visitOr(filter)
    }

    fun visitAttribute(filter: QueryFilter.Attribute): SqlFragment
    fun visitRelationship(filter: QueryFilter.Relationship): SqlFragment
    fun visitAnd(filter: QueryFilter.And): SqlFragment
    fun visitOr(filter: QueryFilter.Or): SqlFragment
}
```

### Pattern 2: Immutable Fragment Composition

**What:** Build SQL incrementally by composing immutable fragments.

**When:** Combining multiple filter conditions or query clauses.

**Why:**
- Thread-safe
- Easy to test individual fragments
- Prevents accidental mutation during composition
- Matches jOOQ's QueryPart composition pattern

**Example:**
```kotlin
val left = visit(filter.conditions[0])
val right = visit(filter.conditions[1])
val combined = left.and(right)  // Returns new SqlFragment
```

### Pattern 3: Parameterized Queries Only

**What:** Never interpolate values into SQL strings. Always use `?` placeholders.

**When:** Any value from filter input (literals, template-resolved values).

**Why:**
- SQL injection prevention (OWASP primary defense)
- Query plan caching in PostgreSQL
- Type safety via JDBC parameter binding

**Example:**
```kotlin
// CORRECT
SqlFragment("payload->>'${attributeId}' = ?", listOf(value))

// WRONG - SQL injection vulnerability
SqlFragment("payload->>'${attributeId}' = '${value}'", emptyList())
```

Note: Attribute UUIDs can be interpolated because they come from the entity type schema (trusted), but values must always be parameterized.

### Pattern 4: Subquery for Relationship Conditions

**What:** Use EXISTS subqueries for relationship filtering, not JOINs in main query.

**When:** Filtering by relationship existence or related entity attributes.

**Why:**
- Avoids row multiplication from JOINs
- EXISTS short-circuits on first match (performance)
- Cleaner composition with AND/OR
- Handles nested TargetMatches via recursive subqueries

**Example:**
```sql
-- EXISTS pattern (preferred)
SELECT * FROM entities e
WHERE EXISTS (
    SELECT 1 FROM entity_relationships r
    WHERE r.source_entity_id = e.id
      AND r.relationship_field_id = ?
)

-- JOIN pattern (problematic for filtering)
SELECT DISTINCT e.* FROM entities e
JOIN entity_relationships r ON r.source_entity_id = e.id
WHERE r.relationship_field_id = ?
-- Issues: DISTINCT overhead, row multiplication
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: String Concatenation for SQL

**What:** Building SQL by concatenating strings with user values.

**Why Bad:**
- SQL injection vulnerability
- No query plan caching
- Type mismatches at runtime

**Instead:** Use SqlFragment with parameterized placeholders.

### Anti-Pattern 2: N+1 Subqueries

**What:** Generating separate subquery for each relationship in an AND condition.

**Why Bad:**
- Performance degrades linearly with filter complexity
- Database must evaluate each subquery independently

**Instead:** Batch relationship lookups where possible, or use indexed EXISTS patterns.

### Anti-Pattern 3: Mutable Query Builder

**What:** Builder that mutates internal state during construction.

**Why Bad:**
- Thread-unsafe
- Harder to debug (state changes over time)
- Can't reuse partial queries
- jOOQ explicitly warns about this in their DSL

**Instead:** Immutable SqlFragment composition.

### Anti-Pattern 4: Direct EntityManager Native Queries

**What:** Using `EntityManager.createNativeQuery()` with raw SQL strings.

**Why Bad:**
- No compile-time SQL validation
- Manual result mapping
- Easy to forget parameter binding

**Instead:** Use JdbcTemplate with SqlFragment, or typed repository methods.

---

## Polymorphic Type Handling (TargetTypeMatches)

For polymorphic relationships where a single relationship can target multiple entity types, the architecture needs special handling.

### Challenge

A relationship like `Project.Owner` might target either `Client` OR `Partner`. When filtering with `TargetMatches`, we need to:
1. Determine which entity types are valid targets
2. Apply the nested filter appropriately to each type
3. Handle the case where the attribute UUID differs between types

### Solution: Type-Branched Subqueries

```sql
EXISTS (
    SELECT 1 FROM entity_relationships r
    JOIN entities target ON r.target_entity_id = target.id
    WHERE r.source_entity_id = e.id
      AND r.relationship_field_id = ?
      AND r.deleted = false
      AND target.deleted = false
      AND (
          -- Branch for Client type
          (target.type_key = 'client' AND target.payload->>'client-status-uuid' = ?)
          OR
          -- Branch for Partner type
          (target.type_key = 'partner' AND target.payload->>'partner-status-uuid' = ?)
      )
)
```

This requires the visitor to:
1. Look up relationship definition to find target entity types
2. For each target type, resolve attribute UUID from that type's schema
3. Generate OR-branched conditions

---

## Suggested Build Order

Based on component dependencies:

| Phase | Component | Depends On | Rationale |
|-------|-----------|------------|-----------|
| 1 | SqlFragment | Nothing | Pure data structure, foundation |
| 2 | AttributeOperatorMapper | SqlFragment | Simple mapping, needed by visitor |
| 2 | JsonbAccessBuilder | SqlFragment | Simple string generation |
| 3 | FilterSqlVisitor (Attribute only) | SqlFragment, mappers | Start with simplest filter type |
| 4 | FilterSqlVisitor (And/Or) | Attribute visitor | Composition of existing fragments |
| 5 | RelationshipSubqueryBuilder | SqlFragment | Complex but isolated |
| 5 | FilterSqlVisitor (Relationship) | Subquery builder | Most complex filter type |
| 6 | SqlQueryBuilder | Complete visitor | Assembles full queries |
| 7 | QueryExecutor | SqlFragment | JDBC execution layer |
| 7 | ResultMapper | Entity models | Independent of SQL generation |
| 8 | EntityQueryService | All above | Orchestration layer |

### Milestone Mapping

- **Phase 1-2:** Foundation (SqlFragment + basic mappers)
- **Phase 3-4:** Attribute Filtering (visitor for Attribute/And/Or)
- **Phase 5:** Relationship Filtering (visitor for Relationship conditions)
- **Phase 6:** Query Assembly (SqlQueryBuilder)
- **Phase 7:** Execution Layer (QueryExecutor + ResultMapper)
- **Phase 8:** Integration (EntityQueryService + workflow integration)

---

## Integration with Existing Codebase

### Repository Layer

The existing `EntityRepository` uses Spring Data JPA with native queries. The query system can integrate via:

**Option A: JdbcTemplate (Recommended)**
```kotlin
@Service
class QueryExecutor(
    private val jdbcTemplate: JdbcTemplate
) {
    fun executeQuery(fragment: SqlFragment): List<Map<String, Any?>> =
        jdbcTemplate.queryForList(fragment.sql, *fragment.parameters.toTypedArray())
}
```

**Option B: EntityManager Native Query**
```kotlin
@Service
class QueryExecutor(
    private val entityManager: EntityManager
) {
    fun executeQuery(fragment: SqlFragment): List<Array<Any?>> {
        val query = entityManager.createNativeQuery(fragment.sql)
        fragment.parameters.forEachIndexed { i, param ->
            query.setParameter(i + 1, param)
        }
        return query.resultList as List<Array<Any?>>
    }
}
```

### Workflow Integration

The `WorkflowQueryEntityActionConfig.execute()` method currently throws `NotImplementedError`. Integration:

```kotlin
override fun execute(
    context: WorkflowExecutionContext,
    inputs: Map<String, Any?>,
    services: NodeServiceProvider
): Map<String, Any?> {
    val queryService = services.service<EntityQueryService>()

    // Resolve templates in filter
    val resolvedFilter = resolveTemplates(query.filter, context)

    // Execute query
    val result = queryService.query(
        workspaceId = context.workspaceId,
        request = query.copy(filter = resolvedFilter),
        pagination = pagination,
        projection = projection
    )

    return mapOf(
        "entities" to result.entities,
        "totalCount" to result.totalCount,
        "hasMore" to result.hasMore
    )
}
```

---

## Performance Considerations

| Concern | At 100 entities | At 10K entities | At 100K+ entities |
|---------|-----------------|-----------------|-------------------|
| Attribute filter | Index on payload GIN | GIN index critical | Consider materialized columns |
| Relationship EXISTS | Fine | Add covering index | Consider denormalization |
| Nested TargetMatches | Fine | Query plan caching | Limit nesting depth |
| COUNT query | Fine | Use estimate for UI | Approximate count option |
| Pagination | OFFSET fine | Keyset pagination | Keyset required |

### Recommended Indexes

Already exist in schema.sql:
- `idx_entities_payload_gin` - GIN index on payload JSONB
- `idx_entity_relationships_source` - Composite index on (workspace_id, source_entity_id)
- `idx_entity_relationships_target` - Composite index on (workspace_id, target_entity_id)

May need to add:
- Index on `entity_relationships.relationship_field_id` for filtered EXISTS

---

## Sources

- [jOOQ Query Object Model Design](https://www.jooq.org/doc/latest/manual/sql-building/model-api/model-api-design/)
- [jOOQ DSL and Model API](https://www.jooq.org/doc/3.13/manual/sql-building/sql-statements/dsl-and-non-dsl/)
- [Visitor Design Pattern for SQL Statement Builder (Exasol)](https://www.exasol.com/resource/visitor-design-pattern-using-sql-statement-builder-as-an-example/)
- [The Visitor Pattern Re-visited (jOOQ Blog)](https://blog.jooq.org/the-visitor-pattern-re-visited/)
- [Spring Data Specifications for Dynamic Query Generation](https://technology.inmobi.com/articles/2023/05/25/spring-data-specifications-for-dynamic-query-generation)
- [Advanced Spring Data JPA - Specifications and Querydsl](https://spring.io/blog/2011/04/26/advanced-spring-data-jpa-specifications-and-querydsl/)
- [JetBrains Exposed - Kotlin SQL Framework](https://github.com/JetBrains/Exposed)
- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [PostgreSQL JSONB Functions and Operators](https://www.postgresql.org/docs/current/functions-json.html)
