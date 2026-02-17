# Knowledge Layer

## What This Is

The knowledge layer extends Riven's entity system with semantic metadata that describes what data means (not just what it contains), and an enrichment pipeline that transforms entity data into vector embeddings stored in pgvector. This lays the foundation for future natural language querying and proactive insights by ensuring every entity carries machine-understandable context about its business meaning.

## Core Value

Entity data is semantically enriched and embedded so that the system understands what business concepts its data represents — enabling future retrieval and reasoning without requiring users to manually structure queries.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] Entity types carry a semantic definition (natural language description of what the entity represents)
- [ ] Attributes carry a semantic type classification (extensible: identifier, categorical, quantitative, temporal, freetext, relational reference) and natural language description
- [ ] Relationships carry semantic context describing the nature of the connection
- [ ] Semantic metadata is user-editable on entity types, attributes, and relationships
- [ ] Template system bootstraps full entity type schemas with pre-configured semantic metadata in one action
- [ ] Three initial templates: SaaS Startup, DTC E-commerce, Service Business
- [ ] Templates include 3-5 pre-configured analytical briefs demonstrating cross-domain querying
- [ ] Templates include example queries that work with minimal data (<50 records)
- [ ] Enrichment pipeline (Temporal workflow) transforms entity data into semantically-enriched embeddings
- [ ] Enrichment triggers on entity create, update, relationship change, schema change, and manual request via queue-based pattern
- [ ] Enriched text construction includes semantic descriptions, attribute values with semantic labels, relationship context with related entity summaries
- [ ] Embeddings generated via OpenAI text-embedding-3-small and stored in pgvector
- [ ] Embedding metadata stored for filtering (entity_type, workspace_id, semantic_category, related_entity_types, timestamps)
- [ ] Schema change detection triggers re-embedding of affected entities with priority-based ordering
- [ ] Re-embedding batched via child Temporal workflows (~100 entities per batch)
- [ ] Re-embedding progress tracked and visible (schema_migration_jobs table)
- [ ] Users can continue working during re-embedding with stale-but-functional query results
- [ ] Schema changes to <1000 entities complete re-embedding within 15 minutes
- [ ] User starting from a template can ask a meaningful cross-domain question within 10 minutes of setup

### Out of Scope

- Natural language query interface — future retrieval and reasoning engine project
- Proactive insights / analytical brief execution — future work that consumes the embeddings this project produces
- Real-time embedding updates (near-real-time via queue is sufficient)
- Workspace-level API key management — single platform-level OpenAI key via environment variable
- Custom embedding model support — OpenAI text-embedding-3-small only for now

## Context

This project builds on Riven's existing entity system (entity types, attributes, relationships) and workflow infrastructure (Temporal). The semantic metadata attaches to existing schema objects. The enrichment pipeline follows the established queue-based pattern used by the workflow domain — entity mutations create queue records consumed by the enrichment pipeline asynchronously.

pgvector is a new PostgreSQL extension dependency. The embedding API (OpenAI) is a new external integration managed via a platform-level environment variable.

The template system is entirely new — it bundles entity type definitions, attribute schemas, relationship definitions, and semantic metadata into installable packages that bootstrap a workspace's data model.

## Constraints

- **Tech stack**: pgvector extension for PostgreSQL, OpenAI text-embedding-3-small for embeddings — no additional vector databases or embedding providers
- **Architecture**: Enrichment pipeline runs as Temporal workflows following existing workflow queue patterns. No new event bus or messaging infrastructure.
- **API key**: Single platform-level OpenAI API key via environment variable (`OPENAI_API_KEY`)
- **Performance**: Re-embedding <1000 entities must complete within 15 minutes. Users must not be blocked during re-embedding.
- **Compatibility**: Semantic metadata additions to entity types/attributes/relationships must not break existing entity CRUD operations

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| pgvector over dedicated vector DB | Keeps infrastructure simple — single PostgreSQL instance. Sufficient for initial scale. | — Pending |
| OpenAI text-embedding-3-small | Good quality/cost ratio for initial implementation. Platform-level key simplifies management. | — Pending |
| Queue-based enrichment triggers | Follows existing workflow queue pattern. Decouples entity mutations from embedding generation. | — Pending |
| Extensible semantic type enum | Users may have domain-specific attribute classifications beyond the initial six. Start with defaults, allow custom. | — Pending |
| Templates create full schemas | Maximizes day-one value — user gets entity types, attributes, relationships, and semantic metadata in one action. | — Pending |

---
*Last updated: 2026-02-17 after initialization*
