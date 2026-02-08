---
Created: 2026-02-08
Domains:
  - "[[Entities]]"
tags:
  - domain/entity
---
# Subdomain: Relationships

## Overview

Manages both relationship definitions (type-level schema) and relationship instances (entity-level data). This is the heaviest subdomain — it handles bidirectional sync between ORIGIN and REFERENCE relationships, cascading updates, impact analysis for schema changes, and diff calculation.

### Relationship Definitions

Type-level schema defining what relationships can exist between entity types. ORIGIN relationships are the source of truth; REFERENCE relationships are automatically created and synced for bidirectional relationships.

### Relationship Instances

Entity-level data storing actual relationship links between entities. Managed through EntityRelationshipService for create/update/delete operations on relationship data.

## Components

| Component | Purpose | Type |
| --------- | ------- | ---- |
| [[EntityTypeRelationshipService]] | Bidirectional relationship definition management with ORIGIN/REFERENCE sync | Service |
| [[EntityTypeRelationshipImpactAnalysisService]] | Impact analysis for relationship schema changes | Service |
| [[EntityTypeRelationshipDiffService]] | Delta calculation between relationship definition versions | Service |
| [[EntityRelationshipService]] | Instance-level relationship CRUD (link/unlink entities) | Service |

## Technical Debt

| Issue | Impact | Effort |
| ----- | ------ | ------ |
| Thread safety in bidirectional sync | ORIGIN/REFERENCE sync assumes single-threaded execution | Medium |

---

## Recent Changes

| Date | Change | Feature/ADR |
| ---- | ------ | ----------- |
| 2026-02-08 | Subdomain overview created | [[02-01-PLAN]] |
