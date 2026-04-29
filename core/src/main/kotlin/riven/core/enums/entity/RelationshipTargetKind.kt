package riven.core.enums.entity

/**
 * Kind of target a relationship row points at.
 *
 * Default targets are entity instances ([ENTITY]). Knowledge-domain edges (e.g. glossary
 * `DEFINES`) may point at structural objects rather than data rows: an entity type
 * ([ENTITY_TYPE]) or a single attribute of an entity type ([ATTRIBUTE]).
 *
 * Phase B (Note Graduation) declares the enum; the corresponding `entity_relationships.target_kind`
 * column is added by Phase C (Glossary Graduation, Task 16). Until Phase C lands, only [ENTITY]
 * is materialised — non-ENTITY values pass through the abstract ingestion base for forward-compat
 * but are not yet persisted.
 */
enum class RelationshipTargetKind {
    ENTITY,
    ENTITY_TYPE,
    ATTRIBUTE,
}
