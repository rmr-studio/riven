---
tags:
  - component/deprecated
  - layer/service
  - architecture/component
Created: 2026-02-08
Updated: 2026-02-21
Domains:
  - "[[Entities]]"
---
# EntityTypeRelationshipImpactAnalysisService

> [!warning] Deprecated
> This component was deleted from the codebase on 2026-02-21 as part of the Entity Relationships overhaul. Impact analysis is now a simple two-pass pattern in [[EntityTypeRelationshipService]].`deleteRelationshipDefinition()`: count existing links, return `DeleteDefinitionImpact` if confirmation needed, otherwise execute deletion.

Part of [[Relationships]]

## Replaced By

- [[EntityTypeRelationshipService]] — `deleteRelationshipDefinition()` uses two-pass impact pattern with `DeleteDefinitionImpact` data class
