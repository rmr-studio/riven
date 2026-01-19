# Testing Patterns

**Analysis Date:** 2026-01-18

## Test Framework

### Client (TypeScript/React)

**Runner:**
- Jest 29.7.0 with Next.js integration
- Config: `client/jest.config.ts`

**Assertion Library:**
- `@testing-library/jest-dom` for DOM assertions
- `@testing-library/react` for component testing
- `@testing-library/user-event` for user interaction simulation

**Run Commands:**
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
```

### Core (Kotlin/Spring)

**Runner:**
- JUnit 5 (JUnit Platform)
- Spring Boot Test
- Config: `build.gradle.kts` with `useJUnitPlatform()`

**Assertion Library:**
- JUnit 5 assertions (`assertEquals`, `assertTrue`, `assertNotNull`, `assertThrows`)

**Mocking:**
- Mockito 5.20.0
- mockito-kotlin 3.2.0 for Kotlin DSL

**Run Commands:**
```bash
./gradlew test        # Run all tests
./gradlew clean test  # Clean and run tests
```

## Test File Organization

### Client

**Location:**
- Co-located in `__tests__/` directories alongside source files
- Example: `client/components/feature-modules/blocks/components/bespoke/__tests__/`

**Naming:**
- Pattern: `ComponentName.test.tsx`
- Examples: `AddressCard.test.tsx`, `ContactCard.test.tsx`, `FallbackBlock.test.tsx`

**Structure:**
```
client/
├── components/feature-modules/blocks/components/bespoke/
│   ├── AddressCard.tsx
│   ├── ContactCard.tsx
│   └── __tests__/
│       ├── AddressCard.test.tsx
│       ├── ContactCard.test.tsx
│       └── FallbackBlock.test.tsx
└── test/
    └── __mocks__/
        └── fileMock.ts
```

### Core

**Location:**
- Separate `src/test/kotlin/` directory mirroring main package structure

**Naming:**
- Pattern: `PascalCaseTest.kt`
- Examples: `EntityRelationshipServiceTest.kt`, `SchemaServiceTest.kt`

**Structure:**
```
core/src/test/kotlin/riven/core/
├── entity/block/
│   └── TreeLayoutSerializationTest.kt
├── models/entity/validation/
│   └── EntityRelationshipDefinitionValidatorTest.kt
├── service/
│   ├── block/
│   │   ├── BlockChildrenServiceTest.kt
│   │   ├── BlockEnvironmentServiceTest.kt
│   │   └── BlockTypeServiceTest.kt
│   ├── entity/
│   │   ├── EntityRelationshipServiceTest.kt
│   │   ├── EntityValidationServiceTest.kt
│   │   └── type/
│   │       └── EntityTypeRelationshipServiceTest.kt
│   ├── schema/
│   │   └── SchemaServiceTest.kt
│   ├── workflow/
│   │   ├── ExpressionEvaluatorServiceTest.kt
│   │   ├── ExpressionParserServiceTest.kt
│   │   ├── TemplateParserServiceTest.kt
│   │   └── WorkflowExecutionIntegrationTest.kt
│   └── workspace/
│       ├── WorkspaceInviteServiceTest.kt
│       └── WorkspaceServiceTest.kt
└── service/util/
    └── WithUserPersona.kt
```

## Test Structure

### Client (React Components)

**Suite Organization:**
```typescript
import { render, screen } from "@testing-library/react";
import { AddressCard } from "../AddressCard";

describe("AddressCard", () => {
    it("renders default title when none provided", () => {
        const Component = AddressCard.component;
        render(<Component address={{ city: "Sydney" }} />);

        expect(screen.getByText("Address")).toBeInTheDocument();
        expect(screen.getByText("Sydney")).toBeInTheDocument();
    });

    it("renders full address metadata", () => {
        const Component = AddressCard.component;
        render(
            <Component
                title="Head Office"
                address={{
                    street: "123 Harbour Rd",
                    city: "Sydney",
                    state: "NSW",
                    postalCode: "2000",
                    country: "Australia",
                }}
            />
        );

        expect(screen.getByText("Head Office")).toBeInTheDocument();
        expect(screen.getByText("123 Harbour Rd")).toBeInTheDocument();
    });
});
```

**Patterns:**
- `describe` blocks group related tests by component or feature
- `it` blocks for individual test cases with descriptive names
- Use `screen` queries for DOM assertions
- Access component via `.component` property for block components

### Core (Kotlin/Spring)

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

    @MockitoBean
    private lateinit var entityRelationshipRepository: EntityRelationshipRepository

    @Autowired
    private lateinit var entityRelationshipService: EntityRelationshipService

    @BeforeEach
    fun setup() {
        reset(entityRelationshipRepository)
        // Setup test data
    }

    @Nested
    inner class CreatingNewRelationships {

        @Test
        fun `saveRelationships - creates single relationship to one target entity`() {
            // Given: A new entity with one relationship to one target
            val entityId = UUID.randomUUID()
            val contactId = UUID.randomUUID()

            // Mock repository calls
            whenever(entityRepository.findAllById(any()))
                .thenReturn(listOf(contact))

            // When: Saving relationships
            val result = entityRelationshipService.saveRelationships(
                id = entityId,
                workspaceId = workspaceId,
                type = companyEntityType,
                curr = mapOf(companyContactsRelId to listOf(contactId))
            )

            // Then: Creates relationship and returns EntityLink
            assertFalse(result.links.isEmpty())
            verify(entityRelationshipRepository).saveAll<EntityRelationshipEntity>(any())
        }
    }
}
```

**Patterns:**
- `@SpringBootTest` with minimal class loading for unit tests
- `@WithUserPersona` custom annotation for authenticated user context
- `@Nested` inner classes group related test cases
- Backtick method names with descriptive test scenarios
- Given/When/Then comment structure
- `@BeforeEach` for setup, `reset()` mocks between tests

## Mocking

### Client (Jest)

**Module Mocking:**
```typescript
// jest.config.ts
moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^.+\\.(css|scss|sass)$": "identity-obj-proxy",
    "^.+\\.(png|jpg|jpeg|gif|webp|avif|svg)$": "<rootDir>/test/__mocks__/fileMock.ts",
}
```

**File Mock:**
```typescript
// test/__mocks__/fileMock.ts
export default "test-file-stub";
```

### Core (Mockito)

**Framework:** Mockito 5.20.0 + mockito-kotlin 3.2.0

**Patterns:**
```kotlin
// Mock bean declaration
@MockitoBean
private lateinit var entityRelationshipRepository: EntityRelationshipRepository

// Stubbing with mockito-kotlin DSL
whenever(entityRepository.findAllById(eq(setOf(contactId))))
    .thenReturn(listOf(contact))

whenever(entityRelationshipRepository.saveAll<EntityRelationshipEntity>(any()))
    .thenAnswer { invocation -> invocation.getArgument(0) as Collection<EntityRelationshipEntity> }

// Verification
verify(entityRelationshipRepository).saveAll<EntityRelationshipEntity>(argThat { entities ->
    entities.any { it.sourceId == entityId && it.targetId == contactId }
})

verify(entityRelationshipRepository, never()).deleteAllBySourceIdAndFieldId(any(), any())
```

**What to Mock:**
- Repositories (data access layer)
- External services (Supabase, etc.)
- Logger (KLogger)

**What NOT to Mock:**
- Service layer methods under test
- Domain model transformations
- Pure utility functions

## Fixtures and Factories

### Core

**Test Data Factory Pattern:**
```kotlin
// In test class
private fun createEntityType(
    id: UUID = UUID.randomUUID(),
    key: String,
    singularName: String,
    pluralName: String,
    relationships: List<EntityRelationshipDefinition>? = null
): EntityTypeEntity {
    val identifierKey = UUID.randomUUID()

    return EntityTypeEntity(
        id = id,
        key = key,
        displayNameSingular = singularName,
        displayNamePlural = pluralName,
        workspaceId = workspaceId,
        // ... other fields
    )
}

private fun createRelationshipDefinition(
    id: UUID = UUID.randomUUID(),
    name: String,
    sourceKey: String,
    type: EntityTypeRelationshipType,
    // ... parameters with defaults
): EntityRelationshipDefinition {
    return EntityRelationshipDefinition(
        id = id,
        name = name,
        // ... fields
    )
}
```

**Block Test Factory (Separate Utility Class):**
```kotlin
// BlockFactory utility class for block tests
val type = createTestBlockType()
val addOp = BlockFactory.createOperationRequest(
    operation = BlockFactory.createAddOperation(blockId = blockId, orgId = orgId, type = type),
    timestamp = ZonedDateTime.now()
)
```

**Location:**
- Helper methods within test class for simple factories
- Utility classes in `service/util/factory/` for reusable factories

## Coverage

**Requirements:** Not enforced (no coverage gates)

**Coverage Generation:**
```bash
# Client
npm test -- --coverage

# Core
./gradlew test jacocoTestReport  # If JaCoCo configured
```

## Test Types

### Unit Tests

**Client:**
- Component rendering tests
- User interaction tests
- Props validation tests
- Scope: Individual React components

**Core:**
- Service method tests with mocked dependencies
- Validation logic tests
- Schema validation tests
- Scope: Single service class or utility

### Integration Tests

**Core:**
- `@SpringBootTest` with minimal context
- Real Spring Security context via `@WithUserPersona`
- Mocked repositories but real service orchestration
- Scope: Service interaction with Spring context

**Examples:**
- `WorkflowExecutionIntegrationTest.kt`
- `DagExecutionIntegrationTest.kt`

### E2E Tests

**Framework:** Not detected in codebase
**Status:** Not used

## Common Patterns

### Async Testing (Client)

```typescript
it("handles async operations", async () => {
    render(<Component />);

    // Wait for async updates
    await screen.findByText("Loaded");

    expect(screen.getByText("Content")).toBeInTheDocument();
});
```

### Error Testing (Core)

```kotlin
@Test
fun `STRICT mode throws exception on validation failure`() {
    val schema = wrapField(
        "age", Schema(
            key = SchemaType.NUMBER,
            type = DataType.NUMBER,
            options = Schema.SchemaOptions(minimum = 18.0)
        )
    )
    val payload = mapOf("age" to 16)

    assertThrows(SchemaValidationException::class.java) {
        schemaService.validateOrThrow(schema, payload, ValidationScope.STRICT)
    }
}
```

### Verification Patterns (Core)

```kotlin
// Verify method was called
verify(entityRelationshipRepository).saveAll<EntityRelationshipEntity>(any())

// Verify method was never called
verify(entityRelationshipRepository, never()).deleteAllBySourceIdAndFieldId(any(), any())

// Verify with argument matching
verify(entityRelationshipRepository).deleteAllBySourceIdAndFieldIdAndTargetIdIn(
    eq(entityId),
    eq(companyContactsRelId),
    eq(setOf(contact2Id))
)

// Verify with complex argument assertions
verify(entityRelationshipRepository).saveAll<EntityRelationshipEntity>(argThat { entities: Collection<EntityRelationshipEntity> ->
    entities.size == 3 &&
    entities.all { it.sourceId == entityId && it.fieldId == companyContactsRelId }
})
```

### Custom Security Context (Core)

```kotlin
// Custom annotation for test user context
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
class MyServiceTest {
    // Tests run with authenticated user context
}
```

**Implementation:** `core/src/test/kotlin/riven/core/service/util/WithUserPersona.kt`
- Creates JWT with Supabase-like claims
- Sets Spring Security context before each test
- Clears context after each test

### Nested Test Classes (Core)

```kotlin
class EntityRelationshipServiceTest {

    @Nested
    inner class NewEntityWithNoRelationships {
        @Test
        fun `saveRelationships - new entity with empty relationships returns empty map`() {
            // ...
        }
    }

    @Nested
    inner class CreatingNewRelationships {
        @Test
        fun `saveRelationships - creates single relationship to one target entity`() {
            // ...
        }

        @Test
        fun `saveRelationships - creates multiple relationships to multiple targets`() {
            // ...
        }
    }

    @Nested
    inner class BidirectionalRelationships {
        // ...
    }
}
```

Use `@Nested` to organize tests by:
- Feature behavior (e.g., "Creating", "Updating", "Removing")
- Edge cases
- Validation scenarios

## Test Data Patterns

### Fixed Test IDs

```kotlin
private val userId: UUID = UUID.fromString("f8b1c2d3-4e5f-6789-abcd-ef0123456789")
private val workspaceId: UUID = UUID.fromString("f8b1c2d3-4e5f-6789-abcd-ef9876543210")
```

Use fixed UUIDs for:
- User IDs matching `@WithUserPersona`
- Workspace IDs for authorization tests

### Dynamic Test IDs

```kotlin
val entityId = UUID.randomUUID()
val contactId = UUID.randomUUID()
```

Use random UUIDs for:
- Entity instances created during tests
- Relationship IDs
- Any ID not needed for cross-test consistency

---

*Testing analysis: 2026-01-18*
