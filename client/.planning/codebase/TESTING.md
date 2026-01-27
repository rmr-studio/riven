# Testing Patterns

**Analysis Date:** 2026-01-19

## Test Framework

**Runner:**

- Jest 29.7.0
- Config: `jest.config.ts`

**Assertion Library:**

- `@testing-library/jest-dom` 6.6.3 (custom matchers like `toBeInTheDocument`)
- Jest's built-in `expect` API

**Run Commands:**

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
```

**Coverage:**
No coverage command configured in `package.json` (would need to add `jest --coverage`).

## Test Framework Configuration

**jest.config.ts:**

```typescript
const customJestConfig: Config = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^.+\\.(css|scss|sass)$': 'identity-obj-proxy',
    '^.+\\.(png|jpg|jpeg|gif|webp|avif|svg)$': '<rootDir>/test/__mocks__/fileMock.ts',
  },
  testEnvironment: 'jest-environment-jsdom',
  testMatch: [
    '<rootDir>/**/__tests__/**/*.(test|spec).[jt]s?(x)',
    '<rootDir>/**/?(*.)+(spec|test).[jt]s?(x)',
  ],
};
```

**jest.setup.ts:**

```typescript
import '@testing-library/jest-dom';
```

**Key Configuration:**

- Test environment: `jsdom` (simulates browser DOM for React components)
- Module name mapper supports `@/*` path alias
- CSS mocked via `identity-obj-proxy`
- Static assets mocked via `test/__mocks__/fileMock.ts`

## Test File Organization

**Location:**
Co-located with source files in `__tests__/` subdirectories:

```
components/feature-modules/blocks/components/bespoke/
├── AddressCard.tsx
├── ContactCard.tsx
├── FallbackBlock.tsx
└── __tests__/
    ├── AddressCard.test.tsx
    ├── ContactCard.test.tsx
    └── FallbackBlock.test.tsx
```

**Naming:**

- Pattern: `{ComponentName}.test.tsx` (PascalCase matching component name)
- Location: `__tests__/` directory adjacent to components being tested
- Alternative: `{name}.spec.tsx` also supported but not observed in codebase

**Structure:**

```
components/feature-modules/blocks/components/bespoke/
└── __tests__/
```

**Coverage:**
Minimal test coverage observed. Only 3 test files found in entire codebase:

- `components/feature-modules/blocks/components/bespoke/__tests__/AddressCard.test.tsx`
- `components/feature-modules/blocks/components/bespoke/__tests__/ContactCard.test.tsx`
- `components/feature-modules/blocks/components/bespoke/__tests__/FallbackBlock.test.tsx`

## Test Structure

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
        expect(screen.getByText("Sydney, NSW, 2000")).toBeInTheDocument();
        expect(screen.getByText("Australia")).toBeInTheDocument();
    });
});
```

**Patterns:**

- One `describe` block per component
- Multiple `it` test cases covering different scenarios
- Descriptive test names using plain English (not action-oriented like "should render...")
- Arrange-Act-Assert pattern implicit in structure
- No explicit setup/teardown (Jest handles cleanup via Testing Library)

## Mocking

**Framework:**
Jest's built-in mocking capabilities (though not extensively used in existing tests)

**Static Assets:**
File mock at `test/__mocks__/fileMock.ts`:

```typescript
export default 'test-file-stub';
```

Maps all image/media imports to a stub string.

**CSS Mocking:**
Via `identity-obj-proxy` package - CSS modules return object with className keys.

**Patterns:**
No mocking observed in existing tests. Components tested are simple presentational components without external dependencies requiring mocks.

**What Would Need Mocking (based on codebase patterns):**

- `fetch` calls in service layer tests
- Supabase session/auth context
- TanStack Query providers
- Zustand stores
- React Router navigation
- Toast notifications (Sonner)

**What NOT to Mock:**

- Simple utility functions
- Type definitions
- Static configuration objects
- React components under test

## Fixtures and Factories

**Test Data:**
Inline test data objects in each test:

```typescript
render(
    <Component
        client={{
            id: "client-1",
            name: "Jane Doe",
            contact: { email: "jane@example.com" },
            company: { name: "Acme Corp" },
            archived: false,
            type: "VIP",
        }}
        accounts={[
            {
                entityId: "acct-1",
                name: "Primary Account",
            },
        ]}
    />
);
```

**Location:**
No centralized fixtures directory. Test data defined inline within test files.

**Pattern:**

- Minimal viable data for each test case
- Plain objects matching component prop interfaces
- No factory functions observed

**Recommendation for Future:**
Given the complex data structures (EntityType, SaveEntityRequest, etc.), factory functions would be beneficial:

```typescript
// Future pattern (not currently used)
function createMockEntityType(overrides?: Partial<EntityType>): EntityType {
  return {
    key: 'test-entity',
    name: { singular: 'Test', plural: 'Tests' },
    schema: { properties: {} },
    ...overrides,
  };
}
```

## Coverage

**Requirements:**
None enforced (no coverage threshold in `jest.config.ts`)

**View Coverage:**
Not configured. To enable:

```bash
npm test -- --coverage
```

**Current State:**
Extremely limited test coverage:

- Only 3 test files for entire application
- Tests only cover simple presentational components in blocks feature
- No tests for:
  - Services (API layer)
  - Hooks (queries, mutations, forms)
  - Complex components
  - Stores (Zustand state management)
  - Utility functions
  - Context providers

## Test Types

**Unit Tests:**
Current tests are unit tests for isolated React components. Pattern:

- Import component
- Render with props
- Assert rendered output

No tests exist for:

- Service layer methods
- Custom hooks
- Utility functions
- Store logic

**Integration Tests:**
Not currently implemented. Would test:

- Component + hooks + service integration
- Form submission flows
- Context provider + consumer interactions
- TanStack Query + mutations + cache updates

**E2E Tests:**
Not implemented. No Playwright, Cypress, or similar framework configured.

## Common Patterns

**Component Testing:**

```typescript
import { render, screen } from "@testing-library/react";

it("renders client details", () => {
    const Component = ContactCard.component;
    render(<Component client={mockClient} accounts={mockAccounts} />);

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
});
```

**Conditional Rendering:**

```typescript
it("wraps content with a link when href provided", () => {
    const Component = ContactCard.component;
    render(<Component client={mockClient} href="/clients/client-2" />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/clients/client-2");
});
```

**Query Methods:**

- `screen.getByText(text)` - Find by text content
- `screen.getByRole(role)` - Find by ARIA role
- Prefer accessible queries (ByRole, ByLabelText) over test IDs

**Async Testing:**
Not demonstrated in existing tests, but would use:

```typescript
// Future pattern for async operations
it("loads and displays data", async () => {
    render(<Component />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();

    const data = await screen.findByText("Loaded Data");
    expect(data).toBeInTheDocument();
});
```

**Error Testing:**
Not demonstrated. Would follow pattern:

```typescript
// Future pattern for error states
it("displays error message on failure", () => {
    render(<Component error="Failed to load" />);

    expect(screen.getByText("Failed to load")).toBeInTheDocument();
});
```

## Testing Library Best Practices (Observed)

1. **Import from Testing Library:** `import { render, screen } from "@testing-library/react"`
2. **Use `screen` queries:** Prefer `screen.getByText()` over destructuring from `render()`
3. **Accessible queries:** Use `getByRole`, `getByText` for semantic queries
4. **Custom matchers:** Use jest-dom matchers like `toBeInTheDocument`, `toHaveAttribute`

## Gaps and Recommendations

**Current Gaps:**

1. No service layer tests (fetch calls, error handling, validation)
2. No custom hook tests (mutations, queries, forms)
3. No store tests (Zustand state management)
4. No integration tests (multi-component flows)
5. No utility function tests
6. No snapshot testing for complex UI

**Recommended Additions:**

1. Test utilities for common setup (mock auth, query client wrapper)
2. Factory functions for complex test data (EntityType, etc.)
3. Service layer tests with mocked fetch
4. Hook tests using `@testing-library/react-hooks`
5. User interaction tests with `@testing-library/user-event`

---

_Testing analysis: 2026-01-19_
