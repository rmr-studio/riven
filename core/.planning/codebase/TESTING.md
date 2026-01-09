# Testing Patterns

**Analysis Date:** 2026-01-09

## Test Framework

**Runner (Backend):**
- JUnit 5 (Jupiter)
- Config: `useJUnitPlatform()` in `build.gradle.kts`

**Runner (Frontend):**
- Jest 29.7.0
- Config: `client/jest.config.ts`

**Assertion Library (Backend):**
- JUnit 5 built-in assertions
- Matchers: `assertEquals`, `assertTrue`, `assertThrows`

**Assertion Library (Frontend):**
- Jest built-in expect + Testing Library matchers
- Matchers: `toBe`, `toEqual`, `toBeInTheDocument`, `toHaveBeenCalledWith`

**Run Commands:**

Backend:
```bash
./gradlew test                      # Run all tests
./gradlew test --tests EntityTypeServiceTest  # Single test class
./gradlew clean test                # Clean and test
```

Frontend:
```bash
npm test                            # Run all tests
npm test -- --watch                 # Watch mode
npm test -- ContactCard.test.tsx    # Single file
npm run test:coverage               # Coverage report (if configured)
```

## Test File Organization

**Location (Backend):**
- Tests mirror source structure: `src/test/kotlin/riven/core/{mirror-path}Test.kt`
- Example: `src/main/kotlin/riven/core/service/entity/EntityTypeService.kt` → `src/test/kotlin/riven/core/service/entity/EntityTypeServiceTest.kt`

**Location (Frontend):**
- `__tests__/` directory: `components/feature-modules/blocks/components/bespoke/__tests__/ContactCard.test.tsx`
- Co-located suffixes: `*.test.tsx` or `*.spec.tsx` (both patterns supported)

**Naming (Backend):**
- Test classes: `{ClassName}Test.kt` (e.g., `EntityTypeServiceTest.kt`)
- Test methods: camelCase descriptive names (e.g., `testSaveEnvironmentWithAddOperation()`)

**Naming (Frontend):**
- Test files: `{ComponentName}.test.tsx` (e.g., `ContactCard.test.tsx`)
- Test cases: `it("should...description")` or `it("renders client details")`

**Structure (Backend):**
```
src/test/kotlin/riven/core/
  ├── service/
  │   ├── entity/
  │   │   └── EntityTypeServiceTest.kt
  │   ├── block/
  │   │   ├── BlockEnvironmentServiceTest.kt
  │   │   └── SchemaServiceTest.kt
  │   └── workspace/
  │       └── WorkspaceServiceTest.kt
  └── (mirrors src/main structure)
```

**Structure (Frontend):**
```
client/components/feature-modules/
  └── blocks/components/bespoke/
      ├── __tests__/
      │   └── ContactCard.test.tsx
      └── ContactCard.tsx
```

## Test Structure

**Suite Organization (Backend):**
```kotlin
@WithUserPersona(
    userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
    email = "test@example.com",
    displayName = "Test User",
    roles = [WorkspaceRole(workspaceId = "...", role = WorkspaceRoles.ADMIN)]
)
@SpringBootTest(classes = [
    AuthTokenService::class,
    WorkspaceSecurity::class,
    BlockEnvironmentService::class
])
class BlockEnvironmentServiceTest {
    @MockitoBean
    private lateinit var blockService: BlockService

    @Autowired
    private lateinit var blockEnvironmentService: BlockEnvironmentService

    @Test
    fun testSaveEnvironmentWithAddOperation() {
        // Arrange
        val request = createTestRequest()

        // Act
        val result = blockEnvironmentService.saveEnvironment(request)

        // Assert
        assertEquals(expected, result)
    }
}
```

**Suite Organization (Frontend):**
```typescript
import { render, screen } from "@testing-library/react";
import { ContactCard } from "../ContactCard";

describe("ContactCard", () => {
    it("renders client details", () => {
        // Arrange
        const Component = ContactCard.component;

        // Act
        render(
            <Component client={{ id: "client-1", name: "Jane Doe" }} />
        );

        // Assert
        expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    });

    it("wraps content with a link when href provided", () => {
        // Test implementation
    });
});
```

**Patterns:**
- Arrange/Act/Assert pattern (backend and frontend)
- `describe()` blocks for grouping related tests
- `it()` or `test()` for individual test cases

## Mocking

**Framework (Backend):**
- Mockito 5.20.0 with mockito-kotlin
- `@MockitoBean` annotation for mocking Spring beans

**Patterns (Backend):**
```kotlin
@MockitoBean
private lateinit var blockService: BlockService

@Test
fun testWithMock() {
    // Setup mock behavior
    whenever(blockService.getBlockById(any())).thenReturn(mockBlock)

    // Execute
    val result = blockEnvironmentService.saveEnvironment(request)

    // Verify
    verify(blockService, times(1)).getBlockById(any())
}
```

**Framework (Frontend):**
- Jest built-in mocking (`vi.mock()` if using Vitest, but Jest is configured)
- No Vitest detected, uses Jest

**Patterns (Frontend):**
```typescript
// Mock module
jest.mock('../service', () => ({
    EntityTypeService: {
        getEntityTypes: jest.fn()
    }
}));

// Mock in test
const mockGetEntityTypes = EntityTypeService.getEntityTypes as jest.Mock;
mockGetEntityTypes.mockResolvedValue([{ id: '1', name: 'Test' }]);
```

**What to Mock (Backend):**
- External services (database, Supabase, Temporal)
- Repository layer (use `@MockitoBean`)
- Time/dates (use `Clock` injection)

**What to Mock (Frontend):**
- API calls (service methods)
- Browser APIs (localStorage, sessionStorage)
- External libraries (Supabase, TanStack Query)

**What NOT to Mock:**
- Backend: Pure functions, utilities, domain models
- Frontend: Pure functions, utilities, type guards

## Fixtures and Factories

**Test Data (Backend):**
```kotlin
// Factory functions in test class
private fun createTestBlockType(): BlockType {
    return BlockType(
        id = UUID.randomUUID(),
        key = "test-block",
        version = 1,
        // ... other properties
    )
}

private fun createTestRequest(): SaveEnvironmentRequest {
    return SaveEnvironmentRequest(
        rootBlockId = UUID.randomUUID(),
        operations = listOf(/* ... */)
    )
}
```

**Test Data (Frontend):**
```typescript
// Factory functions in test file
function createTestEntity(overrides?: Partial<Entity>): Entity {
    return {
        id: 'test-id',
        typeKey: 'test-type',
        payload: {},
        ...overrides
    };
}

// Shared fixtures (if needed)
// tests/fixtures/entities.ts
export const mockEntities = [/* ... */];
```

**Location:**
- Backend: Factory functions in test class, no separate fixtures directory
- Frontend: Factory functions in test file, shared fixtures in `test/fixtures/` (not currently used)

## Coverage

**Requirements:**
- No enforced coverage target
- Coverage tracked for awareness

**Configuration (Backend):**
- No explicit coverage plugin configured in `build.gradle.kts`
- Coverage can be generated with JaCoCo (not currently configured)

**Configuration (Frontend):**
- Jest coverage via `--coverage` flag
- No explicit coverage thresholds in `jest.config.ts`

**View Coverage:**
Backend:
```bash
# Not currently configured
# Would require adding JaCoCo plugin to build.gradle.kts
```

Frontend:
```bash
npm test -- --coverage
# Coverage report in console
# HTML report in coverage/index.html (if generated)
```

## Test Types

**Unit Tests (Backend):**
- Scope: Test single service method in isolation
- Mocking: Mock all external dependencies (repositories, other services)
- Example: `EntityTypeServiceTest`, `SchemaServiceTest`
- Files: 11 test files detected in `src/test/kotlin/riven/core/`

**Unit Tests (Frontend):**
- Scope: Test single component or hook in isolation
- Mocking: Mock service methods, external dependencies
- Example: `ContactCard.test.tsx`
- Files: `__tests__/` directories in feature modules

**Integration Tests (Backend):**
- Scope: Test multiple services together with H2 database
- Mocking: Mock only external boundaries (Supabase, Temporal)
- Setup: `@SpringBootTest` with test configuration
- Example: `BlockEnvironmentServiceTest` (integrates BlockService, BlockChildrenService)

**Integration Tests (Frontend):**
- Not currently implemented
- Would test: API integration, state management flows

**E2E Tests:**
- Not detected in either backend or frontend

## Common Patterns

**Async Testing (Backend):**
```kotlin
@Test
fun testAsyncOperation() {
    // Kotlin coroutines or Java CompletableFuture
    val result = runBlocking {
        service.asyncMethod()
    }
    assertEquals(expected, result)
}
```

**Async Testing (Frontend):**
```typescript
it("should handle async operation", async () => {
    const result = await asyncFunction();
    expect(result).toBe('expected');
});
```

**Error Testing (Backend):**
```kotlin
@Test
fun testThrowsException() {
    assertThrows<SchemaValidationException> {
        service.validateEntity(invalidEntity)
    }
}
```

**Error Testing (Frontend):**
```typescript
it("should throw on invalid input", () => {
    expect(() => functionCall()).toThrow('error message');
});

// Async error
it("should reject on failure", async () => {
    await expect(asyncCall()).rejects.toThrow('error message');
});
```

**Snapshot Testing:**
- Not currently used in frontend (no `__snapshots__/` directories found)

---

*Testing analysis: 2026-01-09*
*Update when test patterns change*
