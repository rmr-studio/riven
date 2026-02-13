-- =====================================================
-- INTEGRATION DEFINITIONS INDEXES
-- =====================================================

CREATE INDEX idx_integration_definitions_category ON integration_definitions(category);
CREATE INDEX idx_integration_definitions_active ON integration_definitions(active) WHERE active = true;
CREATE INDEX idx_integration_definitions_slug ON integration_definitions(slug);

-- =====================================================
-- INTEGRATION CONNECTIONS INDEXES
-- =====================================================

CREATE INDEX idx_integration_connections_workspace ON integration_connections(workspace_id);
CREATE INDEX idx_integration_connections_status ON integration_connections(status);
CREATE INDEX idx_integration_connections_integration ON integration_connections(integration_id);
