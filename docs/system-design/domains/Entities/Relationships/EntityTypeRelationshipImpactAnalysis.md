---
tags:
  - component/deprecated
  - architecture/component
Created: 2026-02-09
Updated: 2026-02-21
Domains:
  - "[[Entities]]"
---
# EntityTypeRelationshipImpactAnalysis

> [!warning] Deprecated
> This model was deleted from the codebase on 2026-02-21 as part of the Entity Relationships overhaul. The complex impact analysis model has been replaced by a simple `DeleteDefinitionImpact` data class in [[EntityTypeRelationshipService]].

## Replaced By

- `DeleteDefinitionImpact(definitionId, definitionName, impactedLinkCount)` — Simple data class defined in `EntityTypeRelationshipService.kt`
