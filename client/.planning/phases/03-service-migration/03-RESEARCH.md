# Phase 3: Service Migration - Research

**Researched:** 2026-01-25
**Domain:** Service layer migration from manual fetch to generated OpenAPI clients
**Confidence:** HIGH

## Summary

This phase migrates five services (BlockService, BlockTypeService, LayoutService, UserService, WorkspaceService) from manual `fetch()` patterns to generated OpenAPI client classes. The codebase already has the necessary infrastructure in place: API factory functions (`createBlockApi`, `createUserApi`, `createWorkspaceApi`) exist and follow the established `createEntityApi` pattern. The `normalizeApiError` function already exists in `lib/util/error/error.util.ts` and correctly handles the OpenAPI-generated `ResponseError` class.

The migration is straightforward: replace manual fetch calls with generated API method calls, wrap in try-catch with `normalizeApiError`. Keep existing validation (`validateSession`, `validateUuid`) and service method signatures unchanged. Two methods require manual fetch retention due to missing generated API coverage.

**Primary recommendation:** Follow the existing `createEntityApi` pattern, using `normalizeApiError` for error handling. Migrate methods in-place, preserving method signatures and validation logic.

## Standard Stack

### Core (Already in Codebase)

| Component | Location | Purpose | Status |
|-----------|----------|---------|--------|
| `createBlockApi` | `lib/api/block-api.ts` | Factory for BlockApi instances | EXISTS |
| `createUserApi` | `lib/api/user-api.ts` | Factory for UserApi instances | EXISTS |
| `createWorkspaceApi` | `lib/api/workspace-api.ts` | Factory for WorkspaceApi instances | EXISTS |
| `normalizeApiError` | `lib/util/error/error.util.ts` | Converts OpenAPI errors to ResponseError | EXISTS |
| `validateSession` | `lib/util/service/service.util.ts` | Session validation utility | EXISTS |
| `validateUuid` | `lib/util/service/service.util.ts` | UUID validation utility | EXISTS |

### Generated API Classes

| Class | Methods Available | Used By |
|-------|-------------------|---------|
| `BlockApi` | `hydrateBlocks`, `getBlockEnvironment`, `saveBlockEnvironment`, `getBlockTypes`, `getBlockTypeByKey`, `publishBlockType`, `updateBlockType` | BlockService, BlockTypeService, LayoutService |
| `UserApi` | `getCurrentUser`, `updateUserProfile`, `getUserById`, `deleteUserProfileById` | UserService |
| `WorkspaceApi` | `saveWorkspace`, `getWorkspace`, `getWorkspaceInvites`, `inviteToWorkspace`, `revokeInvite` | WorkspaceService |

### No New Dependencies Required

All infrastructure already exists. No new packages or utilities need to be created.

## Architecture Patterns

### Migration Pattern Template

Every service method migration follows this pattern:

```typescript
// BEFORE (manual fetch)
static async methodName(session: Session | null, ...args): Promise<ReturnType> {
    try {
        validateSession(session);
        validateUuid(someId);

        const url = api();
        const response = await fetch(`${url}/v1/...`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(request),
        });

        if (response.ok) return await response.json();
        throw await handleError(response, (res) => `Failed: ${res.status}`);
    } catch (error) {
        if (isResponseError(error)) throw error;
        throw fromError(error);
    }
}

// AFTER (generated API)
static async methodName(session: Session | null, ...args): Promise<ReturnType> {
    try {
        validateSession(session);
        validateUuid(someId);

        const api = createXxxApi(session);
        return await api.methodName({ param1, param2 });
    } catch (error) {
        await normalizeApiError(error);
    }
}
```

### Key Differences

1. **No manual URL construction** - Generated API handles paths
2. **No manual headers** - Configuration handles auth
3. **No response parsing** - Generated API returns typed objects
4. **Simpler error handling** - Single `normalizeApiError` call

### Error Flow

```
Generated API call fails
    |
    v
OpenAPI ResponseError thrown (has response property)
    |
    v
normalizeApiError catches it
    |
    v
Extracts body from response.json()
    |
    v
Maps backend ErrorResponse to frontend ResponseError
    |
    v
Throws ResponseError (same type callers expect)
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| API factory functions | Manual Configuration setup | Existing `createXxxApi` factories | Already exist, proven pattern |
| Error normalization | Per-method error handling | `normalizeApiError` | Handles OpenAPI errors, network errors, body parsing |
| Request serialization | Manual JSON.stringify | Generated API methods | Automatic with ToJSON helpers |
| Response deserialization | Manual response.json() | Generated API methods | Automatic with FromJSON helpers |
| URL path construction | Template strings | Generated API paths | Auto-encoded, type-safe |

## Common Pitfalls

### Pitfall 1: Forgetting to Validate Before API Call

**What goes wrong:** API call with null session fails with cryptic error
**Why it happens:** Generated API expects valid session in factory
**How to avoid:** Keep `validateSession(session)` BEFORE `createXxxApi(session)`
**Warning signs:** Errors about "session.access_token" being undefined

### Pitfall 2: Incorrect Request Parameter Structure

**What goes wrong:** TypeScript error or runtime failure
**Why it happens:** Generated APIs use request parameter objects, not positional args
**How to avoid:** Check generated API signature - it uses `{ param1, param2 }` object
**Example:**
```typescript
// Wrong
await api.getBlockEnvironment(workspaceId, type, entityId);

// Correct
await api.getBlockEnvironment({ workspaceId, type, entityId });
```

### Pitfall 3: Return Type Mismatch

**What goes wrong:** Service returns different type than before
**Why it happens:** Generated types may differ from manually typed responses
**How to avoid:** Generated types are authoritative - update service return type to match
**Note:** Per CONTEXT.md decision, callers may need type updates

### Pitfall 4: Missing Generated Coverage

**What goes wrong:** No generated method for service method
**Why it happens:** OpenAPI spec doesn't include all endpoints
**How to avoid:** Audit each service method against generated API before migration
**Resolution:** Keep manual fetch for uncovered methods

### Pitfall 5: Void Return Methods

**What goes wrong:** Expecting return value from void method
**Why it happens:** Some generated methods return `Promise<void>` (e.g., `updateBlockType`)
**How to avoid:** Check return type in generated API - adjust service if needed

## Code Examples

### Example 1: Simple GET Method

```typescript
// BlockTypeService.getBlockTypes - BEFORE
static async getBlockTypes(
    session: Session | null,
    workspaceId: string
): Promise<GetBlockTypesResponse> {
    try {
        validateUuid(workspaceId);
        validateSession(session);
        const url = api();
        const response = await fetch(`${url}/v1/block/schema/workspace/${workspaceId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
            },
        });
        if (response.ok) return await response.json();
        throw await handleError(response, (res) => `Failed: ${res.status}`);
    } catch (error) {
        if (isResponseError(error)) throw error;
        throw fromError(error);
    }
}

// BlockTypeService.getBlockTypes - AFTER
static async getBlockTypes(
    session: Session | null,
    workspaceId: string
): Promise<BlockType[]> {
    try {
        validateUuid(workspaceId);
        validateSession(session);
        const api = createBlockApi(session);
        return await api.getBlockTypes({ workspaceId });
    } catch (error) {
        await normalizeApiError(error);
    }
}
```

### Example 2: POST Method with Body

```typescript
// BlockTypeService.publishBlockType - AFTER
static async publishBlockType(
    session: Session | null,
    request: CreateBlockTypeRequest
): Promise<BlockType> {
    try {
        validateSession(session);
        const api = createBlockApi(session);
        return await api.publishBlockType({ createBlockTypeRequest: request });
    } catch (error) {
        await normalizeApiError(error);
    }
}
```

### Example 3: Method with Multipart Form Data

```typescript
// WorkspaceService.saveWorkspace - AFTER
static async saveWorkspace(
    session: Session | null,
    request: SaveWorkspaceRequest,
    uploadedAvatar: Blob | null = null
): Promise<Workspace> {
    try {
        validateSession(session);
        const api = createWorkspaceApi(session);
        return await api.saveWorkspace({
            workspace: request,
            file: uploadedAvatar ?? undefined
        });
    } catch (error) {
        await normalizeApiError(error);
    }
}
```

### Example 4: Method Returning Void

```typescript
// BlockTypeService.updateBlockType - AFTER
// Note: Generated API returns void, service may need adjustment
static async updateBlockType(
    session: Session | null,
    blockTypeId: string,
    request: BlockType
): Promise<void> {
    try {
        validateSession(session);
        validateUuid(blockTypeId);
        const api = createBlockApi(session);
        await api.updateBlockType({ blockTypeId, blockType: request });
    } catch (error) {
        await normalizeApiError(error);
    }
}
```

## Method Mapping

### BlockService (1 method)

| Service Method | Generated API Method | Notes |
|----------------|---------------------|-------|
| `hydrateBlocks` | `BlockApi.hydrateBlocks` | Direct mapping |

### BlockTypeService (5 methods)

| Service Method | Generated API Method | Notes |
|----------------|---------------------|-------|
| `publishBlockType` | `BlockApi.publishBlockType` | Direct mapping |
| `updateBlockType` | `BlockApi.updateBlockType` | Returns void (was BlockType) |
| `getBlockTypes` | `BlockApi.getBlockTypes` | Direct mapping |
| `getBlockTypeByKey` | `BlockApi.getBlockTypeByKey` | Direct mapping |
| `lintBlockType` | NONE | **Keep manual fetch** |

### LayoutService (2 methods)

| Service Method | Generated API Method | Notes |
|----------------|---------------------|-------|
| `loadLayout` | `BlockApi.getBlockEnvironment` | Different method name |
| `saveLayoutSnapshot` | `BlockApi.saveBlockEnvironment` | Different method name |

### UserService (2 methods)

| Service Method | Generated API Method | Notes |
|----------------|---------------------|-------|
| `fetchSessionUser` | `UserApi.getCurrentUser` | Different method name |
| `updateUser` | `UserApi.updateUserProfile` | Avatar param unused in current impl |

### WorkspaceService (6 methods)

| Service Method | Generated API Method | Notes |
|----------------|---------------------|-------|
| `saveWorkspace` | `WorkspaceApi.saveWorkspace` | Multipart supported |
| `inviteToWorkspace` | `WorkspaceApi.inviteToWorkspace` | Direct mapping |
| `getWorkspaceInvites` | `WorkspaceApi.getWorkspaceInvites` | Direct mapping |
| `revokeInvite` | `WorkspaceApi.revokeInvite` | Returns void (was boolean) |
| `getWorkspace` | `WorkspaceApi.getWorkspace` | Direct mapping |
| `getWorkspaceMembers` | NONE | **Keep manual fetch** |

## Methods Requiring Manual Fetch

Two service methods have no generated API coverage:

1. **`BlockTypeService.lintBlockType`**
   - Endpoint: `POST /api/v1/block/schema/lint/`
   - Not in OpenAPI spec - keep manual fetch

2. **`WorkspaceService.getWorkspaceMembers`**
   - Endpoint: `GET /api/v1/workspace/{workspaceId}/members`
   - Not in OpenAPI spec - keep manual fetch

These methods should retain current implementation but can be refactored to use consistent error handling with `try/catch` and `normalizeApiError` for network errors.

## Return Type Considerations

### Breaking Changes (Minor)

| Service Method | Old Return | New Return | Impact |
|----------------|------------|------------|--------|
| `BlockTypeService.updateBlockType` | `Promise<BlockType>` | `Promise<void>` | Callers ignoring return unaffected |
| `WorkspaceService.revokeInvite` | `Promise<boolean>` | `Promise<void>` | Callers checking true unaffected |

Per CONTEXT.md decision, these are acceptable. The generated types are authoritative.

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Manual fetch with URL templates | Generated API client methods | Type-safe, auto-encoded paths |
| Per-method error parsing | Single `normalizeApiError` | Consistent error format |
| Manual JSON serialization | Generated ToJSON/FromJSON | Automatic type conversion |
| Manual auth header injection | Configuration accessToken | Centralized auth handling |

## Open Questions

None - all questions resolved through codebase investigation.

## Sources

### Primary (HIGH confidence)

- `/home/jared/dev/worktrees/riven-openapi/client/lib/api/entity-api.ts` - Factory pattern reference
- `/home/jared/dev/worktrees/riven-openapi/client/lib/api/block-api.ts` - Block factory exists
- `/home/jared/dev/worktrees/riven-openapi/client/lib/api/user-api.ts` - User factory exists
- `/home/jared/dev/worktrees/riven-openapi/client/lib/api/workspace-api.ts` - Workspace factory exists
- `/home/jared/dev/worktrees/riven-openapi/client/lib/util/error/error.util.ts` - normalizeApiError exists
- `/home/jared/dev/worktrees/riven-openapi/client/lib/types/apis/BlockApi.ts` - Generated API methods
- `/home/jared/dev/worktrees/riven-openapi/client/lib/types/apis/UserApi.ts` - Generated API methods
- `/home/jared/dev/worktrees/riven-openapi/client/lib/types/apis/WorkspaceApi.ts` - Generated API methods
- `/home/jared/dev/worktrees/riven-openapi/client/lib/types/runtime.ts` - OpenAPI ResponseError class

### Service Files Analyzed

- `/home/jared/dev/worktrees/riven-openapi/client/components/feature-modules/blocks/service/block.service.ts` - 1 method
- `/home/jared/dev/worktrees/riven-openapi/client/components/feature-modules/blocks/service/block-type.service.ts` - 5 methods
- `/home/jared/dev/worktrees/riven-openapi/client/components/feature-modules/blocks/service/layout.service.ts` - 2 methods
- `/home/jared/dev/worktrees/riven-openapi/client/components/feature-modules/user/service/user.service.ts` - 2 methods
- `/home/jared/dev/worktrees/riven-openapi/client/components/feature-modules/workspace/service/workspace.service.ts` - 6 methods

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All components verified to exist in codebase
- Architecture: HIGH - Pattern derived from existing createEntityApi usage
- Method mapping: HIGH - Verified against generated API files
- Pitfalls: HIGH - Based on actual code structure differences

**Research date:** 2026-01-25
**Valid until:** 60 days (stable infrastructure, no external dependencies)
