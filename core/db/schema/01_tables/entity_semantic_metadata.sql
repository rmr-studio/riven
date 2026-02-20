-- =====================================================
-- ENTITY SEMANTIC METADATA TABLE
-- =====================================================
-- Stores semantic metadata (definition, classification, tags) for entity types,
-- their attributes, and their relationships. Uses a target_type discriminator
-- to identify which domain object the metadata describes.
--
-- target_type = 'ENTITY_TYPE'  → target_id is the entity_type_id itself
-- target_type = 'ATTRIBUTE'    → target_id is a UUID attribute key from the schema
-- target_type = 'RELATIONSHIP' → target_id is a UUID relationship definition ID

CREATE TABLE IF NOT EXISTS public.entity_type_semantic_metadata
(
    "id"             UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
    "workspace_id"   UUID    NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
    "entity_type_id" UUID    NOT NULL REFERENCES entity_types (id) ON DELETE CASCADE,
    "target_type"    TEXT    NOT NULL CHECK (target_type IN ('ENTITY_TYPE', 'ATTRIBUTE', 'RELATIONSHIP')),
    "target_id"      UUID    NOT NULL,
    "definition"     TEXT,
    "classification" TEXT    CHECK (classification IS NULL OR classification IN (
                         'IDENTIFIER', 'CATEGORICAL', 'QUANTITATIVE',
                         'TEMPORAL', 'FREETEXT', 'RELATIONAL_REFERENCE'
                     )),
    "tags"           JSONB   NOT NULL DEFAULT '[]'::jsonb,
    "deleted"        BOOLEAN NOT NULL DEFAULT FALSE,
    "deleted_at"     TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    "created_at"     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at"     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "created_by"     UUID,
    "updated_by"     UUID,

    -- Non-partial UNIQUE: soft-deleted rows still occupy the unique tuple.
    -- Any future restore path must UPDATE (un-soft-delete) existing rows rather than INSERT,
    -- otherwise a constraint violation will occur. Current code paths are safe because:
    -- (1) new entity types get new UUIDs, (2) attribute/relationship removal hard-deletes metadata,
    -- (3) soft-delete only occurs on entity type deletion, and (4) restore is explicitly unimplemented.
    UNIQUE (entity_type_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_entity_semantic_metadata_workspace
    ON public.entity_type_semantic_metadata (workspace_id);

CREATE INDEX IF NOT EXISTS idx_entity_semantic_metadata_entity_type
    ON public.entity_type_semantic_metadata (entity_type_id)
    WHERE deleted = false;

CREATE INDEX IF NOT EXISTS idx_entity_semantic_metadata_target
    ON public.entity_type_semantic_metadata (target_type, target_id)
    WHERE deleted = false;
