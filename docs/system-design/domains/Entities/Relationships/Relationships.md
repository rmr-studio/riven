---
tags:
  - architecture/subdomain
  - domain/entity
Created: 2026-02-08
Domains:
  - "[[Entities]]"
---
# Subdomain: Relationships

## Overview

Manages both relationship definitions (type-level schema) and relationship instances (entity-level data). The subdomain uses a table-based architecture with `relationship_definitions` and `relationship_target_rules` tables replacing the old JSONB field on entity types. No inverse rows are stored — bidirectional visibility is resolved at query time through `inverseVisible` flags on target rules.

### Relationship Definitions

Type-level configuration stored in dedicated tables. Each definition belongs to a source entity type and defines relationship name, cardinality, polymorphism, and icon. Target rules specify which entity types can be targets, with optional cardinality overrides and inverse visibility configuration.

### Relationship Instances

Entity-level data stored in `entity_relationships` linking source entities to targets via `definition_id`. Write-time cardinality enforcement validates relationship limits at insert. Instance management is handled by [[EntityRelationshipService]] in the [[Entity Management]] subdomain.

## Components

| Component | Purpose | Type |
| --------- | ------- | ---- |
| [[EntityTypeRelationshipService]] | Relationship definition CRUD with target rule management and two-pass impact deletion | Service |
| [[RelationshipDefinitionRepository]] | JPA repository for relationship definition persistence | Repository |
| [[RelationshipTargetRuleRepository]] | JPA repository for target rule persistence with inverse-visible queries | Repository |

## Technical Debt

| Issue | Impact | Effort |
| ----- | ------ | ------ |
| Semantic type constraint matching stubbed | Target rules with `semanticTypeConstraint` don't match at runtime — only explicit type ID matching works | Low |

---

## Recent Changes

| Date | Change | Feature/ADR |
| ---- | ------ | ----------- |
| 2026-02-08 | Subdomain overview created | [[02-01-PLAN]] |
| 2026-02-21 | Replaced ORIGIN/REFERENCE sync with table-based architecture. Deleted DiffService and ImpactAnalysisService. Added RelationshipDefinitionRepository and RelationshipTargetRuleRepository. | Entity Relationships |
