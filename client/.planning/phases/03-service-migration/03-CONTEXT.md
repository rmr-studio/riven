# Phase 3: Service Migration - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate all services from manual fetch patterns to generated API classes with `normalizeApiError` error handling. This phase covers BlockService, BlockTypeService, LayoutService, UserService, and WorkspaceService. Entity services are out of scope.

</domain>

<decisions>
## Implementation Decisions

### Error normalization
- Keep existing `ResponseError` type from `error.util` — callers already handle it
- Provide context-specific error messages (e.g., "Failed to hydrate block abc123")
- Use single `normalizeApiError` function uniformly — no service-specific handling
- Network/timeout errors normalized to `ResponseError` with status 0 and descriptive message

### Validation approach
- Keep `validateSession` before API calls — explicit validation, fail fast
- Keep `validateUuid` for ID parameters — prevent malformed requests
- Validation logic stays inline in service methods — explicit, self-contained
- No runtime validation of request body contents — trust TypeScript types

### Service method signatures
- Keep existing method signatures — no breaking changes for callers
- Return generated types directly — callers may need type updates
- Keep static method pattern — session passed in per call
- Create API instances per-call with `createXxxApi(session)` — no caching

### Migration strategy
- In-place conversion — replace fetch calls directly in existing methods
- Keep manual fetch for methods without generated API coverage
- Verification via existing tests + manual browser testing
- Scope limited to 5 services: BlockService, BlockTypeService, LayoutService, UserService, WorkspaceService

### Claude's Discretion
- Order of service migration within plans
- Handling any edge cases in response type mapping
- Test file organization if needed

</decisions>

<specifics>
## Specific Ideas

- Migration pattern should match `createEntityApi` factory approach already in codebase
- Error normalization should follow the existing `handleError` utility pattern but wrap generated API errors

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-service-migration*
*Context gathered: 2026-01-25*
