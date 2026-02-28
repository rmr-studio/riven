---
tags:
  - adr/accepted
  - architecture/decision
Created: 2026-02-28
Updated:
---
# ADR-004: Declarative-First Storage for Integration Mappings and Entity Templates

---

## Context

The system requires two categories of reusable entity type definitions that must be stored statically and shared across workspaces:

1. **Data model templates** — pre-built entity type ecosystems (entity types, attributes, relationships, semantic metadata) that bootstrap a workspace for a specific business type (SaaS startup, DTC e-commerce, service business). Users select a template during workspace setup, and it gets synced into their environment where they can further edit and mould it as if they created it themselves. New templates will be continuously added to broaden coverage across business types.

2. **Integration entity type schemas and field mappings** — each integration source (HubSpot, Stripe, Zendesk, etc.) has its own set of entity models representing that tool's data inside the application (e.g., HubSpot Contact, Stripe Invoice, Zendesk Ticket). These are protected/readonly models used for data mapping during sync. Each integration also defines field-level mappings that tell the sync pipeline how to transform raw external payloads into entity attribute payloads.

Both categories share the same core requirement: definitions must be **statically stored**, **reusable across workspaces**, **version-controlled**, and **extensible by the community** without requiring deep application knowledge.

The existing architecture has an unresolved tension. [[ADR-001 Nango as Integration Infrastructure]] established that the integration catalog is database-stored to avoid redeployment when adding new integrations. But the [[Integration Schema Mapping]] feature design implies per-integration code — each integration platform having "its own interface definition" for entity type templates and schema mapping guides. This effectively reintroduces the redeployment problem: every new integration or mapping change requires a code change, a build, and a release.

Additionally, the application is **self-hostable and open source**. This creates two specific extensibility requirements:
- **Community contributors** need to be able to add new integrations and templates without deep Kotlin/Spring Boot expertise
- **Self-hosters** need to be able to add custom integrations without forking the codebase

These requirements make the storage and packaging model a foundational architectural decision that shapes the entire contribution model.

---

## Decision

Adopt a **declarative-first storage model** with three layers:

### 1. Declarative Manifest Files (primary definition format)

All integration entity type schemas, field mappings, semantic metadata, and data model templates are defined as **JSON manifest files stored in the application repository**. These manifests are the single source of truth for what an integration or template contains.

**Integration manifests** live under a dedicated directory structure:
```
integrations/
  hubspot/
    manifest.json        # entity types, field mappings, semantic metadata
  stripe/
    manifest.json
  zendesk/
    manifest.json
```

**Template manifests** live under a parallel structure:
```
templates/
  saas-startup/
    manifest.json        # entity types, relationships, semantic metadata, example queries
  dtc-ecommerce/
    manifest.json
  service-business/
    manifest.json
```

A manifest defines:
- **Entity type schemas** — attribute definitions, data types, validation rules
- **Field mappings** (integrations only) — source field to target attribute mappings with optional declarative transformations (type coercion, value mapping, default values, simple expressions)
- **Relationship definitions** — how entity types within the manifest connect to each other
- **Semantic metadata** — natural language definitions, attribute classifications, tags (per [[Semantic Metadata Foundation]])
- **Integration metadata** (integrations only) — which Nango provider key to use, sync direction, supported models

### 2. Database as Runtime Store

On application startup, a **manifest loader** scans the manifest directories, validates each manifest against a JSON Schema, and upserts the definitions into the database. The database is the runtime query surface — application code reads definitions from the database, not from the filesystem at request time.

This preserves the existing pattern established in [[Integration Access Layer]] where integration definitions are queryable via standard JPA repositories. The manifests simply replace the Flyway seed migrations (V005) as the source of catalog data.

**Loading behavior:**
- Manifests are loaded on every application startup (idempotent upsert)
- Definitions from manifests are marked with a `source = 'MANIFEST'` discriminator
- The loader validates manifest structure before writing to the database
- Invalid manifests log a warning and are skipped — they do not prevent application startup
- Manifest-sourced definitions are treated as the canonical version — if a manifest changes between deployments, the database is updated to match

### 3. Generic Mapping Engine (code, deployed once)

A single **generic mapping engine** in code interprets the declarative field mappings at runtime. This engine handles:
- Simple field-to-field mapping (`source.email` → `target.email_address`)
- Type coercion (`string` → `number`, date format conversion)
- Value mapping (enum translation: HubSpot's `"subscriber"` → `"active"`)
- JSONPath extraction for nested source payloads
- Default values for missing fields
- Conditional mapping (if source field exists, map it; otherwise skip)

**No per-integration Kotlin classes are written for standard field mappings.** The generic engine + declarative manifest handles the vast majority of integration scenarios.

**Custom transformation plugins** are only written when an integration has behavior that genuinely cannot be expressed declaratively — for example, a transformation that requires calling an external API, performing complex computation, or handling a deeply non-standard payload structure. These are the exception, not the rule. When needed, they are registered as named transforms that manifests can reference:

```json
{
  "field": "deal_amount",
  "source": "properties.amount",
  "transform": { "type": "plugin", "name": "hubspot-currency-converter" }
}
```

---

## Rationale

- **Community contributions become JSON PRs, not Kotlin PRs.** A contributor adding a new integration writes a manifest file describing entity types and field mappings. They do not need to understand Spring Boot, JPA, or the service layer. The barrier drops from "can write Kotlin" to "can write JSON."
- **Self-hosters extend without forking.** A self-hoster drops a manifest file into the integrations directory and restarts. No code changes, no build toolchain, no merge conflicts with upstream.
- **Version control and review are natural.** Manifests are files in the repo — they go through standard Git workflow, PR review, and CI validation. Changes are diffable and auditable.
- **The redeployment problem is solved for definitions.** Adding a new integration or template requires adding a manifest file and restarting, not a code change and rebuild. The code (mapping engine) changes rarely; the data (manifests) changes frequently.
- **Startup validation catches errors early.** JSON Schema validation on startup ensures manifests are structurally valid before they reach the database. This replaces compile-time type safety with boot-time validation — a reasonable tradeoff given that manifests are validated in CI as well.
- **The database remains the runtime query surface.** Application code queries definitions via JPA repositories, matching the existing pattern. The manifest files are a packaging/authoring concern, not a runtime concern.

---

## Alternatives Considered

### Option 1: Pure In-Code (class per integration/template)

Each integration and template is defined as a Kotlin class implementing an interface (e.g., `IntegrationDefinitionProvider`, `TemplateProvider`). Entity type schemas, field mappings, and semantic metadata are expressed as code.

- **Pros:** Compile-time type safety. IDE support (autocomplete, refactoring). Mapping logic can use arbitrary Kotlin expressions. Testable with standard unit testing.
- **Cons:** Every new integration or template requires a code change, build, and deployment. Community contributors must understand Kotlin and the application's service layer. Self-hosters cannot extend without forking. The number of classes grows linearly with integrations — at 50+ integrations, the codebase becomes cluttered with near-identical boilerplate differing only in field names.
- **Why rejected:** The contribution model does not scale. The redeployment requirement directly contradicts the earlier decision (in [[ADR-001 Nango as Integration Infrastructure]]) to avoid per-integration code for commodity concerns. Field mappings are data, not behavior — expressing them as code is over-engineering.

### Option 2: Database-Only with SQL Seed Migrations

Definitions exist only as Flyway seed migration scripts. No manifest files on the filesystem. Community contributions are SQL INSERT scripts.

- **Pros:** Definitions live in the database from the start — no loader needed. Flyway ordering guarantees migration sequence. Matches the existing V005 seed pattern.
- **Cons:** SQL is a poor authoring format for complex nested structures (entity types with attributes with semantic metadata). Definitions are buried in migration scripts and hard to browse or diff as a whole. Community contributors must write SQL — higher barrier than JSON. Self-hosters must write SQL to add custom integrations. No way to "see" the full definition of an integration without reading across multiple migration files.
- **Why rejected:** Migration scripts are an implementation mechanism, not an authoring format. JSON manifests are human-readable, self-documenting, and diffable. The database is the right runtime store but the wrong authoring surface.

### Option 3: Runtime Admin API for Custom Definitions

Expose REST endpoints that allow self-hosters to register custom integrations and templates at runtime without touching the filesystem or writing SQL.

- **Pros:** Maximum flexibility for self-hosters. No restart required to add an integration. Could support a future "marketplace" of community integrations.
- **Cons:** Adds significant API surface (CRUD for definitions, mappings, templates). Requires authorization model for who can modify global definitions. Introduces state that is not version-controlled — definitions in the database diverge from what shipped with the application. Complicates upgrades (what happens when a new version ships a manifest that conflicts with a runtime-defined custom integration?).
- **Why rejected:** Deferred, not rejected permanently. The manifest-first approach solves the immediate extensibility needs. A runtime API can layer on top of it in a future phase if the community demands it. Building it now would be premature — the manifest format needs to stabilize first.

---

## Consequences

### Positive

- Community contributions for new integrations and templates are JSON file PRs — dramatically lower barrier than Kotlin code changes
- Self-hosters add custom integrations by dropping manifest files into the directory and restarting — no fork required
- New integrations and templates do not require code changes in most cases — only a manifest file addition
- Manifest files are version-controlled, diffable, and reviewable through standard Git workflows
- The generic mapping engine is written and tested once, then reused across all integrations — reduced maintenance surface
- Boot-time validation catches malformed manifests before they reach the database
- Existing database-backed query patterns ([[Integration Access Layer]] JPA repositories) are preserved — the manifest loader is a write path change, not a read path change

### Negative

- No compile-time type safety for mapping definitions — a malformed manifest is caught at startup or CI time, not at compile time. Mitigated by JSON Schema validation and CI checks on manifest files.
- The generic mapping engine must be expressive enough to handle the majority of integration field mapping patterns. If the declarative format proves too limited, more integrations will require custom plugins, partially negating the benefit. Mitigated by designing the mapping DSL with sufficient expressiveness upfront (JSONPath, type coercion, value mapping, conditionals).
- Startup time increases proportionally with the number of manifests — each must be read, validated, and upserted. At the current scale (6-20 integrations, 3-5 templates) this is negligible. At 100+ integrations, the loader may need optimization (checksum-based skip for unchanged manifests).
- Manifest format becomes a de facto public API — breaking changes to the manifest schema affect all community-contributed manifests. Mitigated by versioning the manifest schema (`"manifestVersion": "1.0"`) and providing migration tooling if the schema evolves.

### Neutral

- The existing V005 seed migration for integration definitions is superseded by the manifest loader. V005 can be retained as a no-op migration for existing deployments or removed in a future cleanup.
- Integration entity type schemas defined in manifests follow the same structural conventions as user-created entity types — they use the same attribute definition format, relationship definition format, and semantic metadata shape. The only difference is the `readonly` flag and the `source` discriminator.
- Custom transformation plugins follow a registry pattern — they are registered by name in the application and referenced by name in manifests. This is analogous to the existing [[WorkflowNodeConfigRegistry]] pattern used for workflow node types.

---

## Implementation Notes

- **Manifest JSON Schema:** Define a JSON Schema for both integration manifests and template manifests. Publish the schema in the repository (e.g., `schemas/integration-manifest.schema.json`) so contributors can validate locally before submitting PRs. The schema covers entity type definitions, field mappings, relationship definitions, semantic metadata, and integration-specific configuration.
- **Manifest Loader Service:** A Spring `@Component` that runs on application startup (via `@EventListener(ApplicationReadyEvent::class)` or `ApplicationRunner`). Scans the manifest directories, validates each file against the JSON Schema, and upserts definitions into the database. Uses `source = 'MANIFEST'` to distinguish manifest-loaded definitions from any future runtime-defined definitions.
- **Generic Mapping Engine:** A stateless service that accepts a raw external payload (JSON) and a field mapping definition (from the manifest) and produces an entity attribute payload. The engine applies mappings sequentially: extract source value → apply transform → validate type → assign to target attribute. Transformations are a sealed class hierarchy: `DirectMapping`, `TypeCoercion`, `ValueMapping`, `JsonPathExtraction`, `DefaultValue`, `Conditional`, `PluginTransform`.
- **Custom Plugin Registry:** A Spring bean registry where custom transformation plugins register themselves by name. Manifests reference plugins by name string. If a manifest references an unregistered plugin, the manifest loader logs a warning and skips that specific mapping (not the entire manifest).
- **CI Validation:** A CI step validates all manifest files against the JSON Schema before merge. This provides the "compile-time" safety equivalent for declarative definitions.
- **Migration from V005:** The existing V005 seed migration data for the 6 initial integrations (HubSpot, Salesforce, Stripe, Zendesk, Intercom, Gmail) should be converted to manifest files. V005 itself can be left as a no-op or retained for backward compatibility with existing database state.

---

## Related

- [[Integration Schema Mapping]]
- [[Predefined Integration Entity Types]]
- [[Semantic Metadata Baked Entity Data Model Templates]]
- [[Entity Integration Sync]]
- [[Integration Access Layer]]
- [[ADR-001 Nango as Integration Infrastructure]]
- [[Semantic Metadata Foundation]]
- [[WorkflowNodeConfigRegistry]]
