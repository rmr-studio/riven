# Testing Patterns

**Analysis Date:** 2026-02-07

## Test Framework

**Runner:**
- JUnit 5 (Jupiter)
- Gradle task: `./gradlew test`
- Configuration: `useJUnitPlatform()` in `build.gradle.kts`

**Assertion Library:**
- JUnit 5 built-in `Assertions` class
- Assertions used: `assertTrue()`, `assertFalse()`, `assertEquals()`, `assertNotNull()`, `assertThrows()`
- Imported from: `org.junit.jupiter.api.Assertions.*`

**Mocking Framework:**
- Mockito 5.20.0 for object mocking
- Mockito-Kotlin 3.2.0 for Kotlin-specific extensions (`.whenever()`, `.argThat {}`, `.any()`)
- Mock management: `@MockitoBean` for Spring context injection
- Mock reset: `reset(mock1, mock2, ...)` in `@BeforeEach`

**Run Commands:**
```bash
./gradlew test              # Run all tests
./gradlew test --watch     # Watch mode (if supported)
./gradlew testClasses      # Compile tests only
```

## Test File Organization

**Location:**
- Co-located with main source code
- Mirror package structure: `src/test/kotlin/riven/core/` matches `src/main/kotlin/riven/core/`
- Full path preservation: `src/test/kotlin/riven/core/service/entity/EntityRelationshipServiceTest.kt` mirrors `src/main/kotlin/riven/core/service/entity/`

**Naming:**
- Test classes: `[ClassName]Test.kt` (e.g., `EntityRelationshipServiceTest.kt`, `SchemaServiceTest.kt`)
- Test methods: Descriptive backtick-quoted strings with given/when/then pattern
- Test nested classes: `@Nested inner class [ScenarioName]` for organizing related test cases

**Structure:**
```
src/test/kotlin/riven/core/
├── service/
│   ├── entity/
│   │   ├── EntityRelationshipServiceTest.kt      # 1,600 lines
│   │   ├── EntityValidationServiceTest.kt        # 600+ lines
│   │   └── type/
│   │       └── EntityTypeRelationshipServiceTest.kt
│   ├── block/
│   │   ├── BlockEnvironmentServiceTest.kt        # 500+ lines
│   │   ├── BlockTypeServiceTest.kt
│   │   └── BlockChildrenServiceTest.kt
│   ├── schema/
│   │   └── SchemaServiceTest.kt                  # 500+ lines (nested format)
│   └── util/
│       ├── WithUserPersona.kt                    # Test annotation + JWT utility
│       ├── WorkspaceRole.kt
│       └── TestObjectMapper.kt
├── models/
│   ├── entity/
│   │   └── validation/
│   │       └── EntityRelationshipDefinitionValidatorTest.kt
│   └── workflow/
│       └── node/
│           └── config/
│               └── actions/
│                   └── EntityActionConfigValidationTest.kt
└── entity/
    └── block/
        └── TreeLayoutSerializationTest.kt
```

## Test Structure

**Suite Organization:**
```kotlin
@SpringBootTest(
    classes = [
        AuthTokenService::class,
        WorkspaceSecurity::class,
        EntityRelationshipServiceTest.TestConfig::class,
        EntityRelationshipService::class
    ]
)
@WithUserPersona(
    userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
    email = "test@test.com",
    displayName = "Test User",
    roles = [
        WorkspaceRole(
            workspaceId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
            role = WorkspaceRoles.OWNER
        )
    ]
)
class EntityRelationshipServiceTest {

    @Configuration
    class TestConfig

    private val userId: UUID = UUID.fromString("f8b1c2d3-4e5f-6789-abcd-ef0123456789")
    private val workspaceId: UUID = UUID.fromString("f8b1c2d3-4e5f-6789-abcd-ef9876543210")

    @MockitoBean
    private lateinit var entityRelationshipRepository: EntityRelationshipRepository

    @Autowired
    private lateinit var entityRelationshipService: EntityRelationshipService

    @BeforeEach
    fun setup() {
        reset(entityRelationshipRepository)
        // Initialize test data
    }

    @Nested
    inner class NewEntityWithNoRelationships {
        @Test
        fun \`saveRelationships - new entity with empty relationships returns empty map\`() {
            // Given: ...
            // When: ...
            // Then: ...
        }
    }
}
```

**Patterns:**
- `@SpringBootTest` with minimal class list for faster boot
- `@WithUserPersona` annotation for automatic JWT security context setup
- `@Configuration class TestConfig` as placeholder for test-specific beans
- `@MockitoBean` for dependencies to mock
- `@Autowired` for dependencies to test
- `@BeforeEach` for test setup with `reset()` calls
- Nested test classes using `@Nested inner class` for test grouping

## Mocking

**Framework:** Mockito + Mockito-Kotlin

**Patterns:**
```kotlin
// Setup mocks
whenever(entityRepository.findById(any()))
    .thenReturn(entity)

// Kotlin shortcuts
whenever(repository.save(any()))
    .thenAnswer { invocation -> invocation.getArgument(0) }

// Capture values
val savedRelationships = mutableListOf<EntityRelationshipEntity>()
whenever(repository.saveAll<EntityRelationshipEntity>(any()))
    .thenAnswer { invocation ->
        val entities = invocation.getArgument(0) as Collection<EntityRelationshipEntity>
        savedRelationships.addAll(entities)
        entities
    }

// Verification
verify(repository).save(argThat { it.id == expectedId })
verify(repository, never()).delete(any())
verify(repository, times(2)).save(any())
```

**What to Mock:**
- Repository dependencies (data access layer)
- External services (AuthTokenService, ActivityService, StorageService)
- Infrastructure services (logging via KLogger)
- Spring Security context handled via `@WithUserPersona` annotation

**What NOT to Mock:**
- Service under test (autowired)
- Domain models and DTOs
- Utility functions
- Spring framework components (handled by `@SpringBootTest`)

**Custom Test Utilities:**
- `WithUserPersona.kt` - Annotation + JUnit extension for security context setup
- `JwtTestUtil.createTestJwt()` - Generates test JWTs matching Supabase format
- `TestObjectMapper.kt` - Jackson ObjectMapper configured for tests

## Fixtures and Factories

**Test Data Patterns:**

Factory helper methods defined within test classes:
```kotlin
private fun createEntityType(
    id: UUID = UUID.randomUUID(),
    key: String,
    singularName: String,
    pluralName: String,
    relationships: List<EntityRelationshipDefinition>? = null
): EntityTypeEntity {
    return EntityTypeEntity(
        id = id,
        key = key,
        displayNameSingular = singularName,
        displayNamePlural = pluralName,
        workspaceId = workspaceId,
        relationships = relationships,
        // ... other fields
    )
}

private fun createRelationshipDefinition(
    id: UUID = UUID.randomUUID(),
    name: String,
    sourceKey: String,
    cardinality: EntityRelationshipCardinality,
    bidirectional: Boolean
): EntityRelationshipDefinition {
    return EntityRelationshipDefinition(
        id = id,
        name = name,
        sourceEntityTypeKey = sourceKey,
        cardinality = cardinality,
        bidirectional = bidirectional,
        // ... other fields
    )
}
```

**Location:**
- Factory methods at end of test class (after test methods)
- Named `create[EntityName]()` with sensible defaults
- All parameters have defaults except required ones
- Builder pattern via default parameters for flexibility

**BlockFactory Utility:**
- Dedicated factory class in `src/test/kotlin/riven/core/service/util/factory/block/BlockFactory.kt`
- Used in block-related tests: `BlockFactory.createType()`, `BlockFactory.createOperationRequest()`
- Centralized to reduce duplication across multiple block tests

## Coverage

**Requirements:** Not explicitly enforced (no coverage plugins in `build.gradle.kts`)

**Coverage Gaps (observed):**
- Some stub/TODO methods not tested: `EntityTypeRelationshipImpactAnalysisService.analyze()` returns empty
- Workflow execution path has partial coverage
- Query integration tests use TestContainers with real PostgreSQL

**View Coverage:**
```bash
# No coverage command configured
# Would typically use: ./gradlew test jacocoTestReport
```

## Test Types

**Unit Tests:**
- Scope: Single service method with mocked dependencies
- Examples: `EntityTypeServiceTest`, `SchemaServiceTest`
- Structure: Given/When/Then with nested test classes
- 50-200 lines per test case

**Integration Tests:**
- Scope: Service + Repository interaction with test database
- Database: H2 in-memory (configured via `@SpringBootTest`)
- Examples: `EntityQueryIntegrationTest` (all variants), `EntityQueryErrorPathIntegrationTest`
- Run with `./gradlew test`

**E2E Tests:**
- Framework: Not used in this codebase
- Controller integration tested indirectly through service tests
- Note: Could be added using `@SpringBootTest` with `TestRestTemplate` if needed

**Container Tests:**
- Framework: TestContainers 2.0.3 + PostgreSQL container
- Classes: `org.testcontainers:testcontainers-postgresql:2.0.3`
- Used for: Entity query integration tests requiring real PostgreSQL semantics
- Configuration: Managed by Spring Boot test context automatically

## Common Patterns

**Async Testing:**
```kotlin
// Coroutine support (kotlinx-coroutines-test)
@Test
fun \`async operation completes correctly\`() {
    // Uses runTest { } from kotlinx.coroutines.test
    // Not heavily used in entity/block tests
}
```

**Error Testing:**
```kotlin
@Test
fun \`validates string with minLength constraint - failure\`() {
    val schema = wrapField(
        "username", Schema(
            key = SchemaType.TEXT,
            type = DataType.STRING,
            options = Schema.SchemaOptions(minLength = 5)
        )
    )
    val payload = mapOf("username" to "abc")

    val errors = schemaService.validate(schema, payload)

    assertTrue(errors.any { it.contains("too short") })
}

@Test
fun \`validateEntity - throws exception on invalid relationship cardinality\`() {
    // ...
    assertThrows(InvalidRelationshipException::class.java) {
        entityRelationshipService.validateRelationshipForCreateOrUpdate(/*...*/)
    }
}
```

**Test Data Setup:**
```kotlin
@BeforeEach
fun setup() {
    reset(entityRelationshipRepository, entityRepository, entityTypeService)

    // Initialize relationship IDs
    companyContactsRelId = UUID.randomUUID()
    contactCompanyRelId = UUID.randomUUID()

    // Create test entity types
    companyEntityType = createEntityType(
        key = "company",
        singularName = "Company",
        pluralName = "Companies",
        relationships = listOf(
            createRelationshipDefinition(
                id = companyContactsRelId,
                name = "Contacts",
                // ... other params
            )
        )
    )

    // Default mock behavior
    whenever(entityRelationshipRepository.findBySourceId(any()))
        .thenReturn(emptyList())
}
```

---

*Testing analysis: 2026-02-07*
