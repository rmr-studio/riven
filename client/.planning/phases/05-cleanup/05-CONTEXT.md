# Phase 5: Cleanup - Context

**Gathered:** 2026-01-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Remove legacy interface re-export files and types.ts after migration is complete. Update documentation to reflect new patterns. This phase does not add new functionality — it removes obsolete code.

</domain>

<decisions>
## Implementation Decisions

### Interface file handling
- Custom types (anything not from OpenAPI) must be preserved — move to domain barrels
- Move types and update imports atomically in the same step
- Custom types go to `@/lib/types/{domain}/index.ts` alongside re-exports
- Any type not from OpenAPI is considered custom and worth preserving

### Deletion order
- Interface files first, then types.ts — validates migration worked before final cut
- Batch deletions by domain (entity, block, workspace, user) — one commit per domain
- TypeScript build (`tsc`) required after interface cleanup, before removing types.ts
- If types.ts still has imports after interface cleanup: FAIL and investigate — something was missed in Phase 4

### Build verification
- Final verification: TypeScript build only (`tsc` compiles successfully)
- Pre-existing TypeScript errors (noted in STATE.md) do not block — same error count is acceptable
- CLAUDE.md requires full review — update all references to old patterns, not just imports

### Claude's Discretion
- Exact wording of CLAUDE.md updates
- Whether to consolidate multiple small custom types
- Order of domain processing (entity, block, workspace, user)

</decisions>

<specifics>
## Specific Ideas

- Error count baseline established in STATE.md blockers section — cleanup shouldn't increase errors
- Phase 4 already updated most imports; this phase handles the final deletion

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-cleanup*
*Context gathered: 2026-01-26*
