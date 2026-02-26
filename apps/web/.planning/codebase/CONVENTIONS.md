# Coding Conventions

**Analysis Date:** 2026-02-26

## Naming Patterns

**Files:**
- Components: PascalCase (e.g., `Button.tsx`, `WaitlistForm.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useBreakpoint.ts`, `useWaitlistMutation.ts`)
- Utilities/Config: camelCase (e.g., `validations.ts`, `styles.ts`, `navigation.ts`)
- Type definition files: lowercase (e.g., `interface.ts`)
- Graphic components: numeric prefix with kebab-case (e.g., `2.integrations.tsx`, `3.identity-matching.tsx`, `7.templates.tsx`)
- Page files: kebab-case in routes (e.g., `privacy/page.tsx`)

**Functions:**
- Custom hooks: camelCase with `use` prefix (e.g., `useBreakpoint()`, `useWaitlistJoinMutation()`)
- Regular functions: camelCase (e.g., `createClient()`, `validateEnv()`, `cn()`)
- Event handlers: camelCase with action prefix (e.g., `handleJoin()`, `handleOk()`, `goForward()`)
- Mutation functions: past tense (e.g., `mutationFn`)
- Callback functions: descriptive camelCase (e.g., `updateBreakpoint()`, `toggleIntegration()`, `addCustomIntegration()`)

**Variables:**
- React state: camelCase (e.g., `currentStep`, `showOtherInput`, `selectedIntegrations`)
- Constants: UPPER_SNAKE_CASE for module-level constants (e.g., `PostgresErrorCode`, `PRESET_INTEGRATION_LABELS`, `INPUT_CLASS`)
- Type unions/discriminated types: UPPER_SNAKE_CASE (e.g., `UniqueViolation`, `WAITLIST`)
- Configuration objects: PascalCase for exported configs (e.g., `INTEGRATIONS_STEP_CONFIG`, `PRICING_STEP_CONFIG`)
- CSS class constants: UPPER_SNAKE_CASE (e.g., `INPUT_CLASS`, `INPUT_ERROR_CLASS`)

**Types:**
- Exported types: PascalCase (e.g., `Breakpoint`, `ButtonProps`, `ClassNameProps`)
- Interface names: PascalCase (e.g., `NavbarProps`, `LinkProps`)
- Type aliases from Zod: PascalCase with `Data` suffix (e.g., `WaitlistJoinData`, `WaitlistSurveyData`, `WaitlistMultiStepFormData`)
- Discriminated unions: use enums for values (e.g., `enum Step` with numeric values)

## Code Style

**Formatting:**
- Prettier configured with:
  - `printWidth: 100`
  - `tabWidth: 2`
  - `useTabs: false`
  - `semi: true`
  - `singleQuote: true` (except JSX attributes use double quotes)
  - `jsxSingleQuote: false`
  - `trailingComma: "all"`
  - `arrowParens: "always"`
  - `endOfLine: "lf"`

**Linting:**
- ESLint using Next.js recommended config
- Uses `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Config location: `eslint.config.mjs`
- Tailwind CSS formatting applied by `prettier-plugin-tailwindcss`

**File structure conventions:**
- Component files export a single default or named component
- Providers are wrapped in `providers/` directory with individual files (e.g., `query-provider.tsx`)
- UI components in `components/ui/`
- Feature modules organized by feature name: `components/feature-modules/[feature]/`
- Within feature modules: `components/`, `config/`, `hooks/`, `query/` subdirectories

## Import Organization

**Order:**
1. React/Next.js imports at top
2. Third-party library imports
3. Internal component imports (from `@/components`)
4. Internal hook imports (from `@/hooks`)
5. Internal type imports (use `type` keyword)
6. Utility imports (from `@/lib`)
7. Style imports at end

**Example from `waitlist-form.tsx`:**
```typescript
'use client';

import { CtaStep } from '@/components/feature-modules/waitlist/components/steps/1.cta';
import { ... } from '@/components/feature-modules/...';
import posthog from 'posthog-js';
import { useWaitlistJoinMutation, ... } from '@/hooks/use-waitlist-mutation';
import { cn } from '@/lib/utils';
import { waitlistFormSchema, type WaitlistMultiStepFormData } from '@/lib/validations';
```

**Path Aliases:**
- `@/*` maps to project root (configured in `tsconfig.json`)
- Always use `@/` prefix for internal imports

**Import style:**
- Use `import type` for type-only imports to support tree-shaking
- Named imports preferred over default imports
- Group related imports together

## Error Handling

**Patterns:**
- Async mutations catch errors and re-throw with descriptive messages
- Error messages displayed to user via toast notifications (`toast.error()`)
- Specific error handling in mutations (e.g., checking PostgresErrorCode for unique constraint violations)
- Form validation errors handled via `react-hook-form` and displayed inline
- Environment validation errors throw immediately with formatted error message listing all issues

**Example from `useWaitlistJoinMutation()`:**
```typescript
if (error) {
  if (error.code === PostgresErrorCode.UniqueViolation) {
    throw new Error("This email is already on the waitlist!");
  }
  throw new Error(error.message);
}
```

**Validation:**
- Use Zod schemas for data validation
- Environment variables validated via Zod with `.safeParse()`
- Form validation uses `zodResolver` from `@hookform/resolvers`
- Validation mode: `onTouched` for forms

## Logging

**Framework:** `posthog` for analytics

**Patterns:**
- Capture user actions at key points (e.g., step navigation, form submission)
- Event names: snake_case (e.g., `waitlist_step_completed`, `waitlist_joined`, `waitlist_survey_submitted`)
- Structured event data passed as objects with snake_case keys
- Analytics events fired in callback handlers and mutations
- Toast notifications (`sonner`) used for user feedback, not logging

**Example from `waitlist-form.tsx`:**
```typescript
posthog.capture('waitlist_step_completed', {
  from_step: STEP_NAMES[currentStep],
  to_step: STEP_NAMES[currentStep + 1],
});
```

## Comments

**When to Comment:**
- HTML comments for structural sections in JSX (e.g., `{/* Progress bar */}`, `{/* Navigation */}`)
- Comments for complex algorithms or non-obvious business logic
- Comments for TODO items (though only 1 found in codebase at `app/sitemap.ts`)
- No excessive comment coverage; code should be self-documenting through clear naming

**JSDoc/TSDoc:**
- Not heavily used in this codebase
- Used minimally for type-only files and exports
- Parameter and return documentation inferred from TypeScript types

## Function Design

**Size:** Functions kept reasonably small; largest component logic broken into handlers (e.g., `handleJoin()`, `handleSurveyNext()`, `renderStep()`)

**Parameters:**
- React components take props object with destructuring
- Utility functions accept positional parameters
- Form handlers use `useCallback` with proper dependency arrays
- Callbacks prefer callback syntax over separate handler definitions

**Return Values:**
- Components return JSX elements wrapped in fragments or divs when needed
- Custom hooks return typed values matching their purpose
- Functions return early on error conditions
- Mutations use `onSuccess`/`onError` callbacks instead of return values

## Module Design

**Exports:**
- Named exports for components, hooks, utilities
- Default exports used sparingly (e.g., `export default function Home()` for Next.js pages)
- Type exports use `export type` to enable tree-shaking
- Configuration objects exported as named exports

**Barrel Files:**
- Not heavily used; direct imports from specific files preferred
- Some feature modules have direct internal imports rather than barrel exports

**Component Composition:**
- Larger components broken into smaller focused components within feature modules
- Props passed explicitly; context used for providers (QueryProvider, ThemeProvider, etc.)
- Controlled components pattern used with `react-hook-form`

## Tailwind CSS

**Pattern:**
- Classes applied inline using `className` prop
- Utility classes used primarily (e.g., `flex`, `items-center`, `gap-2`)
- Custom CSS via CSS variables for theming
- Prettier plugin automatically organizes Tailwind classes in CSS specificity order

**Example:**
```typescript
<button className={cn(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium',
  'transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
)}>
```

## Type Safety

**Pattern:**
- Full TypeScript with strict mode enabled via `@riven/tsconfig`
- Component props typed with interfaces (e.g., `ButtonProps`, `NavbarProps`)
- React component types from `@types/react` and `@types/react-dom`
- Zod used for runtime validation of user input and environment variables
- Type narrowing used in conditional branches

---

*Convention analysis: 2026-02-26*
