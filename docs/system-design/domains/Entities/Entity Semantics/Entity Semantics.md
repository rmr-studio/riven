---
Created: 2026-02-06
Domains:
  - "[[Entities]]"
  - "[[Knowledge]]"
tags:
---
# Subdomain: Entity Semantics
## Overview

Entity types, attributes, and relationships carry semantic metadata that defines what they mean, not just what they're called.

- Each entity type carries a semantic definition (natural language description of what this entity represents in the business model)
- Each attribute carries a semantic type classification (identifier, categorical, quantitative, temporal, freetext, relational reference) and natural language description
- Each relationship carries semantic context (the nature of the connection, e.g., "customer purchased product" vs "customer viewed product")
- Semantic metadata is inherited from templates but user-editable
- Changes to semantic metadata trigger re-enrichment of affected entities 
	- [[Schema Change Handling]]
## Components

| Component | Purpose | Type |
| --------- | ------- | ---- |
| [[EntityTypeSemanticMetadataService]] | CRUD operations and lifecycle hooks for semantic metadata | Service |
| [[EntityTypeSemanticMetadataRepository]] | Data access with custom JPQL for hard-delete and cascade soft-delete | Repository |
| [[KnowledgeController]] | 8 REST endpoints at `/api/v1/knowledge/` for semantic metadata management | Controller |
| EntityTypeSemanticMetadataEntity | Database mapping for `entity_type_semantic_metadata` table | JPA Entity |
| EntityTypeSemanticMetadata | Immutable domain model for semantic metadata | Model |
| SemanticMetadataTargetType | Discriminator enum: ENTITY_TYPE, ATTRIBUTE, RELATIONSHIP | Enum |
| SemanticAttributeClassification | Classification enum: identifier, categorical, quantitative, temporal, freetext, relational_reference | Enum |

## Technical Debt

|Issue|Impact|Effort|
|---|---|---|
||High/Med/Low|High/Med/Low|

---

## Recent Changes

| Date | Change | Feature/ADR |
| ---- | ------ | ----------- |
| 2026-02-19 | Phase 1 implementation — service, repository, JPA entity, domain model, enums, lifecycle hooks, KnowledgeController, 12 unit tests | Semantic Metadata Foundation |
