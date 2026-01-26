# Phase 4: Import Updates - Context

**Gathered:** 2026-01-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Update all files to import types from domain barrels (`@/lib/types/entity`, `@/lib/types/block`, etc.) instead of legacy `types.ts`. After this phase, no file should import entity, block, workspace, or user types from `@/lib/types/types`.

</domain>

<decisions>
## Implementation Decisions

### Import grouping
- **Separate domain imports** — Each domain gets its own import statement (`import type { EntityType } from '@/lib/types/entity'`; `import type { BlockType } from '@/lib/types/block'`)
- **Always use `import type`** — All type-only imports should use the `type` keyword for clarity and tree-shaking
- **Move enums to domain barrels** — Enums should also come from domain barrels, not directly from types.ts
- **Keep existing import order** — Only change import paths, don't reorganize import statement ordering within files

### Migration scope
- **Update ALL files** — Every file importing from types.ts should be updated, not just migration-related files
- **Note and skip pre-existing errors** — Pre-existing type errors (entity-block-environment.tsx, use-blocks-hydration.ts, etc.) should be documented but not fixed in this phase
- **Consumers import from barrels** — Update consumers to import directly from `@/lib/types/{domain}`, leaving interface files for Phase 5 cleanup

### Type re-export strategy
- **Create 'common' barrel** — Shared/utility types that span domains go in `@/lib/types/common`
- **Custom types in barrel file** — When barrels need custom types (like Date transformations), define them inline in the barrel, not in separate files
- **Export model types with Date fields** — Barrels export runtime-accurate types (User with `createdAt: Date`, not string)
- **Curated exports** — Only export types actually used in the codebase, not everything from generated types

### Claude's Discretion
- Handling edge cases where type domain is ambiguous
- Exact wording of documentation for skipped type errors
- Whether to update test files in same pass or separate plan

</decisions>

<specifics>
## Specific Ideas

- Per STATE.md decisions: "Import types from @/lib/types (generated) for service compatibility"
- Per STATE.md decisions: "Import User/Workspace from @/lib/types (models with Date) not interface (openapi-typescript with string)"
- Barrels already exist for entity, block, workspace, user domains from Phase 2

</specifics>

<deferred>
## Deferred Ideas

- Removing interface files entirely — Phase 5 cleanup
- Fixing pre-existing type errors — separate cleanup task after migration
- Removing legacy types.ts — Phase 5

</deferred>

---

*Phase: 04-import-updates*
*Context gathered: 2026-01-26*
