# Architecture Suggestions

## 2026-02-21 — Entity Relationships Overhaul: Vault Updates Needed

**Trigger:** Complete rewrite of relationship architecture — ORIGIN/REFERENCE sync replaced with table-based definitions

**Affected vault notes:**

- `System Design/System Patterns/` — Any documentation of the ORIGIN/REFERENCE bidirectional sync pattern is now outdated
- `domains/Entities/Relationships/Relationships.md` — Updated, but the architectural narrative may benefit from human-authored context on why the change was made
- `domains/Entities/Entities.md` — Updated with new tables and decisions, but the domain overview prose may need human review for completeness
- Any flow diagrams referencing ORIGIN/REFERENCE relationship creation should be updated or removed

**Suggested update:** Review all vault content that references "ORIGIN", "REFERENCE", "bidirectional sync", or "inverse relationship creation" and update or remove those references. The new architecture stores relationship configuration in dedicated tables and resolves inverse visibility at query time — no inverse rows are ever stored.

## 2026-02-21 — Deepened Cross-Domain Coupling: Workflows → Entities

**Trigger:** `EntityContextService` (Workflows domain) now directly injects `RelationshipDefinitionRepository` and `RelationshipTargetRuleRepository` from the Entities domain

**Affected vault notes:**

- `integrations/Domain Integration.md` — If this documents cross-domain dependencies, the Workflows → Entities coupling has deepened
- `domains/Workflows/State Management/` — May need updated dependency documentation at the subdomain level

**Suggested update:** Consider whether `EntityContextService` should continue to directly access Entities domain repositories, or whether a service-level abstraction (e.g., a method on `EntityTypeRelationshipService`) would be a cleaner cross-domain boundary. The current approach works but creates tight coupling to the Entities domain's internal storage model.
