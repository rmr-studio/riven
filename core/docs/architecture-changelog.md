# Architecture Changelog

Append-only log of architectural changes made during development tasks.

---

## 2026-02-13 — Generated Phase 1 Documentation: Entity Model Restructuring + Integration Foundation

**Domains affected:** Entities, Integrations
**What changed:**

- Generated 2 feature design documents for Entity Integration Sync sub-domain (Entity Provenance Tracking — Quick Design, Integration Access Layer — Full Design)
- Created 1 ADR documenting Nango as integration infrastructure decision (ADR-001)
- Created 1 flow document for Integration Connection Lifecycle (10-state machine)
- Populated Entity Integration Sync sub-domain plan with architecture overview, data flows, feature dependencies, domain interactions, and design constraints

**New cross-domain dependencies:** yes — Entity Integration Sync depends on Entities domain (EntityService, EntityTypeService) and Workflows domain (Temporal orchestration). Integration connections table has FK to integration_definitions, and entities.source_integration_id + entity_attribute_provenance.source_integration_id both FK to integration_definitions.
**New components introduced:**
- NangoClientWrapper — REST API client for Nango with retry logic and rate limit handling
- IntegrationDefinitionService — Integration catalog query service (by slug, category, active status)
- IntegrationConnectionService — Connection lifecycle management with 10-state machine enforcement
- NangoConfigurationProperties — Spring configuration properties binding for Nango API credentials
- IntegrationDefinitionEntity — JPA entity for global integration catalog (integration_definitions table)
- IntegrationConnectionEntity — JPA entity for workspace-scoped connections (integration_connections table)
- EntityAttributeProvenanceEntity — JPA entity for attribute-level provenance tracking (entity_attribute_provenance table)
- ConnectionStatus — 10-state enum with canTransitionTo() state machine validation
- SourceType — 5-value enum for entity source classification (USER_CREATED, INTEGRATION, IMPORT, API, WORKFLOW)
