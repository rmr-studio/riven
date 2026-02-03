# Project Research Summary

**Project:** Entity Query System for Riven Core
**Domain:** JSONB Query Service / Dynamic SQL Generation
**Researched:** 2026-02-01
**Confidence:** HIGH

## Executive Summary

The Entity Query System is a native PostgreSQL JSONB query service that translates a filter tree AST into parameterized SQL for execution against entity payloads. Based on research across technology options, industry patterns, architectural approaches, and domain-specific pitfalls, the recommended approach is **custom SQL generation with Spring's NamedParameterJdbcTemplate and a Visitor-based Kotlin DSL**. This avoids introducing heavy dependencies (jOOQ licensing, Exposed paradigm mismatch) while providing full access to PostgreSQL's JSONB operators and GIN index capabilities.

The existing codebase already has foundational pieces: a GIN index with `jsonb_path_ops` on the payload column, expression models (`Condition.kt`, `Expression.kt`), pagination/projection structures (`ReferenceMetadata.kt`), and the relationship model (`EntityRelationshipDefinition.kt`). The query system should complement this infrastructure by translating the existing `QueryFilter` sealed hierarchy into efficient SQL fragments. The architecture follows the principle that the filter tree is already an AST; the system traverses it to produce `SqlFragment` objects containing parameterized SQL and bound values.

Critical risks center on SQL injection (especially via JSONB operators that look "safe"), GIN index underutilization (wrong operators bypass the index), and workspace isolation bypass (relationship traversal must enforce workspace_id at every JOIN). The mitigation strategy is architectural: parameterization must be mandatory at the SqlFragment level, operator selection must match `jsonb_path_ops` capabilities (use `@>` containment, not `->>` extraction), and workspace scoping must be a constructor-time requirement rather than an optional filter.

## Key Findings

### Recommended Stack

The stack leverages existing Spring Boot infrastructure without new dependencies. NamedParameterJdbcTemplate provides safe, parameterized native SQL execution with named parameters for readability. A custom Kotlin DSL handles type-safe query building with full control over generated SQL, GIN index awareness, and workspace isolation built into the design.

**Core technologies:**
- **NamedParameterJdbcTemplate:** Execute parameterized native SQL - already in Spring Boot, named parameters more readable than positional
- **Custom Kotlin DSL:** Type-safe query building - full control over JSONB operators, no external dependencies
- **PostgreSQL JSONB operators:** `@>` containment for GIN index usage, `@?`/`@@` for jsonpath queries

**Not recommended:**
- jOOQ (commercial license for PostgreSQL JSONB), Exposed (paradigm mismatch), JPA Criteria API (no JSONB support)

### Expected Features

**Must have (table stakes):**
- Comparison operators (EQUALS, NOT_EQUALS, GT, LT, GTE, LTE) - standard filtering
- String operators (CONTAINS, STARTS_WITH, ENDS_WITH) - text search fundamentals
- Logical grouping (AND, OR) - combining conditions
- Attribute filtering on entity payload fields - core use case
- Relationship EXISTS queries - relational data filtering
- Single-level relationship traversal - filter by related entity fields
- Pagination (limit/offset) and ordering - result handling
- Parameterized query execution - SQL injection prevention

**Should have (competitive):**
- Polymorphic relationship queries - type-aware branching for multi-target relationships
- Cursor-based pagination - required for scale (17x faster for deep pages)
- N+1 prevention via batch loading - performance critical

**Defer (v2+):**
- Multi-level relationship traversal (cap at single level for v1)
- Aggregate functions (COUNT, SUM, AVG)
- Full-text search integration
- Query result caching
- Saved query templates

### Architecture Approach

The architecture uses a Visitor pattern to traverse the `QueryFilter` AST and produce immutable `SqlFragment` objects. Each component has clear boundaries: SqlFragment holds SQL + parameters, FilterSqlVisitor traverses the filter tree, SqlQueryBuilder assembles complete SELECT queries, QueryExecutor handles JDBC execution, and ResultMapper hydrates domain objects. Relationship conditions use EXISTS subqueries (not JOINs) to avoid row multiplication and enable short-circuit evaluation.

**Major components:**
1. **SqlFragment** - Immutable container for SQL text + parameter bindings; supports composition (and/or)
2. **FilterSqlVisitor** - Traverses QueryFilter AST; generates JSONB-specific SQL per node type
3. **SqlQueryBuilder** - Assembles SELECT/WHERE/ORDER BY/LIMIT from visitor output
4. **QueryExecutor** - NamedParameterJdbcTemplate execution with proper type binding
5. **ResultMapper** - Transforms raw results to Entity domain objects
6. **EntityQueryService** - Orchestrator coordinating the pipeline with workspace scoping

### Critical Pitfalls

1. **SQL Injection via Dynamic Query Building** - JSONB operators look "safe" but aren't. Never concatenate user input; whitelist attribute UUIDs against schema; parameterize all values. JSON-based injection can bypass WAFs.

2. **GIN Index Not Used** - The existing `jsonb_path_ops` index only supports `@>`, `@?`, `@@` operators. Using `->>` extraction bypasses the index. Generate containment queries: `payload @> '{"uuid-key": "value"}'::jsonb`.

3. **Workspace Isolation Bypass** - Relationship JOINs must include `workspace_id` at every hop. Polymorphic relationships could traverse to other workspaces if not enforced. Build workspace scoping into the query builder constructor, not as an afterthought.

4. **Unbounded Relationship Traversal** - N+1 queries and exponential expansion from nested relationships. Hard limit at 3 levels; batch relationship fetching; use CTEs for recursive traversal.

5. **NULL Handling in Expressions** - `payload->>'missing-key'` returns NULL; NULL comparisons evaluate to unknown. Define explicit null semantics per operator; use COALESCE or explicit NULL checks.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Expression System Foundation
**Rationale:** SqlFragment and basic operators are pure data structures with no dependencies; they form the foundation for all subsequent work
**Delivers:** SqlFragment data class, AttributeOperatorMapper, JsonbAccessBuilder, basic visitor for Attribute conditions
**Addresses:** Comparison operators, string operators, parameterized execution
**Avoids:** SQL injection (baked into SqlFragment design), NULL handling (defined per operator)

### Phase 2: Logical Grouping and Filter Composition
**Rationale:** Depends on Attribute visitor; enables complex queries by combining conditions
**Delivers:** AND/OR visitor methods, immutable fragment composition
**Addresses:** Logical grouping feature
**Uses:** SqlFragment composition methods

### Phase 3: Relationship Query Support
**Rationale:** Builds on attribute filtering; most complex filter type requiring subquery generation
**Delivers:** RelationshipSubqueryBuilder, EXISTS patterns for relationship conditions, TargetMatches recursive handling
**Addresses:** Relationship EXISTS, single-level traversal, polymorphic type discrimination
**Avoids:** Workspace isolation bypass (enforce at every JOIN), N+1 queries (EXISTS short-circuits)

### Phase 4: Query Assembly and Execution
**Rationale:** Requires complete visitor; assembles production-ready queries
**Delivers:** SqlQueryBuilder, QueryExecutor with NamedParameterJdbcTemplate, statement timeout configuration
**Addresses:** Ordering, pagination, field projection
**Avoids:** Query timeout (statement_timeout), GIN index not used (verify with EXPLAIN)

### Phase 5: Result Mapping and Service Integration
**Rationale:** Final integration layer; depends on all query generation components
**Delivers:** ResultMapper, EntityQueryService orchestrator, workflow integration
**Addresses:** Type-safe result hydration, API surface
**Implements:** Full EntityQueryService coordinating builder -> executor -> mapper

### Phase 6: Performance and Production Hardening
**Rationale:** Optimization after correctness; measure before optimizing
**Delivers:** Cursor-based pagination, batch loading for relationships, query complexity budget
**Addresses:** Cursor pagination differentiator, N+1 prevention
**Avoids:** GIN write degradation (monitor pending list), query explosion (depth limits)

### Phase Ordering Rationale

- **Dependency chain:** SqlFragment -> Visitor -> Builder -> Executor -> Service (linear dependency)
- **Security first:** SQL injection prevention and workspace isolation are architectural (Phase 1-3), not bolt-on
- **GIN index awareness:** Operator selection must match index type from the start (Phase 1)
- **Relationship complexity:** EXISTS subqueries are isolated from attribute filtering; can develop in parallel after Phase 2
- **Optimization last:** Cursor pagination and batch loading are enhancements after correctness proven

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Relationship Queries):** Polymorphic type branching requires schema lookup; TargetMatches recursion depth limits need validation
- **Phase 6 (Performance):** Cursor-based pagination implementation details; batch loading strategy for polymorphic relationships

Phases with standard patterns (skip research-phase):
- **Phase 1 (SqlFragment):** Pure Kotlin data class; immutable composition is well-established
- **Phase 4 (Execution):** NamedParameterJdbcTemplate usage is thoroughly documented in Spring

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | NamedParameterJdbcTemplate is standard Spring; JSONB operators documented in PostgreSQL official docs |
| Features | MEDIUM-HIGH | Table stakes verified across industry patterns; polymorphic queries are Riven-specific |
| Architecture | HIGH | Visitor pattern well-established for SQL builders (jOOQ, Exposed); EXISTS subquery pattern is standard |
| Pitfalls | HIGH | SQL injection prevention from OWASP; GIN index behavior from PostgreSQL docs; multi-tenant isolation from AWS/Crunchy Data |

**Overall confidence:** HIGH

### Gaps to Address

- **H2 test compatibility:** H2 does not support PostgreSQL JSONB operators; integration tests need Testcontainers or PostgreSQL profile
- **Polymorphic attribute resolution:** When TargetMatches filters across multiple entity types, attribute UUIDs may differ per type; schema lookup needed at query build time
- **GIN index verification:** Generated queries must be tested with EXPLAIN ANALYZE to confirm index usage; no automated validation in place

## Sources

### Primary (HIGH confidence)
- [PostgreSQL 18: JSON Functions and Operators](https://www.postgresql.org/docs/current/functions-json.html) - JSONB operators, jsonpath syntax
- [PostgreSQL 18: GIN Indexes](https://www.postgresql.org/docs/current/gin.html) - GIN behavior, operator class support
- [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html) - Parameterization requirements
- [Spring NamedParameterJdbcTemplate](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/jdbc/core/namedparam/NamedParameterJdbcTemplate.html) - API reference

### Secondary (MEDIUM confidence)
- [Crunchy Data: Indexing JSONB](https://www.crunchydata.com/blog/indexing-jsonb-in-postgres) - GIN index patterns
- [pganalyze: Understanding GIN Indexes](https://pganalyze.com/blog/gin-index) - Index size, operator support
- [jOOQ Query Object Model Design](https://www.jooq.org/doc/latest/manual/sql-building/model-api/model-api-design/) - Visitor pattern for SQL
- [Prisma Relation Queries](https://www.prisma.io/docs/orm/prisma-client/queries/relation-queries) - EXISTS vs JOIN patterns
- [AWS: Multi-tenant RLS](https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security/) - Workspace isolation

### Tertiary (LOW confidence)
- [Team82: JSON-Based WAF Bypass](https://claroty.com/team82/research/js-on-security-off-abusing-json-based-sql-to-bypass-waf) - JSONB injection vectors (edge case research)
- [Pitfalls of JSONB indexes](https://vsevolod.net/postgresql-jsonb-index/) - Query planner statistics for JSONB

---
*Research completed: 2026-02-01*
*Ready for roadmap: yes*
