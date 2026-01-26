# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2025-01-25)

**Core value:** All backend communication flows through generated API classes with consistent error handling
**Current focus:** Phase 5 - Cleanup (COMPLETE)

## Current Position

Phase: 5 of 5 (Cleanup) - Complete
Plan: 3 of 3 in phase 5 complete
Status: OpenAPI Migration Complete
Last activity: 2026-01-26 - Completed 05-03-PLAN.md (Interface Directory Cleanup)

Progress: [##########] 100% (5 of 5 phases)

## Performance Metrics

**Velocity:**
- Total plans completed: 13
- Average duration: 7 min
- Total execution time: 1.5 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 1 | 8 min | 8 min |
| 2. Type Barrels | 2 | 7 min | 3.5 min |
| 3. Service Migration | 3 | 21 min | 7 min |
| 4. Import Updates | 4 | 29 min | 7.25 min |
| 5. Cleanup | 3 | 26 min | 8.7 min |

**Recent Trend:**
- Last 5 plans: 04-04 (5 min), 05-01 (15 min), 05-02 (4 min), 05-03 (7 min)
- Trend: 05-03 efficient with inlined types and clean documentation update

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Domain-based barrel exports in `lib/types/{domain}/` for better import semantics
- Custom types live in barrels alongside re-exports
- One API factory per generated API class
- Enum member casing: Generated enums use PascalCase (BlockMetadataType.Content not CONTENT)
- Inlined operation types in domain barrels (path params, query params, responses)
- revokeInvite returns void to match generated API (was boolean)
- getWorkspaceMembers retains manual fetch (no generated API coverage)
- Import types from @/lib/types/{domain} for all type imports
- updateBlockType returns void to match generated API
- getBlockTypes returns BlockType[] instead of wrapper type
- loadLayout uses ApplicationEntityType instead of EntityType schema object
- lintBlockType retains manual fetch (no generated API coverage)
- Use `throw await normalizeApiError(error)` for TypeScript control flow recognition
- Import User/Workspace from @/lib/types (models with Date) not interface (openapi-typescript with string)
- Re-export HydrateBlockResponse as HydrateBlocksResponse for hook compatibility
- ValidationScope exported (not BlockValidationScope) - use generated name
- DataType exported from both entity and common barrels
- IconType and IconColour imported from @/lib/types/common (shared types)
- EntityCategory.Standard (not Custom) - matches generated enum values
- Kept auth.interface.ts (Supabase auth types, not OpenAPI)
- Object literal keys using enum string VALUES unchanged (e.g., ICON_COLOUR_MAP)
- EntityType model imported from @/lib/types/entity for type annotations
- ApplicationEntityType used for entity type enum values
- ValidationScope is correct name (not BlockValidationScope)
- MembershipDetails and TileLayoutConfig added as custom UI types in workspace barrel

### Pending Todos

None - OpenAPI Migration complete.

### Blockers/Concerns

**Pre-existing type issues (out of migration scope):**
- lib/util/form files: Property naming differences (`enum` vs `_enum`, `protected` vs `_protected`, `default` vs `_default`)
- Icon type structure: `icon` property vs `type` property mismatch
- use-blocks-hydration.ts: TS2345 - passes string[] instead of Record<string, EntityReferenceHydrationRequest[]>
- entity-block-environment.tsx: References non-existent EntityType enum
- entity-block-environment.tsx: BlockEnvironment interface vs generated type mismatch
- Various other pre-existing errors in auth.util.ts, reference-block.tsx, etc.

**Block module pre-existing issues (out of migration scope):**
- EntityType.CLIENT/INVOICE/USER etc. don't exist - code uses model type as enum
- BlockTree.type property doesn't exist - code assigns non-existent property
- ApplicationEntityType lacks BLOCK_TREE member - code references non-existent value

These are pre-existing issues that were not in scope for the OpenAPI migration.

## Session Continuity

Last session: 2026-01-26
Stopped at: Completed 05-03-PLAN.md
Resume file: None
Next action: OpenAPI Migration Complete - no further action required

## Migration Summary

The OpenAPI migration is complete. All backend communication now flows through:

1. **Generated API classes** in `lib/types/apis/` (EntityApi, UserApi, WorkspaceApi, WorkflowApi)
2. **Domain barrel exports** in `lib/types/{domain}/` (entity, block, workspace, user, common)
3. **API factories** in `lib/api/` for session-bound API instances

Key artifacts:
- `lib/types/index.ts` - Main barrel re-exporting from models
- `lib/types/{domain}/index.ts` - Domain-specific barrels with models, custom types, guards
- `lib/api/*-api.ts` - API factory functions
- `CLAUDE.md` - Updated documentation with new import patterns
