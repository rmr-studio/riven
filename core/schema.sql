begin;
create extension if not exists "uuid-ossp";
commit;

-- Organisations
CREATE TABLE IF NOT EXISTS "organisations"
(
    "id"               UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
    "name"             VARCHAR(100)     NOT NULL UNIQUE,
    "plan"             VARCHAR          NOT NULL DEFAULT 'FREE' CHECK (plan IN ('FREE', 'STARTUP', 'SCALE', 'ENTERPRISE')),
    "default_currency" VARCHAR(3)       NOT NULL DEFAULT 'AUD',
    "address"          jsonb,
    "avatar_url"       TEXT,
    "business_number"  TEXT,
    "tax_id"           TEXT,
    "payment_details"  jsonb,
    "member_count"     INTEGER          NOT NULL DEFAULT 0,
    "created_at"       TIMESTAMP WITH TIME ZONE  DEFAULT CURRENT_TIMESTAMP,
    "updated_at"       TIMESTAMP WITH TIME ZONE  DEFAULT CURRENT_TIMESTAMP,
    "created_by"       UUID,
    "updated_by"       UUID
);

CREATE TABLE IF NOT EXISTS "organisation_members"
(
    "id"              UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
    "organisation_id" UUID             NOT NULL REFERENCES organisations (id) ON DELETE CASCADE,
    "user_id"         UUID             NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    "role"            VARCHAR          NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
    "member_since"    TIMESTAMP WITH TIME ZONE  DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.organisation_members
    ADD CONSTRAINT ux_organisation_user UNIQUE (organisation_id, user_id);

CREATE INDEX idx_organisation_members_user_id
    ON public.organisation_members (user_id);



-- Function to update member count
CREATE OR REPLACE FUNCTION public.update_org_member_count()
    RETURNS TRIGGER AS
$$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Increment member count on INSERT
        UPDATE public.organisations
        SET member_count = member_count + 1,
            updated_at   = now()
        WHERE id = NEW.organisation_id;
    ELSIF (TG_OP = 'DELETE') THEN
        -- Decrement member count on DELETE
        UPDATE public.organisations
        SET member_count = member_count - 1,
            updated_at   = now()
        WHERE id = OLD.organisation_id;
    END IF;

    RETURN NULL; -- Triggers on INSERT/DELETE do not modify the rows
END;
$$ LANGUAGE plpgsql;

-- Trigger for INSERT and DELETE on org_member
CREATE or replace TRIGGER trg_update_org_member_count
    AFTER INSERT OR DELETE
    ON public.organisation_members
    FOR EACH ROW
EXECUTE FUNCTION public.update_org_member_count();

ALTER TABLE ORGANISATIONS
    ENABLE ROW LEVEL SECURITY;

/* Add restrictions to ensure that only organisation members can view their organisation*/
CREATE POLICY "Users can view their own organisations" on organisations
    FOR SELECT
    TO authenticated
    USING (
    id IN (SELECT organisation_id
           FROM organisation_members
           WHERE user_id = auth.uid())
    );

CREATE TABLE IF NOT EXISTS "organisation_invites"
(
    "id"              UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
    "organisation_id" UUID             NOT NULL REFERENCES organisations (id) ON DELETE CASCADE,
    "email"           VARCHAR(100)     NOT NULL,
    "status"          VARCHAR(100)     NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED')),
    "invite_code"     VARCHAR(12)      NOT NULL CHECK (LENGTH(invite_code) = 12),
    "role"            VARCHAR          NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
    "invited_by"      UUID             NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    "created_at"      TIMESTAMP WITH TIME ZONE  DEFAULT CURRENT_TIMESTAMP,
    "expires_at"      TIMESTAMP WITH TIME ZONE  DEFAULT CURRENT_TIMESTAMP + INTERVAL '1 days'
);

CREATE INDEX idx_invite_organisation_id ON public.organisation_invites (organisation_id);
CREATE INDEX idx_invite_email ON public.organisation_invites (email);
CREATE INDEX idx_invite_token ON public.organisation_invites (invite_code);

alter table organisation_invites
    add constraint uq_invite_code unique (invite_code);

-- Users
drop table if exists "users" cascade;
create table if not exists "users"
(
    "id"                      uuid primary key not null default uuid_generate_v4(),
    "name"                    varchar(50)      not null,
    "email"                   varchar(100)     not null unique,
    "phone"                   varchar(15)      null,
    "avatar_url"              TEXT,
    "default_organisation_id" UUID             references public.organisations (id) ON DELETE SET NULL,
    "created_at"              timestamp with time zone  default current_timestamp,
    "updated_at"              timestamp with time zone  default current_timestamp
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
    "organisation_id"   uuid  REFERENCES organisations (id) ON DELETE SET NULL,                                     -- null for global
    "nesting"           jsonb,                                                                                      -- options for storing blocks within this block. Null indicates no children allowed
    "system"            boolean                  DEFAULT FALSE,                                                     -- system types you control
    "schema"            jsonb NOT NULL,                                                                             -- JSON Schema for validation
    "display_structure" jsonb not NULL,                                                                             -- UI metadata for frontend display (ie. Form Structure, Display Component Rendering, etc)
    "strictness"        text  NOT NULL           default 'soft' check ( strictness in ('none', 'soft', 'strict') ), -- how strictly to enforce schema (none, soft (warn), strict (reject))
    "version"           integer                  DEFAULT 1,                                                         -- To handle updates to schema/display_structure over time to ensure that existing blocks are not broken,
    "archived"          boolean                  DEFAULT FALSE,                                                     -- soft delete
    "created_at"        timestamp with time zone default current_timestamp,
    "updated_at"        timestamp with time zone default current_timestamp,
    "created_by"        uuid,                                                                                       -- optional user id
    "updated_by"        uuid,                                                                                       -- optional user id
    UNIQUE (organisation_id, key, version)
);

-- System types (your pre-generated defaults) are the ONLY rows without an org_id
ALTER TABLE block_types
    ADD CONSTRAINT chk_system_org
        CHECK (
            (system = true AND organisation_id IS NULL) OR
            (system = false AND organisation_id IS NOT NULL)
            );

create index idx_block_types_organisation_id on block_types (organisation_id);
create index idx_block_types_key on block_types (key);

ALTER TABLE block_types
    ADD CONSTRAINT chk_key_slug
        CHECK (key ~ '^[a-z0-9][a-z0-9._-]{1,62}$');

-- Tenant isolation (Supabase RLS)
ALTER TABLE public.block_types
    ENABLE ROW LEVEL SECURITY;
CREATE POLICY "block_types_select_by_org" ON public.block_types
    FOR SELECT TO authenticated
    USING (organisation_id IS NULL OR organisation_id IN (SELECT organisation_id
                                                          FROM public.organisation_members
                                                          WHERE user_id = auth.uid()));
CREATE POLICY "block_types_write_by_org" ON public.block_types
    FOR ALL TO authenticated
    USING (organisation_id IN (SELECT organisation_id
                               FROM public.organisation_members
                               WHERE user_id = auth.uid()))
    WITH CHECK (organisation_id IN (SELECT organisation_id
                                    FROM public.organisation_members
                                    WHERE user_id = auth.uid()));
-- Blocks: first-class rows, tenant-scoped
create table if not exists public.blocks
(
    "id"              uuid PRIMARY KEY         DEFAULT uuid_generate_v4(),
    "organisation_id" uuid REFERENCES organisations (id) NOT NULL,
    "type_id"         uuid REFERENCES block_types (id)   NOT NULL, -- true if payload contains references to another block/entities
    "name"            text,                                        -- human-friendly title
    "payload"         jsonb                    DEFAULT '{}',       -- flexible content
    "archived"        boolean                  DEFAULT false,      -- archives
    "created_by"      uuid                               references public.users (id) ON DELETE SET NULL,
    "updated_by"      uuid                               references public.users (id) ON DELETE SET NULL,
    "created_at"      TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updated_at"      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blocks_org ON public.blocks (organisation_id);
CREATE INDEX IF NOT EXISTS idx_blocks_type ON public.blocks (type_id);
CREATE INDEX IF NOT EXISTS idx_blocks_archived ON public.blocks (archived);

-- RLS
ALTER TABLE public.blocks
    ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocks_select_by_org" ON public.blocks
    FOR SELECT TO authenticated
    USING (organisation_id IN (SELECT organisation_id
                               FROM public.organisation_members
                               WHERE user_id = auth.uid()));
CREATE POLICY "blocks_write_by_org" ON public.blocks
    FOR ALL TO authenticated
    USING (organisation_id IN (SELECT organisation_id
                               FROM public.organisation_members
                               WHERE user_id = auth.uid()))
    WITH CHECK (organisation_id IN (SELECT organisation_id
                                    FROM public.organisation_members
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
    id              uuid primary key         default uuid_generate_v4(),
    organisation_id uuid    not null references organisations (id) on delete cascade,
    layout          jsonb   not null,
    version         integer not null         default 1, -- id of client, line item, etc,
    entity_id       uuid    not null references public.entities (id) on delete cascade,
    created_at      timestamp with time zone default current_timestamp,
    updated_at      timestamp with time zone default current_timestamp,
    "created_by"    uuid    references public.users (id) ON DELETE SET NULL,
    "updated_by"    uuid    references public.users (id) ON DELETE SET NULL
);

create index if not exists idx_block_tree_layouts_entity_id
    on public.block_tree_layouts (entity_id);

create index if not exists idx_block_tree_layouts_organisation_id
    on public.block_tree_layouts (organisation_id);

create table if not exists "activity_logs"
(
    "id"              uuid primary key         not null default uuid_generate_v4(),
    "activity"        varchar(100)             not null,
    "operation"       varchar(10)              not null check (operation in
                                                               ('CREATE', 'UPDATE', 'DELETE', 'READ', 'ARCHIVE',
                                                                'RESTORE')),
    "organisation_id" uuid                     not null references public.organisations (id) on delete cascade,
    "user_id"         uuid                     references public.users (id) on delete set null,
    "entity_type"     varchar(50)              not null,
    "entity_id"       uuid,
    "details"         JSONB                    not null default '{}'::jsonb,
    "timestamp"       timestamp with time zone not null default current_timestamp
);

create index if not exists idx_activity_logs_organisation_id
    on public.activity_logs (organisation_id);

create index if not exists idx_activity_logs_user_id
    on public.activity_logs (user_id);

CREATE TABLE IF NOT EXISTS public.entity_types
(
    "id"                    UUID PRIMARY KEY         DEFAULT uuid_generate_v4(),
    "key"                   TEXT    NOT NULL,
    "type"                  TEXT    NOT NULL CHECK (type IN ('STANDARD', 'RELATIONSHIP')),
    "organisation_id"       UUID REFERENCES organisations (id) ON DELETE CASCADE,
    "identifier_key"        UUID    NOT NULL,
    "display_name_singular" TEXT    NOT NULL,
    "display_name_plural"   TEXT    NOT NULL,
    "icon_type"             TEXT    NOT NULL         DEFAULT 'CIRCLE_DASHED', -- Lucide Icon Representation,
    "icon_colour"           TEXT    NOT NULL         DEFAULT 'NEUTRAL',       -- Colour of the icon,
    "description"           TEXT,
    "protected"             BOOLEAN NOT NULL         DEFAULT FALSE,
    "schema"                JSONB   NOT NULL,
    "column_order"          JSONB,
    -- Denormalized count of entities of this type for faster access
    "count"                 INTEGER NOT NULL         DEFAULT 0,
    "relationships"         JSONB,
    "version"               INTEGER NOT NULL         DEFAULT 1,
    "archived"              BOOLEAN NOT NULL         DEFAULT FALSE,
    "created_at"            TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at"            TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "created_by"            UUID,
    "updated_by"            UUID,
    "deleted_at"            TIMESTAMP WITH TIME ZONE DEFAULT NULL,

    -- Single row per entity type (mutable pattern)
    -- Also creates an index on organisation_id + key for faster lookups
    UNIQUE (organisation_id, key),

    -- Relationship entities must have relationship_config
    CHECK (
        (type = 'RELATIONSHIP' AND relationships IS NOT NULL) OR
        (type = 'STANDARD' AND relationships IS NULL)
        )
);

create index if not exists idx_entity_types_organisation_id
    on entity_types (organisation_id)
    where archived = false;

-- =====================================================
-- 2. ENTITIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.entities
(
    "id"              UUID PRIMARY KEY         DEFAULT uuid_generate_v4(),
    "organisation_id" UUID    NOT NULL REFERENCES organisations (id) ON DELETE CASCADE,
    "type_id"         UUID    NOT NULL REFERENCES entity_types (id) ON DELETE RESTRICT,
    "name"            TEXT,
    "archived"        BOOLEAN NOT NULL         DEFAULT FALSE,
    -- Duplicate key from entity_type for faster lookups without needing separate query
    "identifier_key"  UUID    NOT NULL,
    "payload"         JSONB   NOT NULL         DEFAULT '{}'::jsonb,
    "icon_type"       TEXT    NOT NULL         DEFAULT 'FILE',    -- Lucide Icon Representation,
    "icon_colour"     TEXT    NOT NULL         DEFAULT 'NEUTRAL', --
    "created_at"      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "created_by"      UUID    REFERENCES users (id) ON DELETE SET NULL,
    "updated_by"      UUID    REFERENCES users (id) ON DELETE SET NULL,
    "deleted_at"      TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

create index if not exists idx_entities_organisation_id_type_id
    on entities (organisation_id, type_id)
    where archived = false;


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

-- Indexes for entities
drop index if exists idx_entities_organisation_id;



CREATE INDEX idx_entities_payload_gin ON entities USING GIN (payload jsonb_path_ops);

-- Function to update entity count in entity_types
CREATE OR REPLACE FUNCTION public.update_entity_type_count()
    RETURNS TRIGGER AS
$$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Increment entity count on INSERT
        UPDATE public.entity_types
        SET count      = count + 1,
            updated_at = now()
        WHERE id = NEW.type_id;
    ELSIF (TG_OP = 'DELETE') THEN
        -- Decrement entity count on DELETE
        UPDATE public.entity_types
        SET count      = count - 1,
            updated_at = now()
        WHERE id = OLD.type_id;
    END IF;

    RETURN NULL; -- Triggers on INSERT/DELETE do not modify the rows
END;
$$ LANGUAGE plpgsql;

-- Trigger for INSERT and DELETE on entities
CREATE OR REPLACE TRIGGER trg_update_entity_type_count
    AFTER INSERT OR DELETE
    ON public.entities
    FOR EACH ROW
EXECUTE FUNCTION public.update_entity_type_count();

CREATE INDEX idx_archived_entities_organisation_id ON archived_entities (organisation_id);
CREATE INDEX idx_archived_entities_type_id ON archived_entities (type_id);

-- =====================================================
-- 3. ENTITY_RELATIONSHIPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.entity_relationships
(
    "id"               UUID PRIMARY KEY         DEFAULT uuid_generate_v4(),
    "organisation_id"  UUID NOT NULL REFERENCES organisations (id) ON DELETE CASCADE,
    "source_entity_id" UUID NOT NULL REFERENCES entities (id) ON DELETE CASCADE,
    "target_entity_id" UUID NOT NULL REFERENCES entities (id) ON DELETE CASCADE,
    "key"              TEXT NOT NULL,
    "label"            TEXT,
    "created_at"       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at"       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "created_by"       UUID REFERENCES users (id) ON DELETE SET NULL,
    "updated_by"       UUID REFERENCES users (id) ON DELETE SET NULL,

    -- Prevent duplicate relationships
    UNIQUE (source_entity_id, target_entity_id, key)
);

-- Indexes for entity_relationships
CREATE INDEX idx_entity_relationships_source_key ON entity_relationships (source_entity_id, key);
CREATE INDEX idx_entity_relationships_target ON entity_relationships (target_entity_id);
CREATE INDEX idx_entity_relationships_organisation ON entity_relationships (organisation_id);

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- entity_types RLS
ALTER TABLE entity_types
    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "entity_types_select_by_org" ON entity_types
    FOR SELECT TO authenticated
    USING (
    organisation_id IS NULL OR
    organisation_id IN (SELECT organisation_id
                        FROM organisation_members
                        WHERE user_id = auth.uid())
    );

CREATE POLICY "entity_types_write_by_org" ON entity_types
    FOR ALL TO authenticated
    USING (
    organisation_id IN (SELECT organisation_id
                        FROM organisation_members
                        WHERE user_id = auth.uid())
    )
    WITH CHECK (
    organisation_id IN (SELECT organisation_id
                        FROM organisation_members
                        WHERE user_id = auth.uid())
    );

-- entities RLS
ALTER TABLE entities
    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "entities_select_by_org" ON entities
    FOR SELECT TO authenticated
    USING (
    organisation_id IN (SELECT organisation_id
                        FROM organisation_members
                        WHERE user_id = auth.uid())
    );

CREATE POLICY "entities_write_by_org" ON entities
    FOR ALL TO authenticated
    USING (
    organisation_id IN (SELECT organisation_id
                        FROM organisation_members
                        WHERE user_id = auth.uid())
    )
    WITH CHECK (
    organisation_id IN (SELECT organisation_id
                        FROM organisation_members
                        WHERE user_id = auth.uid())
    );

-- entity_relationships RLS
ALTER TABLE entity_relationships
    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "entity_relationships_select_by_org" ON entity_relationships
    FOR SELECT TO authenticated
    USING (
    organisation_id IN (SELECT organisation_id
                        FROM organisation_members
                        WHERE user_id = auth.uid())
    );

CREATE POLICY "entity_relationships_write_by_org" ON entity_relationships
    FOR ALL TO authenticated
    USING (
    organisation_id IN (SELECT organisation_id
                        FROM organisation_members
                        WHERE user_id = auth.uid())
    )
    WITH CHECK (
    organisation_id IN (SELECT organisation_id
                        FROM organisation_members
                        WHERE user_id = auth.uid())
    );


/* Add Organisation Roles to Supabase JWT */
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
                   jsonb_agg(jsonb_build_object('organisation_id', organisation_id, 'role', role)),
                   '[]'::jsonb)
    INTO _roles
    FROM public.organisation_members
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

grant all on table public.organisations to supabase_auth_admin;
grant all on table public.users to supabase_auth_admin;
grant all on table public.organisation_members to supabase_auth_admin;

create policy "Allow auth admin to read organisation member roles" ON public.organisation_members
    as permissive for select
    to supabase_auth_admin
    using (true);

