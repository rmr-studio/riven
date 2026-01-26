# Phase 2: Type Barrels - Context

**Gathered:** 2025-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Create domain-based barrel exports that provide single import paths for all types in each domain (entity, block, workspace, user). After this phase, `import type { EntityType } from "@/lib/types/entity"` resolves correctly. This phase does NOT update existing imports — that's Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Export scope
- Barrels include both generated OpenAPI types AND custom types (single import path for everything)
- Types only — enums continue to be imported directly from `lib/types`
- Claude's discretion on whether to export extended version only or both generated + extended per type
- Claude's discretion on exhaustive vs curated exports based on usage analysis

### Naming convention
- Keep original generated type names — no semantic aliases or renaming
- Custom types that extend generated ones use the same name (shadow the generated type)
- Use explicit `export type { }` syntax for type-only exports
- Include utility types (form values, etc.) in domain barrels, not with their usage

### Barrel structure
- Categorized files within each domain: models.ts, requests.ts, responses.ts
- index.ts re-exports everything from category files
- No top-level lib/types/index.ts — always import per domain
- Consumers use `@/lib/types/entity`, not `@/lib/types/entity/models`

### Custom type location
- Custom types live in domain barrel directory alongside re-exports
- File naming: forms.ts for form types, custom.ts for other custom types
- Feature module interface files will be removed (consumers import from lib/types directly)
- Use absolute imports within barrel files (`@/lib/types/models`)

### Claude's Discretion
- Whether to export generated type, extended type, or both per type
- Which types to include based on actual codebase usage
- Exact categorization of types into models/requests/responses

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-type-barrels*
*Context gathered: 2025-01-25*
