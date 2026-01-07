DROP INDEX IF EXISTS uq_unique_attribute_per_type;
CREATE UNIQUE INDEX uq_unique_attribute_per_type
    ON public.entities_unique_values (type_id, field_id, field_value)
    WHERE deleted = FALSE AND deleted_at IS NULL;

ALTER TABLE public.entity_relationships
    drop constraint IF EXISTS uq_relationship_source_target_field;

ALTER TABLE public.entity_relationships
    ADD CONSTRAINT uq_relationship_source_target_field UNIQUE (source_entity_id, relationship_field_id, target_entity_id)