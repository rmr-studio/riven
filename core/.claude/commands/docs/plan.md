---
name: docs:plan
description: "Generate fully authored architectural documentation from GSD phase plans"
argument-hint: "<phase-number>"
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - Task
  - AskUserQuestion
---

<objective>
Translate a GSD phase's planning documents into fully authored architectural documentation. Read phase plans, requirements, research, and codebase analysis from `.planning/`, then generate feature designs, sub-domain plans, ADRs, and flow documents in `../docs/system-design/` using templates from `../docs/templates/`.

**IMPORTANT**: This skill explicitly overrides the CLAUDE.md "Scaffold Only — Do Not Author" rule. The entire purpose of this skill is to produce complete, authored documentation content with real architectural detail derived from planning sources. Do NOT leave template placeholders — every section must be populated with substantive content derived from the source material.
</objective>

<execution_context>

## Source Data (read from `.planning/`)

| File | Purpose |
|------|---------|
| `.planning/ROADMAP.md` | Phase definitions, requirement mappings, success criteria, dependencies |
| `.planning/REQUIREMENTS.md` | Full requirement text by ID (INTG-*, SMAP-*, IDEN-*, PROV-*, SYNC-*) |
| `.planning/PROJECT.md` | Key architectural decisions, constraints, existing architecture context |
| `.planning/phases/NN-*/PLAN.md` | Phase-specific plans (tasks, components, implementation details) |
| `.planning/research/SUMMARY.md` | Executive summary, recommended stack, architecture approach, pitfalls |
| `.planning/research/ARCHITECTURE.md` | Architectural patterns, component boundaries, data flows |
| `.planning/research/FEATURES.md` | Feature analysis: table stakes, differentiators, anti-features |
| `.planning/research/STACK.md` | Technology choices and rationale |
| `.planning/research/PITFALLS.md` | Critical risks with prevention strategies |
| `.planning/codebase/ARCHITECTURE.md` | Existing pattern overview, layers, data flows, abstractions |
| `.planning/codebase/STRUCTURE.md` | Directory layout, naming conventions, where to add new code |
| `.planning/codebase/CONVENTIONS.md` | Code conventions, patterns, style |
| `.planning/codebase/STACK.md` | Current technology stack |

## Output Destination

- Feature designs: `../docs/system-design/feature-design/1. Planning/`
- Sub-domain plans: `../docs/system-design/feature-design/_Sub-Domain Plans/`
- ADRs: `../docs/system-design/decisions/`
- Flows: `../docs/system-design/flows/` (create directory if needed)
- Architecture changelog: `docs/architecture-changelog.md`

## Templates (read from `../docs/templates/`)

| Template | Path | Use When |
|----------|------|----------|
| Feature Design - Full | `../docs/templates/Design/Feature Design - Full.md` | Feature has 3+ of: new DB tables, new API endpoints, multiple new components, external integrations, complex failure modes, cross-domain flows, security changes |
| Feature Design - Quick | `../docs/templates/Design/Feature Design - Quick.md` | Simpler features not meeting Full threshold |
| Architecture Decision Record | `../docs/templates/Decisions/Architecture Decision Record.md` | Technology choices, pattern choices, constraints that eliminate alternatives |
| Architecture Flow | `../docs/templates/Documentation/Architecture Flow.md` | Multi-step process crossing domain boundaries or involving async/external systems |
| Architecture Flow - Quick | `../docs/templates/Documentation/Architecture Flow - Quick.md` | Simpler flows within a single domain |
| Sub-Domain Plan | `../docs/templates/Design/Sub-Domain Plan.md` | One per sub-domain, populated after all features are written |

## Vault Conventions

- **Frontmatter tags** (pick applicable, remove inapplicable from template list):
  - Features: `architecture/feature`, one `status/*`, one `priority/*`
  - ADRs: `architecture/decision`, one `adr/*` (typically `adr/proposed`)
  - Flows: `architecture/flow`, one `flow/*`
  - Sub-domain plans: `architecture/subdomain-plan`
- **Dates**: `Created: YYYY-MM-DD` format
- **Domain links**: `Domains: ["[[DomainName]]"]` — use actual domain names from `../docs/system-design/domains/`
- **Sub-domain link**: `Sub-Domain: "[[Entity Integration Sync]]"` in feature frontmatter (filename of the sub-domain plan)
- **Cross-references**: `[[Document Name]]` wiki-link syntax (use exact filenames without path)
- **Feature headings**: Full template uses `# Feature: Title`, Quick uses `# Quick Design: Title`
- **ADR headings**: `# ADR-NNN: Title` with zero-padded 3-digit number
- **Flow headings**: `# Flow: Title`

</execution_context>

<process>

## Step 1: Validate and Parse Phase

Parse `$ARGUMENTS` as the phase number. If empty or non-numeric, ask the user which phase to generate documentation for.

Read `.planning/ROADMAP.md` and locate the phase section matching the number. Extract:
- Phase name and goal
- Requirement IDs listed under `**Requirements**:`
- Success criteria
- Dependencies on prior phases

If the phase number doesn't exist in the roadmap, report the error and list available phases.

## Step 2: Gather All Context

Read the following files (skip any that don't exist — not all phases will have all files):

**Phase-specific:**
- All `PLAN.md` files in `.planning/phases/NN-*/` where NN matches the phase number (use Glob: `.planning/phases/{phase_number_padded}-*/PLAN.md`)
- If no PLAN.md files exist for this phase, note this — you'll derive features from ROADMAP.md and REQUIREMENTS.md instead

**Requirements:**
- `.planning/REQUIREMENTS.md` — read full text for each requirement ID mapped to this phase

**Project context:**
- `.planning/PROJECT.md` — key decisions, constraints, existing architecture
- `.planning/research/SUMMARY.md` — stack, architecture, pitfalls overview
- `.planning/research/ARCHITECTURE.md`, `FEATURES.md`, `STACK.md`, `PITFALLS.md`
- `.planning/codebase/ARCHITECTURE.md`, `STRUCTURE.md`, `CONVENTIONS.md`

**Existing vault state:**
- Glob `../docs/system-design/**/*.md` to build a complete list of existing document names. This serves two purposes:
  1. Detect existing documents that might be replaced/updated
  2. Know valid cross-reference targets for `[[WikiLinks]]`
- Read all templates from `../docs/templates/` that may be needed

**Existing ADR numbering:**
- Glob `../docs/system-design/decisions/*.md` and determine the highest ADR number in use. New ADRs continue from the next number.

## Step 3: Identify Documentation Artifacts

Analyze the gathered context and determine what documents to create. Use these heuristics:

### Features

Identify distinct features by looking for:
- Distinct PLAN.md files that describe a buildable capability
- Requirement group prefixes that cluster into a cohesive feature (e.g., all SMAP-* requirements = "Schema Mapping" feature, all INTG-01/02/03/06 = "Integration Access Layer" feature)
- Explicit feature names in the roadmap phase description
- New services or subsystems with their own lifecycle

For each feature, determine template selection:
- **Full template** when the feature has 3+ of: new DB tables, new API endpoints, multiple new components, external integrations, complex failure modes, cross-domain flows, security considerations
- **Quick template** otherwise

Check if a document with matching name already exists in the vault. If it does, flag it for the user (Step 4).

### ADRs

Create ADRs for:
- Decisions listed in `PROJECT.md` "Key Decisions" table with status "Pending" that are relevant to THIS phase's scope
- Technology choices specific to this phase (e.g., "Use JSONPath for schema mapping extraction")
- Pattern choices that constrain implementation (e.g., "Wrap EntityService rather than modifying it")
- Constraints that eliminate alternatives worth documenting

### Flows

Create flow documents when:
- A multi-step process crosses domain boundaries or involves async processing
- External system interaction occurs (webhook receipt, outbound API call)
- A user-facing multi-step operation exists in this phase's scope

Select Full vs Quick flow template based on complexity.

### Sub-Domain Plan Update

If this is the first phase generating features for the sub-domain (check if the sub-domain plan is still a stub/template), plan to populate it after features are written.

## Step 4: Build Generation Manifest and Get User Approval

Create a structured manifest listing every document to generate:

```
## Documentation Generation Manifest — Phase N

### Features
| # | Name | Template | Output Path | Exists? | Source Context |
|---|------|----------|-------------|---------|----------------|
| 1 | ...  | Full/Quick | ...        | Yes/No  | Req IDs, PLAN.md |

### ADRs
| # | Title | ADR Number | Source Decision |
|---|-------|------------|-----------------|
| 1 | ...   | ADR-NNN    | From PROJECT.md |

### Flows
| # | Name | Template | Trigger |
|---|------|----------|---------|
| 1 | ...  | Full/Quick | ... |

### Sub-Domain Plan
- [ ] Populate `Entity Integration Sync.md` (currently stub)

### Existing Documents
- `Integration Access Layer.md` — exists as draft, will be replaced with fully authored version
- (list any others)
```

Present this manifest to the user via AskUserQuestion. Ask them to confirm or adjust. If documents already exist, ask whether to replace them with fully authored versions or skip.

**IMPORTANT**: Do NOT proceed to generation without user confirmation of the manifest.

## Step 5: Generate Documents (parallel via Task sub-agents)

After user confirms the manifest, spawn Task sub-agents to generate documents in parallel, grouped by type. Use up to 3 parallel agents:

### Task 1: "Feature Design Documents"

Spawn a Task sub-agent with subagent_type `general-purpose`. Provide it with:
- The relevant template content (Full or Quick, already read)
- The subset of context needed for each feature (requirement text, PLAN.md content, research excerpts, codebase patterns)
- The cross-reference manifest (all existing + planned document names for valid `[[WikiLinks]]`)
- The output paths

The sub-agent must write each feature design file using the Write tool. Instructions for the sub-agent:

**Content derivation rules:**
- Every section must contain substantive content derived from the source material (requirements, plans, research, codebase analysis). No template placeholder text should remain.
- Data model sections: Use existing entity patterns — Kotlin JPA entities, UUID primary keys, JSONB payload columns, workspace_id FK, soft delete (deleted_at), audit fields (created_at, updated_at). Reference `.planning/codebase/CONVENTIONS.md` patterns.
- Component sections: Name Spring services following project conventions (e.g., `IntegrationConnectionService`, `SchemaMappingService`). Reference `.planning/codebase/ARCHITECTURE.md` for layer patterns.
- API sections: Follow existing REST patterns — `POST/GET/PUT/DELETE /api/v1/workspaces/{workspaceId}/...`. Include realistic request/response JSON with actual field names from requirements.
- Security sections: Reference RLS policies (workspace-scoped), `@PreAuthorize` annotations, JWT-based auth via Supabase.
- Include Mermaid diagrams in architecture, data flow, and interaction sections. Diagrams must reflect actual components and flows, not generic placeholders.
- Frontmatter must include `Created: YYYY-MM-DD` (today's date), correct `Domains`, `Sub-Domain: "[[Entity Integration Sync]]"`, and appropriate tags (remove inapplicable tag options from the template list — pick exactly one status and one priority).
- Cross-reference other documents using `[[Exact Document Name]]` syntax.

### Task 2: "Architecture Decision Records"

Spawn a Task sub-agent for ADR generation. Provide:
- ADR template content
- The specific decisions to document with their context from PROJECT.md
- Starting ADR number (continue from existing highest)
- Cross-reference manifest

Each ADR must have:
- Concrete context drawn from project requirements and constraints
- Clear decision statement
- Substantive rationale
- At least 2 alternatives with real pros/cons/rejection reasons
- Consequences (positive, negative, neutral) grounded in the project's technical reality
- Implementation notes specific to this codebase
- Tags: `architecture/decision`, `adr/proposed` (remove other status options)

### Task 3: "Flow Documents"

Spawn a Task sub-agent for flow documents (if any flows were identified). Provide:
- Flow template content (Full or Quick)
- Context about the flow's trigger, steps, components involved
- Cross-reference manifest

Each flow must have:
- Realistic Mermaid sequence diagrams with actual component names
- Step-by-step breakdown referencing real services
- Failure modes specific to this flow's dependencies
- Correct frontmatter with flow type tags

**If fewer than 3 document types need generation, use fewer agents.** If only features and the sub-domain plan are needed, a single agent is fine.

## Step 6: Generate/Update Sub-Domain Plan

After feature documents are written, populate the sub-domain plan (`../docs/system-design/feature-design/_Sub-Domain Plans/Entity Integration Sync.md`).

Read the current file and replace its template content while preserving the existing frontmatter (tags, Created date, Domains). Populate:

1. **Vision & Purpose** — derived from PROJECT.md "What This Is" and "Core Value" sections
   - What this sub-domain covers
   - Why it's a distinct area (cohesion rationale)
   - Boundaries (owns / does not own) from PROJECT.md scope and out-of-scope

2. **Architecture Overview**
   - System context Mermaid diagram showing the sub-domain's components and their connections to external domains (Entities, Workflows, Nango)
   - Core components table listing major services with responsibility and status (Planned)
   - Key design decisions from PROJECT.md decisions table

3. **Data Flow**
   - Primary flow: Mermaid flowchart showing the sync pipeline (webhook → schema mapping → identity resolution → conflict resolution → entity persistence)
   - Secondary flows (error handling, retry via Temporal, user override)

4. **Feature Map** — keep the existing `dataviewjs` query block unchanged (it auto-discovers features via frontmatter)

5. **Feature Dependencies**
   - Mermaid dependency graph showing how features in this sub-domain depend on each other
   - Implementation sequence table mapped to roadmap phases

6. **Domain Interactions**
   - Depends On: Entities domain (entity storage, type definitions), Workflows domain (Temporal orchestration)
   - Consumed By: UI/frontend (provenance display, match review), Workflows (integration actions)
   - Cross-cutting concerns: workspace scoping, RLS, audit logging

7. **Design Constraints** — from PROJECT.md constraints section

8. **Open Questions** — any unresolved items from the generation process

9. **Decisions Log** — reference generated ADRs

10. **Related Documents** — link to all generated features, ADRs, and flows

11. **Changelog** — add entry: today's date, "Claude", "Populated from GSD Phase N planning documents"

## Step 7: Verification Pass

After all documents are written, verify quality:

1. **Glob** all newly created/modified files
2. For each file, verify:
   - Valid YAML frontmatter (has `---` delimiters, `tags:` array, `Created:` date, `Domains:` array)
   - No template placeholder text remains (search for `{{`, `_What`, `_How`, `_List`, `_Any`, `_Where`, `_When`, `Component1`, `ComponentA`, `ADR-xxx`, `Feature A`)
   - All `[[WikiLinks]]` reference documents that exist or were just created
   - Tags are valid (exactly one status, one priority for features; exactly one adr/* for ADRs)
   - Mermaid code blocks are syntactically plausible (have matching opening/closing ```, contain valid diagram type keywords)

3. Report verification results:
   - Total documents created/updated
   - Any issues found (broken links, remaining placeholders, invalid frontmatter)
   - List of all cross-references used

## Step 8: Update Architecture Changelog

Append an entry to `docs/architecture-changelog.md` following the CLAUDE.md format:

```markdown
## [YYYY-MM-DD] — Generated Phase N Documentation: [Phase Name]

**Domains affected:** [list domains from generated documents]
**What changed:**
- Generated N feature design documents for [sub-domain name]
- Created N ADRs documenting key architectural decisions
- Created N flow documents
- Populated sub-domain plan with architecture overview, data flows, and feature dependencies

**New cross-domain dependencies:** [yes/no — if yes, list: Source Domain -> Target Domain via mechanism]
**New components introduced:** [list architecturally significant components from feature designs with one-line descriptions]
```

If `docs/architecture-changelog.md` doesn't exist yet, create it with a header:

```markdown
# Architecture Changelog

Append-only log of architectural changes made during development tasks.

If the feature design plan has been successfully drafted. The file itself should be moved to the next step (2.Planned). Make the directory if it does not exist.

---
```

</process>

<output>
After completing all steps, provide a summary to the user:

1. **Documents Created** — table with name, type, and path for each
2. **Documents Updated** — any existing documents that were modified (e.g., sub-domain plan)
3. **Verification Results** — pass/fail status and any issues
4. **Architecture Changelog** — the entry that was appended
5. **Next Steps** — suggest running the skill for subsequent phases, or note any open questions that emerged
</output>

<success_criteria>
- All identified features have fully authored design documents with no template placeholders
- ADRs document pending decisions from PROJECT.md relevant to the phase scope
- Flow documents capture cross-domain or async processes with realistic Mermaid diagrams
- Sub-domain plan is populated with vision, architecture, data flow, and feature dependencies
- All `[[WikiLinks]]` resolve to existing or newly created documents
- Frontmatter is valid with correct tags, dates, domains, and sub-domain references
- Architecture changelog has a new entry documenting what was generated
- User confirmed the generation manifest before any documents were written
</success_criteria>
