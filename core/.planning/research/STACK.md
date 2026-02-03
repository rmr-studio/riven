# Technology Stack: Entity Query System

**Project:** Entity Query Service for Riven Core
**Researched:** 2026-02-01
**Overall Confidence:** HIGH

## Executive Summary

For building a native PostgreSQL JSONB query service in an existing Spring Boot 3.5.3/Kotlin 2.1.21 codebase, the recommended approach is **custom SQL generation with Spring's NamedParameterJdbcTemplate**. This avoids introducing heavy new dependencies (jOOQ licensing, Exposed learning curve) while providing safe, parameterized query execution with full access to PostgreSQL's JSONB operators.

The existing codebase already uses:
- Spring Data JPA with Hibernate 6 for entity management
- Hypersistence Utils for JSONB type mapping
- Native queries via `@Query(nativeQuery = true)` in repositories
- GIN index with `jsonb_path_ops` on the payload column

The query service should complement (not replace) this existing infrastructure.

---

## Recommended Stack

### Core Query Execution

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| **NamedParameterJdbcTemplate** | Spring Boot 3.5.3 (included) | Execute parameterized native SQL | HIGH |
| **Custom Kotlin DSL** | N/A (build ourselves) | Type-safe query building for JSONB | HIGH |
| **PostgreSQL JDBC** | 42.x (existing) | Database connectivity | HIGH |

**Why NamedParameterJdbcTemplate:**
- Already available in Spring Boot (no new dependency)
- Named parameters (`:param`) are more readable than positional (`?`)
- Native SQL access means full PostgreSQL JSONB operator support
- Parameterized queries prevent SQL injection by design
- Returns raw `List<Map<String, Any?>>` or custom RowMappers

### NOT Recommended

| Technology | Why Not |
|------------|---------|
| **jOOQ** | Commercial license required for PostgreSQL JSONB support; adds significant complexity; overkill for this use case |
| **Exposed** | Different paradigm from existing JPA setup; learning curve; would create two competing data access patterns |
| **JPA Criteria API** | Does not support JSONB operators natively; would require ugly `function()` calls |
| **Spring Data JPA Specifications** | Same limitation as Criteria API for JSONB; designed for entity-based queries, not raw SQL |
| **Hibernate 6 JSON support** | Limited to basic JSON navigation; doesn't support `@>`, `@?`, `@@` operators needed for GIN index usage |

---

## Query Building Architecture

### Recommended: Custom Kotlin Query Builder

Build a lightweight, type-safe Kotlin DSL specifically for entity JSONB queries.

**Rationale:**
1. **Full control** over generated SQL
2. **Workspace isolation** built into the design
3. **UUID key handling** for `Map<UUID, EntityAttribute>` payloads
4. **GIN index awareness** - generate queries that use `@>` and `jsonb_path_ops`
5. **No external dependencies** - pure Kotlin

**Design Pattern:**

```kotlin
// Type-safe query builder (conceptual)
class EntityQueryBuilder(private val workspaceId: UUID) {
    private val conditions = mutableListOf<SqlCondition>()
    private val params = mutableMapOf<String, Any>()

    fun where(attributeKey: UUID, operator: Operator, value: Any): EntityQueryBuilder {
        // Generate JSONB-specific SQL with named parameters
        conditions.add(buildJsonbCondition(attributeKey, operator, value))
        return this
    }

    fun build(): SqlQuery {
        // Always include workspace isolation
        val sql = buildString {
            append("SELECT e.* FROM entities e WHERE e.workspace_id = :workspaceId ")
            append("AND e.deleted = false ")
            conditions.forEach { append("AND ${it.sql} ") }
        }
        return SqlQuery(sql, params + ("workspaceId" to workspaceId))
    }
}
```

### Alternative Considered: String Builder Pattern

The "safe StringBuilder pattern" used in some Spring applications:

```kotlin
val sql = StringBuilder("SELECT * FROM entities WHERE workspace_id = :workspaceId ")
val params = mutableMapOf<String, Any>("workspaceId" to workspaceId)

if (filter.name != null) {
    sql.append("AND payload->>:nameKey ILIKE :nameValue ")
    params["nameKey"] = filter.attributeKey.toString()
    params["nameValue"] = "%${filter.name}%"
}
```

**Why custom DSL is better:**
- Type safety catches errors at compile time
- Encapsulates JSONB operator complexity
- Easier to test and maintain
- Prevents accidental SQL injection from string concatenation

---

## PostgreSQL JSONB Query Operators

### Operators to Use (GIN Index Compatible)

| Operator | Purpose | GIN Support | Example |
|----------|---------|-------------|---------|
| `@>` | Containment (does JSON contain this?) | YES (`jsonb_path_ops`) | `payload @> '{"key": "value"}'` |
| `@?` | Path exists with condition | YES | `payload @? '$.field ? (@ > 10)'` |
| `@@` | Path match (boolean result) | YES | `payload @@ '$.field > 10'` |
| `->>` | Extract as text | NO (but fast for indexed paths) | `payload->>'field'` |
| `#>>` | Extract nested path as text | NO | `payload#>>'{a,b,c}'` |

### Operators to Avoid

| Operator | Why Avoid |
|----------|-----------|
| `->` returning JSONB | Requires additional casting; use `->>` for text comparisons |
| `?`, `?\|`, `?&` | Key existence only; `jsonb_path_ops` doesn't support these |

### UUID Key Strategy

Entity payloads use UUID keys: `Map<UUID, EntityAttribute>`. To query:

```sql
-- Extract value by UUID key
payload->>'{uuid-as-string}' = 'value'

-- Using containment (GIN-friendly)
payload @> '{"uuid-key": {"value": "search-term"}}'::jsonb

-- Using jsonpath
payload @? '$.* ? (@.value == "search-term")'
```

**Recommendation:** Store the UUID key as a string in queries. The `#>>` operator with path arrays handles this well:

```sql
payload #>> ARRAY[:attributeKey::text, 'value'] = :searchValue
```

---

## Index Strategy

### Existing Index (Verified)

From `schema.sql`:
```sql
CREATE INDEX idx_entities_payload_gin ON entities
  USING gin (payload jsonb_path_ops)
  WHERE deleted = false AND deleted_at IS NULL;
```

**This index supports:**
- `@>` containment queries (primary use case)
- `@?` and `@@` jsonpath queries
- Efficient filtering on any JSONB path

**This index does NOT support:**
- `?`, `?|`, `?&` key existence operators
- Full-text search within JSONB values

### Query Patterns That Use GIN

```sql
-- GOOD: Uses GIN index
SELECT * FROM entities
WHERE payload @> '{"uuid-key": {"value": "search"}}'::jsonb
AND workspace_id = :workspaceId

-- GOOD: Uses GIN index with jsonpath
SELECT * FROM entities
WHERE payload @? '$.* ? (@.value like_regex "search" flag "i")'
AND workspace_id = :workspaceId

-- LESS OPTIMAL: May not use GIN (but still works)
SELECT * FROM entities
WHERE payload->>'uuid-key'->>'value' = 'search'
AND workspace_id = :workspaceId
```

---

## Relationship Joins

Entity relationships are stored in `entity_relationships` table, not in JSONB. The query service must support:

1. **Filter by relationship existence**
2. **Filter by related entity attributes**
3. **Traverse bidirectional relationships**

### Join Strategy

```sql
-- Find entities with specific relationship
SELECT DISTINCT e.*
FROM entities e
JOIN entity_relationships r ON r.source_entity_id = e.id
WHERE e.workspace_id = :workspaceId
  AND r.relationship_field_id = :fieldId
  AND r.target_entity_id = :targetId
  AND r.deleted = false
  AND e.deleted = false

-- Find entities where related entity has attribute value
SELECT DISTINCT e.*
FROM entities e
JOIN entity_relationships r ON r.source_entity_id = e.id
JOIN entities target ON r.target_entity_id = target.id
WHERE e.workspace_id = :workspaceId
  AND r.relationship_field_id = :fieldId
  AND target.payload @> :jsonFilter::jsonb
  AND r.deleted = false
  AND e.deleted = false
  AND target.deleted = false
```

---

## SQL Injection Prevention

### Required Practices

1. **Always use named parameters** - Never concatenate values into SQL strings
2. **Whitelist operators** - Only allow known operators (EQUALS, CONTAINS, GREATER_THAN, etc.)
3. **Validate UUID keys** - Ensure attribute keys are valid UUIDs before query building
4. **Escape JSONB literals** - When building `@>` containment queries, properly escape JSON values

### Parameter Binding Example

```kotlin
// SAFE: Parameters are bound, not concatenated
val sql = """
    SELECT * FROM entities
    WHERE workspace_id = :workspaceId
    AND payload @> :jsonFilter::jsonb
    AND deleted = false
"""
val params = mapOf(
    "workspaceId" to workspaceId,
    "jsonFilter" to objectMapper.writeValueAsString(filterObject)
)
jdbcTemplate.queryForList(sql, params)
```

```kotlin
// UNSAFE: String concatenation - DO NOT DO THIS
val sql = "SELECT * FROM entities WHERE payload->>'$key' = '$value'"  // SQL INJECTION RISK
```

---

## Execution Layer

### NamedParameterJdbcTemplate Usage

```kotlin
@Repository
class EntityQueryRepository(
    private val jdbcTemplate: NamedParameterJdbcTemplate,
    private val objectMapper: ObjectMapper
) {
    fun executeQuery(query: EntityQuery): List<EntityQueryResult> {
        val sqlQuery = query.toSql()  // Our custom DSL generates this

        return jdbcTemplate.query(
            sqlQuery.sql,
            MapSqlParameterSource(sqlQuery.parameters),
            EntityQueryResultRowMapper(objectMapper)
        )
    }
}
```

### Row Mapping

Map results back to domain objects:

```kotlin
class EntityQueryResultRowMapper(
    private val objectMapper: ObjectMapper
) : RowMapper<EntityQueryResult> {

    override fun mapRow(rs: ResultSet, rowNum: Int): EntityQueryResult {
        val payloadJson = rs.getString("payload")
        val payload: Map<String, EntityAttributePrimitivePayload> =
            objectMapper.readValue(payloadJson)

        return EntityQueryResult(
            id = UUID.fromString(rs.getString("id")),
            typeId = UUID.fromString(rs.getString("type_id")),
            payload = payload.mapKeys { UUID.fromString(it.key) },
            // ... other fields
        )
    }
}
```

---

## Dependencies

### Already Present (No Changes Needed)

```kotlin
// build.gradle.kts - these are already in the project
implementation("org.springframework.boot:spring-boot-starter-data-jpa")
implementation("org.postgresql:postgresql")
implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
implementation("io.hypersistence:hypersistence-utils-hibernate-63:3.9.2")
```

### Optional: Enhanced Testing

```kotlin
// Consider adding for query testing
testImplementation("org.testcontainers:postgresql:1.19.x")  // Real PostgreSQL in tests
```

**Note:** The existing H2 test database does NOT support PostgreSQL JSONB operators. For testing the query service, either:
1. Mock at the repository level
2. Use Testcontainers with real PostgreSQL
3. Create integration test profile with PostgreSQL

---

## Confidence Assessment

| Component | Confidence | Rationale |
|-----------|------------|-----------|
| NamedParameterJdbcTemplate | HIGH | Standard Spring, well-documented, already in use for native queries |
| Custom Kotlin DSL | HIGH | Kotlin DSL features are mature; pattern is well-established |
| JSONB `@>` operator | HIGH | PostgreSQL official docs confirm GIN support |
| `jsonb_path_ops` index usage | HIGH | Existing index in schema.sql uses this |
| Relationship joins | MEDIUM | Need to verify query performance with large datasets |
| H2 test compatibility | LOW | H2 doesn't support JSONB; will need PostgreSQL for integration tests |

---

## Sources

### Official Documentation
- [PostgreSQL 18: JSON Functions and Operators](https://www.postgresql.org/docs/current/functions-json.html) - Authoritative reference for JSONB operators
- [PostgreSQL 18: GIN Indexes](https://www.postgresql.org/docs/current/gin.html) - GIN index behavior and operator class support

### Spring/JPA
- [Baeldung: Querying JSONB Columns Using Spring Data JPA](https://www.baeldung.com/spring-data-jpa-querying-jsonb-columns)
- [Baeldung: Storing PostgreSQL JSONB Using Spring Boot and JPA](https://www.baeldung.com/spring-boot-jpa-storing-postgresql-jsonb)
- [Spring SQL Injection Prevention](https://www.stackhawk.com/blog/sql-injection-prevention-spring/)

### PostgreSQL JSONB Indexing
- [Crunchy Data: Indexing JSONB in Postgres](https://www.crunchydata.com/blog/indexing-jsonb-in-postgres)
- [pganalyze: Understanding Postgres GIN Indexes](https://pganalyze.com/blog/gin-index)
- [Medium: JSONB GIN Index Operator Classes](https://medium.com/@josef.machytka/postgresql-jsonb-operator-classes-of-gin-indexes-and-their-usage-0bf399073a4c)

### SQL Injection Prevention
- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [Vlad Mihalcea: SQL Injection Prevention](https://vladmihalcea.com/a-beginners-guide-to-sql-injection-and-how-you-should-prevent-it/)

### Alternative Libraries (Evaluated, Not Recommended)
- [jOOQ Documentation](https://www.jooq.org/doc/latest/manual/sql-building/kotlin-sql-building/)
- [JetBrains Exposed](https://www.jetbrains.com/exposed/)
- [jooq-postgresql-json (Third-party JSONB support)](https://github.com/t9t/jooq-postgresql-json)
