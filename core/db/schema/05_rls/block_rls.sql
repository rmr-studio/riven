-- =====================================================
-- BLOCK ROW LEVEL SECURITY POLICIES
-- =====================================================

-- =====================================================
-- BLOCK TYPES RLS
-- =====================================================

-- Enable RLS on block_types
ALTER TABLE public.block_types
    ENABLE ROW LEVEL SECURITY;

-- Block types can be selected by workspace members or if system (workspace_id IS NULL)
CREATE POLICY "block_types_select_by_org" ON public.block_types
    FOR SELECT TO authenticated
    USING (workspace_id IS NULL OR workspace_id IN (SELECT workspace_id
                                                    FROM public.workspace_members
                                                    WHERE user_id = auth.uid()));

-- Block types can be written by workspace members
CREATE POLICY "block_types_write_by_org" ON public.block_types
    FOR ALL TO authenticated
    USING (workspace_id IN (SELECT workspace_id
                            FROM public.workspace_members
                            WHERE user_id = auth.uid()))
    WITH CHECK (workspace_id IN (SELECT workspace_id
                                 FROM public.workspace_members
                                 WHERE user_id = auth.uid()));

-- =====================================================
-- BLOCKS RLS
-- =====================================================

-- Enable RLS on blocks
ALTER TABLE public.blocks
    ENABLE ROW LEVEL SECURITY;

-- Blocks can be selected by workspace members
CREATE POLICY "blocks_select_by_org" ON public.blocks
    FOR SELECT TO authenticated
    USING (workspace_id IN (SELECT workspace_id
                            FROM public.workspace_members
                            WHERE user_id = auth.uid()));

-- Blocks can be written by workspace members
CREATE POLICY "blocks_write_by_org" ON public.blocks
    FOR ALL TO authenticated
    USING (workspace_id IN (SELECT workspace_id
                            FROM public.workspace_members
                            WHERE user_id = auth.uid()))
    WITH CHECK (workspace_id IN (SELECT workspace_id
                                 FROM public.workspace_members
                                 WHERE user_id = auth.uid()));
