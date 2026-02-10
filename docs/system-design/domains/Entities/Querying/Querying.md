---
tags:
  - architecture/subdomain
  - domain/entity
Created: 2026-02-08
Domains:
  - "[[Entities]]"
---
# Subdomain: Querying

## Overview

Provides a pipeline for querying entities with complex filters on JSONB attributes and relationships. The pipeline validates filters, generates parameterized SQL, traverses filter ASTs, and assembles complete queries with workspace isolation and pagination.

### Query Pipeline

```mermaid
flowchart TD
    A[QueryFilterValidator] --> B[EntityQueryAssembler]
    B --> C[AttributeFilterVisitor]
    C --> D{Filter Type?}
    D -->|Attribute Filter| E[AttributeSqlGenerator]
    D -->|Relationship Filter| F[RelationshipSqlGenerator]
    E --> G[SqlFragment]
    F --> G
    B --> H[Assemble SqlFragments into AssembledQuery]
    I[EntityQueryService] --> A
    I --> H
    H --> J[Execute via JdbcTemplate]
```

The query pipeline flow:
1. **QueryFilterValidator** validates filter structure and operator compatibility
2. **EntityQueryAssembler** coordinates the assembly process
3. **AttributeFilterVisitor** traverses the filter AST
4. **AttributeSqlGenerator** generates SQL for JSONB attribute filters
5. **RelationshipSqlGenerator** generates EXISTS subqueries for relationship filters
6. SQL fragments combine into **AssembledQuery** (paired data/count queries)
7. **EntityQueryService** executes the assembled queries via JdbcTemplate

## Components

| Component | Purpose | Type |
| --------- | ------- | ---- |
| [[EntityQueryService]] | Query entry point, delegates to pipeline, executes SQL | Service |
| [[EntityQueryAssembler]] | Assembles complete parameterized queries from filter output | Service |
| [[QueryFilterValidator]] | Validates filter structure and operator compatibility | Service |
| [[AttributeFilterVisitor]] | Traverses filter AST, dispatches to SQL generators | Service |
| [[AttributeSqlGenerator]] | Generates SQL for JSONB attribute filters | Component |
| [[RelationshipSqlGenerator]] | Generates EXISTS subqueries for relationship filters | Component |
| [[SqlFragment]] | Value object for SQL clause + parameter pairs | Data Class |
| [[ParameterNameGenerator]] | Unique parameter name generation for query tree | Utility |
| [[AssembledQuery]] | Value object holding paired data/count queries | Data Class |

## Technical Debt

| Issue | Impact | Effort |
| ----- | ------ | ------ |
| Cross-type attribute validation missing | Relationship filters validate against root entity type attributes instead of target type | Low |

---

## Recent Changes

| Date | Change | Feature/ADR |
| ---- | ------ | ----------- |
| 2026-02-08 | Subdomain overview created with pipeline diagram | [[02-01-PLAN]] |
