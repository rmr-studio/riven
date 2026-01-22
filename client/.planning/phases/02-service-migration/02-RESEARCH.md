# Phase 2: Service Migration - Research

**Researched:** 2026-01-22
**Domain:** OpenAPI Generator typescript-fetch client migration
**Confidence:** HIGH

## Summary

This phase involves replacing manual `fetch()` calls in two service files with generated `EntityApi` wrappers. The generated API uses a `Configuration` class for auth injection via `accessToken` parameter, and `BaseAPI` for request handling.

The migration is straightforward for most methods but requires careful handling of **HTTP 409 (Conflict) responses** which return valid response data rather than errors. The generated API throws `ResponseError` for any non-2xx status, but the current services treat 409 as a successful response returning impact analysis data. This requires using the `*Raw` methods to access the raw Response object.

**Primary recommendation:** Create a centralized API factory function in `lib/api/entity-api.ts` that configures `EntityApi` with session-based auth. Use `*Raw` methods with custom response handling for endpoints that return data on 409 status codes.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@/lib/types` (generated) | Current | EntityApi, Configuration, runtime | Generated from OpenAPI spec via openapi-generator-cli |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@supabase/supabase-js` | 2.50.0 | Session type for auth tokens | Auth context provides Session object |

### No Additional Dependencies Required

The generated `EntityApi` class and `Configuration` are self-contained. No additional HTTP client libraries needed.

**Import paths:**
```typescript
// API client and Configuration
import { EntityApi, Configuration, ResponseError } from "@/lib/types";

// Types (continue using interface re-exports per Phase 1 pattern)
import { EntityType, EntityTypeImpactResponse, ... } from "../interface/entity.interface";
```

## Architecture Patterns

### Recommended Project Structure

```
lib/
├── api/
│   └── entity-api.ts        # NEW: Factory function for EntityApi
├── types/
│   ├── apis/
│   │   └── EntityApi.ts     # Generated API class
│   ├── models/              # Generated types
│   └── runtime.ts           # Configuration, ResponseError, etc.
└── util/
    ├── error/
    │   └── error.util.ts    # Keep existing error utilities
    └── service/
        └── service.util.ts  # Keep validateSession, validateUuid
```

### Pattern 1: API Factory Function

**What:** Singleton factory that creates configured EntityApi instances
**When to use:** All service methods that need authenticated API calls

```typescript
// lib/api/entity-api.ts
import { EntityApi, Configuration } from "@/lib/types";
import { Session } from "@supabase/supabase-js";

/**
 * Creates an EntityApi instance configured with session-based authentication.
 * Uses NEXT_PUBLIC_API_URL for base path.
 */
export function createEntityApi(session: Session | null): EntityApi {
    if (!session?.access_token) {
        throw new Error("No active session found");
    }

    const config = new Configuration({
        basePath: process.env.NEXT_PUBLIC_API_URL,
        accessToken: async () => session.access_token,
    });

    return new EntityApi(config);
}
```

### Pattern 2: Service Method Migration (Simple Case)

**What:** Replace fetch with EntityApi call for 2xx-only endpoints
**When to use:** Endpoints that only return success (200) or throw errors

```typescript
// BEFORE
static async getEntityTypes(session: Session | null, workspaceId: string): Promise<EntityType[]> {
    validateSession(session);
    validateUuid(workspaceId);
    const url = api();
    const response = await fetch(`${url}/v1/entity/schema/workspace/${workspaceId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
    });
    if (response.ok) return await response.json();
    throw await handleError(response, (res) => `Failed: ${res.status}`);
}

// AFTER
static async getEntityTypes(session: Session | null, workspaceId: string): Promise<EntityType[]> {
    validateSession(session);
    validateUuid(workspaceId);
    const api = createEntityApi(session);
    return api.getEntityTypesForWorkspace({ workspaceId });
}
```

### Pattern 3: Service Method Migration (409 Response Case)

**What:** Replace fetch with EntityApi *Raw method for endpoints returning data on 409
**When to use:** Impact analysis endpoints (delete definition, save definition, delete type)

```typescript
// BEFORE
static async saveEntityTypeDefinition(
    session: Session | null,
    workspaceId: string,
    definition: SaveTypeDefinitionRequest,
    impactConfirmed: boolean = false
): Promise<EntityTypeImpactResponse> {
    // ... validation ...
    const response = await fetch(`${url}/...?impactConfirmed=${impactConfirmed}`, { ... });
    // Both 200 (success) and 409 (conflict with impact) return EntityTypeImpactResponse
    if (response.ok || response.status === 409) return await response.json();
    throw await handleError(response, ...);
}

// AFTER
static async saveEntityTypeDefinition(
    session: Session | null,
    workspaceId: string,
    definition: SaveTypeDefinitionRequest,
    impactConfirmed: boolean = false
): Promise<EntityTypeImpactResponse> {
    validateSession(session);
    validateUuid(workspaceId);
    const api = createEntityApi(session);

    try {
        return await api.saveEntityTypeDefinition({
            workspaceId,
            saveTypeDefinitionRequest: definition,
            impactConfirmed,
        });
    } catch (error) {
        // Handle 409 Conflict - returns valid impact response data
        if (error instanceof ResponseError && error.response.status === 409) {
            return await error.response.json();
        }
        throw error;
    }
}
```

### Pattern 4: Handling 400/409 Dual Response

**What:** Handle endpoints that return data on both 400 and 409 (validation + impact errors)
**When to use:** Entity save operations

```typescript
// AFTER
static async saveEntity(
    session: Session | null,
    workspaceId: string,
    entityTypeId: string,
    request: SaveEntityRequest
): Promise<SaveEntityResponse> {
    validateSession(session);
    validateUuid(workspaceId);
    validateUuid(entityTypeId);
    const api = createEntityApi(session);

    try {
        return await api.saveEntity({
            workspaceId,
            entityTypeId,
            saveEntityRequest: request,
        });
    } catch (error) {
        // Both 400 (validation) and 409 (impact) return SaveEntityResponse payload
        if (error instanceof ResponseError &&
            (error.response.status === 400 || error.response.status === 409)) {
            return await error.response.json();
        }
        throw error;
    }
}
```

### Anti-Patterns to Avoid

- **Recreating fetch logic:** Don't use `fetch()` alongside EntityApi - use the generated client consistently
- **Ignoring ResponseError:** The generated API throws `ResponseError` for non-2xx - catch and handle appropriately
- **Hardcoding base URLs:** Use Configuration with `process.env.NEXT_PUBLIC_API_URL`
- **Skipping validation:** Keep `validateSession()` and `validateUuid()` calls - they provide better error messages than API-level RequiredError

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth header injection | Manual header building | `Configuration.accessToken` | Automatic Bearer token handling |
| URL construction | String concatenation | EntityApi methods | Type-safe, path parameters encoded automatically |
| Query parameter serialization | Manual URLSearchParams | EntityApi | Handles array params, encoding |
| Request body serialization | JSON.stringify | EntityApi | Uses generated `*ToJSON` functions |
| Response deserialization | Manual JSON parsing | EntityApi | Uses generated `*FromJSON` functions |

**Key insight:** The generated API handles all fetch complexity including headers, body serialization, path encoding, and response typing. The only manual handling needed is for non-standard status codes (409, 400) that return valid data.

## Common Pitfalls

### Pitfall 1: ResponseError Confusion

**What goes wrong:** Confusing generated `ResponseError` (from runtime.ts) with app's `ResponseError` (from error.util.ts)
**Why it happens:** Both have the same name but different structures
**How to avoid:** Import from specific paths:
```typescript
import { ResponseError as ApiResponseError } from "@/lib/types/runtime";
import { ResponseError } from "@/lib/util/error/error.util";
```
Or use the barrel import and access `.response` property to distinguish (API's has it, app's doesn't)
**Warning signs:** Type errors about missing `response` property or `status` shape mismatch

### Pitfall 2: 409 Responses Thrown as Errors

**What goes wrong:** Impact analysis responses (409) are thrown instead of returned
**Why it happens:** Generated API treats all non-2xx as errors
**How to avoid:** Use try/catch pattern shown in Pattern 3/4 above
**Warning signs:** Impact modals not showing, "Failed to save" errors when backend returns impact data

### Pitfall 3: Session Validation Timing

**What goes wrong:** Session validation after API creation causes confusing errors
**Why it happens:** `createEntityApi` needs valid session but validation happens after
**How to avoid:** Always call `validateSession(session)` BEFORE `createEntityApi(session)`
**Warning signs:** Cryptic "access_token is undefined" errors instead of "No active session"

### Pitfall 4: Method Name Mapping Confusion

**What goes wrong:** Using wrong API method names (service methods don't match generated method names)
**Why it happens:** Generated methods have verbose names based on OpenAPI operationId
**How to avoid:** Reference the mapping table below
**Warning signs:** TypeScript "property does not exist" errors

### Pitfall 5: URL Path Mismatch

**What goes wrong:** API calls fail with 404 errors
**Why it happens:** Generated API adds `/api` prefix to paths (BASE_PATH is `http://localhost:8081`)
**How to avoid:** Ensure `NEXT_PUBLIC_API_URL` does NOT include `/api` suffix if generated paths include it
**Warning signs:** 404 errors, paths like `/api/api/v1/...`

## Method Mapping

Complete mapping between current service methods and EntityApi methods:

### EntityTypeService Methods

| Service Method | EntityApi Method | Special Handling |
|----------------|------------------|------------------|
| `getEntityTypes(session, workspaceId)` | `getEntityTypesForWorkspace({ workspaceId })` | None - returns `EntityType[]` |
| `getEntityTypeByKey(session, workspaceId, key)` | `getEntityTypeByKeyForWorkspace({ workspaceId, key })` | None - returns `EntityType` |
| `publishEntityType(session, workspaceId, request)` | `createEntityType({ workspaceId, createEntityTypeRequest: request })` | None - returns `EntityType` |
| `saveEntityTypeConfiguration(session, workspaceId, entityType)` | `updateEntityType({ workspaceId, entityType })` | None - returns `EntityType` |
| `removeEntityTypeDefinition(session, workspaceId, definition, impactConfirmed)` | `deleteEntityTypeDefinition({ workspaceId, deleteTypeDefinitionRequest: definition, impactConfirmed })` | **Catch 409** - returns `EntityTypeImpactResponse` |
| `saveEntityTypeDefinition(session, workspaceId, definition, impactConfirmed)` | `saveEntityTypeDefinition({ workspaceId, saveTypeDefinitionRequest: definition, impactConfirmed })` | **Catch 409** - returns `EntityTypeImpactResponse` |
| `deleteEntityType(session, workspaceId, entityTypeKey, impactConfirmed)` | `deleteEntityTypeByKey({ workspaceId, key: entityTypeKey, impactConfirmed })` | **Catch 409** - returns `EntityTypeImpactResponse` |

### EntityService Methods

| Service Method | EntityApi Method | Special Handling |
|----------------|------------------|------------------|
| `saveEntity(session, workspaceId, entityTypeId, request)` | `saveEntity({ workspaceId, entityTypeId, saveEntityRequest: request })` | **Catch 400, 409** - returns `SaveEntityResponse` |
| `getEntitiesForType(session, workspaceId, typeId)` | `getEntityByTypeIdForWorkspace({ workspaceId, id: typeId })` | None - returns `Entity[]` |
| `getEntitiesForTypes(session, workspaceId, typeIds)` | `getEntityByTypeIdInForWorkspace({ workspaceId, ids: typeIds })` | None - returns `Record<string, Entity[]>` |
| `deleteEntities(session, workspaceId, entityIds)` | `deleteEntity({ workspaceId, requestBody: entityIds })` | None - returns `DeleteEntityResponse` |

## Code Examples

### Complete Factory Function

```typescript
// lib/api/entity-api.ts
import { EntityApi, Configuration } from "@/lib/types";
import { Session } from "@supabase/supabase-js";

/**
 * Creates a configured EntityApi instance for authenticated requests.
 *
 * @param session - Supabase session with access_token
 * @returns Configured EntityApi instance
 * @throws Error if session is invalid
 */
export function createEntityApi(session: Session | null): EntityApi {
    if (!session?.access_token) {
        throw new Error("No active session found");
    }

    const basePath = process.env.NEXT_PUBLIC_API_URL;
    if (!basePath) {
        throw new Error("API URL not configured");
    }

    const config = new Configuration({
        basePath,
        accessToken: async () => session.access_token,
    });

    return new EntityApi(config);
}
```

### Migrated Service with 409 Handling

```typescript
// entity-type.service.ts (partial - saveEntityTypeDefinition)
import { createEntityApi } from "@/lib/api/entity-api";
import { ResponseError } from "@/lib/types";
import { validateSession, validateUuid } from "@/lib/util/service/service.util";
import { EntityTypeImpactResponse, SaveTypeDefinitionRequest } from "../interface/entity.interface";
import { Session } from "@supabase/supabase-js";

export class EntityTypeService {
    static async saveEntityTypeDefinition(
        session: Session | null,
        workspaceId: string,
        definition: SaveTypeDefinitionRequest,
        impactConfirmed: boolean = false
    ): Promise<EntityTypeImpactResponse> {
        validateSession(session);
        validateUuid(workspaceId);

        const api = createEntityApi(session);

        try {
            return await api.saveEntityTypeDefinition({
                workspaceId,
                saveTypeDefinitionRequest: definition,
                impactConfirmed,
            });
        } catch (error) {
            // 409 Conflict returns impact analysis data, not an error
            if (error instanceof ResponseError && error.response.status === 409) {
                return await error.response.json();
            }
            throw error;
        }
    }
}
```

### Import Pattern After Migration

```typescript
// entity-type.service.ts imports
import { createEntityApi } from "@/lib/api/entity-api";
import { ResponseError } from "@/lib/types";
import { validateSession, validateUuid } from "@/lib/util/service/service.util";
import { Session } from "@supabase/supabase-js";
import {
    CreateEntityTypeRequest,
    DeleteTypeDefinitionRequest,
    EntityType,
    EntityTypeImpactResponse,
    SaveTypeDefinitionRequest,
} from "../interface/entity.interface";
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual fetch with headers | Generated API client with Configuration | openapi-generator-cli adoption | Type-safe, consistent auth handling |
| `api()` utility for base URL | `Configuration.basePath` | This migration | Centralized config |
| `handleError()` for all responses | try/catch with ResponseError | This migration | Explicit 409 handling |

**Note:** The `handleError` utility in `service.util.ts` can be kept for non-migrated services but is not needed for EntityApi methods.

## Open Questions

1. **Error Transformation**
   - What we know: Generated `ResponseError` has `response: Response` with status/body
   - What's unclear: Should we transform to app's `ResponseError` format for consistency with toast notifications?
   - Recommendation: Transform in catch blocks or leave as-is since mutation hooks already handle errors

2. **Base URL Configuration**
   - What we know: Generated `BASE_PATH` defaults to `http://localhost:8081`, config `basePath` overrides
   - What's unclear: Does NEXT_PUBLIC_API_URL include `/api` prefix or not?
   - Recommendation: Check current env value; generated paths have `/api/v1/...` prefix

## Sources

### Primary (HIGH confidence)
- `/home/jared/dev/worktrees/riven-openapi/client/lib/types/apis/EntityApi.ts` - Generated API class with all method signatures
- `/home/jared/dev/worktrees/riven-openapi/client/lib/types/runtime.ts` - Configuration, ResponseError, BaseAPI implementation
- `/home/jared/dev/worktrees/riven-openapi/client/components/feature-modules/entity/service/entity-type.service.ts` - Current service implementation
- `/home/jared/dev/worktrees/riven-openapi/client/components/feature-modules/entity/service/entity.service.ts` - Current service implementation

### Secondary (MEDIUM confidence)
- [OpenAPI Generator typescript-fetch documentation](https://openapi-generator.tech/docs/generators/typescript-fetch/) - Generator options
- [GitHub runtime.ts sample](https://github.com/OpenAPITools/openapi-generator/blob/master/samples/client/petstore/typescript-fetch/builds/default/runtime.ts) - Reference runtime implementation
- [GitHub Issue #17979](https://github.com/OpenAPITools/openapi-generator/issues/17979) - Middleware onError limitation for HTTP errors

### Tertiary (LOW confidence)
- Web search results for "openapi-generator typescript-fetch Configuration accessToken middleware error handling 2025"

## Metadata

**Confidence breakdown:**
- Method mapping: HIGH - verified by comparing service URLs with EntityApi paths
- Configuration pattern: HIGH - verified by reading generated runtime.ts
- 409 handling approach: HIGH - verified by reading BaseAPI.request() behavior
- Base URL compatibility: MEDIUM - need to verify NEXT_PUBLIC_API_URL format

**Research date:** 2026-01-22
**Valid until:** 30 days (generated code stable, migration approach settled)
