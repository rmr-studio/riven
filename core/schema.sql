-- workspaces

ALTER TABLE public.workspace_members
    ADD CONSTRAINT ux_workspace_user UNIQUE (workspace_id, user_id);

CREATE INDEX idx_workspace_members_user_id
    ON public.workspace_members (user_id);



-- Function to update member count
CREATE OR REPLACE FUNCTION public.update_org_member_count()
    RETURNS TRIGGER AS
$$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Increment member count on INSERT
        UPDATE public.workspaces
        SET member_count = member_count + 1,
            updated_at   = now()
        WHERE id = NEW.workspace_id;
    ELSIF (TG_OP = 'DELETE') THEN
        -- Decrement member count on DELETE
        UPDATE public.workspaces
        SET member_count = member_count - 1,
            updated_at   = now()
        WHERE id = OLD.workspace_id;
    END IF;

    RETURN NULL; -- Triggers on INSERT/DELETE do not modify the rows
END;
$$ LANGUAGE plpgsql;

-- Trigger for INSERT and DELETE on workspace_members
CREATE or replace TRIGGER trg_update_workspace_member_count
    AFTER INSERT OR DELETE
    ON public.workspace_members
    FOR EACH ROW
EXECUTE FUNCTION public.update_org_member_count();

ALTER TABLE workspaces
    ENABLE ROW LEVEL SECURITY;

/* Add restrictions to ensure that only workspac members can view their workspace*/
CREATE POLICY "Users can view their own workspaces" on workspaces
    FOR SELECT
    TO authenticated
    USING (
    id IN (SELECT workspace_id
           FROM workspace_members
           WHERE user_id = auth.uid())
    );



CREATE INDEX idx_invite_workspace_id ON public.workspace_invites (workspace_id);
CREATE INDEX idx_invite_email ON public.workspace_invites (email);
CREATE INDEX idx_invite_token ON public.workspace_invites (invite_code);

alter table workspace_invites
    add constraint uq_invite_code unique (invite_code);

-- Users
drop table if exists "users" cascade;
create table if not exists "users"
(
    "id"                   uuid primary key not null default uuid_generate_v4(),
    "name"                 varchar(50)      not null,
    "email"                varchar(100)     not null unique,
    "phone"                varchar(15)      null,
    "avatar_url"           TEXT,
    "default_workspace_id" UUID             references public.workspaces (id) ON DELETE SET NULL,
    "created_at"           timestamp with time zone  default current_timestamp,
    "updated_at"           timestamp with time zone  default current_timestamp
);

create or replace function public.handle_new_user()
    returns trigger
    language plpgsql
    security definer set search_path = ''
as
$$
begin
    insert into public.users (id, name, email, phone, avatar_url)
    values (new.id,
            coalesce(new.raw_user_meta_data ->> 'name', ''),
            new.email,
            coalesce(new.raw_user_meta_data ->> 'phone', ''),
            avatar_url);
    return new;
end
$$;

-- trigger the function every time a user is created
create or replace trigger on_auth_user_created
    after insert
    on auth.users
    for each row
execute procedure public.handle_new_user();

create or replace function public.handle_phone_confirmation()
    returns trigger
    language plpgsql
    security definer set search_path = ''
as
$$
begin
    if new.phone is not null then
        update public.users
        set phone = new.phone
        where id = new.id;
    end if;
    return new;
end;
$$;

-- Content Blocks
CREATE TABLE if not exists public.block_types
(
    "id"                uuid PRIMARY KEY         DEFAULT uuid_generate_v4(),
    "key"               text  NOT NULL,                                                                             -- machine key e.g. "contact_card"
    "display_name"      text  NOT NULL,
    "source_id"         uuid  references block_types (id) ON DELETE SET NULL,                                       -- refers to the original block type if this is a copy/updated version
    "description"       text,
    "workspace_id"      uuid  REFERENCES workspaces (id) ON DELETE SET NULL,                                        -- null for global
    "nesting"           jsonb,                                                                                      -- options for storing blocks within this block. Null indicates no children allowed
    "system"            boolean                  DEFAULT FALSE,                                                     -- system types you control
    "schema"            jsonb NOT NULL,                                                                             -- JSON Schema for validation
    "display_structure" jsonb not NULL,                                                                             -- UI metadata for frontend display (ie. Form Structure, Display Component Rendering, etc)
    "strictness"        text  NOT NULL           default 'soft' check ( strictness in ('none', 'soft', 'strict') ), -- how strictly to enforce schema (none, soft (warn), strict (reject))
    "version"           integer                  DEFAULT 1,                                                         -- To handle updates to schema/display_structure over time to ensure that existing blocks are not broken,
    "deleted"           boolean                  DEFAULT FALSE,                                                     -- soft delete
    "created_at"        timestamp with time zone default current_timestamp,
    "updated_at"        timestamp with time zone default current_timestamp,
    "created_by"        uuid,                                                                                       -- optional user id
    "updated_by"        uuid,                                                                                       -- optional user id
    UNIQUE (workspace_id, key, version)
);

-- System types (your pre-generated defaults) are the ONLY rows without an org_id
ALTER TABLE block_types
    ADD CONSTRAINT chk_system_org
        CHECK (
            (system = true AND workspace_id IS NULL) OR
            (system = false AND workspace_id IS NOT NULL)
            );

create index idx_block_types_workspace_id on block_types (workspace_id);
create index idx_block_types_key on block_types (key);

ALTER TABLE block_types
    ADD CONSTRAINT chk_key_slug
        CHECK (key ~ '^[a-z0-9][a-z0-9._-]{1,62}$');

-- Tenant isolation (Supabase RLS)
ALTER TABLE public.block_types
    ENABLE ROW LEVEL SECURITY;
CREATE POLICY "block_types_select_by_org" ON public.block_types
    FOR SELECT TO authenticated
    USING (workspace_id IS NULL OR workspace_id IN (SELECT workspace_id
                                                    FROM public.workspace_members
                                                    WHERE user_id = auth.uid()));
CREATE POLICY "block_types_write_by_org" ON public.block_types
    FOR ALL TO authenticated
    USING (workspace_id IN (SELECT workspace_id
                            FROM public.workspace_members
                            WHERE user_id = auth.uid()))
    WITH CHECK (workspace_id IN (SELECT workspace_id
                                 FROM public.workspace_members
                                 WHERE user_id = auth.uid()));
-- Blocks: first-class rows, tenant-scoped
create table if not exists public.blocks
(
    "id"           uuid PRIMARY KEY         DEFAULT uuid_generate_v4(),
    "workspace_id" uuid REFERENCES workspaces (id)  NOT NULL,
    "type_id"      uuid REFERENCES block_types (id) NOT NULL, -- true if payload contains references to another block/entities
    "name"         text,                                      -- human-friendly title
    "payload"      jsonb                    DEFAULT '{}',     -- flexible content
    "deleted"      boolean                  DEFAULT false,    -- archives
    "created_by"   uuid                             references public.users (id) ON DELETE SET NULL,
    "updated_by"   uuid                             references public.users (id) ON DELETE SET NULL,
    "created_at"   TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updated_at"   TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blocks_org ON public.blocks (workspace_id);
CREATE INDEX IF NOT EXISTS idx_blocks_type ON public.blocks (type_id);
CREATE INDEX IF NOT EXISTS idx_blocks_deleted ON public.blocks (deleted);

-- RLS
ALTER TABLE public.blocks
    ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocks_select_by_org" ON public.blocks
    FOR SELECT TO authenticated
    USING (workspace_id IN (SELECT workspace_id
                            FROM public.workspace_members
                            WHERE user_id = auth.uid()));
CREATE POLICY "blocks_write_by_org" ON public.blocks
    FOR ALL TO authenticated
    USING (workspace_id IN (SELECT workspace_id
                            FROM public.workspace_members
                            WHERE user_id = auth.uid()))
    WITH CHECK (workspace_id IN (SELECT workspace_id
                                 FROM public.workspace_members
                                 WHERE user_id = auth.uid()));


CREATE TABLE public.block_children
(
    "id"          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "parent_id"   uuid NOT NULL REFERENCES blocks (id) ON DELETE CASCADE,
    "child_id"    uuid NOT NULL REFERENCES blocks (id) ON DELETE CASCADE,
    -- Order index to maintain the order of children within the parent block, given the parent is of 'list' type
    "order_index" integer          DEFAULT null
);

CREATE INDEX IF NOT EXISTS idx_block_children_parent ON block_children (parent_id);
CREATE INDEX IF NOT EXISTS idx_block_children_child ON public.block_children (child_id);

-- A block can only be the child of a singular parent block. Ensure no blocks are shared when looking at direct children
alter table public.block_children
    add constraint uq_block_child unique (child_id);

alter table public.block_children
    add constraint uq_parent_order_index unique (parent_id, order_index);


create table public.block_tree_layouts
(
    id           uuid primary key         default uuid_generate_v4(),
    workspace_id uuid    not null references workspaces (id) on delete cascade,
    layout       jsonb   not null,
    version      integer not null         default 1, -- id of client, line item, etc,
    entity_id    uuid    not null references public.entities (id) on delete cascade,
    created_at   timestamp with time zone default current_timestamp,
    updated_at   timestamp with time zone default current_timestamp,
    "created_by" uuid    references public.users (id) ON DELETE SET NULL,
    "updated_by" uuid    references public.users (id) ON DELETE SET NULL
);

create index if not exists idx_block_tree_layouts_entity_id
    on public.block_tree_layouts (entity_id);

create index if not exists idx_block_tree_layouts_workspace_id
    on public.block_tree_layouts (workspace_id);

create table if not exists "activity_logs"
(
    "id"           uuid primary key         not null default uuid_generate_v4(),
    "activity"     varchar(100)             not null,
    "operation"    varchar(10)              not null check (operation in
                                                            ('CREATE', 'UPDATE', 'DELETE', 'READ', 'ARCHIVE',
                                                             'RESTORE')),
    "workspace_id" uuid                     not null references public.workspaces (id) on delete cascade,
    "user_id"      uuid                     references public.users (id) on delete set null,
    "entity_type"  varchar(50)              not null,
    "entity_id"    uuid,
    "details"      JSONB                    not null default '{}'::jsonb,
    "timestamp"    timestamp with time zone not null default current_timestamp
);

create index if not exists idx_activity_logs_workspace_id
    on public.activity_logs (workspace_id);

create index if not exists idx_activity_logs_user_id
    on public.activity_logs (user_id);

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

create index if not exists idx_entity_types_workspace_id
    on entity_types (workspace_id)
    where deleted = false;

-- =====================================================
-- 2. ENTITIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.entities
(
    "id"             UUID PRIMARY KEY         DEFAULT uuid_generate_v4(),
    "workspace_id"   UUID    NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
    "type_id"        UUID    NOT NULL REFERENCES entity_types (id) ON DELETE RESTRICT,
    "deleted"        BOOLEAN NOT NULL         DEFAULT FALSE,
    "type_key"       TEXT    NOT NULL,                           -- Denormalized key from entity_type for easier access
    -- Duplicate key from entity_type for faster lookups without needing separate query
    "identifier_key" UUID    NOT NULL,
    "payload"        JSONB   NOT NULL         DEFAULT '{}'::jsonb,
    "icon_type"      TEXT    NOT NULL         DEFAULT 'FILE',    -- Lucide Icon Representation,
    "icon_colour"    TEXT    NOT NULL         DEFAULT 'NEUTRAL', --
    "created_at"     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at"     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "created_by"     UUID    REFERENCES users (id) ON DELETE SET NULL,
    "updated_by"     UUID    REFERENCES users (id) ON DELETE SET NULL,
    "deleted_at"     TIMESTAMP WITH TIME ZONE DEFAULT NULL,

    -- Provenance tracking fields
    "source_type"            VARCHAR(50) NOT NULL DEFAULT 'USER_CREATED',
    "source_integration_id"  UUID,
    "source_external_id"     TEXT,
    "source_url"             TEXT,
    "first_synced_at"        TIMESTAMPTZ,
    "last_synced_at"         TIMESTAMPTZ,
    "sync_version"           BIGINT NOT NULL DEFAULT 0
);

create index if not exists idx_entities_type_id
    on entities (type_id)
    where deleted = false;

create index if not exists idx_entities_workspace_id
    on entities (workspace_id)
    where deleted = false;

create index idx_entities_payload_gin on entities using gin (payload jsonb_path_ops) where deleted = false and deleted_at is null;

-- Provenance indexes
CREATE INDEX idx_entities_source_integration ON entities(source_integration_id) WHERE source_integration_id IS NOT NULL;
CREATE INDEX idx_entities_source_external_id ON entities(source_external_id) WHERE source_external_id IS NOT NULL;

--Easy way to enforce unique fields per entity type. This table will store unique field values for entities.
--When an entity is created or updated, the relevant unique fields will be deleted and re-inserted/updated here

CREATE TABLE IF NOT EXISTS public.entities_unique_values
(
    "id"          UUID PRIMARY KEY         DEFAULT uuid_generate_v4(),
    "type_id"     UUID    NOT NULL REFERENCES entity_types (id) ON DELETE CASCADE,
    "entity_id"   UUID    NOT NULL REFERENCES entities (id) ON DELETE CASCADE,
    "field_id"    UUID    NOT NULL,
    "field_value" TEXT    NOT NULL,
    "deleted"     BOOLEAN NOT NULL         DEFAULT FALSE,
    "deleted_at"  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_unique_attribute_per_type
        UNIQUE (type_id, field_id, field_value, deleted)
);

CREATE OR REPLACE FUNCTION sync_entity_identifier_key()
    RETURNS TRIGGER AS
$$
BEGIN
    -- Only act when identifier_key has changed
    IF NEW.identifier_key IS DISTINCT FROM OLD.identifier_key THEN
        UPDATE entities
        SET identifier_key = NEW.identifier_key
        WHERE type_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_entity_identifier_key
    AFTER UPDATE OF identifier_key
    ON entity_types
    FOR EACH ROW
EXECUTE FUNCTION sync_entity_identifier_key();



-- Function to update entity count in entity_types
-- Handles soft deletion via 'deleted' field:
-- - INSERT: increment count (only if not deleted)
-- - UPDATE: decrement on archive, increment on restore
-- - DELETE: decrement only if not already deleted (avoid double-decrement)
CREATE OR REPLACE FUNCTION public.update_entity_type_count()
    RETURNS TRIGGER AS
$$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Increment entity count on INSERT (only if not deleted)
        IF NEW.deleted = false THEN
            UPDATE public.entity_types
            SET count      = count + 1,
                updated_at = now()
            WHERE id = NEW.type_id;
        END IF;

    ELSIF (TG_OP = 'UPDATE') THEN
        -- Handle archive status changes
        IF OLD.deleted = false AND NEW.deleted = true THEN
            -- Entity is being deleted: decrement count
            UPDATE public.entity_types
            SET count      = count - 1,
                updated_at = now()
            WHERE id = NEW.type_id;

        ELSIF OLD.deleted = true AND NEW.deleted = false THEN
            -- Entity is being restored: increment count
            UPDATE public.entity_types
            SET count      = count + 1,
                updated_at = now()
            WHERE id = NEW.type_id;
        END IF;

    ELSIF (TG_OP = 'DELETE') THEN
        -- Decrement entity count on DELETE (only if not already deleted)
        -- If deleted, the count was already decremented during archiving
        IF OLD.deleted = false THEN
            UPDATE public.entity_types
            SET count      = count - 1,
                updated_at = now()
            WHERE id = OLD.type_id;
        END IF;
    END IF;

    RETURN NULL; -- Triggers on INSERT/UPDATE/DELETE do not modify the rows
END;
$$ LANGUAGE plpgsql;

-- Trigger for INSERT, UPDATE (of deleted field), and DELETE on entities
CREATE OR REPLACE TRIGGER trg_update_entity_type_count
    AFTER INSERT OR UPDATE OF deleted OR DELETE
    ON public.entities
    FOR EACH ROW
EXECUTE FUNCTION public.update_entity_type_count();

-- =====================================================
-- 3. ENTITY_ATTRIBUTE_PROVENANCE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.entity_attribute_provenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    attribute_id UUID NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    source_integration_id UUID,
    source_external_field VARCHAR(255),
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    override_by_user BOOLEAN NOT NULL DEFAULT false,
    override_at TIMESTAMPTZ,
    UNIQUE(entity_id, attribute_id)
);

CREATE INDEX idx_provenance_entity ON entity_attribute_provenance(entity_id);
CREATE INDEX idx_provenance_integration ON entity_attribute_provenance(source_integration_id) WHERE source_integration_id IS NOT NULL;

-- =====================================================
-- 4. ENTITY_RELATIONSHIPS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.entity_relationships
(
    "id"                    UUID PRIMARY KEY         DEFAULT uuid_generate_v4(),
    "workspace_id"          UUID    NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
    "source_entity_id"      UUID    NOT NULL REFERENCES entities (id) ON DELETE CASCADE,
    "source_entity_type_id" UUID    NOT NULL REFERENCES entity_types (id) ON DELETE RESTRICT,
    "target_entity_id"      UUID    NOT NULL REFERENCES entities (id) ON DELETE CASCADE,
    "target_entity_type_id" UUID    NOT NULL REFERENCES entity_types (id) ON DELETE RESTRICT,
    "relationship_field_id" UUID    NOT NULL,
    "deleted"               BOOLEAN NOT NULL         DEFAULT FALSE,
    "deleted_at"            TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    -- Additional metadata about the relationship
    "created_at"            TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at"            TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "created_by"            UUID    REFERENCES users (id) ON DELETE SET NULL,
    "updated_by"            UUID    REFERENCES users (id) ON DELETE SET NULL,

    UNIQUE (source_entity_id, relationship_field_id, target_entity_id)
);

-- Indexes for entity_relationships
CREATE INDEX idx_entity_relationships_source ON entity_relationships (workspace_id, source_entity_id)
    WHERE deleted = false AND deleted_at IS NULL;
CREATE INDEX idx_entity_relationships_target ON entity_relationships (workspace_id, target_entity_id)
    WHERE deleted = false AND deleted_at IS NULL;
CREATE INDEX idx_entity_relationships_target ON entity_relationships (workspace_id, source_entity_type_id)
    WHERE deleted = false AND deleted_at IS NULL;
CREATE INDEX idx_entity_relationships_target ON entity_relationships (workspace_id, target_entity_type_id)
    WHERE deleted = false AND deleted_at IS NULL;



-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- entity_types RLS
ALTER TABLE entity_types
    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "entity_types_select_by_org" ON entity_types
    FOR SELECT TO authenticated
    USING (
    workspace_id IS NULL OR
    workspace_id IN (SELECT workspace_id
                     FROM workspace_members
                     WHERE user_id = auth.uid())
    );

CREATE POLICY "entity_types_write_by_org" ON entity_types
    FOR ALL TO authenticated
    USING (
    workspace_id IN (SELECT workspace_id
                     FROM workspace_members
                     WHERE user_id = auth.uid())
    )
    WITH CHECK (
    workspace_id IN (SELECT workspace_id
                     FROM workspace_members
                     WHERE user_id = auth.uid())
    );

-- entities RLS
ALTER TABLE entities
    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "entities_select_by_org" ON entities
    FOR SELECT TO authenticated
    USING (
    workspace_id IN (SELECT workspace_id
                     FROM workspace_members
                     WHERE user_id = auth.uid())
    );

CREATE POLICY "entities_write_by_org" ON entities
    FOR ALL TO authenticated
    USING (
    workspace_id IN (SELECT workspace_id
                     FROM workspace_members
                     WHERE user_id = auth.uid())
    )
    WITH CHECK (
    workspace_id IN (SELECT workspace_id
                     FROM workspace_members
                     WHERE user_id = auth.uid())
    );

-- entity_relationships RLS
ALTER TABLE entity_relationships
    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "entity_relationships_select_by_org" ON entity_relationships
    FOR SELECT TO authenticated
    USING (
    workspace_id IN (SELECT workspace_id
                     FROM workspace_members
                     WHERE user_id = auth.uid())
    );

CREATE POLICY "entity_relationships_write_by_org" ON entity_relationships
    FOR ALL TO authenticated
    USING (
    workspace_id IN (SELECT workspace_id
                     FROM workspace_members
                     WHERE user_id = auth.uid())
    )
    WITH CHECK (
    workspace_id IN (SELECT workspace_id
                     FROM workspace_members
                     WHERE user_id = auth.uid())
    );


/* Add Workspace Roles to Supabase JWT */
CREATE or replace FUNCTION public.custom_access_token_hook(event jsonb)
    RETURNS jsonb
    LANGUAGE plpgsql
    stable
AS
$$
DECLARE
    claims jsonb;
    _roles jsonb;
BEGIN
    SELECT coalesce(
                   jsonb_agg(jsonb_build_object('workspace_id', workspace_id, 'role', role)),
                   '[]'::jsonb)
    INTO _roles
    FROM public.workspace_members
    WHERE user_id = (event ->> 'user_id')::uuid;
    claims := event -> 'claims';
    claims := jsonb_set(claims, '{roles}', _roles, true);
    event := jsonb_set(event, '{claims}', claims, true);
    RETURN event;
END;
$$;

grant usage on schema public to supabase_auth_admin;

grant execute
    on function public.custom_access_token_hook
    to supabase_auth_admin;
revoke execute
    on function public.custom_access_token_hook
    from authenticated, anon, public;

grant all on table public.workspaces to supabase_auth_admin;
grant all on table public.users to supabase_auth_admin;
grant all on table public.workspace_members to supabase_auth_admin;

create policy "Allow auth admin to read workspace member roles" ON public.workspace_members
    as permissive for select
    to supabase_auth_admin
    using (true);


-- =====================================================
-- WORKFLOW EXECUTION QUEUE
-- =====================================================
-- Execution Queue table for durable workflow request queuing
-- Supports concurrent consumers via FOR UPDATE SKIP LOCKED
CREATE TABLE IF NOT EXISTS public.workflow_execution_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    workflow_definition_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'CLAIMED', 'DISPATCHED', 'FAILED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    claimed_at TIMESTAMPTZ,
    dispatched_at TIMESTAMPTZ,
    input JSONB,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT
);

-- Partial index for efficient queue polling (pending items by age)
CREATE INDEX IF NOT EXISTS idx_execution_queue_pending
    ON workflow_execution_queue (status, created_at)
    WHERE status = 'PENDING';

-- Index for workspace-scoped queries
CREATE INDEX IF NOT EXISTS idx_execution_queue_workspace
    ON workflow_execution_queue (workspace_id, status);

-- =====================================================
-- SHEDLOCK TABLE FOR DISTRIBUTED SCHEDULER LOCKING
-- =====================================================

-- ShedLock table for distributed scheduler locking
-- Ensures scheduled tasks only run on one instance at a time
CREATE TABLE IF NOT EXISTS public.shedlock (
    name VARCHAR(64) PRIMARY KEY,
    lock_until TIMESTAMP(3) NOT NULL,
    locked_at TIMESTAMP(3) NOT NULL,
    locked_by VARCHAR(255) NOT NULL
);


-- =====================================================
-- INTEGRATION DEFINITIONS TABLE
-- =====================================================
-- Global catalog of supported integrations (HubSpot, Salesforce, etc.)
-- No workspace_id - all workspaces read from same catalog
-- No RLS - catalog is globally readable

CREATE TABLE IF NOT EXISTS integration_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    icon_url TEXT,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    nango_provider_key VARCHAR(100) NOT NULL,
    capabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
    sync_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    auth_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_integration_definitions_category ON integration_definitions(category);
CREATE INDEX idx_integration_definitions_active ON integration_definitions(active) WHERE active = true;
CREATE INDEX idx_integration_definitions_slug ON integration_definitions(slug);

-- =====================================================
-- INTEGRATION CONNECTIONS TABLE
-- =====================================================
-- Workspace-scoped connections to integrations
-- One connection per integration per workspace
-- RLS enforces workspace isolation

CREATE TABLE IF NOT EXISTS integration_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    integration_id UUID NOT NULL REFERENCES integration_definitions(id) ON DELETE RESTRICT,
    nango_connection_id TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_AUTHORIZATION',
    connection_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(workspace_id, integration_id)
);

CREATE INDEX idx_integration_connections_workspace ON integration_connections(workspace_id);
CREATE INDEX idx_integration_connections_status ON integration_connections(status);
CREATE INDEX idx_integration_connections_integration ON integration_connections(integration_id);

-- Integration connections RLS
ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integration_connections_select_by_workspace" ON integration_connections
    FOR SELECT TO authenticated
    USING (workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "integration_connections_write_by_workspace" ON integration_connections
    FOR ALL TO authenticated
    USING (workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    ))
    WITH CHECK (workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    ));
