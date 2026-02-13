---
name: arch-impact
description: Analyze branch changes and produce an architecture impact report for the documentation vault.
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Bash(git *), Write
---

# Architecture Impact Report

Generate a structured impact report analyzing all changes on the current branch relative to `main`, mapping them to the architecture documentation vault at `../docs/system-design/`.

## Branch Context

**Current branch:** !`git branch --show-current`

**Commits on this branch:**
```
!`git log main..HEAD --oneline`
```

**File change summary:**
```
!`git diff main...HEAD --stat`
```

**File-level changes:**
```
!`git diff main...HEAD --name-status`
```

## Instructions

### Step 1: Read the Full Diffs

Read the complete diff for all code files:
```
git diff main...HEAD -- '*.kt' '*.java' '*.xml' '*.yml' '*.yaml' '*.properties' '*.sql'
```

Read the complete diff for all documentation files:
```
git diff main...HEAD -- '*.md'
```

### Step 2: Understand the Vault

Browse the architecture documentation vault at `../docs/system-design/` to understand the current documented state. Focus on domains and components that overlap with the changed files. The vault is organized as:

- `domains/` — Domain overviews and component documentation
- `flows/` — Cross-domain flow documentation
- `decisions/` — Architecture decision records
- `feature-design/` — Feature design documents (planning through completion)
- `infrastructure/` — Infrastructure and tech stack documentation
- `integrations/` — Integration documentation

Use `[[wiki-link]]` syntax when referencing vault documents in the report (e.g., `[[Node Execution]]`, `[[WorkflowNodeConfig]]`).

### Step 3: Analyze Impact

For each changed file, determine:

1. **Which domain** it belongs to (map source packages to vault domains)
2. **What components** are new, modified, or removed
3. **Which flows** are affected by the changes
4. **What cross-domain dependencies** exist (new or changed)
5. **What API contracts** changed (controllers, DTOs, request/response shapes)
6. **What data model changes** occurred (entities, migrations, schema)

### Step 4: Write the Report

Write the report to `docs/architecture-impact-report.md` using the template below. Every section must be filled in — use "None" for sections with no changes. Be specific and actionable: reference exact class names, vault document paths, and describe what needs to change.

## Report Template

````markdown
---
tags:
  - architecture/change-report
Created: [YYYY-MM-DD]
Branch: [branch-name]
Base: main
---

# Architecture Impact Report: [Branch Name]

## Summary
[1-2 paragraph overview: what this branch introduces, the motivation, and the scope of changes]

## Affected Domains
| Domain | Impact | Description |
|--------|--------|-------------|
| [domain] | New/Modified/Extended | [what changed in this domain] |

## New Components
| Component | Domain | Type | Purpose |
|-----------|--------|------|---------|
| [class name] | [domain] | Service/Controller/Entity/Config/Enum/DTO | [one-line purpose] |

## Modified Components
| Component | Domain | What Changed |
|-----------|--------|--------------|
| [class name] | [domain] | [specific changes made] |

## Flow Changes
| Flow | Change Type | Description |
|------|-------------|-------------|
| [[flow name]] | New/Modified/Extended | [what changed in this flow] |

## Cross-Domain Dependencies
| Source | Target | Mechanism | New? |
|--------|--------|-----------|------|
| [source domain] | [target domain] | [how they interact] | Yes/No |

## API Changes
| Endpoint | Method | Change | Breaking? |
|----------|--------|--------|-----------|
| [path] | GET/POST/PUT/DELETE | [what changed] | Yes/No |

## Data Model Changes
| Entity/Table | Change | Migration? |
|-------------|--------|------------|
| [name] | [added/modified/removed fields] | Yes/No |

## Documentation Impact

### New Documentation Needed
- [ ] [[Suggested Document Name]] — [brief description of what should be documented]

### Existing Docs Requiring Updates
| Document | Section | Required Update |
|----------|---------|-----------------|
| [[document name]] | [section] | [what needs to change] |

## Suggested Changelog Entries

Formatted per the project's `CLAUDE.md` changelog format:

```markdown
## [YYYY-MM-DD] — [Short Task Description]

**Domains affected:** [list]
**What changed:**
- [bullet points]

**New cross-domain dependencies:** [yes/no — details if yes]
**New components introduced:** [list with one-line descriptions]
```
````
