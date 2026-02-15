-- =====================================================
-- ENTITY TABLES
-- =====================================================

-- =====================================================
-- ENTITY TYPES TABLE
-- =====================================================
DROP TABLE IF EXISTS public.entity_types CASCADE;
CREATE TABLE IF NOT EXISTS public.entity_types
(
    "id"                    UUID PRIMARY KEY         DEFAULT uuid_generate_v4(),
    "key"                   TEXT    NOT NULL,
    "type"                  TEXT    NOT NULL CHECK (type IN ('STANDARD', 'RELATIONSHIP')),
    "workspace_id"          UUID REFERENCES workspaces (id) ON DELETE CASCADE,
    "identifier_key"        UUID    NOT NULL,
    "display_name_singular" TEXT    NOT NULL,
    "display_name_plural"   TEXT    NOT NULL,
    "icon_type"             TEXT    NOT NULL         DEFAULT 'CIRCLE_DASHED', -- Lucide Icon Representation,
    "icon_colour"           TEXT    NOT NULL         DEFAULT 'NEUTRAL',       -- Colour of the icon,
    "description"           TEXT,
    "protected"             BOOLEAN NOT NULL         DEFAULT FALSE,
    "schema"                JSONB   NOT NULL,
    "columns"               JSONB,
    -- Denormalized count of entities of this type for faster access
    "count"                 INTEGER NOT NULL         DEFAULT 0,
    "relationships"         JSONB,
    "version"               INTEGER NOT NULL         DEFAULT 1,
    "deleted"               BOOLEAN NOT NULL         DEFAULT FALSE,
    "created_at"            TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at"            TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "created_by"            UUID,
    "updated_by"            UUID,
    "deleted_at"            TIMESTAMP WITH TIME ZONE DEFAULT NULL,

    -- Single row per entity type (mutable pattern)
    -- Also creates an index on workspace_id + key for faster lookups
    UNIQUE (workspace_id, key),

    -- Relationship entities must have relationship_config
    CHECK (
        (type = 'RELATIONSHIP' AND relationships IS NOT NULL) OR
        (type = 'STANDARD' AND relationships IS NULL)
        )
);

-- =====================================================
-- ENTITIES TABLE
-- =====================================================
DROP TABLE IF EXISTS public.entities CASCADE;
CREATE TABLE IF NOT EXISTS public.entities
(
    "id"             UUID PRIMARY KEY         DEFAULT uuid_generate_v4(),
    "workspace_id"   UUID    NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
    "type_id"        UUID    NOT NULL REFERENCES entity_types (id) ON DELETE RESTRICT,
    "type_key"       TEXT    NOT NULL,                           -- Denormalized key from entity_type for easier access

    "identifier_key" UUID    NOT NULL,                           -- Duplicate key from entity_type for faster lookups without needing separate query
    "payload"        JSONB   NOT NULL         DEFAULT '{}'::jsonb,
    "icon_type"      TEXT    NOT NULL         DEFAULT 'FILE',    -- Lucide Icon Representation,
    "icon_colour"    TEXT    NOT NULL         DEFAULT 'NEUTRAL', --

    "created_at"     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at"     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "created_by"     UUID    REFERENCES users (id) ON DELETE SET NULL,
    "updated_by"     UUID    REFERENCES users (id) ON DELETE SET NULL,

    "deleted"        BOOLEAN NOT NULL         DEFAULT FALSE,
    "deleted_at"     TIMESTAMP WITH TIME ZONE DEFAULT NULL,

    -- Provenance tracking fields
    "source_type"            VARCHAR(50) NOT NULL DEFAULT 'USER_CREATED',
    "source_integration_id"  UUID REFERENCES integration_definitions(id) ON DELETE SET NULL,
    "source_external_id"     TEXT,
    "source_url"             TEXT,
    "first_synced_at"        TIMESTAMPTZ,
    "last_synced_at"         TIMESTAMPTZ,
    "sync_version"           BIGINT NOT NULL DEFAULT 0
);

-- =====================================================
-- ENTITIES UNIQUE VALUES TABLE
-- =====================================================

-- Easy way to enforce unique fields per entity type. This table will store unique field values for entities.
-- When an entity is created or updated, the relevant unique fields will be deleted and re-inserted/updated here
DROP TABLE IF EXISTS public.entities_unique_values CASCADE;
CREATE TABLE IF NOT EXISTS public.entities_unique_values
(
    "id"           UUID PRIMARY KEY         DEFAULT uuid_generate_v4(),
    "workspace_id" UUID    NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
    "type_id"      UUID    NOT NULL REFERENCES entity_types (id) ON DELETE CASCADE,
    "entity_id"    UUID    NOT NULL REFERENCES entities (id) ON DELETE CASCADE,
    "field_id"     UUID    NOT NULL,
    "field_value"  TEXT    NOT NULL,

    "deleted"      BOOLEAN NOT NULL         DEFAULT FALSE,
    "deleted_at"   TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- =====================================================
-- ENTITY ATTRIBUTE PROVENANCE TABLE
-- =====================================================
DROP TABLE IF EXISTS public.entity_attribute_provenance CASCADE;
CREATE TABLE IF NOT EXISTS public.entity_attribute_provenance (
    "id"                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "entity_id"              UUID    NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    "attribute_id"           UUID    NOT NULL,
    "source_type"            VARCHAR(50) NOT NULL,
    "source_integration_id"  UUID REFERENCES integration_definitions(id) ON DELETE SET NULL,
    "source_external_field"  VARCHAR(255),
    "last_updated_at"        TIMESTAMPTZ NOT NULL DEFAULT now(),
    "override_by_user"       BOOLEAN NOT NULL DEFAULT false,
    "override_at"            TIMESTAMPTZ,
    UNIQUE(entity_id, attribute_id)
);

-- =====================================================
-- ENTITY RELATIONSHIPS TABLE
-- =====================================================
DROP TABLE IF EXISTS public.entity_relationships CASCADE;
CREATE TABLE IF NOT EXISTS public.entity_relationships
(
    "id"                    UUID PRIMARY KEY         DEFAULT uuid_generate_v4(),
    "workspace_id"          UUID    NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
    "source_entity_id"      UUID    NOT NULL REFERENCES entities (id) ON DELETE CASCADE,
    "source_entity_type_id" UUID    NOT NULL REFERENCES entity_types (id) ON DELETE RESTRICT,
    "target_entity_id"      UUID    NOT NULL REFERENCES entities (id) ON DELETE CASCADE,
    "target_entity_type_id" UUID    NOT NULL REFERENCES entity_types (id) ON DELETE RESTRICT,
    "relationship_field_id" UUID    NOT NULL,

    -- Additional metadata about the relationship
    "created_at"            TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at"            TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "created_by"            UUID    REFERENCES users (id) ON DELETE SET NULL,
    "updated_by"            UUID    REFERENCES users (id) ON DELETE SET NULL,

    "deleted"               BOOLEAN NOT NULL         DEFAULT FALSE,
    "deleted_at"            TIMESTAMP WITH TIME ZONE DEFAULT NULL
);
