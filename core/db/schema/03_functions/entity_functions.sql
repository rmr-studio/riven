-- =====================================================
-- ENTITY FUNCTIONS
-- =====================================================

-- =====================================================
-- SYNC ENTITY IDENTIFIER KEY
-- =====================================================

-- Function to sync identifier_key from entity_types to entities when it changes
CREATE OR REPLACE FUNCTION sync_entity_identifier_key()
    RETURNS TRIGGER AS
$$
BEGIN
    -- Only act when identifier_key has changed
    IF NEW.identifier_key IS DISTINCT FROM OLD.identifier_key THEN
        UPDATE entities
        SET identifier_key = NEW.identifier_key
        WHERE type_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- UPDATE ENTITY TYPE COUNT
-- =====================================================

-- Function to update entity count in entity_types
-- Handles soft deletion via 'deleted' field:
-- - INSERT: increment count (only if not deleted)
-- - UPDATE: decrement on delete, increment on restore
-- - DELETE: decrement only if not already deleted (avoid double-decrement)
CREATE OR REPLACE FUNCTION public.update_entity_type_count()
    RETURNS TRIGGER AS
$$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Increment entity count on INSERT (only if not deleted)
        IF NEW.deleted = FALSE THEN
            UPDATE public.entity_types
            SET count      = count + 1,
                updated_at = NOW()
            WHERE id = NEW.type_id;
        END IF;

    ELSIF (TG_OP = 'UPDATE') THEN
        -- Handle archive status changes
        IF OLD.deleted = FALSE AND NEW.deleted = TRUE THEN
            -- Entity is being deleted: decrement count
            UPDATE public.entity_types
            SET count      = count - 1,
                updated_at = NOW()
            WHERE id = NEW.type_id;

        ELSIF OLD.deleted = TRUE AND NEW.deleted = FALSE THEN
            -- Entity is being restored: increment count
            UPDATE public.entity_types
            SET count      = count + 1,
                updated_at = NOW()
            WHERE id = NEW.type_id;
        END IF;

    ELSIF (TG_OP = 'DELETE') THEN
        -- Decrement entity count on DELETE (only if not already deleted)
        -- If deleted, the count was already decremented during archiving
        IF OLD.deleted = FALSE THEN
            UPDATE public.entity_types
            SET count      = count - 1,
                updated_at = NOW()
            WHERE id = OLD.type_id;
        END IF;
    END IF;

    RETURN NULL; -- Triggers on INSERT/UPDATE/DELETE do not modify the rows
END;
$$ LANGUAGE plpgsql;
