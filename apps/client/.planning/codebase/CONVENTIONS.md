# Coding Conventions

**Analysis Date:** 2026-01-19

## Naming Patterns

**Files:**

- Components: `kebab-case.tsx` (e.g., `entity-type-header.tsx`, `relationship-form.tsx`)
- Utilities: `kebab-case.util.ts` (e.g., `error.util.ts`, `schema.util.ts`)
- Services: `kebab-case.service.ts` (e.g., `entity-type.service.ts`, `workspace.service.ts`)
- Hooks: `use-kebab-case.ts` (e.g., `use-entity-types.ts`, `use-save-definition-mutation.ts`)
- Stores: `kebab-case.store.ts` (e.g., `entity.store.ts`, `workspace.store.ts`)
- Interfaces: `kebab-case.interface.ts` (e.g., `entity.interface.ts`, `workspace.interface.ts`)
- Test files: `ComponentName.test.tsx` in `__tests__/` directories

**Functions:**

- Components: `PascalCase` (e.g., `Button`, `RelationshipAttributeForm`, `EntityTypeHeader`)
- Hooks: `use{Name}` prefix with camelCase (e.g., `useEntityTypes`, `useSaveDefinitionMutation`)
- Regular functions: `camelCase` (e.g., `validateSession`, `handleError`, `buildAttributeMetadataMap`)
- Service methods: Static methods in `PascalCase` classes with `camelCase` method names

**Variables:**

- Constants: `camelCase` for local, `UPPER_SNAKE_CASE` for exported constants
- State variables: `camelCase` (e.g., `isDraftMode`, `selectedEntityTypeKeys`)
- React refs: `{name}Ref` suffix (e.g., `submissionToastRef`, `storeRef`)

**Types:**

- Interfaces: `PascalCase` (e.g., `EntityType`, `SaveEntityRequest`, `ResponseError`)
- Props interfaces: `{ComponentName}Props` or just `Props` when defined within component file
- Type aliases: `PascalCase` (e.g., `EntityDraftStoreApi`, `AuthenticatedQueryResult`)

## Code Style

**Formatting:**

- No explicit Prettier configuration detected (relies on Next.js defaults)
- 4-space indentation (observed in source files)
- Double quotes for strings
- Trailing commas in multi-line objects/arrays
- Arrow functions for React components and callbacks

**Linting:**

- ESLint via `eslint.config.mjs`
- Extends `next/core-web-vitals` and `next/typescript`
- Flat config format (ESLint 9+)
- Run: `npm run lint`

**TypeScript:**

- Strict mode enabled (`"strict": true`)
- Path alias: `@/*` maps to project root
- Target: ES2017
- JSX: preserve (handled by Next.js)

## Import Organization

**Order:**

1. External libraries (React, Next.js, third-party packages)
2. Internal aliases starting with `@/` (components, lib, types)
3. Relative imports from feature module (../interface, ../service, ../util)
4. Type imports (may be mixed with regular imports)

**Example:**

```typescript
import { useAuth } from '@/components/provider/auth-context';
import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { useRef } from 'react';
import { toast } from 'sonner';
import {
  EntityType,
  SaveTypeDefinitionRequest,
  type EntityTypeImpactResponse,
} from '../../../interface/entity.interface';
import { EntityTypeService } from '../../../service/entity-type.service';
```

**Path Aliases:**

- `@/*` - Project root alias (configured in `tsconfig.json`)
- Always use absolute imports for cross-module references
- Use relative imports within same feature module for internal references

**Type Import Rules:**

- OpenAPI types: Never import directly from `@/lib/types/types.ts`
- Always use re-exported types from feature interfaces (e.g., `@/components/feature-modules/entity/interface/entity.interface.ts`)
- Enums: Can import directly from `@/lib/types/types.ts` as they are exported constants
- Use `type` keyword for type-only imports when beneficial

## Error Handling

**Centralized Error Utilities:**
All error handling flows through `@/lib/util/error/error.util.ts`:

```typescript
export interface ResponseError extends Error {
  status: number;
  error: string;
  message: string;
  stackTrace?: string;
  details?: unknown;
}
```

**Service Layer Pattern:**

```typescript
static async getEntityTypes(session: Session | null, workspaceId: string): Promise<EntityType[]> {
    try {
        validateSession(session);
        validateUuid(workspaceId);
        const url = api();

        const response = await fetch(`${url}/v1/entity/schema/workspace/${workspaceId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
            },
        });

        if (response.ok) return await response.json();

        throw await handleError(
            response,
            (res) => `Failed to fetch entity types: ${res.status} ${res.statusText}`
        );
    } catch (error) {
        if (isResponseError(error)) throw error;
        throw fromError(error);
    }
}
```

**Validation Functions:**

- `validateSession(session)` - Asserts session is valid, throws if null
- `validateUuid(id)` - Throws if ID is not a valid UUID
- `handleError(response, messageFn)` - Converts fetch response to `ResponseError`
- `fromError(error)` - Normalizes any error type to `ResponseError`
- `isResponseError(error)` - Type guard for `ResponseError`

**Mutation Error Handling:**
Errors propagate to mutation hooks and display via toast notifications:

```typescript
onError: (error: Error) => {
  toast.dismiss(submissionToastRef.current);
  toast.error(`Failed to save: ${error.message}`);
};
```

## Logging

**Framework:** `console` methods (no specialized logging library)

**Patterns:**

- `console.warn()` for non-critical issues (e.g., `console.warn('No metadata found for attribute: ${key}')`)
- `console.error()` for caught errors
- Minimal logging in production code
- Most user feedback via toast notifications (Sonner library)

**Toast Notifications:**

- Loading states: `toast.loading("Saving...")`
- Success: `toast.success("Saved successfully!")`
- Errors: `toast.error(\`Failed: ${error.message}\`)`
- Use refs to update same toast: `toast.success(msg, { id: toastRef.current })`

## Comments

**When to Comment:**

- Complex business logic requiring explanation
- TODOs for future work (30+ instances found)
- JSDoc for exported utilities and service methods
- Inline comments for non-obvious type assertions or workarounds

**Comment Style:**

- Single-line: `// Comment text`
- Multi-line: Standard `/* */` blocks
- TODO format: `// TODO: Description` or `// todo: Description` (inconsistent capitalization)

**JSDoc/TSDoc:**
Limited usage. Found in utility functions:

```typescript
/**
 * Converts an unknown error into a ResponseError with proper formatting
 */
export function fromError(error: unknown): ResponseError { ... }
```

## Function Design

**Size:**

- Services: 20-50 lines per method (including error handling)
- Components: Variable, but keep render logic focused
- Hooks: 30-70 lines for mutation hooks with full lifecycle
- Utilities: Small, focused functions (10-30 lines)

**Parameters:**

- Service methods: `session` always first parameter
- Mutation hooks: `workspaceId` or context ID first, `options?` last
- Components: Destructured props with TypeScript interface
- Optional parameters use `?` or default values

**Return Values:**

- Services: Return typed responses from OpenAPI schemas
- Hooks: Return object with destructured values `{ form, handleSubmit, mode }`
- Mutations: Return TanStack Query mutation object
- Type guards: Return type predicates `is Type`

## Module Design

**Exports:**

- Named exports preferred over default exports
- Component files: `export { Component }` or `export const Component`
- Service classes: `export class ServiceName { static methods }`
- Utilities: Individual named function exports
- Types: Re-export from feature interfaces

**Barrel Files:**

- Not extensively used
- Interfaces re-export from OpenAPI types
- No index.ts barrel pattern observed

**Feature Module Pattern:**
Every feature follows this structure:

```
feature-name/
├── components/          # UI components
├── context/            # React Context providers
├── hooks/              # Custom hooks
│   ├── form/          # Form hooks
│   ├── mutation/      # TanStack mutation hooks
│   └── query/         # TanStack query hooks
├── interface/          # TypeScript interfaces (re-exports OpenAPI types)
├── service/            # API client services (static classes)
├── stores/             # Zustand stores (scoped state)
└── util/               # Feature-specific utilities
```

## React Patterns

**Client Components:**
Use `"use client"` directive at top of file when using:

- Hooks (`useState`, `useEffect`, etc.)
- Browser APIs
- Event handlers
- Context consumers

**Props Destructuring:**

```typescript
export const RelationshipAttributeForm: FC<Props> = ({
    type,
    relationship,
    dialog,
    workspaceId,
}) => { ... }
```

**Conditional Rendering:**
Use `&&` for conditional elements, ternary for alternate content:

```typescript
{activeOverlaps.length > 0 && <RelationshipOverlapAlert />}
{isReference ? "Cannot change" : "Select entities"}
```

**Class Names:**
Use `cn()` utility (from `@/lib/util/utils`) to merge Tailwind classes:

```typescript
className={cn(
    "text-sm font-medium",
    isActive ? "text-foreground" : "text-muted-foreground"
)}
```

## Type Safety Patterns

**Type Guards:**
Preferred over type assertions:

```typescript
export function isResponseError(error: unknown): error is ResponseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'error' in error &&
    'message' in error
  );
}
```

**Assertion Functions:**
For validation that throws:

```typescript
export function validateSession(session: Session | null): asserts session is NonNullable<Session> {
  if (!session?.access_token) {
    throw fromError({ message: 'No active session', status: 401, error: 'NO_SESSION' });
  }
}
```

**Generic Constraints:**
Used in Zustand stores and hooks:

```typescript
export const useEntityTypeConfigurationStore = <T,>(
    selector: (store: EntityTypeConfigStore) => T
): T => { ... }
```

---

_Convention analysis: 2026-01-19_
