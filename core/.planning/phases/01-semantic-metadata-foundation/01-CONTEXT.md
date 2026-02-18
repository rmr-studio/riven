# Phase 1: Semantic Metadata Foundation - Context

**Gathered:** 2026-02-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Extend entity types, attributes, and relationships with user-editable semantic metadata fields (definitions, classifications, descriptions, tags) and expose CRUD API endpoints. Metadata is stored in a separate table from entity_types. Templates, enrichment, and embedding are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Metadata richness
- Core fields as defined in success criteria: semantic definition (entity types), semantic type classification + description (attributes), semantic context (relationships)
- Add tags/keywords as a shared extra field across all three metadata targets (entity types, attributes, relationships)
- Tags are free-form string arrays — no workspace-level vocabulary management in this phase
- All three targets share the same field set (definition/description + tags) — one metadata shape, not tailored per target

### API response shape
- Semantic metadata is NOT inline in entity type responses by default
- Available via `?include=semantics` query parameter on entity type endpoints — opt-in
- Dedicated endpoints live under a new `KnowledgeController` at `/api/v1/knowledge/...`, not as sub-routes on existing controllers
- Metadata updates use full replacement (PUT), not partial updates (PATCH)
- Provide both individual and bulk endpoints — bulk endpoint for setting metadata on multiple attributes at once (needed for template installation in Phase 2)

### Classification system
- Strict enum with 6 predefined values only: `identifier`, `categorical`, `quantitative`, `temporal`, `freetext`, `relational_reference`
- API rejects unknown classification values with 400
- Classification is optional (nullable) — users can set description/tags first and classify later
- No endpoint to list valid classification values — clients hardcode the enum

### Metadata lifecycle
- Auto-create empty metadata records when entity types, attributes, or relationships are created — guarantees 1:1 relationship
- Cascade soft-delete metadata when parent entity type is soft-deleted — restoring entity type restores metadata
- Hard-delete attribute/relationship metadata when the attribute or relationship is removed — no orphans
- Skip activity logging for metadata mutations — metadata edits are frequent during setup and low-impact

### Claude's Discretion
- Database table structure (single table vs multiple, column types, indexes)
- JPA entity design and mapping approach
- Endpoint URL structure within `/api/v1/knowledge/`
- Error response format for validation failures
- How `?include=semantics` is implemented (join fetch, separate query, etc.)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches that follow the existing codebase patterns.

</specifics>

<deferred>
## Deferred Ideas

- Custom/extensible classification values beyond the predefined 6 — revisit if users need domain-specific types
- Tag vocabulary management (workspace-level tag lists, autocomplete, deduplication) — future phase
- Activity logging for metadata mutations — reconsider when usage patterns are clearer

</deferred>

---

*Phase: 01-semantic-metadata-foundation*
*Context gathered: 2026-02-18*
