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
-- Note: slug index is provided by the UNIQUE constraint, no explicit index needed

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_integration_definitions_updated_at
    BEFORE UPDATE ON integration_definitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
