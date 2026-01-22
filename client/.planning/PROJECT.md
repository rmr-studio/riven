# OpenAPI Type System Migration

## What This Is

Migration of the Riven Client's API type system from openapi-typescript (single `types.ts` with `components["schemas"]` pattern) to openapi-generator-cli (individual model files + generated API classes). This modernizes the type infrastructure to use strongly-typed API clients with built-in serialization.

## Core Value

Strong compile-time contracts between the client and backend API. Every service call should have typed request/response shapes that match the OpenAPI spec exactly, with generated serializers handling the JSON transformation.

## Requirements

### Validated

- Generated API infrastructure in place — `lib/types/apis/`, `lib/types/models/`, `lib/types/runtime.ts`
- 185 model files generated from OpenAPI spec
- 5 API classes generated: BlockApi, EntityApi, UserApi, WorkflowApi, WorkspaceApi
- Configuration pattern supports accessToken injection for auth

### Active

- [ ] Migrate interface files — Remove `components["schemas"]` re-exports, use direct model imports
- [ ] Migrate service files — Wrap generated API classes instead of manual fetch
- [ ] Delete types.ts — Remove legacy openapi-typescript output after migration complete
- [ ] Update lib/interfaces/common.interface.ts — Align with generated model structure

### Out of Scope

- Backend OpenAPI spec changes — Migration uses existing spec as-is
- New API endpoints — Just migrating existing functionality
- Changing the service layer abstraction — Services remain thin wrappers, pattern stays consistent

## Context

**Current State:**
- 11 interface files across 5 feature modules (authentication, blocks, entity, user, workspace)
- 7 service files using manual fetch with session-based auth
- Interface files mix OpenAPI re-exports with custom local types (EntityTypeAttributeRow, RelationshipPickerProps, etc.)
- Services handle validation, error handling, and auth header injection

**Migration Pattern:**

Interface files change from:
```typescript
import { components } from "@/lib/types/types";
export type EntityType = components["schemas"]["EntityType"];
```

To:
```typescript
import { EntityType } from "@/lib/types/models/EntityType";
export type { EntityType };
```

Service files change from manual fetch:
```typescript
const response = await fetch(`${url}/v1/entity/schema/workspace/${workspaceId}`, {
  headers: { Authorization: `Bearer ${session.access_token}` }
});
return await response.json();
```

To API wrapper:
```typescript
const api = new EntityApi(new Configuration({
  basePath: apiUrl(),
  accessToken: async () => session.access_token
}));
return api.getEntityTypesForWorkspace({ workspaceId });
```

**Custom types stay in interface files** — They're local definitions, not OpenAPI re-exports.

## Constraints

- **Incremental migration**: Each feature module can be migrated independently without breaking others
- **Type compatibility**: Generated types must be compatible with existing usage (watch for optional vs required field differences)
- **Runtime behavior**: Generated `*FromJSON`/`*ToJSON` functions may transform data differently than raw JSON.parse

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Wrap API classes in services | Keeps service abstraction for consistency, error handling, validation | — Pending |
| Keep custom types in interface files | Simpler migration, maintains module cohesion | — Pending |
| Direct model imports (not barrel) | Clearer dependencies, better tree-shaking | — Pending |

---
*Last updated: 2026-01-22 after initialization*
