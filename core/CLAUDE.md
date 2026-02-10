##     

## Documentation Protocol

- Architecture documentation vault: `../docs/system-design/`

- This vault is the source of truth for system architecture, domain boundaries, patterns, and design decisions. You do
  NOT
  write architectural documentation directly. Your role is to maintain structural scaffolding and log changes for human
  review.

### Repo Documentation Files

- `docs/architecture-changelog.md` — Append-only log of architectural changes made during development tasks.
- `docs/architecture-suggestions.md` — Suggestions for vault updates that require human review and authoring.

## Documentation Rules

### 1. Scaffold Only — Do Not Author

When your work results in a new domain, sub-domain, feature, or architecturally significant component that does not yet
have a corresponding location in the vault:

- Create the appropriate folder and/or stub note following the existing vault structure.
- Stub notes should contain only:

```markdown
# [Name]

<!-- Pending review — created [date] during [brief task reference] -->
```

- Do not write domain overviews, pattern descriptions, flow documentation, or any substantive architectural content.

### 2. Architecture Changelog

After every task that changes the system's structure, append an entry to `docs/architecture-changelog.md` in the
following format:

```markdown
## [YYYY-MM-DD] — [Short Task Description]

**Domains affected:** [list]
**What changed:**

- [concise bullet describing each structural change]

**New cross-domain dependencies:** [yes/no — if yes, describe: Source Domain → Target Domain via what mechanism]
**New components introduced:
** [list any new services, controllers, repositories, or other Spring components that are architecturally significant, with a one-line description of purpose]
```

Do not log trivial changes (bug fixes, styling, copy changes, minor refactors within a single service). Log changes that
affect domain responsibilities, introduce new components, alter data flow, change API contracts, or modify
infrastructure.

### 3. Architecture Suggestions

When your work introduces any of the following, append a suggestion to `docs/architecture-suggestions.md`:

- A new dependency between domains that is not reflected in the existing dependency map.
- A deviation from or extension of a pattern documented in `System Design/System Patterns/`.
- A change that alters the responsibilities or boundaries of an existing domain.
- A significant frontend change that affects how a feature maps to backend domains.
- Anything where you believe the existing documentation no longer accurately represents the system.

Format:

```markdown
## [YYYY-MM-DD] — [Suggestion Title]

**Trigger:** [what you did that prompted this suggestion]
**Affected vault notes:** [which specific notes or sections may need updating]
**Suggested update:** [concise description of what should be reviewed or changed]
```

### 4. Do Not Modify Existing Vault Content

- Never edit, overwrite, or append to existing vault notes.
- Never restructure or reorganise vault folders.
- Never delete anything in the vault.
- If you believe existing documentation is outdated or incorrect, log it as a suggestion in
  `docs/architecture-suggestions.md`.

### 5. When in Doubt

If you are unsure whether a change warrants a changelog entry or suggestion, include it. False positives are low cost.
Missed architectural drift is high cost.