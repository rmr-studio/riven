# Feature Landscape: Entity Query System

**Domain:** Entity/Document Query System for Spring Boot/Kotlin/PostgreSQL
**Researched:** 2026-02-01
**Confidence:** MEDIUM-HIGH (verified against industry patterns and existing codebase)

## Table Stakes

Features users expect from any entity query system. Missing these makes the product feel incomplete.

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **Comparison Operators** (EQUALS, NOT_EQUALS, GT, LT, GTE, LTE) | Standard filtering - every query system has these | Low | None | Already have `Op` enum in `Condition.kt` with these |
| **String Operators** (CONTAINS, STARTS_WITH, ENDS_WITH) | Text search is fundamental for entity data | Low | None | Add to existing `Op` enum |
| **Collection Operators** (IN, NOT_IN, EMPTY, NOT_EMPTY) | Filtering by sets of values is universal | Low | None | Already have IN, NOT_IN, EMPTY, NOT_EMPTY in `Op` enum |
| **NULL Handling** (IS_NULL, IS_NOT_NULL) | Nullable fields require explicit null checks | Low | None | Common across all query systems |
| **Logical Grouping** (AND, OR) | Combining multiple conditions is essential | Medium | Comparison operators | Existing `Expression.kt` has AND/OR operators |
| **Attribute Filtering** | Filter by entity payload fields | Medium | Comparison operators | Core requirement - filter on schema-defined attributes |
| **Result Ordering** (ASC, DESC by field) | Sorted results are baseline expectation | Low | None | Existing `SortSpec` in `ReferenceMetadata.kt` |
| **Pagination** (limit/offset) | Unbounded result sets are unacceptable | Low | None | Existing `PagingSpec` supports pageSize |
| **Field Projection** | Select only needed fields to reduce payload | Medium | None | Existing `Projection` model with field list |
| **Relationship EXISTS** | "Has related entities" is fundamental join query | Medium | Entity relationships | Required for relational data |
| **Single-Level Relationship Traversal** | Filter by immediate related entity fields | High | EXISTS operator | e.g., "Clients where Project.status = ACTIVE" |
| **Type-Safe Query Building** | Compile-time validation prevents runtime errors | Medium | None | JPA Criteria API provides this |
| **Parameterized Query Execution** | SQL injection prevention is non-negotiable | Low | None | Spring Data JPA handles automatically |

### Table Stakes Summary

The existing codebase already has foundation pieces:
- `Condition.kt`: Basic operators (EXISTS, EQUALS, NOT_EQUALS, GT, GTE, LT, LTE, IN, NOT_IN, EMPTY, NOT_EMPTY)
- `Expression.kt`: AST with Literal, PropertyAccess, BinaryOp (AND, OR, comparisons)
- `ReferenceMetadata.kt`: SortSpec, FilterSpec, PagingSpec, Projection
- `EntityRelationshipDefinition.kt`: Full relationship model with cardinality and bidirectional support

**Gap to close:** Connect these models into a cohesive query service that translates to JPA Criteria API queries.

---

## Differentiators

Features that set the query system apart. Not expected but highly valued when present.

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| **Polymorphic Relationship Queries** | Query across relationships that target multiple entity types with type-aware branching | Very High | Relationship traversal | Unique to Riven's polymorphic model - requires TYPEOF-like discrimination |
| **Multi-Level Relationship Traversal** | `client.projects.tasks.assignee.name` deep path traversal | Very High | Single-level traversal | Depth limit recommended (3-4 levels) to prevent performance issues |
| **Cursor-Based Pagination** | Stable, performant pagination for large datasets and real-time data | Medium | Basic pagination | 17x faster than offset for deep pages; essential for infinite scroll |
| **N+1 Prevention (Batch Loading)** | Automatic query coalescing for relationship hydration | High | Relationship queries | DataLoader pattern - reduces queries from thousands to dozens |
| **Query Result Caching** | Cache frequently-run queries with smart invalidation | High | Query execution | TTL + event-driven invalidation on entity changes |
| **Negation Operators** (NOT, NONE) | "Entities with NO matching relationships" queries | Medium | EXISTS operator | Prisma's `none` operator pattern |
| **Quantified Relationship Filters** (SOME, EVERY) | "Entities where ALL/SOME relationships match" | High | EXISTS operator | Prisma pattern - powerful for complex business logic |
| **Saved Query Templates** | Reusable, parameterized query definitions | Medium | Core query model | Existing `Projection.templateId` suggests this direction |
| **Query Explain/Debug Mode** | Show generated SQL and execution plan | Low | Query execution | Developer experience - helps optimize queries |
| **Aggregate Functions** (COUNT, SUM, AVG, MIN, MAX) | Compute summaries without fetching all entities | High | Core query model | GraphQL aggregations pattern |
| **GROUP BY Support** | Aggregate by category/field | Very High | Aggregate functions | Complex but powerful for analytics |
| **Full-Text Search Integration** | PostgreSQL tsvector/tsquery for linguistic search | High | None | Optional but valuable - PostgreSQL native capability |

### Differentiator Priority Recommendation

**V1 (Essential Differentiators):**
1. Polymorphic relationship queries - core to Riven's value proposition
2. Cursor-based pagination - required for scale
3. N+1 prevention - performance is table stakes, this prevents disaster

**V2 (High-Value Extensions):**
4. Multi-level relationship traversal (with depth limits)
5. Quantified filters (SOME, EVERY, NONE)
6. Query result caching

**V3 (Nice-to-Have):**
7. Aggregate functions
8. Full-text search integration
9. Saved query templates

---

## Anti-Features

Features to deliberately NOT build for v1. Common mistakes in query system design.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Arbitrary Depth Traversal** | Unbounded depth causes N^2 query explosion, timeout risks, and memory exhaustion | Cap at 3-4 levels; require explicit depth specification |
| **Real-Time Query Subscriptions** | Massive infrastructure complexity; not needed for entity queries | Use polling or separate event system for real-time |
| **Custom Query Language Parser** | Reinventing SQL is a multi-year effort with edge cases | Use structured JSON/object query model that maps to JPA Criteria |
| **Automatic Join Optimization** | Complex query planner is database's job | Generate straightforward SQL, let PostgreSQL optimize |
| **Cross-Workspace Queries** | Security nightmare; violates multi-tenant isolation | Always scope to single workspace; federated queries are separate product |
| **Dynamic Schema Queries** | Querying arbitrary JSON paths defeats type safety | Only allow queries on defined EntityType schema attributes |
| **Recursive Relationship Queries** | Graph traversal (find all ancestors/descendants) requires specialized algorithms | Use explicit depth limits; offer as separate graph API if needed |
| **Query Builder UI Integration** | Frontend concern; backend should be query-model-agnostic | Provide clean API; let frontend build its own query builder |
| **Result Transformation/Mapping** | Projection + presentation is frontend's job | Return entities with requested fields; client transforms |
| **Soft Delete Query Modes** | "Include deleted" queries add complexity to every query | Handle at entity service level, not query service |

### Anti-Feature Rationale

The temptation in query systems is to build a "universal query language." This leads to:
- Years of edge case handling
- Performance cliffs that are hard to debug
- Security vulnerabilities from query injection
- Maintenance burden that grows quadratically

**Better approach:** Start with structured, validated query models that cover 90% of use cases. Escape hatches (raw SQL) can be added later for power users, but the core should be opinionated and safe.

---

## Feature Dependencies

```
                    +-----------------------+
                    |   Comparison Ops      |
                    | (EQUALS, GT, LT...)   |
                    +-----------+-----------+
                                |
              +----------------+-----------------+
              |                                  |
              v                                  v
    +-------------------+              +-------------------+
    | String Operators  |              | Logical Grouping  |
    | (CONTAINS, etc)   |              |    (AND, OR)      |
    +-------------------+              +--------+----------+
                                                |
                                                v
                                    +-----------------------+
                                    |  Attribute Filtering  |
                                    +-----------+-----------+
                                                |
              +----------------+----------------+
              |                                 |
              v                                 v
    +-------------------+            +----------------------+
    |  Ordering & Sort  |            | Relationship EXISTS  |
    +-------------------+            +-----------+----------+
                                                |
              +----------------+----------------+----------------+
              |                |                                 |
              v                v                                 v
    +-------------------+  +--------------------+   +------------------------+
    |   Pagination      |  | Single-Level       |   | Polymorphic Type       |
    | (offset/cursor)   |  | Traversal          |   | Discrimination         |
    +-------------------+  +--------+-----------+   +------------------------+
                                    |
                                    v
                        +------------------------+
                        | Multi-Level Traversal  |
                        | (with depth limits)    |
                        +------------------------+
                                    |
                                    v
                        +------------------------+
                        | Quantified Filters     |
                        | (SOME, EVERY, NONE)    |
                        +------------------------+
```

**Critical Path for V1:**
1. Comparison Operators + String Operators (foundation)
2. Logical Grouping (enables complex filters)
3. Attribute Filtering (core use case)
4. Relationship EXISTS (relational queries)
5. Single-Level Traversal (filter by related entity fields)
6. Polymorphic Type Discrimination (Riven's unique requirement)
7. Ordering + Pagination (result handling)
8. Field Projection (optimization)

---

## MVP Recommendation

### Phase 1: Core Query Model
Build the query DSL and translation to JPA Criteria:

1. **AttributeCondition** - Filter on entity payload fields
   - All comparison operators
   - String operators (CONTAINS, STARTS_WITH, ENDS_WITH)
   - Collection operators (IN, NOT_IN)

2. **LogicalGroup** - Combine conditions with AND/OR

3. **QueryExecutor** - Translate to JPA Criteria API
   - Parameterized queries (SQL injection safe)
   - Result mapping to Entity model

### Phase 2: Relationship Queries
Enable filtering across relationships:

4. **RelationshipCondition** - EXISTS, TargetEquals, TargetMatches
   - Single-level traversal only
   - Respect cardinality (ONE_TO_ONE vs ONE_TO_MANY)

5. **Polymorphic Branching** - Type-aware relationship queries
   - TYPEOF discrimination for polymorphic relationships
   - Branch conditions per target entity type

### Phase 3: Result Handling
Complete the query pipeline:

6. **Ordering** - Sort by attribute, relationship count
7. **Pagination** - Offset for simplicity, cursor for scale
8. **Projection** - Select specific fields

### Defer to Post-MVP

| Feature | Reason to Defer |
|---------|-----------------|
| Multi-level traversal | Complexity; single-level covers 80% of cases |
| Aggregations | Separate concern; can use native SQL for analytics |
| Full-text search | Integration overhead; PostgreSQL FTS can be added later |
| Query caching | Optimization; measure first, cache second |
| Saved query templates | UX feature; not core functionality |

---

## Sources

### Comparison Operators & Filtering
- [OData Comparison Operators - Azure AI Search](https://learn.microsoft.com/en-us/azure/search/search-query-odata-comparison-operators)
- [MongoDB Query Operators](https://www.bmc.com/blogs/mongodb-operators/)
- [GraphQL Filtering - Neo4j](https://neo4j.com/docs/graphql/current/filtering/)
- [Salesforce Field Operators](https://developer.salesforce.com/docs/platform/graphql/guide/filter-fields.html)

### Pagination
- [Cursor vs Offset Pagination - Milan Jovanovic](https://www.milanjovanovic.tech/blog/understanding-cursor-pagination-and-why-its-so-fast-deep-dive)
- [GraphQL Pagination - Agility CMS](https://agilitycms.com/blog/graphql-pagination-cursor-vs-offset-explained)
- [API Pagination Guide - Gusto](https://embedded.gusto.com/blog/api-pagination/)

### Relationship Queries
- [Prisma Relation Queries](https://www.prisma.io/docs/orm/prisma-client/queries/relation-queries)
- [Hasura Nested Object Filters](https://hasura.io/docs/3.0/graphql-api/queries/filters/nested-objects/)
- [Salesforce Polymorphic Relationship Filters](https://developer.salesforce.com/docs/platform/graphql/guide/filter-polymorphic.html)

### N+1 Problem & DataLoaders
- [Apollo GraphQL - Handling N+1](https://www.apollographql.com/docs/graphos/schema-design/guides/handling-n-plus-one)
- [WunderGraph DataLoader 3.0](https://wundergraph.com/blog/dataloader_3_0_breadth_first_data_loading)
- [gqlgen DataLoaders](https://gqlgen.com/reference/dataloaders/)

### Type-Safe Query Builders
- [JPA Criteria API - Dynamic SQL Generation](https://medium.com/@AlexanderObregon/dynamic-sql-generation-in-spring-boot-with-criteria-api-cf458f057e7d)
- [QueryDSL vs Criteria API](https://dzone.com/articles/querydsl-5-vs-jpa-criteria-introduction)
- [Spring Data JPA Specifications](https://spring.io/blog/2011/04/26/advanced-spring-data-jpa-specifications-and-querydsl/)

### Projections & Sparse Fieldsets
- [JSON:API Sparse Fieldsets](https://www.jsonapi.net/usage/reading/sparse-fieldset-selection.html)
- [GraphQL Projection Performance](https://itnext.io/graphql-performance-tip-database-projection-82795e434b44)

### Security
- [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [Entity Framework SQL Injection Prevention](https://snyk.io/blog/preventing-sql-injection-entity-framework/)

### Caching
- [Redis Cache Invalidation](https://redis.io/glossary/cache-invalidation/)
- [Smart Query Caching in C#](https://www.c-sharpcorner.com/article/smart-query-caching-in-c-sharp-auto-invalidate-on-database-changes/)

### Aggregations
- [Google Cloud Datastore Aggregation Queries](https://cloud.google.com/datastore/docs/aggregation-queries)
- [JPA Aggregation Functions](https://www.baeldung.com/jpa-queries-custom-result-with-aggregation-functions)
