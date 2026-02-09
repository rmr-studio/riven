---
tags:
  - layer/utility
  - component/active
  - architecture/component
Created: 2026-02-08
Updated: 2026-02-08
Domains:
  - "[[Entities]]"
---# EntityTypeRelationshipDiffService

Part of [[Relationships]]

## Purpose

Pure utility service for calculating delta between previous and updated relationship definitions.

---

## Responsibilities

- Compare two relationship definitions and identify changes
- Classify changes into typed enum categories
- Return structured modification object with change set
- Support impact analysis decision-making

---

## Dependencies

None — pure utility with no injected dependencies

## Used By

- [[EntityTypeService]] — Uses during relationship definition updates

---

## Key Logic

**Change detection:**

Compares previous vs. updated relationship definition fields:

- **Name changed:** Display name modified
- **Cardinality changed:** ONE_TO_MANY → MANY_TO_MANY, etc.
- **Inverse name changed:** Bidirectional relationship's inverse display name
- **Target types added:** New entity type keys added to allowed targets
- **Target types removed:** Entity type keys removed from allowed targets
- **Bidirectional enabled:** Changed from unidirectional to bidirectional
- **Bidirectional disabled:** Changed from bidirectional to unidirectional
- **Bidirectional targets changed:** Allowed target types for inverse relationship modified

**Bidirectional target change logic:**

- Only marked as change if bidirectional NOT being enabled in same calculation
- Enabling bidirectional implies target changes, no need for separate flag

**Return structure:**

`EntityTypeRelationshipModification` contains:
- `previous`: Original definition
- `updated`: New definition
- `changes`: Set of `EntityTypeRelationshipChangeType` enums

---

## Public Methods

### `calculateModification(previous, updated): EntityTypeRelationshipModification`

Pure function that compares two definitions and returns structured modification with typed change set.

---

## Gotchas

- **No side effects:** Pure utility service, all methods are stateless functions
- **Enum-based change types:** Uses typed enums rather than strings for change classification (safer for pattern matching in consumers)
- **Set semantics:** Returns `Set<EntityTypeRelationshipChangeType>` to avoid duplicates
- **Smart bidirectional logic:** Avoids redundant "targets changed" flag when bidirectional being enabled

---

## Related

- [[EntityTypeService]] — Primary consumer for modification analysis
- [[Relationships]] — Parent subdomain
- `EntityTypeRelationshipImpactAnalysisService` — Consumes modification diffs for impact analysis
