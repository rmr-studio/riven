---
phase: 03-service-migration
verified: 2026-01-26T12:00:00Z
status: gaps_found
score: 3/5 must-haves verified
gaps:
  - truth: "BlockService methods use createBlockApi and normalizeApiError"
    status: partial
    reason: "BlockService.hydrateBlocks uses createBlockApi and normalizeApiError but has TypeScript errors"
    artifacts:
      - path: "components/feature-modules/blocks/service/block.service.ts"
        issue: "Function lacks ending return statement (TS2366) - normalizeApiError returns Promise<never> but compiler doesn't see it"
      - path: "components/feature-modules/blocks/hooks/use-blocks-hydration.ts"
        issue: "Imports HydrateBlocksResponse from service but service doesn't export it (TS2305)"
    missing:
      - "Add 'throw' before 'await normalizeApiError(error)' or fix return type"
      - "Export HydrateBlocksResponse from block.service.ts or update hook import"
  - truth: "UserService methods use createUserApi and normalizeApiError"
    status: partial
    reason: "UserService functions use createUserApi and normalizeApiError but have TypeScript errors"
    artifacts:
      - path: "components/feature-modules/user/service/user.service.ts"
        issue: "Multiple TypeScript errors: TS2366 (lacking return statement), TS2322 (type mismatch between User and response types)"
    missing:
      - "Add 'throw' before 'await normalizeApiError(error)' to fix return statement"
      - "Fix type mismatch between generated User type and interface-defined response types"
  - truth: "WorkspaceService methods use createWorkspaceApi and normalizeApiError"
    status: partial
    reason: "WorkspaceService methods use createWorkspaceApi and normalizeApiError but have TypeScript errors"
    artifacts:
      - path: "components/feature-modules/workspace/service/workspace.service.ts"
        issue: "Multiple TypeScript errors: TS2366 (lacking return statement), TS2322 (Workspace type mismatch)"
    missing:
      - "Add 'throw' before 'await normalizeApiError(error)' to fix return statement"
      - "Fix Workspace type mismatch between generated type and interface"
---

# Phase 3: Service Migration Verification Report

**Phase Goal:** All services use generated API classes with `normalizeApiError` error handling
**Verified:** 2026-01-26T12:00:00Z
**Status:** gaps_found
**Re-verification:** No - initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | BlockService methods use createBlockApi and normalizeApiError | PARTIAL | Uses createBlockApi (line 58) and normalizeApiError (line 66), but has TS2366 error |
| 2 | BlockTypeService methods use createBlockApi and normalizeApiError | VERIFIED | All 4 migrated methods use createBlockApi; lintBlockType retains manual fetch as expected |
| 3 | LayoutService methods use createBlockApi and normalizeApiError | VERIFIED | Both loadLayout (line 48-49) and saveLayoutSnapshot (line 81-82) use createBlockApi |
| 4 | UserService methods use createUserApi and normalizeApiError | PARTIAL | Uses createUserApi (lines 29, 51) and normalizeApiError (lines 32, 54), but has TS errors |
| 5 | WorkspaceService methods use createWorkspaceApi and normalizeApiError | PARTIAL | Uses createWorkspaceApi (5 methods), but has TS errors; getWorkspaceMembers retains manual fetch |

**Score:** 3/5 truths fully verified (BlockTypeService, LayoutService verified; BlockService, UserService, WorkspaceService have TypeScript errors)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `components/feature-modules/blocks/service/block.service.ts` | BlockService with generated API calls | EXISTS + SUBSTANTIVE + HAS ERRORS | 69 lines, uses createBlockApi/normalizeApiError, but TS2366 error |
| `components/feature-modules/blocks/service/block-type.service.ts` | BlockTypeService with generated API calls | VERIFIED | 107 lines, all methods migrated, lintBlockType retains manual fetch |
| `components/feature-modules/blocks/service/layout.service.ts` | LayoutService with generated API calls | VERIFIED | 87 lines, both methods use createBlockApi |
| `components/feature-modules/user/service/user.service.ts` | UserService functions with generated API calls | EXISTS + SUBSTANTIVE + HAS ERRORS | 57 lines, uses createUserApi/normalizeApiError, but TS2366/TS2322 errors |
| `components/feature-modules/workspace/service/workspace.service.ts` | WorkspaceService with generated API calls | EXISTS + SUBSTANTIVE + HAS ERRORS | 124 lines, uses createWorkspaceApi, but TS2366/TS2322 errors |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| block.service.ts | lib/api/block-api.ts | createBlockApi import | WIRED | Line 3: `import { createBlockApi }` |
| block-type.service.ts | lib/api/block-api.ts | createBlockApi import | WIRED | Line 4: `import { createBlockApi }` |
| layout.service.ts | lib/api/block-api.ts | createBlockApi import | WIRED | Line 3: `import { createBlockApi }` |
| user.service.ts | lib/api/user-api.ts | createUserApi import | WIRED | Line 7: `import { createUserApi }` |
| workspace.service.ts | lib/api/workspace-api.ts | createWorkspaceApi import | WIRED | Line 13: `import { createWorkspaceApi }` |
| All services | lib/util/error/error.util.ts | normalizeApiError import | WIRED | All services import normalizeApiError |

### Service Usage Verification

All services are imported and used in the application:
- `BlockService`: Imported in `block-hydration-provider.tsx`, `use-blocks-hydration.ts`
- `BlockTypeService`: Imported in `use-block-types.ts`
- `LayoutService`: Imported in `layout-change-provider.tsx`, `use-entity-layout.ts`
- `fetchSessionUser/updateUser`: Imported in `OnboardForm.tsx`, `useProfile.tsx`
- `WorkspaceService`: Imported in `use-save-workspace-mutation.tsx`, `use-workspace-members.tsx`, `use-workspace.tsx`

### TypeScript Compilation Status

**Pre-existing errors** (not related to service migration):
- `lib/interfaces/template.interface.ts`: Missing template types from generated schema
- `lib/util/form/entity-instance-validation.util.ts`: `enum` vs `_enum` property naming
- `lib/util/form/schema.util.ts`: Icon type mismatch

**Service migration errors:**

1. **block.service.ts:43** - `TS2366: Function lacks ending return statement`
2. **use-blocks-hydration.ts:3** - `TS2305: Module has no exported member 'HydrateBlocksResponse'`
3. **user.service.ts:18,40** - `TS2366: Function lacks ending return statement`
4. **user.service.ts:30,52** - `TS2322: Type 'User' is not assignable to response type`
5. **workspace.service.ts:20,82** - `TS2366: Function lacks ending return statement`
6. **workspace.service.ts:25,88** - `TS2322: Type 'Workspace' is not assignable to response type`

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| block.service.ts | 66 | `await normalizeApiError(error)` without throw | Warning | Compiler doesn't recognize Promise<never> as throw |
| user.service.ts | 32,54 | `await normalizeApiError(error)` without throw | Warning | Same issue |
| workspace.service.ts | 30,46,61,79,90 | `await normalizeApiError(error)` without throw | Warning | Same issue |

**Root Cause:** The `normalizeApiError` function returns `Promise<never>` (it always throws), but TypeScript's control flow analysis doesn't recognize this as a terminal statement. The fix is to add `throw` before the await.

### Manual Fetch Methods (Expected - No API Coverage)

These methods correctly retain manual fetch patterns as documented:
- `BlockTypeService.lintBlockType` - No generated API endpoint
- `WorkspaceService.getWorkspaceMembers` - No generated API endpoint

### Gaps Summary

The service migration is **functionally complete** - all services have been updated to use the generated API factories (`createBlockApi`, `createUserApi`, `createWorkspaceApi`) and `normalizeApiError` for error handling. However, there are TypeScript compilation errors that prevent a clean build:

1. **Return statement errors (TS2366):** The pattern `await normalizeApiError(error)` doesn't signal to TypeScript that the function always throws. Should be `throw await normalizeApiError(error)` or the function should be changed to use explicit throw.

2. **Type mismatch errors (TS2322):** The interface-defined response types (e.g., `GetCurrentUserResponse`, `UpdateUserProfileResponse`) don't match the generated API return types (`User`). The interfaces use `operations["..."]["responses"]["200"]["content"]["*/*"]` which extracts a different type structure than what the generated API classes return.

3. **Missing export (TS2305):** The `use-blocks-hydration.ts` hook imports `HydrateBlocksResponse` from the service, but the service imports `HydrateBlockResponse` (singular) from the interface.

---

*Verified: 2026-01-26T12:00:00Z*
*Verifier: Claude (gsd-verifier)*
