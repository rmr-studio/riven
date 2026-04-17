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

## 2026-04-15 — Insights domain dependencies and demo-only tech debt

**Trigger:** Built the Insights chat demo (`insights` domain) as a new top-level domain that depends on Entities, Identity, and an external LLM provider, and added a `demo_session_id` column to `entities` and `identity_clusters` to support ephemeral seeding.

**Affected vault notes:**
- `System Design/Domain Map` (or equivalent) — needs to record the new `insights` domain and its outbound dependencies.
- `System Design/System Patterns/External integrations` — needs to add Anthropic Messages API as a new external dependency.
- `System Design/Domains/Entities` and `System Design/Domains/Identity` — need to acknowledge the new `demo_session_id` discriminator and the fact that `Insights` writes directly to those domains' entities/clusters.

**Suggested update:**
1. Document the new `insights` domain (responsibility: workspace-scoped multi-turn AI chat that cites real entities; demo-only seeding pipeline).
2. Document the dependency direction: `Insights → Entities` (creates entities + queries by `demo_session_id`), `Insights → Identity` (creates clusters + members), `Insights → external LLM`.
3. Flag the demo-seeding pattern as ephemeral. The intended long-term replacement is a real retrieval / tool-calling pipeline (semantic search over real workspace data + tool calls into the entity query engine), at which point the seeder, `demo_session_id` columns, and the cross-domain writes from `Insights` should be retired.
4. Flag `entities.demo_session_id` and `identity_clusters.demo_session_id` as demo-only tech debt — these columns are NULL for production rows but couple the Entities/Identity domains to the Insights demo. Removing them is part of the retirement step in (3).

## [2026-04-15] — Business definition edits invalidate Anthropic prompt cache for insights sessions

**Trigger:** Wired WorkspaceBusinessDefinitionService into InsightsService.sendMessage so active definitions are rendered inside the cached system prefix.
**Affected vault notes:** insights domain overview; knowledge domain overview; cross-domain dependency map; caching / prompt-cache patterns.
**Suggested update:** Document that any create/update/delete on a WorkspaceBusinessDefinition invalidates the Anthropic prompt cache for every active insights chat session in that workspace (the cached prefix contains the rendered definitions block). Acceptable for the demo; worth revisiting if prompt-cache hit rate becomes a cost lever — options include splitting the prefix into a stable workspace-level block and a volatile definitions block, or hashing the definitions set into a cacheable snapshot.
