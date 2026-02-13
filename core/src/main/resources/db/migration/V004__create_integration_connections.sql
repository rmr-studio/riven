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

-- =====================================================
-- RLS POLICIES
-- =====================================================
-- Workspace-scoped access (matches existing entity pattern)

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

-- =====================================================
-- FOREIGN KEY CONSTRAINTS FOR PROVENANCE
-- =====================================================
-- Add FK constraints from existing provenance columns to integration_definitions
-- These columns were added in previous migrations but couldn't be constrained
-- until integration_definitions table existed

-- Add FK from entity_attribute_provenance.source_integration_id to integration_definitions
ALTER TABLE entity_attribute_provenance
    ADD CONSTRAINT fk_provenance_integration
    FOREIGN KEY (source_integration_id) REFERENCES integration_definitions(id) ON DELETE SET NULL;

-- Add FK from entities.source_integration_id to integration_definitions
ALTER TABLE entities
    ADD CONSTRAINT fk_entities_source_integration
    FOREIGN KEY (source_integration_id) REFERENCES integration_definitions(id) ON DELETE SET NULL;
