# OpenAPI Migration

## What This Is

Migration of the Riven client codebase from openapi-typescript to openapi-generator-cli. This involves updating all services to use generated API classes instead of manual fetch calls, restructuring type imports to use domain-based barrel exports, and standardizing error handling through `normalizeApiError`.

## Core Value

All backend communication flows through generated API classes with consistent error handling, enabling removal of the legacy `types.ts` file and manual fetch patterns.

## Requirements

### Validated

- ✓ EntityApi generated and working — existing
- ✓ `createEntityApi` factory pattern established — existing
- ✓ `entity.service.ts` migrated to new pattern — existing
- ✓ `entity-type.service.ts` migrated to new pattern — existing
- ✓ `normalizeApiError` error handling utility — existing
- ✓ Generated types available in `lib/types/models/` — existing

### Active

- [ ] Create API factory for BlockApi (`lib/api/block-api.ts`)
- [ ] Create API factory for UserApi (`lib/api/user-api.ts`)
- [ ] Create API factory for WorkspaceApi (`lib/api/workspace-api.ts`)
- [ ] Migrate `block.service.ts` to use `createBlockApi`
- [ ] Migrate `block-type.service.ts` to use `createBlockApi`
- [ ] Migrate `layout.service.ts` to use `createBlockApi`
- [ ] Migrate `user.service.ts` to use `createUserApi`
- [ ] Migrate `workspace.service.ts` to use `createWorkspaceApi`
- [ ] Create type barrel `lib/types/entity/index.ts` with re-exports + custom types + guards
- [ ] Create type barrel `lib/types/block/index.ts` with re-exports + custom types + guards
- [ ] Create type barrel `lib/types/workspace/index.ts` with re-exports + custom types
- [ ] Create type barrel `lib/types/user/index.ts` with re-exports + custom types
- [ ] Update `.openapi-generator-ignore` to protect custom barrel directories
- [ ] Update ~57 files importing from `@/lib/types/types` to use domain barrels
- [ ] Remove legacy `.interface.ts` files after migration
- [ ] Delete `lib/types/types.ts` after all imports migrated

### Out of Scope

- Backend OpenAPI spec changes — this is client-side migration only
- Adding new API endpoints — migrating existing functionality only
- Refactoring service method signatures — maintaining current API contracts

## Context

**Current state:**
- `openapi-generator-cli` has already generated types and API classes in `lib/types/`
- Generated APIs: `EntityApi`, `BlockApi`, `UserApi`, `WorkspaceApi`, `WorkflowApi`
- Two services already migrated: `entity.service.ts`, `entity-type.service.ts`
- Pattern established: API factory → generated API class → `normalizeApiError` for errors

**Old pattern (to remove):**
```typescript
import { api } from "@/lib/util/utils";
const url = api();
const response = await fetch(`${url}/v1/endpoint`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
});
if (response.ok) return await response.json();
throw await handleError(response, ...);
```

**New pattern (target):**
```typescript
import { createBlockApi } from "@/lib/api/block-api";
import { normalizeApiError } from "@/lib/util/error/error.util";
const api = createBlockApi(session!);
try {
    return await api.someMethod({ workspaceId, ... });
} catch (error) {
    throw await normalizeApiError(error);
}
```

**Type import pattern (target):**
```typescript
// Before
import { BlockType } from "@/lib/types/types";

// After
import type { BlockType } from "@/lib/types/block";
```

## Constraints

- **Generated code protection**: Custom barrel directories must be added to `.openapi-generator-ignore` to survive regeneration
- **Type compatibility**: Generated types must match OpenAPI spec names exactly
- **Existing tests**: Migration must not break existing functionality

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Domain-based barrel exports in `lib/types/{domain}/` | Better import semantics (`@/lib/types/entity`) and co-location of custom types with re-exports | — Pending |
| Custom types live in barrels alongside re-exports | Single import source per domain, simpler mental model | — Pending |
| One API factory per generated API class | Matches generated structure, clear separation | — Pending |

---
*Last updated: 2025-01-25 after initialization*
