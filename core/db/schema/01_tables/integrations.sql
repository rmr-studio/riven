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
