# Phase 6: End-to-End Testing - Context

**Gathered:** 2026-02-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Validate the complete entity query pipeline works end-to-end with integration tests against real PostgreSQL. Tests exercise EntityQueryService through SQL execution and result mapping, verifying all filter operators, relationship traversals, logical composition, pagination, and workspace isolation produce correct results.

</domain>

<decisions>
## Implementation Decisions

### Test scope & boundaries
- Service-level tests — call EntityQueryService.execute() directly, no HTTP/controller layer
- Results-only assertions — verify returned entities, counts, and ordering; treat generated SQL as implementation detail
- Key error paths included — invalid attribute references, invalid relationship references, depth exceeded, bad pagination must all be tested E2E
- Workspace isolation is a must-have test — create entities in two workspaces, verify queries in workspace A never return workspace B entities

### Test data strategy
- Dedicated test domain — a small realistic domain (e.g., Company→Employee, Project→Task) with known attributes and relationships
- Per-class shared fixtures — entity types and seed entities set up in @BeforeAll, tests share data but must not mutate it
- Medium volume — 20-50 entities per type for meaningful pagination and filtering coverage
- Polymorphic relationships required — at least one relationship targeting multiple entity types to exercise TargetTypeMatches

### Database infrastructure
- Testcontainers PostgreSQL — real Postgres in Docker for full JSONB operator support
- JPA auto-DDL for schema initialization — let Hibernate generate schema from entities
- Shared singleton container — one Postgres container across all test classes for speed
- Truncate between classes — clean tables in @BeforeAll/@AfterAll rather than transaction rollback (native queries may not participate in Spring transactions)

### Coverage expectations
- All 12 FilterOperators tested individually — EQUALS, NOT_EQUALS, CONTAINS, NOT_CONTAINS, STARTS_WITH, ENDS_WITH, IN, NOT_IN, GT, GTE, LT, LTE, IS_NULL, IS_NOT_NULL
- Relationship nesting up to max depth (3) — test 1-deep, 2-deep, 3-deep nested queries plus depth-exceeded rejection
- Dedicated pagination & ordering scenarios — separate test group for offset, limit, totalCount, asc/desc, multi-field ordering
- Nested logical composition — test AND(a, b), OR(a, b), AND(OR(a, b), c) and deeper nesting to verify parenthesization in real SQL
- All relationship conditions — EXISTS, NOT_EXISTS, TargetEquals, TargetMatches, TargetTypeMatches

### Claude's Discretion
- Exact test domain model design (specific entity type names, attribute schemas, relationship topology)
- Test class organization and grouping strategy
- Helper/utility methods for test data builders
- Which specific attribute values to seed for each operator test

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

*Phase: 06-end-to-end-testing*
*Context gathered: 2026-02-07*
