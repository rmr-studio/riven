# Entity Query System

## What This Is

A reusable Entity Query Service that extracts the query model from `WorkflowQueryEntityActionConfig` into a common location, then implements a service that executes structured queries against entities using native PostgreSQL/JSONB operations. This enables any feature requiring entity querying (workflows, API endpoints, reports) to use a single, optimized, security-aware query system.

## Core Value

Execute complex entity queries with attribute filters, relationship traversals, and polymorphic type handling while maintaining workspace isolation and optimal database performance.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Extract query models (`EntityQuery`, `QueryFilter`, `RelationshipCondition`, `FilterValue`, `FilterOperator`, `QueryPagination`, `QueryProjection`) from workflow config into `models/entity/query/`
- [ ] Add `TargetTypeMatches` relationship condition for polymorphic type-aware branching with OR semantics and optional filters per branch
- [ ] Create `EntityQueryService` in `service/entity/` with query execution
- [ ] Generate native PostgreSQL SQL with JSONB operators for attribute filtering
- [ ] Support relationship filtering via `entity_relationships` table joins
- [ ] Implement configurable max depth for nested relationship traversals (`TargetMatches`)
- [ ] Enforce workspace_id filtering on all queries for multi-tenant security
- [ ] Return `List<Entity>` domain models with `totalCount` for pagination
- [ ] Fail fast with exceptions on invalid filter references (non-existent attributeId, relationshipId)
- [ ] Support all `FilterOperator` variants: EQUALS, NOT_EQUALS, GREATER_THAN, LESS_THAN, IN, NOT_IN, CONTAINS, IS_NULL, STARTS_WITH, ENDS_WITH, etc.
- [ ] Update `WorkflowQueryEntityActionConfig` to use extracted models and delegate execution to `EntityQueryService`

### Out of Scope

- Template resolution inside EntityQueryService — callers resolve templates before calling
- Query result caching — optimize at database level first
- Block system querying — future extension, not this project
- GraphQL-style field selection — projections are informational, full Entity returned
- Query plan explanation/debugging tools — defer to future

## Context

**Existing Implementation:**
- Query model already defined in `WorkflowQueryEntityActionConfig` (754 lines) with comprehensive structure
- `execute()` method throws `NotImplementedError` awaiting `EntityQueryService`
- Entity payload stored as JSONB in `entities.payload` column with GIN index (`jsonb_path_ops`)
- Payload structure is `Map<UUID, EntityAttribute>` where values are polymorphic (primitives or relationships)
- Relationships stored in `entity_relationships` table with source/target entity IDs and relationship keys
- Existing indexes: `idx_entities_payload_gin`, `idx_entity_relationships_source`, `idx_entity_relationships_target`

**Polymorphic Complexity:**
- Relationship definitions can target multiple entity types (e.g., Owner → [Client, Partner])
- Relationship definitions can be fully polymorphic (`allowPolymorphic: true` → any entity type)
- Different target types have different attribute schemas
- Requires type-aware filtering: "Owner is Client where tier = Premium" vs "Owner is Partner where region = APAC"

**Database Schema:**
- `entities`: id, workspace_id, type_id, payload (JSONB), identifier_key, deleted, audit fields
- `entity_relationships`: id, workspace_id, source_entity_id, target_entity_id, relationship_key, source/target_entity_type_id
- RLS policies enforce workspace isolation at database level

## Constraints

- **Tech stack**: Spring Boot 3.5.3, Kotlin 2.1.21, PostgreSQL with JSONB
- **Query approach**: Native SQL with JSONB operators (not JPA Criteria API) for maximum performance
- **Security**: All queries must filter by workspace_id — no cross-tenant data leakage
- **Compatibility**: Must work with existing Entity/EntityType domain models without modification
- **Performance**: Leverage existing GIN index on payload column; avoid N+1 queries for relationships

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Native SQL over JPA Criteria | JSONB operators and complex joins need direct SQL control for performance | — Pending |
| Templates resolved by caller | Keeps EntityQueryService focused on query execution, not context resolution | — Pending |
| Single service (not layered) | Simpler API surface; internal implementation can be refactored later if needed | — Pending |
| TargetTypeMatches with OR semantics | Polymorphic relationships need type-aware branching; OR allows flexible matching | — Pending |
| Always return totalCount | Pagination UX requires knowing total; single query with COUNT(*) OVER() | — Pending |
| Fail fast on invalid refs | Better DX than silent failures; validation should catch issues early | — Pending |
| Configurable traversal depth | Prevents runaway recursive queries while allowing reasonable nesting | — Pending |

---
*Last updated: 2025-02-01 after initialization*
