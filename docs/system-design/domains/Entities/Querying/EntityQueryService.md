---
tags:
  - layer/service
  - component/active
  - architecture/component
Created: 2026-02-08
Updated: 2026-02-08
---
# EntityQueryService

Part of [[Querying]]

## Purpose

Entry point for entity queries, orchestrating validation → assembly → execution → hydration pipeline with parallel query execution.

---

## Responsibilities

- Load entity type schema for filter validation
- Validate filter references (attributes and relationships)
- Assemble parameterized SQL via query assembler
- Execute data and count queries in parallel
- Hydrate entity IDs into full domain models
- Re-sort results to preserve SQL ORDER BY
- Build EntityQueryResult with pagination metadata

---

## Dependencies

- `EntityTypeRepository` — Load entity type schema for validation
- `EntityRepository` — Batch-load entities by IDs
- [[EntityQueryAssembler]] — Convert filters to SQL
- [[QueryFilterValidator]] — Pre-validate filter structure
- `NamedParameterJdbcTemplate` — Execute parameterized SQL with configured timeout
- [[ParameterNameGenerator]] — Unique parameter naming

## Used By

- Workflow execution layer — Query execution in workflow nodes
- Entity API controllers — REST endpoints for entity queries

---

## Key Logic

**Query execution pipeline:**

1. **Load entity type** from repository
2. **Validate filter** (if present):
   - Part A: Walk tree checking attribute IDs exist in schema
   - Part B: Delegate to QueryFilterValidator for relationships
   - Collect all errors, throw QueryValidationException if any found
3. **Assemble SQL** via EntityQueryAssembler
4. **Execute in parallel:**
   - Data query: `SELECT e.id ... ORDER BY ... LIMIT/OFFSET`
   - Count query: `SELECT COUNT(*) ...`
5. **Load entities** by IDs from repository
6. **Re-sort** entities to match SQL ORDER BY (repository doesn't preserve order)
7. **Build result** with entities, totalCount, hasNextPage

**Query timeout:**

Configured via `riven.query.timeout-seconds` property. Applied to JDBC template during initialization.

**Phase 5 limitation — attribute validation:**

Nested relationship filters validate against the ROOT entity type's attributes, not the target entity type. Cross-type validation requires loading target schemas (future phase).

---

## Public Methods

### `execute(query, workspaceId, pagination, projection): EntityQueryResult`

Executes entity query with optional filters and pagination. Returns matching entities with metadata.

- **Throws:** `NotFoundException` if entity type not found
- **Throws:** `QueryValidationException` if filter references invalid
- **Throws:** `QueryExecutionException` if SQL execution fails

---

## Gotchas

- **Parallel execution:** Data and count queries run concurrently via coroutines (Dispatchers.IO)
- **Re-sorting required:** `EntityRepository.findByIdIn()` doesn't preserve order, must re-sort by SQL ORDER BY
- **Attribute validation limitation:** Nested filters validate against root type attributes only (known Phase 5 simplification)
- **No relationship loading:** Phase 5 entities returned with `relationships = emptyMap()`, hydration deferred to future phase

---

## Related

- [[EntityQueryAssembler]] — SQL assembly
- [[QueryFilterValidator]] — Filter validation
- [[Querying]] — Parent subdomain
