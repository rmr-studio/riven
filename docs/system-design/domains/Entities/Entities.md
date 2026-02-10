---
tags:
  - architecture/domain
  - domain/entity
Created: 2026-02-01
Updated: 2026-02-08
---
# Domain: Entities

---

## Overview

The Entities domain provides a flexible, schema-driven data management system. Entity types define schemas (attributes and relationships), entity instances store structured data against those schemas, and a query subsystem enables filtered retrieval with JSONB-based attribute queries and relationship traversal.

---

## Boundaries

### This Domain Owns

- Entity type definitions (attributes, relationships, configuration)
- Entity instance CRUD (create, read, update, soft-delete)
- Entity relationship management (type-level definitions and instance-level data)
- Entity validation against schemas (required fields, property types, unique constraints)
- Entity querying with attribute and relationship filters
- Activity logging for entity operations

### This Domain Does NOT Own

- Workflow execution (Workflows domain consumes entities via node actions)
- Workspace scoping enforcement (enforced by Workspaces domain via RLS)
- Block management (separate domain)
- Entity semantics and templates (future domains, not yet implemented)

---

## Sub-Domains

| Component | Purpose |
| --------- | ------- |
| [[Type Definitions]] | Entity type schema management — attributes, relationships, publishing |
| [[Entity Management]] | Entity instance lifecycle — CRUD with validation and relationship hydration |
| [[Relationships]] | Bidirectional relationship definitions and instance data with ORIGIN/REFERENCE sync |
| [[Querying]] | Query pipeline for filtered entity retrieval with JSONB attribute filters and relationship traversal |
| [[Validation]] | Schema validation for entity instances before persistence |

---

## Flows

| Flow        | Type                     | Description |
| ----------- | ------------------------ | ----------- |
| [[Entity CRUD]] | User-facing | Entity creation, update, and deletion flow (Phase 4) |
| [[Entity Type Definition]] | User-facing | Entity type schema definition and modification flow (Phase 4) |

---

## Data

### Owned Entities

| Entity | Purpose | Key Fields |
| ------ | ------- | ---------- |
| EntityTypeEntity | Entity type schema definitions | id, key, displayNameSingular, displayNamePlural, workspaceId, schema, relationships, columns, identifierKey |
| EntityEntity | Entity instances with JSONB attribute data | id, typeId, typeKey, workspaceId, payload, iconType, iconColour, identifierKey |
| EntityRelationshipEntity | Relationship instances linking entities | id, sourceId, targetId, relationshipTypeId, workspaceId |
| EntityUniqueValueEntity | Unique constraint tracking for entity attributes | entityId, typeId, fieldId, value, workspaceId |

### Database Tables

| Table | Entity | Notes |
| ----- | ------ | ----- |
| entity_types | EntityTypeEntity | Entity type schemas with JSONB schema and relationships columns |
| entities | EntityEntity | Entity instances with JSONB payload column for attribute data |
| entity_relationships | EntityRelationshipEntity | Relationship instance data |
| entity_unique_values | EntityUniqueValueEntity | Normalized unique value tracking for uniqueness constraints |

---

## External Dependencies

None. The Entities domain operates entirely within the application database (PostgreSQL) and does not integrate with external systems.

---

## Domain Interactions

### Depends On

| Domain | What We Consume | Via Component | Related Flow |
|--------|----------------|---------------|--------------|
| [[Workspaces & Users]] | Workspace scoping via RLS | PostgreSQL RLS policies | [[Auth & Authorization]] |
| [[Workspaces & Users]] | @PreAuthorize authorization checks | [[WorkspaceSecurity]] | [[Auth & Authorization]] |
| [[Workspaces & Users]] | User context for activity logging | [[AuthTokenService]] | [[Entity CRUD]] |

### Consumed By

| Consumer | What They Consume | Via Component | Related Flow |
|----------|------------------|---------------|--------------|
| [[Workflows]] | Entity CRUD for workflow node actions | [[EntityService]], [[EntityContextService]] | [[Workflow Execution]] |
| REST API | Entity and entity type management | EntityController, EntityTypeController | [[Entity CRUD]], [[Entity Type Definition]] |

---

## Key Decisions

| Decision | Summary |
| -------- | ------- |
| JSONB for attribute storage | Entity attributes stored in JSONB payload column for schema flexibility |
| Bidirectional relationship sync | ORIGIN relationships automatically create/update inverse REFERENCE relationships |
| Mutable entity types | Entity types update in place (unlike BlockTypes which are versioned) |
| Query pipeline architecture | Filter validation → AST traversal → SQL generation → parameterized execution |

---

## Technical Debt

| Issue | Impact | Effort |
| ----- | ------ | ------ |
| Thread safety issue in relationship sync | ORIGIN/REFERENCE relationship sync assumes single-threaded execution | Medium |
| Missing cross-type attribute validation in query filters | Relationship filters validate against root entity type attributes instead of target entity type | Low |

---

## Recent Changes

| Date | Change | Feature/ADR |
| ---- | ------ | ----------- |
| 2026-02-01 | Domain structure created | Phase 2 initialization |
| 2026-02-08 | Domain overview and subdomain docs created | [[02-01-PLAN]] |
