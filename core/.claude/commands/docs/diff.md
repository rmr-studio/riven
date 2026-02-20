---
name: docs:diff
description: "Analyze branch diffs and write/update domain documentation in the architecture vault"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - AskUserQuestion
---

<objective>
Analyze all code changes on the current branch relative to `main`, then write or update component documentation directly in `../docs/system-design/domains/`. This command produces real, authored documentation — not stubs or impact reports.

**IMPORTANT**: This skill explicitly overrides the CLAUDE.md "Scaffold Only — Do Not Author" rule. The entire purpose of this skill is to produce complete, authored documentation content with real architectural detail derived from the branch diff. Do NOT leave template placeholders — every section must be populated with substantive content derived from the source code.
</objective>

<execution_context>

## Vault Location

`../docs/system-design/` — relative to the core repo root. Absolute path: `/home/jared/dev/riven/docs/system-design/`

## Domain Structure

The vault organizes documentation under `domains/` with this hierarchy:

```
domains/
  {Domain}/
    {Domain}.md              — Domain overview (index)
    {Subdomain}/
      {Subdomain}.md         — Subdomain overview (index)
      {ComponentName}.md     — Individual component docs
```

## Package-to-Domain Mapping

| Source package pattern | Domain folder |
|------------------------|---------------|
| `*.entity.*`, `*.entities.*` | `Entities/` |
| `*.workflow.*` | `Workflows/` |
| `*.workspace.*`, `*.user.*` | `Workspaces & Users/` |
| `*.block.*` | `Knowledge/` |
| `*.integration.*` | `Integrations/` |
| `*.activity.*` | Cross-cutting (log in the primary domain of the caller) |
| `*.configuration.*`, `*.config.*` | Infrastructure (typically cross-cutting) |
| `*.exceptions.*` | Cross-cutting |
| `db/schema/*` | Map to domain by table name prefix |

## Templates

Located at `/home/jared/dev/riven/docs/templates/Documentation/`:

| Template | Use When |
|----------|----------|
| `Component Overview.md` | Service has 5+ public methods, complex dependencies, or non-trivial business logic |
| `Component Overview - Quick.md` | Simple services, utility classes, entities, enums, DTOs |
| `Subdomain Overview.md` | Located at `/home/jared/dev/riven/docs/templates/Domain/Subdomain Overview.md` — new subdomain introduced |
| `Domain Overview.md` | Located at `/home/jared/dev/riven/docs/templates/Domain/Domain Overview.md` — new domain introduced |
| `Architecture Flow - Quick.md` | New cross-domain flow introduced by the diff |

## Vault Conventions

- **Frontmatter**: YAML with `tags:` array, `Created:` date (YYYY-MM-DD), `Domains:` array
- **Cross-references**: `[[WikiLink]]` syntax using exact filenames without path
- **Enums**: Documented inline within their parent component doc, not as standalone files
- **File naming**: Match the class/component name exactly (e.g., `EntityTypeService.md`)

</execution_context>

<process>

## Step 1: Branch Context

Gather the diff context by running these git commands:

```bash
# Current branch
git branch --show-current

# Commits since main
git log main..HEAD --oneline

# File change summary
git diff main...HEAD --stat

# Full diffs for code files only
git diff main...HEAD -- '*.kt' '*.java' '*.sql' '*.yml' '*.yaml' '*.properties'
```

If the branch IS `main` or has no commits ahead of `main`, inform the user and stop. This command requires an active feature branch with changes.

## Step 2: Map Changes to Vault

For each changed source file from the diff:

1. **Classify the change type**: new file (A), modified (M), deleted (D), renamed (R)
2. **Map to domain** using the package-to-domain mapping table above
3. **Classify the component type**: service, controller, entity, repository, config, enum, DTO, model, exception
4. **Determine the affected subdomain** by matching against existing subdomain folders in the vault:
   - Use `Glob` to list `../docs/system-design/domains/{Domain}/*/` for each affected domain
   - Match the source file's sub-package to an existing subdomain folder
   - If no matching subdomain exists, note it as a potential new subdomain

Build a change map:

```
Domain: Entities
  Subdomain: Type System
    - EntityTypeRelationshipService.kt (Modified) — service
    - EntityTypeRelationshipEntity.kt (Modified) — entity
  Subdomain: [NEW] Semantic Metadata
    - EntityTypeSemanticMetadataService.kt (Added) — service
    - EntityTypeSemanticMetadataEntity.kt (Added) — entity
```

## Step 3: Read Context

Read the following to calibrate documentation voice and depth:

### Templates
Read these template files (only the ones needed based on Step 2 findings):
- `/home/jared/dev/riven/docs/templates/Documentation/Component Overview.md` (if full component docs needed)
- `/home/jared/dev/riven/docs/templates/Documentation/Component Overview - Quick.md` (if quick docs needed)
- `/home/jared/dev/riven/docs/templates/Domain/Subdomain Overview.md` (if new subdomains)
- `/home/jared/dev/riven/docs/templates/Documentation/Architecture Flow - Quick.md` (if new flows)

### Exemplar Docs
For each affected domain/subdomain, read 1-2 existing component docs to calibrate:
- Voice, tone, and level of detail
- How method signatures are formatted
- How dependencies are listed
- How business logic is described

### Index Docs
Read the existing domain index and subdomain index docs that will need updating:
- `../docs/system-design/domains/{Domain}/{Domain}.md`
- `../docs/system-design/domains/{Domain}/{Subdomain}/{Subdomain}.md`

## Step 4: Build Documentation Manifest

Present a manifest to the user via `AskUserQuestion` with these sections:

### New Component Docs to Create
| Component | Domain/Subdomain | Template | Reason |
|-----------|-----------------|----------|--------|
| `FooService` | Entities / Type System | Full | 7 public methods, complex validation |

### Existing Component Docs to Update
| Component | Domain/Subdomain | Sections to Update | What Changed |
|-----------|-----------------|-------------------|--------------|
| `EntityTypeService` | Entities / Type System | Public Methods, Dependencies | Added `getFoo()` method |

### Index Docs to Update
| Document | What to Add |
|----------|-------------|
| `Type System.md` | Add FooService to component list |

### New Flow Docs (if applicable)
| Flow | Template | Trigger |
|------|----------|---------|
| `Semantic Metadata Resolution` | Quick | New cross-domain flow |

### New Subdomains (if applicable)
| Subdomain | Domain | Components |
|-----------|--------|------------|
| `Semantic Metadata` | Entities | 3 new components |

**IMPORTANT**: Do NOT proceed without user confirmation. The user may want to adjust template selection, skip certain docs, or add context.

## Step 5: Generate/Update Documentation

After user confirmation, spawn Task sub-agents (up to 3 parallel) grouped by work type:

### Agent Group 1: New Component Docs
For each new component doc, the sub-agent must:
- Use the appropriate template (Full or Quick) as the structural skeleton
- Populate every section with real content from the diff:
  - **Responsibilities**: Derived from the class's public methods and their logic
  - **Public Methods**: Actual method signatures with parameter types and return types from the source
  - **Dependencies**: Real injected services from the constructor
  - **Used By**: Cross-reference with other changed files or existing codebase via Grep
  - **Business Logic**: Describe what the service actually does, derived from method implementations
  - **Security**: Note `@PreAuthorize` annotations, workspace scoping
- Follow frontmatter conventions: `tags`, `Created` (today's date), `Domains`
- Use `[[WikiLink]]` syntax for all cross-references
- Match the voice/depth of the exemplar docs read in Step 3
- Write the file to `../docs/system-design/domains/{Domain}/{Subdomain}/{ComponentName}.md`

### Agent Group 2: Existing Doc Edits
For each existing doc to update:
- Read the current file content
- Update ONLY the sections affected by the diff
- Preserve all existing content that wasn't changed
- Add new methods to the Public Methods section
- Update Dependencies if new injections were added
- Update Responsibilities if the service's scope expanded

### Agent Group 3: Index Doc Updates + Flow Docs
- Update subdomain index docs: add new components to the component list/table
- Update domain index docs: add new subdomains if created
- Create any new flow docs using the Architecture Flow - Quick template

**Sub-agent instructions must include:**
- The relevant template content
- The diff content for the files they're documenting
- The exemplar doc content for voice calibration
- The list of all existing doc names for valid `[[WikiLink]]` targets
- The exact output file paths

## Step 6: Verification

After all documents are written, verify quality:

1. **Glob** all newly created/modified files in `../docs/system-design/domains/`
2. For each file, verify:
   - Valid YAML frontmatter (has `---` delimiters, `tags:` array, `Created:` date, `Domains:` array)
   - No template placeholder text remains (search for `{{`, `_What`, `_How`, `_List`, `_Any`, `_Where`, `_When`, `Component1`, `ComponentA`)
   - All `[[WikiLinks]]` reference documents that exist in the vault or were just created
   - Mermaid code blocks (if any) have matching opening/closing fences and valid diagram type keywords
3. Fix any issues found before proceeding

## Step 7: Summary Report

Present to the user:

### 1. Documents Created
| Name | Type | Path |
|------|------|------|
| `FooService.md` | Component (Full) | `domains/Entities/Type System/` |

### 2. Documents Updated
| Name | Sections Edited | Why |
|------|----------------|-----|
| `EntityTypeService.md` | Public Methods | Added `getFoo()` from branch changes |

### 3. Architectural Impact
- New cross-domain dependencies introduced by the diff
- New components and their roles
- Changed API surface (new/modified endpoints)

### 4. Points of Consideration
- Documentation gaps that may need manual attention
- Areas where the diff touched code but existing docs were already accurate
- Architectural observations from the diff (potential inconsistencies, patterns worth noting)

</process>

<success_criteria>
- All new components from the diff have authored documentation with no template placeholders
- Existing docs affected by the diff are updated with targeted section edits
- Subdomain and domain index docs reflect the new components
- All `[[WikiLinks]]` resolve to existing or newly created documents
- Frontmatter is valid with correct tags, dates, and domains
- User confirmed the documentation manifest before any files were written
- Summary report covers created docs, updated docs, architectural impact, and considerations
</success_criteria>
