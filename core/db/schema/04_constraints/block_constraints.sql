-- =====================================================
-- BLOCK CONSTRAINTS
-- =====================================================

-- System types (your pre-generated defaults) are the ONLY rows without a workspace_id
ALTER TABLE block_types
    ADD CONSTRAINT chk_system_org
        CHECK (
            (system = TRUE AND workspace_id IS NULL) OR
            (system = FALSE AND workspace_id IS NOT NULL)
            );

-- A block can only be the child of a singular parent block
-- Ensure no blocks are shared when looking at direct children
ALTER TABLE public.block_children
    ADD CONSTRAINT uq_block_child UNIQUE (child_id);

-- Ensure unique order_index within parent
ALTER TABLE public.block_children
    ADD CONSTRAINT uq_parent_order_index UNIQUE (parent_id, order_index);
