# Testing Patterns

**Analysis Date:** 2026-02-26

## Test Framework

**Status:** Not detected

**Note:** This codebase currently has no test framework configured. No test files exist in the project (no `.test.ts`, `.test.tsx`, `.spec.ts`, or `.spec.tsx` files found), and no test runners (Jest, Vitest) are configured.

**Dependencies present for testing infrastructure:**
- `@types/node` and `@types/react` for type definitions
- React and React DOM testing utilities available but not configured
- TypeScript for type-safe test writing when tests are added

## Recommended Testing Setup

When implementing testing, consider:

**Test Runner:**
- Vitest recommended for Next.js projects (fast, ESM-native)
- Alternative: Jest with Next.js configuration

**Assertion Library:**
- `@testing-library/react` for component testing
- `@testing-library/jest-dom` for DOM matchers
- `vitest` built-in assertions or `@vitest/expect`

**Setup Configuration:**
- Create `vitest.config.ts` at project root
- Configure Next.js app directory support
- Set up test environment (jsdom for DOM tests)

## Test File Organization

**Recommended Location:**
- Co-located pattern: `ComponentName.test.tsx` next to `ComponentName.tsx`
- Example: `components/ui/button.test.tsx` alongside `components/ui/button.tsx`

**Recommended Naming:**
- `*.test.ts` for unit tests
- `*.test.tsx` for component tests
- `*.spec.ts` for integration tests

**Recommended Structure:**
```
src/
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   └── button.test.tsx
│   └── feature-modules/
│       └── waitlist/
│           ├── components/
│           │   ├── waitlist-form.tsx
│           │   └── waitlist-form.test.tsx
│           └── hooks/
│               └── use-waitlist-mutation.test.ts
├── hooks/
│   ├── use-breakpoint.ts
│   └── use-breakpoint.test.ts
├── lib/
│   ├── validations.ts
│   └── validations.test.ts
└── __tests__/
    └── integration/
```

## Test Structure

**Current Component Complexity (for future test planning):**

Largest component by lines: `app/privacy/page.tsx` (751 lines) - mostly static HTML content, minimal logic testing needed

Complex interactive component: `components/feature-modules/waitlist/components/waitlist-form.tsx` (410 lines)
- Multiple state handlers: `handleJoin()`, `handleSurveyNext()`, `handleSurveySubmit()`, `goForward()`, `goBack()`
- Form validation with multiple steps
- Analytics event tracking
- Keyboard event handling
- Conditional rendering of 8 different steps

**Recommended Suite Organization:**
```typescript
describe('WaitlistForm', () => {
  describe('Form Submission', () => {
    it('should join waitlist with valid email', async () => {});
    it('should show error for duplicate email', async () => {});
    it('should validate email format', async () => {});
  });

  describe('Step Navigation', () => {
    it('should advance to next step when form valid', async () => {});
    it('should go back to previous step when allowed', async () => {});
    it('should disable back button on first step', () => {});
  });

  describe('Keyboard Shortcuts', () => {
    it('should submit on Enter key', async () => {});
    it('should select price options with keyboard', async () => {});
  });

  describe('Analytics', () => {
    it('should track step completion', async () => {});
    it('should track waitlist join event', async () => {});
  });
});
```

## Mocking

**Framework:** Not yet implemented; recommend `vitest.mock()` or `@testing-library/react`

**Patterns (recommended for future implementation):**

Mock external services:
```typescript
vi.mock('@/lib/supabase', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockResolvedValue({ error: null }),
    })),
  })),
}));
```

Mock hooks:
```typescript
vi.mock('@/hooks/use-waitlist-mutation', () => ({
  useWaitlistJoinMutation: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));
```

Mock analytics:
```typescript
vi.mock('posthog-js', () => ({
  capture: vi.fn(),
}));
```

**What to Mock:**
- External API calls (Supabase, PostHog)
- Third-party libraries (unless testing integration)
- Environment variables
- Browser APIs (localStorage, matchMedia)
- Next.js features (router, metadata)

**What NOT to Mock:**
- React hooks (useState, useEffect, useCallback) - test behavior instead
- Component logic and business rules
- Form validation (Zod schemas)
- UI component internals

## Fixtures and Factories

**Test Data (recommended patterns):**

```typescript
// Factory for form data
export const createWaitlistFormData = (overrides = {}): WaitlistMultiStepFormData => ({
  name: 'John Doe',
  email: 'john@example.com',
  operationalHeadache: 'Data silos',
  integrations: ['Salesforce', 'HubSpot'],
  monthlyPrice: '$5,000-$10,000',
  involvement: 'EARLY_TESTING',
  ...overrides,
});

// Factory for API responses
export const createSupabaseResponse = (overrides = {}) => ({
  data: null,
  error: null,
  ...overrides,
});
```

**Recommended Location:**
- Create `__tests__/fixtures/` directory
- Or co-locate in `[feature].fixtures.ts` next to test file

## Coverage

**Requirements:** Not enforced (no coverage configuration found)

**Recommended targets when tests added:**
- Statements: 80%+
- Branches: 75%+
- Functions: 80%+
- Lines: 80%+

**View Coverage (recommended command):**
```bash
npm run test -- --coverage
```

**High-priority areas for coverage:**
1. Form validation and error handling (`lib/validations.ts`, `hooks/use-waitlist-mutation.ts`)
2. Step navigation logic (`components/feature-modules/waitlist/components/waitlist-form.tsx`)
3. Custom hooks (`hooks/use-breakpoint.ts`, `hooks/use-is-mobile.ts`)
4. Environment validation (`lib/env.ts`)

## Test Types

**Unit Tests (recommended):**
- Test individual utilities in isolation
- Test Zod validation schemas
- Test custom hooks with `@testing-library/react`
- Test pure functions like `cn()` in `lib/utils.ts`

**Example for Zod validation:**
```typescript
describe('waitlistJoinSchema', () => {
  it('should validate valid email', () => {
    const result = waitlistJoinSchema.safeParse({
      name: 'John',
      email: 'john@example.com',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = waitlistJoinSchema.safeParse({
      name: 'John',
      email: 'invalid',
    });
    expect(result.success).toBe(false);
  });
});
```

**Integration Tests (recommended):**
- Test form submission flows end-to-end
- Test step navigation with state transitions
- Test mutations with mocked API responses
- Test keyboard shortcuts and event handling

**Example for form flow:**
```typescript
describe('Waitlist Form Flow', () => {
  it('should complete full survey on valid input', async () => {
    const { getByRole, getByText } = render(<WaitlistForm />);

    // Step 1: Enter name and email
    await userEvent.type(getByRole('textbox', { name: /name/i }), 'John');
    await userEvent.type(getByRole('textbox', { name: /email/i }), 'john@example.com');
    await userEvent.click(getByRole('button', { name: /next/i }));

    // Step 2: Continue to survey
    await userEvent.click(getByRole('button', { name: /continue/i }));

    // Verify success
    expect(getByText(/success/i)).toBeInTheDocument();
  });
});
```

**E2E Tests (not currently configured):**
- Framework: Playwright or Cypress
- Scope: Full user journeys like "fill waitlist form to completion"
- Would run against deployed app or local server

## Common Patterns

**Async Testing:**
```typescript
it('should handle async form submission', async () => {
  const { getByRole } = render(<WaitlistForm />);

  const submitButton = getByRole('button', { name: /submit/i });
  await userEvent.click(submitButton);

  // Wait for async operation
  await waitFor(() => {
    expect(getByText(/success/i)).toBeInTheDocument();
  });
});
```

**Mocking Mutations:**
```typescript
it('should show error on duplicate email', async () => {
  const { useWaitlistJoinMutation } = await import('@/hooks/use-waitlist-mutation');

  vi.mocked(useWaitlistJoinMutation).mockReturnValue({
    mutate: vi.fn((data, callbacks) => {
      callbacks?.onError(new Error('This email is already on the waitlist!'));
    }),
    isPending: false,
  } as any);

  const { getByRole, getByText } = render(<WaitlistForm />);
  // ... test error display
});
```

**Testing Hooks:**
```typescript
it('should track breakpoint changes', () => {
  const { result } = renderHook(() => useBreakpoint());

  expect(result.current).toBe('xl');

  // Simulate resize
  fireEvent(window, new Event('resize'));

  expect(result.current).toBe('md');
});
```

**Testing Keyboard Events:**
```typescript
it('should submit form on Enter key', async () => {
  const { getByRole } = render(<WaitlistForm />);

  const input = getByRole('textbox', { name: /name/i });
  await userEvent.type(input, 'John', { skipClick: true });
  await userEvent.keyboard('{Enter}');

  // Verify submission occurred
  expect(vi.mocked(posthog.capture)).toHaveBeenCalledWith(
    'waitlist_joined',
    expect.any(Object)
  );
});
```

## Test Commands

**Recommended package.json scripts (to add):**
```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

---

*Testing analysis: 2026-02-26*

**Note:** This codebase currently has zero tests. These recommendations establish patterns for implementation when testing infrastructure is added.
