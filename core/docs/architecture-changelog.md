# Architecture Changelog

## [2026-03-09] — ID SchemaType and Template Default Value Support

**Domains affected:** Entity, Catalog
**What changed:**

- Added `ID` to `SchemaType` enum — auto-generates prefixed sequential identifiers (e.g. `PKR-1`)
- Added `prefix` field to `SchemaOptions` for configuring ID attribute prefixes
- Created `entity_type_sequences` table and `EntityTypeSequenceService` for atomic counter management
- Sequence increment uses `REQUIRES_NEW` transaction to minimise lock duration (gaps accepted on rollback)
- `TemplateInstallationService.parseSchemaOptions()` now parses `default` and `prefix` from manifests
- Default values validated at definition time via `SchemaService.validateDefault()` — rejects invalid defaults before storage
- `EntityService.saveEntity()` injects defaults and generates IDs on entity creation
- ID attributes are read-only after creation — updates cannot modify them
- Sequence rows initialized during template installation and manual attribute creation

**New cross-domain dependencies:** No — Entity and Catalog already have existing dependency
**New components introduced:**
- `EntityTypeSequenceService` — manages atomic counter increment for ID generation
- `EntityTypeSequenceEntity` / `EntityTypeSequenceRepository` — persistence for sequence counters
- `SchemaService.validateDefault()` — validates default values against attribute schema constraints

## [2026-03-06] — Storage Domain Vault Documentation (Phase 1: Storage Foundation)

**Domains affected:** Storage (new domain)
**What changed:**

- Created full feature design for Provider-Agnostic File Storage in `feature-design/2. Planned/`
- Created ADR-005: Strategy Pattern with Conditional Bean Selection for Storage Providers
- Created ADR-006: HMAC-Signed Download Tokens for File Access
- Created ADR-007: Magic Byte Content Validation via Apache Tika
- Created Flow - File Upload documenting the multipart upload pipeline
- Created Flow - Signed URL Download documenting the unauthenticated download path
- Created File Storage sub-domain plan establishing the Storage domain's vault presence

**New cross-domain dependencies:** Yes — Storage depends on Workspaces & Users (workspace scoping via @PreAuthorize, JWT auth via AuthTokenService) and Activity (audit logging via ActivityService)
**New components introduced:**
- StorageProvider interface — provider-agnostic abstraction for file operations
- LocalStorageProvider — local filesystem implementation, activated via @ConditionalOnProperty
- ContentValidationService — Apache Tika magic byte detection, domain-based validation, SVG sanitization
- SignedUrlService — HMAC-SHA256 token generation/validation for unauthenticated file downloads
- StorageService — orchestrator coordinating validation, storage, metadata, and activity logging
- StorageController — 6 REST endpoints under /api/v1/storage/
- FileMetadataEntity — JPA entity for file metadata persistence
- StorageConfigurationProperties — @ConfigurationProperties for provider and signed URL config
