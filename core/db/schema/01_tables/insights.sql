-- =====================================================
-- INSIGHTS CHAT TABLES
-- =====================================================
-- Multi-turn AI chat sessions and messages used by the Insights demo.
-- Sessions are workspace-scoped. Messages cascade-delete when a session is hard-deleted,
-- but soft-delete is the standard lifecycle.
--
-- Demo seeding: each session may seed a set of demo entities/clusters tagged via
-- demo_session_id on those tables, so cleanup can remove only the seeded rows.

CREATE TABLE IF NOT EXISTS public.insights_chat_sessions
(
    "id"                 UUID PRIMARY KEY         DEFAULT uuid_generate_v4(),
    "workspace_id"       UUID         NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
    "title"              VARCHAR(255),
    "demo_pool_seeded"   BOOLEAN      NOT NULL    DEFAULT FALSE,
    "last_message_at"    TIMESTAMP WITH TIME ZONE,

    "created_by"         UUID         REFERENCES public.users (id) ON DELETE SET NULL,
    "updated_by"         UUID         REFERENCES public.users (id) ON DELETE SET NULL,
    "created_at"         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at"         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    "deleted"            BOOLEAN      NOT NULL    DEFAULT FALSE,
    "deleted_at"         TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS public.insights_messages
(
    "id"            UUID PRIMARY KEY         DEFAULT uuid_generate_v4(),
    "session_id"    UUID        NOT NULL REFERENCES public.insights_chat_sessions (id) ON DELETE CASCADE,
    "role"          VARCHAR(16) NOT NULL,
    "content"       TEXT        NOT NULL,
    "citations"     JSONB       NOT NULL DEFAULT '[]'::jsonb,
    "token_usage"   JSONB,

    "created_by"    UUID        REFERENCES public.users (id) ON DELETE SET NULL,
    "updated_by"    UUID        REFERENCES public.users (id) ON DELETE SET NULL,
    "created_at"    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at"    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    "deleted"       BOOLEAN     NOT NULL DEFAULT FALSE,
    "deleted_at"    TIMESTAMP WITH TIME ZONE DEFAULT NULL
);
