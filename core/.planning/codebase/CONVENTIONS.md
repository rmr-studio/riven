# Coding Conventions

**Analysis Date:** 2026-01-09

## Naming Patterns

**Files (Backend - Kotlin):**
- PascalCase for all files: `EntityTypeService.kt`, `BlockEnvironmentService.kt`
- Suffix patterns: `*Service.kt`, `*Controller.kt`, `*Repository.kt`, `*Entity.kt`
- Test files: `*Test.kt` (e.g., `EntityTypeServiceTest.kt`)
- One public class per file (Kotlin convention)

**Files (Frontend - TypeScript):**
- kebab-case for components: `entity-type-form.tsx`, `block-builder.tsx`
- kebab-case for utilities: `service.util.ts`, `validation.util.ts`, `error.util.ts`
- use-kebab-case.ts for hooks: `use-entity-form.ts`, `use-block-deletion-guard.ts`
- kebab-case.service.ts for services: `entity-type.service.ts`, `block.service.ts`
- kebab-case.store.ts for stores: `data-table.store.ts`
- kebab-case.interface.ts for types: `block.interface.ts`, `entity.interface.ts`
- Test files: `*.test.tsx` or `__tests__/{name}.test.tsx`

**Functions (Backend):**
- camelCase for all functions: `publishEntityType()`, `saveBlockEnvironment()`, `validateEntity()`
- No special prefix for async functions (Kotlin suspend functions)
- Handler naming: `handle*` not used (uses Spring controller methods)

**Functions (Frontend):**
- camelCase for all functions
- No special prefix for async functions (async/await pattern)
- Event handlers: `handle{EventName}` (e.g., `handleEditClick`, `handleSaveClick`)

**Variables (Backend):**
- camelCase for variables: `entityType`, `relationshipDefinition`, `blockTree`
- Constants: SCREAMING_SNAKE_CASE in `companion object` (e.g., `MAX_RETRIES`, `DEFAULT_VERSION`)
- No underscore prefix for private members

**Variables (Frontend):**
- camelCase for variables: `entityType`, `blockData`, `formState`
- Constants: SCREAMING_SNAKE_CASE (e.g., `API_BASE_URL`, `DEFAULT_PAGE_SIZE`)
- No underscore prefix for private members

**Types (Backend):**
- PascalCase for classes/data classes: `EntityType`, `BlockEnvironment`, `SaveEntityResponse`
- PascalCase for interfaces (no I prefix): `Metadata`, `Node`
- Enum names: PascalCase enum class, SCREAMING_SNAKE_CASE values (e.g., `EntityRelationshipCardinality.ONE_TO_MANY`)

**Types (Frontend):**
- PascalCase for interfaces/types: `EntityType`, `Block`, `SaveEntityResponse`
- No I prefix for interfaces
- Props interfaces: `{ComponentName}Props` or descriptive names (e.g., `BlockEnvironmentProviderProps`, `UsePanelEditModeOptions`)
- Type guards: `is{TypeName}` (e.g., `isContentMetadata()`, `isBlockReferenceMetadata()`)

## Code Style

**Formatting (Backend):**
- 4-space indentation (JetBrains Kotlin style)
- Trailing commas in multi-line declarations
- Expression-bodied functions for simple functions
- No explicit configuration files (relies on IntelliJ IDE inspection)

**Formatting (Frontend):**
- 2-space indentation (typical Next.js/React convention)
- Double quotes for strings and JSX attributes
- Semicolons required at end of statements
- Tailwind CSS for styling with `cn()` utility for conditional class merging

**Linting (Backend):**
- No explicit linting tool (relies on Kotlin compiler warnings and IDE inspection)
- Kotlin compiler option: `-Xjsr305=strict` in `build.gradle.kts`

**Linting (Frontend):**
- ESLint with `eslint.config.mjs`
- Extends: `next/core-web-vitals`, `next/typescript`
- TypeScript strict mode enabled: `"strict": true` in `tsconfig.json`
- Run: `npm run lint`

## Import Organization

**Order (Backend):**
No explicit import organization rule, but typical pattern:
1. Java/Kotlin standard library
2. Spring framework packages
3. Third-party libraries (Temporal, Supabase, etc.)
4. Application packages (riven.core.*)

**Order (Frontend):**
1. External packages (react, next, @tanstack/react-query, etc.)
2. Internal modules (components, hooks, services)
3. Relative imports (., ..)
4. Type imports (import type {})

**Grouping (Frontend):**
- Blank line between groups
- Type imports at the end of each group

**Path Aliases (Frontend):**
- `@/` maps to `<rootDir>/` (configured in `tsconfig.json` and `jest.config.ts`)

## Error Handling

**Patterns (Backend):**
- Throw exceptions, catch at controller level (Spring exception handlers)
- Custom exceptions: `SchemaValidationException`, `NotFoundException`, `AccessDeniedException`
- Nullable semantics: Use `T?` over `Optional<T>`
- `requireNotNull()` with descriptive messages
- `IllegalArgumentException` for invalid input
- `IllegalStateException` for constraint violations

**Patterns (Frontend):**
- Try-catch in service methods
- Throw errors with descriptive messages
- TanStack Query `onError` callbacks handle errors
- Toast notifications for user-facing errors (Sonner library)

**Error Types (Backend):**
- Throw on: invalid input, missing dependencies, invariant violations
- Log with context before throwing: `logger.error { "Failed to process: $context" }`
- Include cause when wrapping: `IllegalStateException("Failed to X", cause = originalError)`

**Error Types (Frontend):**
- Validate session before API calls: `validateSession(session)`
- Validate UUIDs: `validateUuid(id)`
- Service methods throw on validation errors or API errors

## Logging

**Framework (Backend):**
- Kotlin Logging 7.0.0 + SLF4J 2.0.16
- Usage: `private val logger = KotlinLogging.logger {}`

**Patterns (Backend):**
- Structured logging with context: `logger.info { "Created entity type: key=$key, version=$version" }`
- Log at service boundaries (method entry/exit for complex operations)
- Log state transitions, external calls, errors
- Levels: debug, info, warn, error (no trace)

**Framework (Frontend):**
- Console logging (development only)
- No structured logging framework detected

## Comments

**When to Comment (Backend):**
- Explain why, not what: `// Protected Entity Types cannot be modified by users`
- Document business rules: `// Relationship names must be unique within an entity type`
- Explain non-obvious algorithms or workarounds
- Avoid obvious comments: `// increment counter`

**When to Comment (Frontend):**
- JSDoc-style for functions: `/** Hook to guard against deletion... @example ... */`
- Inline comments for complex logic: `// Execute immediately if enough time has passed`
- Markdown in comments for critical sections: `/** Purpose: Extracts ~50 lines... Responsibilities: 1. ... */`

**KDoc/JSDoc:**
- Backend: KDoc for public API classes and methods
  ```kotlin
  /**
   * Service for managing entity types.
   *
   * Key difference from BlockTypeService: EntityTypes are MUTABLE.
   */
  @Service
  class EntityTypeService(...)
  ```
- Frontend: JSDoc for hooks and complex functions
  ```typescript
  /**
   * Hook to guard against deletion of protected blocks.
   * @example
   * const { canDeleteBlock } = useBlockDeletionGuard();
   */
  ```

**TODO Comments:**
- Backend: `// Todo. Will need to flesh this out later...`
- Frontend: `// TODO: Fix race condition`
- Pattern: Include context and reason for deferral

## Function Design

**Size:**
- Keep under 100 lines for maintainability
- Extract helpers for complex logic

**Parameters (Backend):**
- Constructor injection (required, no field injection)
- Function parameters: Max 3-4 parameters, use data classes for more
- Destructuring not commonly used in Kotlin

**Parameters (Frontend):**
- Max 3-4 parameters, use options object for more
- Destructure objects in parameter list: `function process({ id, name }: ProcessParams)`

**Return Values (Backend):**
- Explicit return types for public methods
- Return early for guard clauses
- Nullable types over Optional

**Return Values (Frontend):**
- Explicit return statements (no implicit undefined)
- Return early for guard clauses
- Async functions return Promise<T>

## Module Design

**Exports (Backend):**
- One public class per file
- Package-level visibility for internal helpers

**Exports (Frontend):**
- Named exports preferred
- Default exports for React components (Next.js pages)
- Barrel files (index.ts) re-export public API from feature modules

**Barrel Files (Frontend):**
- Use `index.ts` in `components/feature-modules/{feature}/interface/` to re-export types
- Avoid circular dependencies (import from specific files if needed)

---

*Convention analysis: 2026-01-09*
*Update when patterns change*
