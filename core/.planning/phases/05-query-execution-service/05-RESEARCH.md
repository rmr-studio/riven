# Phase 5: Query Execution Service - Research

**Researched:** 2026-02-07
**Domain:** Spring Boot Native SQL Execution with PostgreSQL
**Confidence:** HIGH

## Summary

Phase 5 implements EntityQueryService as the execution layer for entity queries. The service validates filter references against entity type schemas, executes native SQL queries via Spring's JDBC template, and returns typed Entity domain models with pagination metadata. Research confirms that Spring Boot 3.5.3 provides NamedParameterJdbcTemplate as the standard approach for native SQL execution with named parameters, aligning perfectly with SqlFragment's parameter map structure from Phase 4. Kotlin coroutines (already in dependencies via kotlinx-coroutines-reactor) enable parallel execution of data and count queries for optimal latency. PostgreSQL statement timeout can be configured via application.yml properties or per-query hints.

The two-step approach (native query returns IDs → repository loads full entities → re-sort by original order) keeps native SQL isolated from Hibernate entity mapping while preserving pagination ordering. Recursive filter tree validation requires loading multiple entity types as relationship traversals are encountered, with all errors collected in a single pass following the existing error-collection-over-fail-fast pattern from QueryFilterValidator.

**Primary recommendation:** Use NamedParameterJdbcTemplate for native SQL execution with MapSqlParameterSource, execute data/count queries in parallel via async/await coroutines, configure query timeout in application.yml, and wrap DataAccessException in QueryExecutionException with query details.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**ID validation approach:**
- Validate all attributeId and relationshipId references up-front before any SQL generation
- Service loads the EntityType from the repository using entityTypeId (caller does not pass it)
- Recursive validation: walk the entire filter tree, validating each level's attribute/relationship IDs against the correct entity type schema (requires loading multiple entity types for nested relationship filters)
- Error messages include valid options: "attributeId abc123 not found on entity type X. Valid attributes: [id1, id2, id3]"
- Collect all validation errors in a single pass (consistent with existing error-collection-over-fail-fast pattern)
- Use existing QueryFilterException sealed hierarchy for invalid ID reference errors (same as structural validation errors)

**Result mapping:**
- Two-step approach: native query returns IDs only, then load full Entity objects via repository
- Change data query from `SELECT e.*` to `SELECT e.id` for leaner first query
- After loading via repository, re-sort entities to match the original ID order from the native query (preserves ORDER BY created_at DESC pagination ordering)

**SQL execution method:**
- Data query and count query executed in parallel using Kotlin coroutines (kotlinx-coroutines)
- Configurable query timeout (e.g., 10s default) via statement timeout — configurable through application.yml

**Error handling:**
- Entity type not found: throw NotFoundException (consistent with existing service patterns)
- Invalid filter references: throw QueryFilterException (same sealed hierarchy as structural errors)
- SQL execution failure: wrap DataAccessException in a domain-specific QueryExecutionException with context (query details, timeout info)
- Zero results: normal outcome — return EntityQueryResult(entities=[], totalCount=0, hasNextPage=false)

### Claude's Discretion

- Specific JDBC execution mechanism (NamedParameterJdbcTemplate vs EntityManager)
- Coroutine dispatcher choice for parallel query execution
- Statement timeout implementation approach (SET statement_timeout vs JDBC property)
- Whether to add kotlinx-coroutines as new dependency or if it already exists

### Deferred Ideas (OUT OF SCOPE)

- Unit and integration testing for existing Phases 1-4 functionality — Phase 6.1 (End-to-End Testing)

</user_constraints>

## Standard Stack

The established libraries/tools for native SQL execution in Spring Boot:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| NamedParameterJdbcTemplate | Spring Boot 3.5.3 | Native SQL execution with named parameters | Built into Spring JDBC, pairs directly with Map<String, Any?> parameters |
| kotlinx-coroutines-reactor | 1.x (already in dependencies) | Parallel query execution | Official Kotlin coroutines support for Spring reactive stack |
| Spring Data JPA | Spring Boot 3.5.3 | Entity repository for ID-based loading | Already used throughout codebase for entity persistence |
| PostgreSQL JDBC Driver | Latest (postgresql runtime dependency) | PostgreSQL-specific features and types | Required for PostgreSQL database access |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| MapSqlParameterSource | Spring JDBC | Named parameter binding | Convert SqlFragment parameters to Spring JDBC format |
| Dispatchers.IO | kotlinx-coroutines-core | I/O-bound coroutine dispatcher | Database queries are I/O-bound operations |
| Types.OTHER | java.sql.Types | PostgreSQL UUID type handling | UUIDs require explicit type specification for PostgreSQL |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| NamedParameterJdbcTemplate | EntityManager.createNativeQuery() | EntityManager keeps you in JPA ecosystem but requires more type mapping boilerplate; NPJT is cleaner for ID-only queries |
| Parallel coroutines | Sequential execution | Sequential is simpler but adds ~100ms latency waiting for count query after data query completes |
| application.yml timeout | Per-query timeout hints | application.yml is centralized configuration (preferred); per-query hints offer more granularity but add complexity |

**Installation:**
```kotlin
// Already in build.gradle.kts:
implementation("org.springframework.boot:spring-boot-starter-data-jpa")  // Includes Spring JDBC
implementation("org.jetbrains.kotlinx:kotlinx-coroutines-reactor")      // Already present
runtimeOnly("org.postgresql:postgresql")                                 // Already present
```

## Architecture Patterns

### Recommended Service Structure
```
service/entity/
├── EntityQueryService.kt           # NEW: Single entry point for query execution
├── query/
│   ├── EntityQueryAssembler.kt    # Phase 4: Builds complete SQL
│   ├── SqlFragment.kt             # Phase 2: Immutable SQL composition
│   └── ParameterNameGenerator.kt  # Phase 2: Unique parameter names
```

### Pattern 1: Two-Step ID-Then-Load
**What:** Native query returns IDs only, then load full entities via repository, then re-sort by original ID order

**When to use:** When you need native SQL for filtering but want JPA entity mapping for results

**Example:**
```kotlin
// Source: Existing codebase patterns + Spring JDBC best practices
@Service
class EntityQueryService(
    private val namedParameterJdbcTemplate: NamedParameterJdbcTemplate,
    private val entityRepository: EntityRepository,
    private val entityTypeRepository: EntityTypeRepository,
) {
    fun executeQuery(query: EntityQuery, workspaceId: UUID): EntityQueryResult {
        // Step 1: Assemble SQL (Phase 4)
        val assembled = assembler.assemble(...)

        // Step 2: Execute native SQL for IDs only
        val ids = namedParameterJdbcTemplate.queryForList(
            assembled.dataQuery.sql.replace("SELECT e.*", "SELECT e.id"),
            MapSqlParameterSource(assembled.dataQuery.parameters),
            UUID::class.java
        )

        // Step 3: Load full entities via repository
        val entities = entityRepository.findAllById(ids)

        // Step 4: Re-sort by original ID order (preserves pagination ordering)
        val idToEntity = entities.associateBy { it.id }
        val sortedEntities = ids.mapNotNull { idToEntity[it] }

        return EntityQueryResult(...)
    }
}
```

**Why this pattern:**
- Native SQL gives full control over JSONB operators and query structure
- JPA repository handles entity-to-domain-model mapping (already implemented in EntityEntity.toModel())
- Re-sorting preserves ORDER BY created_at DESC from the SQL query
- Leaner first query (IDs only) reduces data transfer before Hibernate processing

### Pattern 2: Parallel Query Execution with Coroutines
**What:** Execute data and count queries concurrently using async/await

**When to use:** When you have independent queries that can run in parallel

**Example:**
```kotlin
// Source: Official Kotlin coroutines documentation
import kotlinx.coroutines.*

@Service
class EntityQueryService(...) {
    suspend fun executeQuery(query: EntityQuery, workspaceId: UUID): EntityQueryResult = coroutineScope {
        val dataDeferred = async(Dispatchers.IO) {
            namedParameterJdbcTemplate.queryForList(
                assembled.dataQuery.sql,
                MapSqlParameterSource(assembled.dataQuery.parameters),
                UUID::class.java
            )
        }

        val countDeferred = async(Dispatchers.IO) {
            namedParameterJdbcTemplate.queryForObject(
                assembled.countQuery.sql,
                MapSqlParameterSource(assembled.countQuery.parameters),
                Long::class.java
            ) ?: 0L
        }

        val ids = dataDeferred.await()
        val totalCount = countDeferred.await()

        // Continue with entity loading...
    }
}
```

**Why this pattern:**
- Reduces total latency from sequential to parallel execution time
- Dispatchers.IO is correct for database I/O operations (64-thread pool by default)
- coroutineScope ensures both queries complete (or both fail) before proceeding
- Spring Boot 3.x supports suspend functions in services when kotlinx-coroutines-reactor is present

### Pattern 3: Recursive Filter Tree Validation
**What:** Walk entire filter tree validating attribute/relationship IDs against schemas, collecting all errors

**When to use:** Pre-execution validation to fail fast with complete diagnostic context

**Example:**
```kotlin
// Source: Existing QueryFilterValidator.kt pattern
fun validateFilterReferences(
    filter: QueryFilter,
    entityType: EntityType,
    entityTypeCache: MutableMap<UUID, EntityType>,
): List<QueryFilterException> {
    val errors = mutableListOf<QueryFilterException>()

    fun walkFilter(f: QueryFilter, currentSchema: EntityTypeSchema, currentRels: Map<UUID, EntityRelationshipDefinition>) {
        when (f) {
            is QueryFilter.Attribute -> {
                if (f.attributeId !in currentSchema.properties.keys) {
                    errors.add(InvalidAttributeReferenceException(
                        attributeId = f.attributeId,
                        reason = "not found in entity type ${currentSchema}. Valid attributes: ${currentSchema.properties.keys}"
                    ))
                }
            }
            is QueryFilter.Relationship -> {
                val relDef = currentRels[f.relationshipId]
                if (relDef == null) {
                    errors.add(InvalidRelationshipReferenceException(
                        relationshipId = f.relationshipId,
                        reason = "not found in entity type relationships. Valid relationships: ${currentRels.keys}"
                    ))
                } else {
                    // Load target entity type for nested filter validation
                    val targetTypeKeys = relDef.entityTypeKeys ?: emptyList()
                    for (targetKey in targetTypeKeys) {
                        val targetType = loadEntityTypeByKey(targetKey, entityTypeCache)
                        walkFilter(f.condition.filter, targetType.schema, targetType.relationships.associateBy { it.id })
                    }
                }
            }
            is QueryFilter.And -> f.conditions.forEach { walkFilter(it, currentSchema, currentRels) }
            is QueryFilter.Or -> f.conditions.forEach { walkFilter(it, currentSchema, currentRels) }
        }
    }

    walkFilter(filter, entityType.schema, entityType.relationships?.associateBy { it.id } ?: emptyMap())
    return errors
}
```

**Why this pattern:**
- Consistent with existing QueryFilterValidator error-collection pattern
- Provides complete diagnostic context upfront (all errors, not just first)
- Entity type cache avoids redundant repository lookups during tree walk
- Error messages include valid options for developer debugging

### Pattern 4: Exception Wrapping with Context
**What:** Catch DataAccessException and wrap in domain-specific QueryExecutionException with query details

**When to use:** Translating infrastructure exceptions to domain layer with execution context

**Example:**
```kotlin
// Source: Spring exception handling best practices
try {
    namedParameterJdbcTemplate.queryForList(sql, params, UUID::class.java)
} catch (e: DataAccessException) {
    throw QueryExecutionException(
        message = "Failed to execute entity query: ${e.message}",
        cause = e,
        context = mapOf(
            "sql" to sql,
            "entityTypeId" to entityTypeId,
            "workspaceId" to workspaceId,
            "timeout" to queryTimeout
        )
    )
}
```

**Why this pattern:**
- Preserves root cause (DataAccessException) for debugging
- Adds domain context (which query failed, what parameters)
- Consistent with existing NotFoundException, SchemaValidationException patterns
- Enables caller to distinguish execution failures from validation failures

### Anti-Patterns to Avoid
- **String concatenation for SQL:** Always use parameterized queries via SqlFragment (already enforced by Phase 4 design)
- **Mixing JPA Criteria with native SQL:** Pick one approach per query (this phase uses pure native SQL)
- **Synchronous query execution:** Use parallel coroutines for data + count queries (reduces latency)
- **Silent null handling:** Throw descriptive exceptions for missing entity types, invalid IDs (fail fast principle)
- **Hardcoded timeouts:** Configure via application.yml for environment-specific tuning

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Named parameter binding | Custom parameter substitution | MapSqlParameterSource | Handles type conversion, null values, collections; battle-tested |
| Parallel query execution | Thread pools, ExecutorService | Kotlin coroutines (async/await) | Structured concurrency, cancellation propagation, simpler syntax |
| Entity loading by IDs | Custom SQL joins | EntityRepository.findAllById() | Hibernate second-level cache, batch fetching, entity lifecycle management |
| Query timeout enforcement | Manual thread interruption | PostgreSQL statement_timeout | Database-level enforcement, works across connection pools |
| UUID type handling for PostgreSQL | String conversion workarounds | java.sql.Types.OTHER | JDBC driver handles native UUID type correctly |

**Key insight:** Spring JDBC provides mature abstractions for named parameter queries, and Kotlin coroutines offer cleaner concurrency than manual thread management. Leverage these rather than building custom solutions.

## Common Pitfalls

### Pitfall 1: UUID Type Mapping in PostgreSQL JDBC
**What goes wrong:** PostgreSQL UUIDs returned as objects that fail casting to java.util.UUID, causing ClassCastException

**Why it happens:** PostgreSQL JDBC driver requires explicit type specification for UUID columns (java.sql.Types.OTHER)

**How to avoid:** When querying for UUIDs, use queryForList with UUID::class.java type parameter:
```kotlin
namedParameterJdbcTemplate.queryForList(
    sql,
    params,
    UUID::class.java  // Explicit type for PostgreSQL UUID handling
)
```

**Warning signs:** ClassCastException when iterating query results, "cannot cast PGobject to UUID" errors

### Pitfall 2: Losing Pagination Order After Repository Load
**What goes wrong:** entityRepository.findAllById() returns entities in arbitrary order, breaking pagination

**Why it happens:** JPA findAllById() uses IN clause which has no guaranteed ordering

**How to avoid:** Re-sort entities by original ID order from native query:
```kotlin
val ids = queryForList(...)           // IDs in correct order from SQL ORDER BY
val entities = findAllById(ids)       // Entities in arbitrary order
val idToEntity = entities.associateBy { it.id }
val sorted = ids.mapNotNull { idToEntity[it] }  // Restore original order
```

**Warning signs:** Pagination returns results in inconsistent order across pages, ORDER BY clause ignored

### Pitfall 3: Coroutine Dispatcher Mismatch
**What goes wrong:** Using Dispatchers.Default for database queries causes thread pool exhaustion under load

**Why it happens:** Dispatchers.Default is for CPU-bound work (limited to CPU core count), not I/O-bound blocking operations

**How to avoid:** Use Dispatchers.IO for database queries:
```kotlin
async(Dispatchers.IO) {  // Correct: 64-thread pool for I/O
    namedParameterJdbcTemplate.queryForList(...)
}
```

**Warning signs:** Thread starvation under concurrent queries, application becomes unresponsive

### Pitfall 4: Missing Workspace Isolation in Entity Loading
**What goes wrong:** Loading entities by IDs across workspaces exposes data isolation vulnerability

**Why it happens:** EntityRepository.findAllById() doesn't filter by workspace_id, SQL WHERE clause already did

**How to avoid:** Trust workspace isolation from SQL query (IDs already filtered), but add defensive check:
```kotlin
val entities = entityRepository.findAllById(ids)
require(entities.all { it.workspaceId == workspaceId }) {
    "Entity isolation violation: loaded entities from wrong workspace"
}
```

**Warning signs:** Security audit flags cross-workspace data access, integration tests fail with mixed workspace data

### Pitfall 5: Timeout Configuration Not Taking Effect
**What goes wrong:** Query timeout configured in application.yml but long-running queries still time out at default interval

**Why it happens:** Multiple timeout layers (connection, statement, transaction) with different precedence

**How to avoid:** Set statement-level timeout in application.yml:
```yaml
spring:
  jpa:
    properties:
      hibernate.query.timeout: 10000  # milliseconds
```
Or use JdbcTemplate.setQueryTimeout() for per-query control.

**Warning signs:** Queries timeout at 30s regardless of configuration, timeout exceptions don't match configured value

## Code Examples

Verified patterns from existing codebase and official documentation:

### Executing Native SQL with Named Parameters
```kotlin
// Source: Spring JDBC NamedParameterJdbcTemplate documentation
@Service
class EntityQueryService(
    private val namedParameterJdbcTemplate: NamedParameterJdbcTemplate,
    private val entityRepository: EntityRepository,
) {
    fun executeQuery(
        assembled: AssembledQuery,
        workspaceId: UUID,
    ): List<UUID> {
        // SqlFragment already has named parameters in Map<String, Any?> format
        val paramSource = MapSqlParameterSource(assembled.dataQuery.parameters)

        // queryForList with type parameter handles PostgreSQL UUID conversion
        return namedParameterJdbcTemplate.queryForList(
            assembled.dataQuery.sql.replace("SELECT e.*", "SELECT e.id"),
            paramSource,
            UUID::class.java
        )
    }
}
```

### Parallel Query Execution with Coroutines
```kotlin
// Source: Kotlin coroutines documentation + Spring Boot integration
import kotlinx.coroutines.*

@Service
class EntityQueryService(...) {
    suspend fun executeQueryParallel(
        assembled: AssembledQuery,
    ): Pair<List<UUID>, Long> = coroutineScope {
        // Launch both queries in parallel on IO dispatcher
        val idsDeferred = async(Dispatchers.IO) {
            namedParameterJdbcTemplate.queryForList(
                assembled.dataQuery.sql.replace("SELECT e.*", "SELECT e.id"),
                MapSqlParameterSource(assembled.dataQuery.parameters),
                UUID::class.java
            )
        }

        val countDeferred = async(Dispatchers.IO) {
            namedParameterJdbcTemplate.queryForObject(
                assembled.countQuery.sql,
                MapSqlParameterSource(assembled.countQuery.parameters),
                Long::class.java
            ) ?: 0L
        }

        // await() suspends until results ready
        Pair(idsDeferred.await(), countDeferred.await())
    }
}
```

### Recursive Filter Validation with Entity Type Loading
```kotlin
// Source: Existing QueryFilterValidator.kt pattern
@Service
class EntityQueryService(
    private val entityTypeRepository: EntityTypeRepository,
) {
    private fun validateFilterReferences(
        filter: QueryFilter,
        rootEntityType: EntityType,
    ): List<QueryFilterException> {
        val errors = mutableListOf<QueryFilterException>()
        val entityTypeCache = mutableMapOf<String, EntityType>()

        fun loadEntityTypeByKey(key: String): EntityType? {
            return entityTypeCache.getOrPut(key) {
                entityTypeRepository.findByworkspaceIdAndKey(rootEntityType.workspaceId!!, key)
                    .orElse(null)
            }
        }

        fun walk(f: QueryFilter, schema: EntityTypeSchema, rels: Map<UUID, EntityRelationshipDefinition>) {
            when (f) {
                is QueryFilter.Attribute -> {
                    if (f.attributeId !in schema.properties.keys) {
                        errors.add(InvalidAttributeReferenceException(
                            attributeId = f.attributeId,
                            reason = "not found. Valid attributes: ${schema.properties.keys.joinToString()}"
                        ))
                    }
                }
                is QueryFilter.Relationship -> {
                    val def = rels[f.relationshipId]
                    if (def == null) {
                        errors.add(InvalidRelationshipReferenceException(
                            relationshipId = f.relationshipId,
                            reason = "not found. Valid relationships: ${rels.keys.joinToString()}"
                        ))
                    } else {
                        // Recurse into relationship target types
                        val targetKeys = def.entityTypeKeys ?: emptyList()
                        for (targetKey in targetKeys) {
                            val targetType = loadEntityTypeByKey(targetKey)
                            if (targetType != null) {
                                walk(
                                    extractNestedFilter(f.condition),
                                    targetType.schema,
                                    targetType.relationships?.associateBy { it.id } ?: emptyMap()
                                )
                            }
                        }
                    }
                }
                is QueryFilter.And -> f.conditions.forEach { walk(it, schema, rels) }
                is QueryFilter.Or -> f.conditions.forEach { walk(it, schema, rels) }
            }
        }

        walk(filter, rootEntityType.schema, rootEntityType.relationships?.associateBy { it.id } ?: emptyMap())
        return errors
    }
}
```

### Exception Wrapping with Query Context
```kotlin
// Source: Spring exception handling best practices
class QueryExecutionException(
    message: String,
    cause: Throwable? = null,
    val context: Map<String, Any?> = emptyMap(),
) : RuntimeException(message, cause)

@Service
class EntityQueryService(...) {
    fun executeWithErrorHandling(sql: String, params: Map<String, Any?>, entityTypeId: UUID): List<UUID> {
        return try {
            namedParameterJdbcTemplate.queryForList(
                sql,
                MapSqlParameterSource(params),
                UUID::class.java
            )
        } catch (e: DataAccessException) {
            throw QueryExecutionException(
                message = "Failed to execute entity query: ${e.message}",
                cause = e,
                context = mapOf(
                    "sql" to sql,
                    "parameterCount" to params.size,
                    "entityTypeId" to entityTypeId,
                )
            )
        }
    }
}
```

### Re-sorting Entities to Preserve Pagination Order
```kotlin
// Source: Common pattern for preserving query result order after JPA load
fun loadAndSortEntities(ids: List<UUID>, repository: EntityRepository): List<Entity> {
    // JPA findAllById uses IN clause with arbitrary ordering
    val entities = repository.findAllById(ids)

    // Build ID-to-entity lookup map
    val idToEntity = entities.associateBy { requireNotNull(it.id) }

    // Re-sort by original ID order from SQL query
    return ids.mapNotNull { id ->
        idToEntity[id]?.toModel(relationships = emptyMap())
    }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JdbcTemplate with positional parameters | NamedParameterJdbcTemplate | Spring 2.x | Named parameters improve readability and prevent parameter order bugs |
| EntityManager.createNativeQuery() | NamedParameterJdbcTemplate for ID queries | Spring Boot 3.x best practices | Cleaner separation: JDBC for native SQL, JPA for entity mapping |
| Sequential query execution | Parallel coroutines (async/await) | Kotlin 1.3+ | Reduces latency by executing independent queries concurrently |
| Per-query timeout via JDBC API | application.yml configuration | Spring Boot 2.x | Centralized timeout configuration across all queries |
| String UUID conversion | java.sql.Types.OTHER for PostgreSQL | JDBC 4.2+ | Native UUID type support eliminates conversion overhead |

**Deprecated/outdated:**
- JdbcTemplate.queryForObject() with RowMapper for single values: Use type-safe queryForObject(sql, params, Class<T>) instead
- Manual thread pools for parallel queries: Use Kotlin coroutines structured concurrency
- Setting timeout via @Transactional(timeout=X): Use spring.jpa.properties.hibernate.query.timeout for query-level control

## Open Questions

Things that couldn't be fully resolved:

1. **Coroutine context propagation in Spring services**
   - What we know: Spring Boot 3.x supports suspend functions when kotlinx-coroutines-reactor is present
   - What's unclear: Whether @Transactional works with suspend functions, or if we need @Transactional on wrapper
   - Recommendation: Test transactional behavior with suspend executeQuery(); if issues arise, use non-suspend wrapper with runBlocking

2. **Query timeout granularity**
   - What we know: application.yml supports spring.jpa.properties.hibernate.query.timeout (global), JdbcTemplate.setQueryTimeout() (per-template)
   - What's unclear: Whether NamedParameterJdbcTemplate respects JPA timeout properties or needs separate configuration
   - Recommendation: Configure spring.jdbc.template.query-timeout in application.yml; validate in integration tests

3. **Entity type cache invalidation**
   - What we know: Validation loads multiple entity types during recursive tree walk
   - What's unclear: Whether entity types can change mid-validation (concurrent schema updates)
   - Recommendation: Accept stale schema risk for now (schema changes are rare); Phase 6 can add optimistic locking if needed

## Sources

### Primary (HIGH confidence)
- Existing codebase (build.gradle.kts, EntityQueryAssembler.kt, QueryFilterValidator.kt, EntityEntity.kt, EntityService.kt)
- [Spring JDBC NamedParameterJdbcTemplate documentation](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/jdbc/core/namedparam/NamedParameterJdbcTemplate.html)
- [Kotlin Coroutines Official Documentation](https://kotlinlang.org/docs/coroutine-context-and-dispatchers.html)

### Secondary (MEDIUM confidence)
- [Spring JDBC Tutorial | Baeldung](https://www.baeldung.com/spring-jdbc-jdbctemplate)
- [NamedParameterJdbcTemplate query methods | Mkyong](https://mkyong.com/spring/spring-jdbctemplate-querying-examples/)
- [Kotlin Coroutines: Waiting for Multiple Threads | Baeldung](https://www.baeldung.com/kotlin/coroutines-waiting-for-multiple-threads)
- [Using Kotlin Coroutines for Parallel Execution | Stefan Kreidel](https://www.stefankreidel.io/blog/kotlin-coroutines-async)
- [Query Timeout Configuration in Spring Boot | Medium](https://medium.com/@AlexanderObregon/query-timeout-configuration-in-spring-boot-with-jpa-properties-4b75f6d84f33)
- [Spring DataAccessException wrapping best practices | Spring.io](https://docs.spring.io/spring-framework/docs/4.0.x/spring-framework-reference/html/dao.html)

### Tertiary (LOW confidence)
- [NamedParameterJdbcTemplate UUID handling issue | GitHub](https://github.com/spring-projects/spring-framework/issues/26481) - Known issue with UUID collections
- [PostgreSQL statement timeout | Crunchy Data](https://www.crunchydata.com/blog/control-runaway-postgres-queries-with-statement-timeout)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - NamedParameterJdbcTemplate and coroutines verified in existing dependencies and official docs
- Architecture: HIGH - Patterns derived from existing codebase (QueryFilterValidator, EntityService) and Spring best practices
- Pitfalls: MEDIUM - UUID type handling and dispatcher choice verified in docs; pagination order pitfall from common patterns

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (30 days - stable Spring Boot 3.x stack)
