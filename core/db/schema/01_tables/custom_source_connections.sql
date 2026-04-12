-- =====================================================
-- CUSTOM SOURCE CONNECTIONS TABLE
-- =====================================================
-- Workspace-scoped connections to user-defined external data sources
-- (e.g. Postgres read-replicas). Credentials are AES-256-GCM encrypted
-- and stored as raw bytea alongside their IV + key version.
--
-- Phase 2 CONN-01. Sibling to integration_connections (Nango-backed),
-- distinct because custom sources carry encrypted credentials + readonly
-- verification metadata rather than a Nango connection id.

CREATE TABLE IF NOT EXISTS custom_source_connections (
    id                    UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    workspace_id          UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name                  VARCHAR(255) NOT NULL,
    connection_status     VARCHAR(50) NOT NULL DEFAULT 'CONNECTED',
    encrypted_credentials BYTEA NOT NULL,
    iv                    BYTEA NOT NULL,
    key_version           INTEGER NOT NULL DEFAULT 1,
    last_verified_at      TIMESTAMPTZ,
    last_failure_reason   VARCHAR(1000),

    -- audit cols (match AuditableEntity)
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by            UUID,
    updated_by            UUID,

    -- soft-delete cols (match SoftDeletable / AuditableSoftDeletableEntity)
    deleted               BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at            TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_custom_source_connections_workspace_id
    ON custom_source_connections(workspace_id) WHERE deleted = FALSE;
