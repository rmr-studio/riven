# Phase 2: Service Migration - Context

**Gathered:** 2026-01-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace manual fetch calls in entity service files with generated EntityApi wrappers. Services use Configuration for auth injection. Covers entity-type.service.ts and entity.service.ts.

</domain>

<decisions>
## Implementation Decisions

### API client setup
- Singleton factory function that returns configured EntityApi given a session
- Factory lives in new `lib/api/` directory (centralized API client utilities)
- Base URL determined by environment variable (NEXT_PUBLIC_API_URL or similar)
- Factory accepts Session only; workspace scoping happens at call site via API method parameters

### Migration approach
- Migrate both entity-type.service.ts AND entity.service.ts in this phase
- Keep existing static class pattern (EntityTypeService.method()), swap fetch for EntityApi internally
- Keep handleError utility in place even if unused by migrated services
- Verification: TypeScript compiles = migrated. Manual testing later.

### Type compatibility
- Service methods keep current names, call generated API methods internally
- Import EntityApi directly from generated location (no re-export through interface file)

### Claude's Discretion
- Whether to update callers or adapt responses in service when generated types differ slightly
- Whether services import from entity/interface/ or directly from @/lib/types (follow Phase 1 pattern)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-service-migration*
*Context gathered: 2026-01-22*
