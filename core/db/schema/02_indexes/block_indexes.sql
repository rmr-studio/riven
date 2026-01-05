-- =====================================================
-- BLOCK INDEXES
-- =====================================================

-- Block Types Indexes
DROP INDEX IF EXISTS idx_block_types_workspace_id;
CREATE INDEX IF NOT EXISTS idx_block_types_workspace_id
    ON block_types (workspace_id)
    WHERE deleted = FALSE;

DROP INDEX IF EXISTS idx_block_types_key;
CREATE INDEX IF NOT EXISTS idx_block_types_key
    ON block_types (workspace_id, key)
    WHERE deleted = FALSE;

-- Blocks Indexes
DROP INDEX IF EXISTS idx_blocks_workspace_type;
CREATE INDEX IF NOT EXISTS idx_blocks_workspace_type
    ON public.blocks (workspace_id, type_id)
    WHERE deleted = FALSE;


-- Block Children Indexes
DROP INDEX IF EXISTS idx_block_children_workspace_parent;
CREATE INDEX IF NOT EXISTS idx_block_children_workspace_parent
    ON block_children (workspace_id, parent_id);

DROP INDEX IF EXISTS idx_block_children_workspace_child;
CREATE INDEX IF NOT EXISTS idx_block_children_workspace_child
    ON public.block_children (workspace_id, child_id);

-- Block Tree Layouts Indexes
DROP INDEX IF EXISTS idx_block_tree_layouts_workspace_entity;
CREATE INDEX IF NOT EXISTS idx_block_tree_layouts_workspace_entity
    ON public.block_tree_layouts (workspace_id, entity_id);
