-- =====================================================
-- ENTITY CONNOTATION TABLE
-- =====================================================
-- Stores per-entity polymorphic semantic envelope (SENTIMENT, RELATIONAL,
-- STRUCTURAL axes) captured at last enrichment time. One envelope per entity.
-- System-managed: no soft-delete, no audit columns. The envelope is internally
-- system-write-only and intentionally lives on a sibling table to avoid
-- polluting entities.audit fields when re-enrichment writes occur.
CREATE TABLE IF NOT EXISTS public.entity_connotation
(
    "id"                    UUID PRIMARY KEY         DEFAULT uuid_generate_v4(),
    "entity_id"             UUID        NOT NULL REFERENCES entities (id) ON DELETE CASCADE,
    "workspace_id"          UUID        NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
    "connotation_metadata"  JSONB       NOT NULL,
    "created_at"            TIMESTAMPTZ NOT NULL     DEFAULT CURRENT_TIMESTAMP,
    "updated_at"            TIMESTAMPTZ NOT NULL     DEFAULT CURRENT_TIMESTAMP,

    -- One envelope per entity (upsert pattern)
    UNIQUE (entity_id)
);
