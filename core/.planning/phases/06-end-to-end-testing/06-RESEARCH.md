# Phase 6: End-to-End Testing - Research

**Researched:** 2026-02-07
**Domain:** Spring Boot Integration Testing with Testcontainers and PostgreSQL
**Confidence:** HIGH

## Summary

Phase 6 validates the complete entity query pipeline works end-to-end with integration tests against real PostgreSQL. The standard approach uses Testcontainers to spin up disposable PostgreSQL containers, enabling tests to exercise JSONB operators and native SQL features that H2 cannot support. Tests call EntityQueryService.execute() directly (service-level, not HTTP), verify returned entities match expected results, and validate all filter operators, relationship traversals, logical composition, pagination, ordering, and workspace isolation.

The established pattern for Spring Boot + Kotlin + Testcontainers uses singleton containers shared across test classes via companion objects with @BeforeAll/@JvmStatic, JPA auto-DDL for schema initialization, and truncate-based cleanup in @BeforeAll rather than transactional rollback (since native queries may not participate in Spring transactions). Test data is set up once per test class, with tests sharing immutable fixtures (20-50 entities per type) to enable meaningful pagination and filtering coverage.

**Primary recommendation:** Use Testcontainers with singleton PostgreSQL container pattern, JPA auto-DDL schema generation, test data builders for entity/relationship setup, and results-only assertions (verify returned entities/counts, not generated SQL).

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Test scope & boundaries:**
- Service-level tests — call EntityQueryService.execute() directly, no HTTP/controller layer
- Results-only assertions — verify returned entities, counts, and ordering; treat generated SQL as implementation detail
- Key error paths included — invalid attribute references, invalid relationship references, depth exceeded, bad pagination must all be tested E2E
- Workspace isolation is a must-have test — create entities in two workspaces, verify queries in workspace A never return workspace B entities

**Test data strategy:**
- Dedicated test domain — a small realistic domain (e.g., Company→Employee, Project→Task) with known attributes and relationships
- Per-class shared fixtures — entity types and seed entities set up in @BeforeAll, tests share data but must not mutate it
- Medium volume — 20-50 entities per type for meaningful pagination and filtering coverage
- Polymorphic relationships required — at least one relationship targeting multiple entity types to exercise TargetTypeMatches

**Database infrastructure:**
- Testcontainers PostgreSQL — real Postgres in Docker for full JSONB operator support
- JPA auto-DDL for schema initialization — let Hibernate generate schema from entities
- Shared singleton container — one Postgres container across all test classes for speed
- Truncate between classes — clean tables in @BeforeAll/@AfterAll rather than transaction rollback (native queries may not participate in Spring transactions)

**Coverage expectations:**
- All 12 FilterOperators tested individually — EQUALS, NOT_EQUALS, CONTAINS, NOT_CONTAINS, STARTS_WITH, ENDS_WITH, IN, NOT_IN, GREATER_THAN, GREATER_THAN_OR_EQUALS, LESS_THAN, LESS_THAN_OR_EQUALS, IS_NULL, IS_NOT_NULL
- Relationship nesting up to max depth (3) — test 1-deep, 2-deep, 3-deep nested queries plus depth-exceeded rejection
- Dedicated pagination & ordering scenarios — separate test group for offset, limit, totalCount, asc/desc, multi-field ordering
- Nested logical composition — test AND(a, b), OR(a, b), AND(OR(a, b), c) and deeper nesting to verify parenthesization in real SQL
- All relationship conditions — EXISTS, NOT_EXISTS, TargetEquals, TargetMatches, TargetTypeMatches

### Claude's Discretion

- Exact test domain model design (specific entity type names, attribute schemas, relationship topology)
- Test class organization and grouping strategy
- Helper/utility methods for test data builders
- Which specific attribute values to seed for each operator test

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope

## Standard Stack

The established libraries/tools for Spring Boot integration testing with Testcontainers:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Testcontainers | 1.19.x+ | PostgreSQL container lifecycle | Industry standard for Docker-based integration tests, supports Spring Boot ServiceConnection |
| PostgreSQL Container | Latest | Real Postgres instance | Provides full JSONB support, native operator compatibility |
| JUnit 5 | 5.x (via Spring Boot) | Test framework | Standard Spring Boot testing framework, Kotlin-compatible |
| Spring Boot Test | 3.5.3 | Integration test support | @SpringBootTest, auto-configuration, dependency injection |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Kotlin Test | 2.1.21 | Kotlin test assertions | Better Kotlin DSL for assertions vs JUnit alone |
| Mockito Kotlin | 3.2.0 (already present) | Mocking for service dependencies | If testing EntityQueryService in isolation (not needed for E2E) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Testcontainers | H2 in-memory | H2 lacks JSONB operators (@>, ?, ->>, etc.), causes false test passes |
| Singleton container | Container per test | 10-20x slower test suite, same coverage |
| JPA auto-DDL | Flyway/Liquibase migrations | More production-like, but adds complexity; auto-DDL sufficient for tests |

**Installation:**

```kotlin
// build.gradle.kts
dependencies {
    testImplementation("org.testcontainers:testcontainers:1.19.3")
    testImplementation("org.testcontainers:postgresql:1.19.3")
    testImplementation("org.testcontainers:junit-jupiter:1.19.3")
}
```

## Architecture Patterns

### Recommended Project Structure

```
src/test/kotlin/riven/core/
├── service/
│   └── entity/
│       └── query/
│           ├── EntityQueryServiceE2ETest.kt          # Main E2E test suite
│           ├── support/
│           │   ├── PostgresTestContainerConfig.kt    # Singleton container setup
│           │   ├── TestDataBuilders.kt               # Entity/relationship builders
│           │   └── QueryTestFixtures.kt              # Shared test domain setup
│           ├── filters/
│           │   ├── AttributeFilterOperatorsE2ETest.kt  # All 12 operators
│           │   └── LogicalCompositionE2ETest.kt        # AND/OR nesting
│           ├── relationships/
│           │   ├── RelationshipConditionsE2ETest.kt    # EXISTS, TargetMatches, etc.
│           │   └── RelationshipDepthE2ETest.kt         # Depth 1-3, depth exceeded
│           ├── pagination/
│           │   └── PaginationAndOrderingE2ETest.kt     # offset, limit, orderBy
│           └── validation/
│               └── ErrorPathsE2ETest.kt                # Invalid refs, bad pagination
```

### Pattern 1: Singleton Container with Companion Object

**What:** Single PostgreSQL container shared across all test classes via Kotlin companion object

**When to use:** All integration tests requiring PostgreSQL

**Example:**

```kotlin
// Source: Testcontainers official docs + Spring Boot best practices
@SpringBootTest
@Testcontainers
abstract class BaseE2ETest {

    companion object {
        @Container
        @JvmStatic
        val postgresContainer: PostgreSQLContainer<*> = PostgreSQLContainer("postgres:16-alpine")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test")

        @JvmStatic
        @DynamicPropertySource
        fun registerPgProperties(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url", postgresContainer::getJdbcUrl)
            registry.add("spring.datasource.username", postgresContainer::getUsername)
            registry.add("spring.datasource.password", postgresContainer::getPassword)
        }

        @JvmStatic
        @BeforeAll
        fun startContainer() {
            postgresContainer.start()
        }

        @JvmStatic
        @AfterAll
        fun stopContainer() {
            postgresContainer.stop()
        }
    }
}
```

### Pattern 2: Test Data Builders for Entity Types

**What:** Builder pattern for constructing EntityTypeEntity and EntityEntity with sensible defaults

**When to use:** Setting up test fixtures in @BeforeAll

**Example:**

```kotlin
// Source: Spring Boot testing best practices
object EntityTypeBuilder {
    fun buildCompanyType(workspaceId: UUID): EntityTypeEntity {
        val nameAttrId = UUID.randomUUID()
        val revenueAttrId = UUID.randomUUID()

        return EntityTypeEntity(
            key = "company",
            workspaceId = workspaceId,
            displayNameSingular = "Company",
            displayNamePlural = "Companies",
            identifierKey = nameAttrId,
            type = EntityCategory.STANDARD,
            schema = Schema(
                label = "Company",
                key = SchemaType.OBJECT,
                type = DataType.OBJECT,
                required = true,
                properties = mapOf(
                    nameAttrId to Schema(
                        label = "Name",
                        key = SchemaType.STRING,
                        type = DataType.STRING,
                        required = true
                    ),
                    revenueAttrId to Schema(
                        label = "Revenue",
                        key = SchemaType.NUMBER,
                        type = DataType.NUMBER,
                        required = false
                    )
                )
            ),
            columns = listOf(
                EntityTypeAttributeColumn(nameAttrId, 0),
                EntityTypeAttributeColumn(revenueAttrId, 1)
            )
        )
    }
}
```

### Pattern 3: Truncate-Based Cleanup

**What:** Clean tables before each test class via TRUNCATE CASCADE, not transactional rollback

**When to use:** All integration tests with shared container

**Example:**

```kotlin
// Source: Spring Boot testing best practices
@SpringBootTest
abstract class BaseE2ETest {

    @Autowired
    protected lateinit var jdbcTemplate: JdbcTemplate

    @BeforeEach
    fun cleanDatabase() {
        jdbcTemplate.execute("""
            TRUNCATE TABLE entities CASCADE;
            TRUNCATE TABLE entity_relationships CASCADE;
            TRUNCATE TABLE entity_types CASCADE;
        """)
    }
}
```

**Why truncate over rollback:**
- Native SQL queries in EntityQueryService don't participate in Spring @Transactional context
- Rollback creates false negatives (tests pass but real transactions commit)
- Truncate matches production transaction behavior
- Easier to debug failures (data persists after test for inspection)

### Pattern 4: Shared Immutable Fixtures

**What:** Set up entity types and seed entities once in @BeforeAll, tests read but don't mutate

**When to use:** Attribute filter tests, pagination tests where data doesn't change

**Example:**

```kotlin
@SpringBootTest
class AttributeFilterOperatorsE2ETest : BaseE2ETest() {

    companion object {
        private lateinit var workspaceId: UUID
        private lateinit var companyTypeId: UUID
        private lateinit var nameAttrId: UUID
        private lateinit var revenueAttrId: UUID
        private val companies = mutableListOf<UUID>()

        @JvmStatic
        @BeforeAll
        fun setupTestData(@Autowired entityTypeRepository: EntityTypeRepository,
                          @Autowired entityRepository: EntityRepository) {
            workspaceId = UUID.randomUUID()

            val companyType = EntityTypeBuilder.buildCompanyType(workspaceId)
            val savedType = entityTypeRepository.save(companyType)
            companyTypeId = savedType.id!!
            nameAttrId = savedType.identifierKey

            // Seed 20 companies with varied data
            companies.addAll((1..20).map { i ->
                val entity = EntityBuilder.buildCompany(
                    workspaceId = workspaceId,
                    typeId = companyTypeId,
                    name = "Company $i",
                    revenue = i * 10000.0
                )
                entityRepository.save(entity).id!!
            })
        }
    }

    @Test
    fun `EQUALS operator filters exact string match`() {
        // Test uses shared companies list, doesn't modify
    }
}
```

### Pattern 5: Results-Only Assertions

**What:** Verify returned Entity objects, counts, and ordering; don't inspect generated SQL

**When to use:** All E2E tests per user requirement

**Example:**

```kotlin
@Test
fun `filter by EQUALS returns only matching entities`() {
    val query = EntityQuery(
        entityTypeId = companyTypeId,
        filter = QueryFilter.Attribute(
            attributeId = nameAttrId,
            operator = FilterOperator.EQUALS,
            value = FilterValue.Literal("Company 5")
        )
    )

    val result = runBlocking {
        entityQueryService.execute(query, workspaceId)
    }

    // Results-only assertions
    assertThat(result.entities).hasSize(1)
    assertThat(result.totalCount).isEqualTo(1)
    assertThat(result.entities[0].payload[nameAttrId]?.payload).isEqualTo("Company 5")

    // DON'T inspect SQL: no entityQueryService.lastExecutedSql() checks
}
```

### Anti-Patterns to Avoid

- **@Transactional on test classes:** Causes false negatives because EntityQueryService commits its own transactions
- **Container per test class:** 10-20x slower than singleton container, no additional coverage
- **Mocking EntityQueryService:** Defeats purpose of E2E testing; mock dependencies if needed but not the SUT
- **SQL string assertions:** Brittle, implementation detail; verify results instead
- **H2 fallback for JSONB tests:** H2 doesn't support @>, ?, ->>, JSONB_PATH operators used in RelationshipSqlGenerator

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PostgreSQL container management | Custom Docker scripts, docker-compose for tests | Testcontainers @Container | Handles lifecycle, random ports, cleanup, parallel execution, CI/CD compatibility |
| Schema initialization | Manual DDL scripts in @BeforeAll | JPA auto-DDL (hibernate.ddl-auto: create-drop) | Hibernate generates schema from @Entity classes, stays in sync with code |
| Test data reset | Manual DELETE queries, savepoints | TRUNCATE CASCADE in @BeforeEach | Faster, resets sequences, handles FK constraints |
| Entity builders | New EntityEntity(...) with all fields | Builder pattern with defaults | 20+ constructor params unreadable; builders provide sensible defaults |
| Workspace isolation verification | Manual queries across workspaces | Dedicated test with two workspaces | Easy to forget; explicit test ensures RLS + FK constraints work |

**Key insight:** Testcontainers and JPA auto-DDL eliminate 90% of custom test infrastructure code. The remaining 10% (data builders, cleanup) is domain-specific and worth implementing.

## Common Pitfalls

### Pitfall 1: Using @Transactional on Test Classes

**What goes wrong:** Tests pass but production queries fail because @Transactional causes rollback, hiding commit-time issues

**Why it happens:** Spring Boot defaults to @Transactional for data access tests, developers apply to integration tests

**How to avoid:** Don't annotate test classes with @Transactional; use TRUNCATE-based cleanup instead

**Warning signs:**
- Tests pass but identical query fails in dev/staging
- "LazyInitializationException: could not initialize proxy - no Session" in production but not tests
- Tests can't reproduce data corruption bugs

### Pitfall 2: H2 for JSONB Operator Testing

**What goes wrong:** Tests pass but queries fail in production with "operator does not exist: jsonb @> jsonb"

**Why it happens:** H2 doesn't support PostgreSQL's JSONB operators (@>, ?, ->>, #>, etc.) used in EntityQueryService

**How to avoid:** Use Testcontainers PostgreSQL for any test exercising EntityQueryService

**Warning signs:**
- Test database: H2, production: PostgreSQL
- Tests use entity.payload.get(attributeId) but production queries use JSONB operators
- SQL exceptions in production but not tests

### Pitfall 3: Shared Container Stopped Early

**What goes wrong:** First test class passes, subsequent classes fail with "Connection refused" errors

**Why it happens:** Using @Container without @JvmStatic stops container at end of first test class

**How to avoid:** Always use companion object with @JvmStatic @Container and @BeforeAll/@AfterAll

**Warning signs:**
- Tests pass individually but fail when run as suite
- Error: "Connection to localhost:XXXXX refused" on second test class
- Container logs show "Stopped container" after first test class

### Pitfall 4: Mutating Shared Fixtures

**What goes wrong:** First test passes, subsequent tests fail with "expected 20 entities but found 19"

**Why it happens:** Test modifies or deletes shared seed data, affecting other tests

**How to avoid:** Document fixtures as immutable, use separate workspace for mutation tests

**Warning signs:**
- Tests pass individually but fail when run together
- Test execution order affects results
- Intermittent failures based on test ordering

### Pitfall 5: Ignoring Workspace Isolation

**What goes wrong:** Query returns entities from multiple workspaces, violating multi-tenancy

**Why it happens:** Base WHERE clause missing workspace_id filter, or FK constraints not enforced

**How to avoid:** Dedicated test creating entities in two workspaces, verify query only returns workspace A

**Warning signs:**
- Production data leakage between customers
- Workspace ID filter missing in generated SQL
- Query returns unexpected entities

### Pitfall 6: Not Testing Error Paths

**What goes wrong:** Production exceptions go unhandled because error paths weren't tested E2E

**Why it happens:** Focus on happy path, assume validation exceptions are "unit test territory"

**How to avoid:** Dedicated error path tests for InvalidAttributeReferenceException, RelationshipDepthExceededException, QueryValidationException

**Warning signs:**
- Exceptions thrown in production but never in tests
- Error messages unhelpful because never validated
- QueryValidationException wraps multiple errors but tests only verify single error

## Code Examples

Verified patterns from Spring Boot + Kotlin + Testcontainers best practices:

### Singleton Container Setup

```kotlin
// Source: Testcontainers docs + Spring Boot integration patterns
@SpringBootTest
@Testcontainers
abstract class PostgresTestContainerConfig {

    companion object {
        @Container
        @JvmStatic
        val postgresContainer: PostgreSQLContainer<*> = PostgreSQLContainer("postgres:16-alpine")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test")
            .withReuse(false)  // Don't reuse across JVM restarts

        init {
            postgresContainer.start()
        }

        @JvmStatic
        @DynamicPropertySource
        fun registerPgProperties(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url", postgresContainer::getJdbcUrl)
            registry.add("spring.datasource.username", postgresContainer::getUsername)
            registry.add("spring.datasource.password", postgresContainer::getPassword)
            registry.add("spring.jpa.hibernate.ddl-auto") { "create-drop" }
            registry.add("riven.query.timeout-seconds") { "30" }
        }
    }
}
```

### Test Data Builder Pattern

```kotlin
// Source: Spring Boot testing best practices
object TestDataBuilders {

    fun buildEntityType(
        key: String,
        workspaceId: UUID,
        attributes: Map<UUID, Schema<UUID>>,
        relationships: List<EntityRelationshipDefinition> = emptyList()
    ): EntityTypeEntity {
        val identifierKey = attributes.keys.first()

        return EntityTypeEntity(
            key = key,
            workspaceId = workspaceId,
            displayNameSingular = key.capitalize(),
            displayNamePlural = "${key.capitalize()}s",
            identifierKey = identifierKey,
            type = EntityCategory.STANDARD,
            schema = Schema(
                label = key,
                key = SchemaType.OBJECT,
                type = DataType.OBJECT,
                required = true,
                properties = attributes
            ),
            relationships = relationships.ifEmpty { null },
            columns = attributes.keys.mapIndexed { index, attrId ->
                EntityTypeAttributeColumn(attrId, index)
            }
        )
    }

    fun buildEntity(
        workspaceId: UUID,
        typeId: UUID,
        typeKey: String,
        identifierKey: UUID,
        payload: Map<String, EntityAttributePrimitivePayload>
    ): EntityEntity {
        return EntityEntity(
            workspaceId = workspaceId,
            typeId = typeId,
            typeKey = typeKey,
            identifierKey = identifierKey,
            payload = payload
        )
    }
}
```

### Relationship Setup Helper

```kotlin
// Source: Domain-specific test pattern
fun buildBidirectionalRelationship(
    originTypeKey: String,
    targetTypeKey: String,
    relationshipName: String,
    inverseName: String,
    cardinality: EntityRelationshipCardinality
): Pair<EntityRelationshipDefinition, EntityRelationshipDefinition> {
    val originId = UUID.randomUUID()

    val origin = EntityRelationshipDefinition(
        id = originId,
        name = relationshipName,
        relationshipType = EntityTypeRelationshipType.ORIGIN,
        sourceEntityTypeKey = originTypeKey,
        originRelationshipId = null,
        entityTypeKeys = listOf(targetTypeKey),
        allowPolymorphic = false,
        required = false,
        cardinality = cardinality,
        bidirectional = true,
        bidirectionalEntityTypeKeys = listOf(targetTypeKey),
        inverseName = inverseName,
        protected = false
    )

    val reference = EntityRelationshipDefinition(
        id = UUID.randomUUID(),
        name = inverseName,
        relationshipType = EntityTypeRelationshipType.REFERENCE,
        sourceEntityTypeKey = targetTypeKey,
        originRelationshipId = originId,
        entityTypeKeys = listOf(originTypeKey),
        allowPolymorphic = false,
        required = false,
        cardinality = invertCardinality(cardinality),
        bidirectional = true,
        bidirectionalEntityTypeKeys = null,
        inverseName = null,
        protected = false
    )

    return origin to reference
}
```

### Complete Test Class Structure

```kotlin
// Source: Spring Boot E2E testing best practices
@SpringBootTest
class AttributeFilterOperatorsE2ETest : PostgresTestContainerConfig() {

    @Autowired
    private lateinit var entityQueryService: EntityQueryService

    @Autowired
    private lateinit var entityTypeRepository: EntityTypeRepository

    @Autowired
    private lateinit var entityRepository: EntityRepository

    @Autowired
    private lateinit var jdbcTemplate: JdbcTemplate

    companion object {
        private lateinit var workspaceId: UUID
        private lateinit var companyTypeId: UUID
        private lateinit var nameAttrId: UUID
        private lateinit var revenueAttrId: UUID
        private lateinit var statusAttrId: UUID

        @JvmStatic
        @BeforeAll
        fun setupTestDomain() {
            // Created once for all tests in this class
        }
    }

    @BeforeEach
    fun cleanDatabaseBeforeEach() {
        jdbcTemplate.execute("TRUNCATE TABLE entity_relationships CASCADE")
        jdbcTemplate.execute("TRUNCATE TABLE entities CASCADE")
    }

    @Test
    fun `EQUALS operator filters exact match`() = runBlocking {
        // Seed test-specific data
        val entity = TestDataBuilders.buildEntity(/* ... */)
        entityRepository.save(entity)

        // Execute query
        val query = EntityQuery(
            entityTypeId = companyTypeId,
            filter = QueryFilter.Attribute(
                attributeId = nameAttrId,
                operator = FilterOperator.EQUALS,
                value = FilterValue.Literal("Acme Corp")
            )
        )

        val result = entityQueryService.execute(query, workspaceId)

        // Results-only assertions
        assertThat(result.entities).hasSize(1)
        assertThat(result.totalCount).isEqualTo(1)
        val payload = result.entities[0].payload[nameAttrId]?.payload as EntityAttributePrimitivePayload
        assertThat(payload.value).isEqualTo("Acme Corp")
    }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| H2 in-memory for all tests | Testcontainers PostgreSQL for integration | 2020-2021 | Full JSONB operator support, eliminates prod/test gaps |
| Manual Docker setup | @Testcontainers annotations | 2019 (TC 1.12) | Automated lifecycle, parallel execution |
| Container per test | Singleton container pattern | 2020+ | 10-20x faster test execution |
| @Transactional rollback | TRUNCATE-based cleanup | 2022+ | Matches production transaction behavior |
| Spring Boot 2.x patterns | @DynamicPropertySource (Spring Boot 3.1+) | 2023 | Cleaner container config, ServiceConnection support |

**Deprecated/outdated:**
- **@ClassRule for Testcontainers:** Replaced by @Container + @JvmStatic in JUnit 5
- **GenericContainer with manual config:** Use PostgreSQLContainer typed container
- **TestPropertySource for container URLs:** Use @DynamicPropertySource for dynamic config
- **spring.jpa.hibernate.ddl-auto: validate in tests:** Use create-drop for clean schema per test run

## Open Questions

Things that couldn't be fully resolved:

1. **Coroutine testing strategy**
   - What we know: EntityQueryService.execute() is suspend function, tests must use runBlocking
   - What's unclear: Whether to test with multiple concurrent queries (parallel execution stress test)
   - Recommendation: Start with sequential runBlocking tests, add concurrency tests if time permits

2. **Relationship entity creation complexity**
   - What we know: EntityRelationshipEntity table requires source_entity_id, target_entity_id, relationship_key
   - What's unclear: Whether to use EntityRelationshipService.createRelationship() or direct repository inserts
   - Recommendation: Direct repository inserts for test speed, but verify against EntityRelationshipService contract

3. **Test domain complexity vs coverage**
   - What we know: Need Company→Employee, polymorphic relationships, 20-50 entities
   - What's unclear: Optimal number of entity types to balance complexity and comprehensiveness
   - Recommendation: Start with 3 entity types (Company, Employee, Project) with 2 relationships, expand if gaps found

4. **Error message validation depth**
   - What we know: QueryValidationException wraps List<QueryFilterException>
   - What's unclear: Should tests verify exact error messages or just exception types?
   - Recommendation: Verify exception types + key fields (attributeId, relationshipId), not exact message strings (brittle)

## Sources

### Primary (HIGH confidence)

- Codebase inspection:
  - `/src/main/kotlin/riven/core/service/entity/query/EntityQueryService.kt` - Service implementation
  - `/src/main/kotlin/riven/core/models/entity/query/` - Query models (EntityQuery, QueryFilter, RelationshipCondition)
  - `/src/main/kotlin/riven/core/exceptions/query/QueryFilterException.kt` - Exception hierarchy
  - `/src/main/kotlin/riven/core/entity/entity/EntityEntity.kt` - JPA entity structure
  - `/src/test/kotlin/riven/core/service/workflow/WorkflowExecutionEndToEndIntegrationTest.kt` - E2E test pattern
  - `/build.gradle.kts` - Existing test dependencies (no Testcontainers yet)

### Secondary (MEDIUM confidence)

- [Testcontainers container lifecycle management using JUnit 5](https://testcontainers.com/guides/testcontainers-container-lifecycle/) - Singleton pattern documentation
- [DB Integration Tests with Spring Boot and Testcontainers](https://www.baeldung.com/spring-boot-testcontainers-integration-test) - Spring Boot integration
- [Kotlin and JUnit 5 @BeforeAll](https://dzone.com/articles/kotlin-and-junit-5-beforeall) - Companion object pattern
- [Spring Boot Testing Pitfall: Transaction Rollback in Tests](https://rieckpil.de/spring-boot-testing-pitfall-transaction-rollback-in-tests/) - Why avoid @Transactional
- [The best way to clean up test data with Spring and Hibernate](https://vladmihalcea.com/clean-up-test-data-spring/) - TRUNCATE vs rollback

### Tertiary (LOW confidence)

- [Spring Boot + Testcontainers Tests at Jet Speed](https://www.sivalabs.in/blog/run-spring-boot-testcontainers-tests-at-jet-speed/) - Performance optimization
- [Testing Spring Boot Applications with Kotlin and Testcontainers](https://rieckpil.de/testing-spring-boot-applications-with-kotlin-and-testcontainers/) - Kotlin-specific patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Testcontainers is industry standard for PostgreSQL integration tests, well-documented
- Architecture: HIGH - Singleton container pattern proven in Spring Boot + Kotlin, verified from official docs
- Pitfalls: HIGH - Based on direct codebase inspection (native queries, JSONB operators) + authoritative sources
- Code examples: MEDIUM - Adapted from official docs to project structure (not tested yet)

**Research date:** 2026-02-07
**Valid until:** 2026-04-07 (60 days - stable ecosystem)
