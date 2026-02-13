# Phase 1: Foundation Infrastructure - Context

**Gathered:** 2026-02-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Data model, registry, and API exposure for workflow node output metadata. This phase creates the infrastructure so nodes can declare what they output and the frontend can discover it via the existing node-schemas endpoint. No node implementations are changed beyond what's needed to validate the infrastructure works.

</domain>

<decisions>
## Implementation Decisions

### Output field modeling
- MAP and OBJECT types stay opaque — no inner schema/child definitions
- Add ENTITY and ENTITY_LIST as first-class OutputFieldType values, with an entityTypeId property on WorkflowNodeOutputField for entity type reference
- Entity type is dynamic (depends on node config) — outputMetadata declares type as ENTITY/ENTITY_LIST with entityType marked as "dynamic"; frontend resolves the actual entity type from the node's configuration at render time
- exampleValue on ALL field types, including JSON snippets for complex types (MAP, OBJECT, ENTITY)
- nullable defaults to false — only declare nullable=true when a field can actually be null
- outputMetadata is an ordered List<WorkflowNodeOutputField> — declaration order is display order for the frontend
- description is optional (nullable) — only provide when the field name isn't self-explanatory
- label is required — every field must have a human-readable display name

### Registry extraction
- outputMetadata follows the same companion object pattern as metadata and configSchema — standard companion property extracted via reflection
- outputMetadata is optional during rollout — registry returns null for nodes that haven't declared it yet (Phase 3 fills in the rest)
- Registry caches extracted outputMetadata at startup alongside other metadata
- If reflection fails to find outputMetadata on a companion, log a warning and continue — don't fail app startup

### API response shape
- outputMetadata is a sibling field alongside metadata and configSchema in the node-schemas endpoint response
- Nodes without outputMetadata return outputMetadata: null (field present but null, not omitted)
- Entity references return entityTypeId only (UUID) — frontend resolves the name from its own entity type cache

### Validation strategy
- Tests validate keys AND types — check that declared OutputFieldType matches the actual Kotlin type returned by toMap()
- toMap() keys must be a superset of outputMetadata keys (extra internal keys allowed, but every declared key must exist)
- Include a test that flags/lists all node types WITHOUT outputMetadata as warnings — acts as a TODO tracker for Phase 3 rollout

### Claude's Discretion
- exampleValue serialization format (native types vs strings) — pick what's most natural for Kotlin/Jackson
- Test structure (parameterized vs per-node) — pick based on existing test patterns
- Exact OutputFieldType enum values and naming

</decisions>

<specifics>
## Specific Ideas

- Entity type support is critical — queries return typed entity lists (e.g., User[]), not generic lists. The frontend needs to know which entity type's fields are available for downstream wiring.
- "Dynamic" entity type pattern: outputMetadata declares the field as ENTITY_LIST with a marker that the actual type comes from the node's configuration, not the metadata itself.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-infrastructure*
*Context gathered: 2026-02-13*
