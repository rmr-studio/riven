package riven.core.enums.entity

/**
 * Classification of a semantic attribute, describing the business role it plays.
 *
 * Constant names are **lowercase** to match the API wire format exactly. Jackson
 * requires exact case matching (ACCEPT_CASE_INSENSITIVE_ENUMS is not enabled).
 *
 * - identifier: uniquely identifies an entity (e.g. email, employee ID)
 * - categorical: groups entities into discrete categories (e.g. industry, status)
 * - quantitative: numeric measurement (e.g. revenue, salary, age)
 * - temporal: date or time value (e.g. created_at, founded_year)
 * - freetext: unstructured text (e.g. description, notes)
 * - relational_reference: a foreign-key-like reference to another entity
 */
@Suppress("EnumEntryName")
enum class SemanticAttributeClassification {
    identifier,
    categorical,
    quantitative,
    temporal,
    freetext,
    relational_reference
}
