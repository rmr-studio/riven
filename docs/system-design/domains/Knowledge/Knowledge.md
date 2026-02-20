---
tags:
  - architecture/domain
  - domain/knowledge
Created:
---
# Domain: AI Data Knowledge Query Layer

---

## Overview

One of the biggest features of the application would be how a unionised platform, collecting data from all sources within a business, and its third party tools (Ie. Forms, Inbound, Outbound, Support, Payments) would then be able to continuously learn from the incoming data, its relationship with other sources, building a compounding contextual moat of patterns, trends links and data that then can be used to answer multi-sectional questions to further aid with business decisions and paths.
- This completely out-shines the capability of any other external tool, and the information and pattern analysis that they can provide, purely due to the whole unification of data, and cross domain analysis capabilities of the application.
- Each entity environment is imbued with semantic metadata to accurately describe each attribute, and the meaning behind each relationship. This will ensure that the AI Agents are fully aware of the meaning behind data entries within a given column
- Over time, as data accumulates through the schema that the AI Agent is aware of, it will build pattern recognition, and will continue to strengthen its contextual capabilities and learning, through analysing trends through high amounts of data volume.
- In order to fully support flexibility within the entity environment, each schema modification would require the AI model to reconcile the changes against its existing understanding of the schema,
	- Users would be required to provide additional semantic tagging and metadata to accurately describe an attribute or relationships functionality and purpose
		- Each entity type would have an overarching `category`
			- customer
			- transaction
			- communication
			- product
			- `custom`
		- Each entity attribute/relationship would also have a `sub-category` or a description field
- The workspace then has a AI Native queryable data layer, this is a layer where a user can run a natural language analytical brief against scoped entity data in order to return insights
	- This means that users can ask questions about any aspect of their current ecosystem in order to understand patterns.
- A workspace can then also define `perspectives`
	- These act as individual 'agents', with stored instructions, a defined scope of entities and relationships and a trigger (ie. Entity data change, scheduled cron job, threshold met)
		- *Track which segments churn fastest and why*
		- *Monitor customer acquisition efficiency across channels*
		- *Monitor churn rate by acquisition channel*
		- *Flag when support ticket volume spikes for a customer segment*
		- *Watch for customers who go inactive for more than 14 days after their first purchase*
		- *Monitor product-revenue patterns*
		- *Tracking support to churn correlations*
	- **The system should then be able to extrapolate schema shape to suggest briefs/perspectives**
		- If a user has entities with revenue data and churn data, but nothing watching the correlation, this could be flagged.
		- If a user is asking the same common questions in the flat query layer, these should also be turned into agents
	- These then provide structured insights, updates, reports or notifications
	- These aren't realistically **agents** by definition, however is great marketing and a good way to frame the responsibility of these models
---

## Boundaries

### This Domain Owns

- Semantic metadata CRUD endpoints (natural language definitions, attribute classifications, tags)
- REST API at `/api/v1/knowledge/` for metadata management
- Full metadata bundle retrieval (entity type + attributes + relationships in one response)

### This Domain Does NOT Own

- Semantic metadata persistence and lifecycle management (owned by [[Entity Semantics]] subdomain within Entities domain)
- Entity type definitions, attributes, or relationships (owned by [[Entities]] domain)
- Enrichment pipeline, embeddings, or AI processing (future — not yet implemented)
- Sub-Agents / Perspectives (future — not yet implemented)

---

## Components

| Component | Purpose | Type |
| --------- | ------- | ---- |
| [[KnowledgeController]] | 8 REST endpoints for semantic metadata CRUD at `/api/v1/knowledge/` | Controller |

---

## Flows

| Flow | Type | Description |
| ---- | ---- | ----------- |
| Semantic Metadata CRUD | User-facing | Create, read, update semantic definitions, classifications, and tags for entity types, attributes, and relationships |

---

## Data

### Owned Entities

| Entity | Purpose | Key Fields |
|--------|---------|------------|
| EntityTypeSemanticMetadataEntity | Semantic metadata records (shared ownership with [[Entity Semantics]]) | id, workspaceId, entityTypeId, targetType, targetId, definition, classification, tags |

### Database Tables

| Table | Entity | Notes |
|-------|--------|-------|
| entity_type_semantic_metadata | EntityTypeSemanticMetadataEntity | Shared ownership with Entity Semantics subdomain. Single-table discriminator pattern |

---

## External Dependencies

None

---

## Domain Interactions

### Depends On

| Domain | What We Need | How We Access |
|--------|-------------|---------------|
| [[Entities]] | Semantic metadata service for all business logic | [[EntityTypeSemanticMetadataService]] via direct service injection |
| [[Entities]] | Entity type existence verification for workspace scoping | [[EntityTypeRepository]] (accessed indirectly via service) |

### Consumed By

| Domain | What They Need | How They Access |
|--------|---------------|-----------------|
| REST API consumers | Semantic metadata management | [[KnowledgeController]] endpoints |

---

## Key Decisions

| Decision | Summary |
|----------|---------|
| Controller-only domain | Knowledge domain owns only the API controller; all business logic lives in Entity Semantics subdomain within Entities domain |
| Separate API path | `/api/v1/knowledge/` endpoints are separate from entity type endpoints to maintain domain boundary |

---

## Technical Debt

None

---

## Recent Changes

| Date | Change | Feature/ADR |
|------|--------|-------------|
| 2026-02-19 | KnowledgeController with 8 REST endpoints for semantic metadata CRUD | Semantic Metadata Foundation |
