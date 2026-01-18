# Coding Conventions

**Analysis Date:** 2026-01-18

## Naming Patterns

**Files (Client - TypeScript/React):**
- Components: `kebab-case.tsx` (e.g., `entity-type-header.tsx`)
- Utilities: `kebab-case.util.ts` (e.g., `auth.util.ts`)
- Services: `kebab-case.service.ts` (e.g., `entity-type.service.ts`)
- Hooks: `use-kebab-case.ts` (e.g., `use-save-definition-mutation.ts`)
- Stores: `kebab-case.store.ts`
- Interfaces: `kebab-case.interface.ts` (e.g., `entity.interface.ts`)
- Test files: `ComponentName.test.tsx` inside `__tests__/` directories

**Files (Core - Kotlin):**
- Services: `PascalCase.kt` (e.g., `EntityTypeService.kt`)
- Entities: `PascalCaseEntity.kt` (e.g., `EntityTypeEntity.kt`)
- Repositories: `PascalCaseRepository.kt`
- Tests: `PascalCaseTest.kt` (e.g., `EntityRelationshipServiceTest.kt`)
- Configuration: `PascalCaseConfig.kt` (e.g., `SecurityConfig.kt`)

**Functions/Methods:**
- TypeScript: `camelCase` (e.g., `getEntityTypes`, `handleSubmit`)
- Kotlin: `camelCase` (e.g., `publishEntityType`, `saveRelationships`)

**Variables:**
- Both: `camelCase` for local variables
- Constants: `SCREAMING_SNAKE_CASE` in Kotlin companion objects

**Types/Interfaces:**
- TypeScript: `PascalCase` (e.g., `EntityType`, `SaveTypeDefinitionRequest`)
- Kotlin: `PascalCase` (e.g., `EntityRelationshipDefinition`)

**React Components:**
- `PascalCase` for component names
- Props interfaces: `{ComponentName}Props`

## Code Style

**Formatting (Client):**
- Tool: Prettier (via Next.js defaults)
- Indentation: 4 spaces
- Semicolons: Required
- Quotes: Double quotes for strings

**Formatting (Core):**
- Tool: JetBrains Kotlin style (IntelliJ defaults)
- Indentation: 4 spaces
- Trailing commas: Used in multi-line declarations

**Linting (Client):**
- Tool: ESLint with `next/core-web-vitals` and `next/typescript`
- Config: `client/eslint.config.mjs`

**TypeScript:**
- Strict mode enabled
- Path alias: `@/*` maps to project root
- Target: ES2017

## Import Organization

**TypeScript (Client):**
1. External libraries (React, Next.js, third-party)
2. Internal aliases (`@/components`, `@/lib`)
3. Relative imports

**Path Aliases:**
- `@/*` - Maps to `client/*` root

**Kotlin (Core):**
1. Java/Jakarta imports
2. Spring framework imports
3. Project imports (`riven.core.*`)
4. Standard library imports

## Error Handling

**Client (TypeScript):**
```typescript
// Service layer pattern - use handleError utility
if (response.ok) return await response.json();
throw await handleError(
    response,
    (res) => `Failed to fetch entity types: ${res.status} ${res.statusText}`
);

// Catch block pattern - re-throw ResponseError, wrap others
catch (error) {
    if (isResponseError(error)) throw error;
    throw fromError(error);
}
```

**Mutation hooks pattern:**
- Use `onMutate` for loading toast
- Use `onError` to dismiss loading and show error toast
- Use `onSuccess` to dismiss loading, show success toast, update cache

**Core (Kotlin):**
```kotlin
// Validation exceptions for schema/payload failures
throw SchemaValidationException("Validation failed: ${errors.joinToString()}")

// Not found exceptions
throw NotFoundException("Entity type not found: $key")

// Access denied for authorization
throw AccessDeniedException("User not authorized for workspace")

// State violations for constraint errors
throw IllegalStateException("Cannot delete entity type with existing entities")
```

## Logging

**Client:**
- Framework: Browser console
- No structured logging framework in use

**Core (Kotlin):**
- Framework: Kotlin Logging (kotlin-logging-jvm) + SLF4J
- Injected as bean: `private val logger: KLogger`
- Pattern: Use `logger.info`, `logger.debug`, `logger.error`

## Comments

**When to Comment:**
- Complex business logic (especially relationship orchestration)
- Service class descriptions explaining responsibilities
- Test method descriptions via backtick strings (Kotlin)

**JSDoc/TSDoc:**
- Used sparingly for complex utility functions
- Type information inferred from TypeScript

**KDoc (Kotlin):**
- Service classes have brief descriptions
- Key methods documented with `@param`, `@return`
- Test classes have overview comments explaining test scope

## Function Design

**Size:**
- Keep functions focused on single responsibility
- Large orchestration functions (e.g., `saveRelationships`) are acceptable when they coordinate related operations

**Parameters:**
- TypeScript: Use typed request objects for complex inputs
- Kotlin: Use data classes for request/response

**Return Values:**
- TypeScript: Explicit return types on service methods
- Kotlin: Return domain models (not entities) from services

## Module Design

**Exports (Client):**
```typescript
// Interface files re-export OpenAPI types with semantic names
export type EntityType = components["schemas"]["EntityType"];

// Type guards exported alongside types
export const isRelationshipDefinition = (
    attribute: EntityRelationshipDefinition | EntityAttributeDefinition
): attribute is EntityRelationshipDefinition => {
    return !("schema" in attribute);
};
```

**Barrel Files:**
- Not heavily used; imports are typically direct to file

## Service Layer Patterns

**Client - Static Service Classes:**
```typescript
export class EntityTypeService {
    static async getEntityTypes(
        session: Session | null,
        workspaceId: string
    ): Promise<EntityType[]> {
        validateSession(session);
        validateUuid(workspaceId);
        // ... fetch logic
    }
}
```
- All methods are `static`
- First param is always `session` for auth
- Always validate session and UUIDs first
- Use `handleError` for response error handling

**Core - Constructor Injection:**
```kotlin
@Service
class EntityTypeService(
    private val entityTypeRepository: EntityTypeRepository,
    private val entityTypeRelationshipService: EntityTypeRelationshipService,
    private val authTokenService: AuthTokenService,
    private val activityService: ActivityService,
) {
    // No field injection, no @Autowired
}
```
- Always use constructor injection
- No `@Autowired` annotations
- Dependencies listed in constructor

**Transactional Boundaries:**
```kotlin
@Transactional
@PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
fun publishEntityType(workspaceId: UUID, request: CreateEntityTypeRequest): EntityType {
    // All database operations in single transaction
}
```
- Use `@Transactional` on service methods modifying data
- Use `@PreAuthorize` for authorization checks

## Type Safety Patterns

**OpenAPI Type Re-exports (Client):**
```typescript
// Always import from feature interface files, not lib/types directly
import { EntityType } from "../interface/entity.interface";

// Interface file re-exports with semantic names
export type EntityType = components["schemas"]["EntityType"];
```

**Type Guards:**
```typescript
export const isRelationshipPayload = (
    payload: EntityAttributePayload
): payload is EntityAttributeRelationPayload => {
    return payload.type === EntityPropertyType.RELATIONSHIP;
};
```
- Use type guards for discriminated unions
- Never use `as` type assertions when type guards can work

**Enums:**
- Can be imported directly from `@/lib/types/types` (they are exported consts)

## Mutation Hook Pattern

```typescript
export function useSaveDefinitionMutation(
    workspaceId: string,
    options?: UseMutationOptions<EntityTypeImpactResponse, Error, SaveTypeDefinitionRequest>
) {
    const queryClient = useQueryClient();
    const { session } = useAuth();
    const submissionToastRef = useRef<string | number | undefined>(undefined);

    return useMutation({
        mutationFn: (definition) =>
            EntityTypeService.saveEntityTypeDefinition(session, workspaceId, definition),
        onMutate: () => {
            submissionToastRef.current = toast.loading("Saving...");
        },
        onSuccess: (response) => {
            toast.dismiss(submissionToastRef.current);
            toast.success("Saved successfully!");
            // Update cache
            queryClient.setQueryData(["entityType", key, workspaceId], response);
        },
        onError: (error) => {
            toast.dismiss(submissionToastRef.current);
            toast.error(`Failed: ${error.message}`);
        },
        ...options,
    });
}
```
- Use `useRef` for toast ID tracking
- Allow `options` override for custom behavior
- Update/invalidate cache on success

## Form Patterns

**React Hook Form with Zod:**
```typescript
const form = useForm<EntityTypeFormValues>({
    resolver: zodResolver(entityTypeFormSchema),
    defaultValues: { /* ... */ },
    mode: "onBlur",
});
```
- Use Zod schemas for validation
- Mode typically `onBlur` for better UX
- Type form values from Zod schema

## State Management

**Zustand Stores with Context:**
```typescript
// Store factory for per-instance stores
export const createEntityTypeConfigStore = (
    entityTypeKey: string,
    workspaceId: string,
    entityType: EntityType,
    form: UseFormReturn<EntityTypeFormValues>
) => {
    return create<EntityTypeConfigStore>()(
        subscribeWithSelector((set, get) => ({
            isDirty: false,
            setDirty: (isDirty) => set({ isDirty }),
        }))
    );
};
```
- Factory function creates scoped store instances
- Provider wraps components needing access
- `subscribeWithSelector` for fine-grained subscriptions

---

*Convention analysis: 2026-01-18*
