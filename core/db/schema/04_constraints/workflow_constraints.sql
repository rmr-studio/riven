ALTER TABLE PUBLIC.workflow_nodes
    ADD CONSTRAINT uq_workflow_nodes_workspace_key_version UNIQUE (workspace_id, key, version)