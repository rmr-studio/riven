# Codebase Concerns

**Analysis Date:** 2026-02-07

## Tech Debt

### 1. Stubbed Impact Analysis Service

**Area:** Entity relationship schema changes

**Issue:** `EntityTypeRelationshipImpactAnalysisService.analyze()` returns empty analysis immediately without calculating actual impact

**Files:**
- `src/main/kotlin/riven/core/service/entity/type/EntityTypeRelationshipImpactAnalysisService.kt` (lines 20-71)

**Impact:**
- Users can make destructive schema changes (cardinality reduction, target removal) without warnings
- Data loss is possible without user awareness
- System cannot prevent incompatible relationship modifications
- Blocks the feature from production-ready state

**Fix approach:**
- Implement entity count queries for affected relationships
- Add actual impact detection for cardinality changes
- Calculate affected entity types for bidirectional relationship changes
- Return `409 Conflict` with warnings when data loss risk detected
- Require user confirmation via `impactConfirmed` flag before proceeding

**Priority:** High - blocks schema change safety

---

### 2. Incomplete Relationship Validation

**Area:** Entity relationship constraints

**Issue:** `EntityValidationService.validateRelationshipEntity()` is completely stubbed with `TODO()`

**Files:**
- `src/main/kotlin/riven/core/service/entity/EntityValidationService.kt` (lines 45-82)

**Impact:**
- RELATIONSHIP entity types cannot be validated against their required relationships
- No enforcement of relationship cardinality on entity instances
- Entities can be created without required relationships
- Polymorphic relationship type constraints not validated

**Fix approach:**
- Implement lookup of entity relationships from database
- Validate each defined relationship is present (if required)
- Check target entity types match definition constraints
- Validate cardinality constraints (ONE_TO_ONE, MANY_TO_ONE, etc.)
- Add comprehensive test coverage for relationship validation

**Priority:** High - data integrity issue

---

### 3. Missing Relationship Data Cleanup

**Area:** Entity relationship data management

**Issue:** Multiple TODOs indicate relationship data is not cleaned up when relationships are removed

**Files:**
- `src/main/kotlin/riven/core/service/entity/type/EntityTypeRelationshipService.kt`
  - Line 542: "TODO: Clean up actual entity relationship data from entity records"
  - Line 598: "TODO: Remove all entity relationship data for this ORIGIN relationship"
  - Line 723: "TODO: Remove all entity relationship data for this REFERENCE relationship and this entity type"
  - Line 1075: "TODO: Clean up entity payload data for disabled bidirectional relationships"

**Impact:**
- When relationships are deleted, entity payloads still contain stale relationship data
- Database grows with orphaned relationship references
- Data inconsistency between schema and actual entity data
- Difficult to audit what data was deleted

**Fix approach:**
- Implement cleanup logic when removing ORIGIN relationships
- Update all entity payloads to remove stale relationship data
- Log data removal for audit trail
- Implement cascade cleanup for REFERENCE relationship removal
- Add migration utilities for handling existing data

**Priority:** High - data consistency

---

### 4. Cardinality Change Data Migration Not Implemented

**Area:** Entity relationship schema evolution

**Issue:** Cardinality changes (e.g., MANY_TO_MANY → ONE_TO_ONE) require data migration that is not implemented

**Files:**
- `src/main/kotlin/riven/core/service/entity/type/EntityTypeRelationshipService.kt` (line 1010)
- `src/main/kotlin/riven/core/service/entity/EntityValidationService.kt` (lines 138-160)

**Impact:**
- Restrictive cardinality changes detected as data-loss risks but cannot be applied
- Entities with multiple relationships blocked when cardinality reduced
- No automatic data migration or truncation strategy
- Users cannot safely evolve relationship schemas

**Fix approach:**
- Implement data migration strategy for cardinality reduction
- Auto-truncate excess relationships to match ONE cardinality
- Archive removed data with audit trail
- Add preview of what data would be affected
- Require explicit confirmation with data loss details

**Priority:** Medium - affects schema evolution

---

### 5. Incomplete Email Notification System

**Area:** Workspace management

**Issue:** Email notifications stubbed in workspace invite workflow

**Files:**
- `src/main/kotlin/riven/core/service/workspace/WorkspaceInviteService.kt`
  - Line 84: "TODO: Send out invitational email"
  - Line 145: "TODO: Send out acceptance email"
  - Line 155: "TODO: Send out rejection email"

**Impact:**
- Users never receive invite notifications
- No confirmation when invites are accepted/rejected
- Email delivery not integrated with external provider
- Workspace adoption friction for non-technical users

**Fix approach:**
- Integrate with email provider (SendGrid, Mailgun, AWS SES)
- Implement templated email sending for invite lifecycle
- Add configuration for email domain/sender
- Log email delivery events for debugging
- Add retry logic for failed email sends

**Priority:** Medium - feature gap

---

### 6. Incomplete Workflow Node Configuration

**Area:** Workflow execution

**Issue:** Workflow node deserialization and config parsing has multiple TODO stubs

**Files:**
- `src/main/kotlin/riven/core/deserializer/WorkflowNodeDeserializer.kt`
  - Line 64: "TODO: Implement concrete parse config classes"
  - Line 71: "TODO: Implement concrete parse config classes"
  - Line 122: `TODO()` throws exception
  - Line 143: "TODO: Add SWITCH, LOOP, PARALLEL in Phase 5+"
  - Line 154: "TODO: Implement concrete utility config classes"
  - Line 167: "TODO: Implement concrete utility config classes"

**Impact:**
- Workflow nodes with unsupported types throw exceptions at runtime
- Parse config deserialization incomplete
- SWITCH, LOOP, PARALLEL node types not supported
- Workflow definitions cannot be fully validated on load

**Fix approach:**
- Implement concrete parse config classes for all node types
- Complete deserializer for utility node configs
- Add support for SWITCH, LOOP, PARALLEL control flow
- Improve error messages when unknown node types encountered
- Add schema validation for all node configurations

**Priority:** Medium - blocks workflow feature expansion

---

### 7. Missing Block Reference Validation

**Area:** Block environment operations

**Issue:** Block reference content validation not fully implemented

**Files:**
- `src/main/kotlin/riven/core/service/block/BlockEnvironmentService.kt` (line 595)

**Impact:**
- New block content not validated before storage
- Invalid block payloads can be persisted
- Block validation strictness not enforced
- References may point to non-existent blocks

**Fix approach:**
- Implement comprehensive block payload validation
- Check references resolve to actual blocks/entities
- Validate against BlockType schema
- Apply strictness rules (NONE, SOFT, STRICT)
- Return validation errors in response

**Priority:** Medium - data quality

---

## Known Bugs

### 1. Incomplete User Profile Sync

**Area:** User authentication integration

**Issue:** User profile updates from Supabase auth trigger not fully implemented

**Files:**
- `src/main/kotlin/riven/core/configuration/auth/SecurityAuditorAware.kt` (context indicates manual sync required)

**Symptoms:**
- Phone number changes in Supabase not synced to users table
- User avatar/profile updates not reflected
- Staleness between auth.users and users table

**Files:** `schema.sql` (lines 101-115) shows trigger exists but may miss updates

**Trigger:** `on_auth_user_created` trigger only handles new users, not updates

**Workaround:** Manual sync query against auth.users required

**Fix approach:**
- Add update trigger for phone confirmation changes
- Sync avatar_url changes from auth.users
- Handle profile data from raw_user_meta_data
- Implement scheduled reconciliation job

**Priority:** Low - affects new user auth flows

---

### 2. Exception Handling in UUID Parsing

**Area:** Block environment ID mapping

**Issue:** Silent failure when widget IDs are not valid UUIDs

**Files:**
- `src/main/kotlin/riven/core/service/block/BlockEnvironmentService.kt` (lines 133-141, 144-150)

**Symptoms:**
- Widget IDs that are not UUIDs skip ID mapping without notification
- Frontend may receive unmapped IDs in response
- Layout widgets with string IDs silently ignored
- Incomplete ID mappings cause sync issues

**Code pattern:**
```kotlin
try {
    val widgetId = UUID.fromString(widget.id)
    mapping[widgetId]?.let { newId -> widget.id = newId.toString() }
} catch (e: Exception) {
    logger.warn { "Widget ${widget.id} is not currently assigned a valid UUID..." }
    // No indication to caller - mapping continues
}
```

**Workaround:** None - behavior is silent

**Fix approach:**
- Validate widget IDs are UUIDs before operation
- Return validation error if non-UUID IDs found
- Update frontend widget ID format to ensure UUID compliance
- Log warnings with structured context for debugging

**Priority:** Medium - could cause sync issues

---

### 3. Potential N+1 Query in Block Children Fetching

**Area:** Block hierarchy loading

**Issue:** `BlockService` loads blocks individually in loops potentially causing N+1 queries

**Files:**
- `src/main/kotlin/riven/core/service/block/BlockService.kt` (line 251)
- Pattern of `findById` calls in iteration visible in `BlockChildrenService.kt` (line 52)

**Symptoms:**
- Slow block tree loading for large hierarchies
- Excessive database queries
- High latency when fetching blocks with many children

**Mitigated by:**
- Batch fetch with `findAllById()` is used in some places (line 251: `blockRepository.findAllById(ids)`)
- But inconsistent pattern across codebase

**Fix approach:**
- Audit all iteration patterns for single-row fetches
- Use `findAllById()` for batch operations
- Implement query batching for relationship loading
- Add performance tests for large block trees
- Consider JPA fetch strategies (eager/lazy loading)

**Priority:** Low - appears to be mitigated in critical paths

---

## Security Considerations

### 1. Row-Level Security (RLS) Not Fully Enforced in App Layer

**Area:** Multi-tenancy and authorization

**Risk:** Application relies on database RLS for multi-tenancy, but app-layer authorization checks are inconsistent

**Files:**
- `schema.sql` (lines 42-52) - RLS policy defined
- Controllers have `@PreAuthorize("@workspaceSecurity.hasWorkspace()")` in BlockEnvironmentController but missing in others

**Current mitigation:**
- RLS policies on workspace tables prevent cross-org data access
- JPA entities mapped to tables with RLS
- Some controllers use `@PreAuthorize` annotations

**Recommendations:**
- Add `@PreAuthorize` to ALL endpoints that access org data
- Validate workspace_id in request matches authenticated user's workspace
- Add integration tests for RLS with multiple users
- Document security boundary clearly in code
- Consider application-layer verification as backup to RLS

**Priority:** High - multi-tenancy security

---

### 2. No Input Size Limits on Entity Payloads

**Area:** Request payload validation

**Risk:** Entity payloads (JSONB) not size-limited, could allow DoS via large payloads

**Files:**
- Controllers accept raw payloads without size validation
- JSONB columns accept unlimited JSON

**Current mitigation:** None detected

**Recommendations:**
- Add `@RequestParam @Size` or `@RequestBody` size limits
- Implement max payload size in SecurityConfig
- Add rate limiting on entity creation endpoints
- Monitor payload sizes in production
- Document maximum payload size constraints

**Priority:** Medium - DoS vector

---

### 3. Sensitive Data in Activity Logs

**Area:** Audit logging

**Risk:** Activity logs store full relationship definitions including potentially sensitive field names

**Files:**
- `src/main/kotlin/riven/core/service/entity/type/EntityTypeRelationshipService.kt` (lines 520-537)
- `src/main/kotlin/riven/core/service/activity/ActivityService.kt` (line 43)

**Current mitigation:** Activity logs captured but access control not visible

**Recommendations:**
- Review what relationship data is logged
- Implement activity log access controls (who can view)
- Mask sensitive relationship names in logs if needed
- Consider separate audit table with restricted access
- Add retention policy for activity logs

**Priority:** Low - depends on activity log visibility

---

## Performance Bottlenecks

### 1. SchemaService Recursive Validation

**Area:** JSON Schema validation

**Problem:** `SchemaService.validate()` uses recursive validation for nested objects, could be slow for large schemas

**Files:**
- `src/main/kotlin/riven/core/service/schema/SchemaService.kt` (lines 140-185)

**Cause:**
- Custom recursive validation beyond networknt library capabilities
- No caching of schema validation rules
- Validates same schema multiple times per request

**Improvement path:**
- Cache compiled schema validation rules
- Use networknt library more directly for recursion
- Add performance metrics for validation time
- Consider schema compilation at type publish time
- Add validation timeout for pathological schemas

**Priority:** Medium - affects entity creation

---

### 2. Block Tree Hydration Performance

**Area:** Block reference resolution

**Problem:** `BlockReferenceHydrationService` hydrates blocks but batching strategy unclear

**Files:**
- `src/main/kotlin/riven/core/service/block/BlockReferenceHydrationService.kt` (143 lines)
- Used by `BlockEnvironmentService` (line 351: TODO comment about batch integration)

**Cause:**
- Reference resolution happens after loading block tree
- Unclear if entity references are batched
- Block references may trigger recursive hydration

**Improvement path:**
- Implement batch entity reference loading
- Add prefetch hints for common reference patterns
- Cache frequently accessed entities/blocks
- Add profiling to identify hotspots
- Consider lazy loading for reference metadata

**Priority:** Low - not critical path yet

---

## Fragile Areas

### 1. Bidirectional Relationship Synchronization

**Files:**
- `src/main/kotlin/riven/core/service/entity/type/EntityTypeRelationshipService.kt` (1,368 lines - largest service)

**Why fragile:**
- Complex cascading logic for inverse relationship creation/deletion
- Multiple interconnected operations: create, update, delete, handle cardinality, handle targets
- Many helper methods with side effects
- Testing complexity: bidirectional changes affect both entity types
- Concurrency risk: two services could modify same relationships simultaneously

**Safe modification:**
- Changes to relationship creation must update inverse creation logic
- Changes to cardinality must update inversion rules (ONE_TO_MANY ↔ MANY_TO_ONE)
- Changes to removal must verify all inverse cleanup
- Add tests for bidirectional consistency after every change
- Use transactions to ensure atomic updates to both entity types

**Test coverage:**
- Model validation tests exist (EntityRelationshipDefinitionValidatorTest.kt)
- Need integration tests for service-level operations
- Need concurrent modification tests

**Critical methods requiring careful changes:**
- `createRelationships()` - creates inverse relationships
- `updateRelationships()` - handles diff application
- `removeRelationships()` - cascades to inverses
- `handleInverseNameChange()` - updates inverse references
- `handleCardinalityChange()` - must invert cardinality

---

### 2. Block Environment Batch Operations

**Files:**
- `src/main/kotlin/riven/core/service/block/BlockEnvironmentService.kt` (674 lines)
- `src/main/kotlin/riven/core/service/block/BlockChildrenService.kt` (440 lines)

**Why fragile:**
- Batch operations (ADD, MOVE, REMOVE, REORDER, UPDATE) executed sequentially in loop
- ID mapping happens after operations complete, requires careful tracking
- Cascade deletion can invalidate subsequent operations
- Operation ordering matters (REMOVE before REORDER)
- Version conflicts possible if concurrent saves

**Safe modification:**
- Changes to operation execution must verify cascade behavior
- Changes to ID mapping must track all affected widgets
- Test operation order sensitivity
- Verify conflict detection works for concurrent saves
- Add integration tests with complex operation sequences

**Test coverage:**
- TreeLayoutSerializationTest exists
- Need integration tests for actual BlockEnvironmentService operations
- Need concurrent operation tests

**Critical methods:**
- `filterCascadeDeletedOperations()` - filters invalid operations after cascade delete
- `normalizeOperations()` - deduplicates operations per block
- `executeOperations()` - applies changes and tracks ID mappings
- `applyIdMapping()` - updates layout after operation execution

---

### 3. Workflow Node Configuration Registry

**Files:**
- `src/main/kotlin/riven/core/service/workflow/WorkflowNodeConfigRegistry.kt` (264 lines)

**Why fragile:**
- Reflection-based registration of node configs
- Companion object lookup could fail silently
- Type parameter extraction fragile to class hierarchy changes
- Config schema registration happens at startup
- No versioning for config schemas

**Safe modification:**
- Changes to node config classes must update registry lookups
- Changes to companion object names break registration
- Verify all node configs register during startup
- Test registry initialization with various node types
- Add explicit registration verification

**Test coverage:**
- InitializationTest patterns needed
- Manual verification of registration output

---

## Test Coverage Gaps

### 1. Entity Relationship Service Integration Tests

**Untested area:** Complete relationship lifecycle (create, update, delete with bidirectional sync)

**Files:**
- `src/main/kotlin/riven/core/service/entity/type/EntityTypeRelationshipService.kt` (1,368 lines)

**What's not tested:**
- Bidirectional relationship creation and inverse validation
- Cardinality inversion (ONE_TO_MANY ↔ MANY_TO_ONE)
- Polymorphic relationship target handling
- Naming collision resolution
- Concurrent modification of related entity types
- Cascade deletion of inverse relationships

**Risk:** High - most complex service with no integration tests visible

**Blocks:** Cannot safely refactor or extend this service

---

### 2. Entity Validation with Relationship Constraints

**Untested area:** `EntityValidationService.validateRelationshipEntity()` is stubbed

**Files:**
- `src/main/kotlin/riven/core/service/entity/EntityValidationService.kt`

**What's not tested:**
- Required relationship enforcement
- Cardinality constraint validation
- Polymorphic relationship type checking
- Entity payload validation against relationship constraints

**Risk:** High - no validation means invalid entities can exist

---

### 3. Block Environment Batch Operations

**Untested area:** Complex operation sequences with cascade deletion and ID mapping

**Files:**
- `src/main/kotlin/riven/core/service/block/BlockEnvironmentService.kt`

**What's not tested:**
- ADD, MOVE, REMOVE, UPDATE, REORDER in complex combinations
- Cascade deletion with dependent operations
- ID mapping accuracy after batch operations
- Version conflict detection and handling
- Concurrent saves with version numbers

**Risk:** Medium - complex orchestration without integration tests

---

### 4. Impact Analysis for Schema Changes

**Untested area:** Impact analysis calculations

**Files:**
- `src/main/kotlin/riven/core/service/entity/type/EntityTypeRelationshipImpactAnalysisService.kt`

**What's not tested:**
- Cardinality change impact detection
- Affected entity type calculation
- Data loss warning generation
- Bidirectional target removal impact

**Risk:** High - feature currently returns empty analysis

---

## Scaling Limits

### 1. Large Entity Type Schemas

**Current capacity:** Schemas stored as JSONB in single column

**Limit:** PostgreSQL JSONB has practical limits around deep nesting and property counts

**Scaling path:**
- Monitor schema size growth in production
- Implement schema compression if needed
- Consider schema versioning/archiving
- Add queries to find large schemas

---

### 2. Large Block Trees

**Current capacity:** Tree structure retrieved with parent-child links via multiple queries

**Limit:** N+1 query problem for deep trees or trees with many children

**Scaling path:**
- Implement batch child loading
- Add materialized path for quick ancestor queries
- Consider tree denormalization for common queries
- Cache frequently accessed block trees

---

### 3. Entity Relationship Count

**Current capacity:** Relationships stored in array within entity type, validated in memory

**Limit:** No apparent limit, but in-memory validation could be slow with many relationships

**Scaling path:**
- Monitor relationship counts per entity type
- Consider separate relationship table if counts grow large
- Implement lazy loading of relationships
- Add caching layer for relationship lookups

---

## Dependencies at Risk

### 1. Temporal Workflow Framework

**Risk:** Temporal 1.24.1 / 1.32.1 - multiple versions used across dependencies

**Impact:**
- Version mismatch could cause serialization issues
- Upgrading requires coordinating multiple packages

**Migration plan:**
- Audit all temporal dependencies for version consistency
- Pin to single version in dependency-management
- Test upgrade path before production use

---

### 2. JSON Schema Validator

**Risk:** networknt json-schema-validator 1.0.83 - Draft 2019-09 implementation

**Impact:**
- Future JSON Schema drafts (2024) not supported
- Custom validation extensions needed

**Migration plan:**
- Monitor validator library updates
- Plan for draft upgrade path
- Document custom validation rules separately

---

### 3. Supabase SDK (3.1.4)

**Risk:** Third-party auth/storage dependency on Supabase stability

**Impact:**
- Breaking changes in Supabase API
- No offline fallback for auth
- Storage operations fail if Supabase down

**Migration plan:**
- Abstract Supabase behind interfaces
- Implement circuit breaker for storage operations
- Add fallback auth mechanism
- Monitor Supabase SDK releases

---

## Missing Critical Features

### 1. Relationship Data Enforcement

**Problem:** No validation that entity instances match relationship constraints

**Blocks:**
- RELATIONSHIP entity types cannot be reliably used
- Polymorphic relationships may link to wrong types
- Cardinality constraints not checked on save

**Implementation needed:** Complete EntityValidationService.validateRelationshipEntity()

---

### 2. Schema Evolution Automation

**Problem:** Schema changes cause data inconsistency; migrations must be manual

**Blocks:**
- Cardinality changes cannot be applied safely
- Attribute removals leave stale data
- Relationship deletions leave orphaned references

**Implementation needed:**
- Automatic entity payload migration on schema change
- Data cleanup on relationship removal
- Backward compatibility checks

---

### 3. Complete Impact Analysis

**Problem:** Schema change impact not calculated

**Blocks:**
- Cannot show users what entities/data will be affected
- Cannot prevent data loss
- Cannot estimate user impact

**Implementation needed:** Implement EntityTypeRelationshipImpactAnalysisService.analyze()

---

## Summary of Critical Items

| Item | Severity | Blocks | Effort |
|------|----------|--------|--------|
| Impact Analysis Service (stubbed) | High | Schema changes | Large |
| Relationship Entity Validation (stubbed) | High | Entity integrity | Large |
| Relationship Data Cleanup (TODOs) | High | Data consistency | Large |
| Email Notifications | Medium | User experience | Medium |
| Workflow Node Config | Medium | Feature expansion | Large |
| Block Validation | Medium | Data quality | Medium |
| Security Authorization | High | Multi-tenancy | Medium |
| EntityRelationshipService fragility | High | Refactoring | Large |

---

*Concerns audit: 2026-02-07*
