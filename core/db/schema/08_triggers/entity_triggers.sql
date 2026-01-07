-- =====================================================
-- ENTITY TRIGGERS
-- =====================================================

-- =====================================================
-- SYNC ENTITY IDENTIFIER KEY TRIGGER
-- =====================================================

-- Trigger to sync identifier_key changes from entity_types to entities
CREATE TRIGGER trg_sync_entity_identifier_key
    AFTER UPDATE OF identifier_key
    ON entity_types
    FOR EACH ROW
EXECUTE FUNCTION sync_entity_identifier_key();

-- =====================================================
-- UPDATE ENTITY TYPE COUNT TRIGGER
-- =====================================================

-- Trigger for INSERT, UPDATE (of deleted field), and DELETE on entities
CREATE OR REPLACE TRIGGER trg_update_entity_type_count
    AFTER INSERT OR UPDATE OF deleted OR DELETE
    ON public.entities
    FOR EACH ROW
EXECUTE FUNCTION public.update_entity_type_count();
