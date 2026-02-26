# Architecture Changelog

## 2026-02-21 — Entity Relationship Overhaul

**Domains affected:** Entities, Workflows

**What changed:**

- Replaced ORIGIN/REFERENCE bidirectional relationship sync pattern with table-based architecture using `relationship_definitions` and `relationship_target_rules` tables
- Inverse rows are no longer stored — bidirectional visibility is resolved at query time via `inverseVisible` flag on `RelationshipTargetRuleEntity`
- Deleted `EntityTypeRelationshipDiffService` and `EntityTypeRelationshipImpactAnalysisService` — diff logic consolidated into `EntityTypeRelationshipService` target rule diffing, impact analysis uses simple two-pass pattern
- `EntityTypeRelationshipService` entirely rewritten — new CRUD interface managing definitions and target rules directly
- `EntityRelationshipService` entirely rewritten — write-time cardinality enforcement (source-side and target-side), target type validation against definition rules, no more bidirectional sync
- `EntityTypeService` updated — removed DiffService/ImpactAnalysisService dependencies, added `RelationshipDefinitionRepository` and `EntityRelationshipRepository` for direct access
- `EntityService` updated — relationship payload now keyed by definition ID, delegates relationship saves per-definition to `EntityRelationshipService`
- `EntityQueryService` updated — loads relationship definitions to resolve FORWARD/INVERSE query direction before SQL generation
- `RelationshipSqlGenerator` updated — new `direction: QueryDirection` parameter, column renamed from `relationship_field_id` to `relationship_definition_id`
- `AttributeFilterVisitor` updated — passes `relationshipDirections` map through to SQL generator
- `QueryFilterValidator` updated — now uses `RelationshipDefinition` model instead of `EntityRelationshipDefinition`
- `EntityContextService` (Workflows domain) updated — loads definitions via `RelationshipDefinitionRepository` and `RelationshipTargetRuleRepository` instead of reading from EntityType JSONB schema

**New cross-domain dependencies:** Yes — Workflows → Entities: `EntityContextService` now injects `RelationshipDefinitionRepository` and `RelationshipTargetRuleRepository` (deepening existing coupling)

**New components introduced:**

- `RelationshipDefinitionEntity` — JPA entity for schema-level relationship configuration (replaces JSONB `relationships` field on EntityTypeEntity)
- `RelationshipTargetRuleEntity` — JPA entity for per-target-type configuration with cardinality overrides and inverse visibility
- `RelationshipDefinition` — Domain model for relationship definitions
- `RelationshipTargetRule` — Domain model for target rules
- `RelationshipDefinitionRepository` — JPA repository with workspace-scoped queries
- `RelationshipTargetRuleRepository` — JPA repository with inverse-visible queries
- `QueryDirection` enum — FORWARD vs INVERSE for SQL generation
- `DeleteDefinitionImpact` — Simple data class for two-pass impact pattern (replaces complex `EntityTypeRelationshipImpactAnalysis`)
