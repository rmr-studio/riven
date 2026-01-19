# Codebase Concerns

**Analysis Date:** 2026-01-18

## Tech Debt

**Stubbed/TODO Implementations (Critical):**
- Issue: Multiple critical service methods contain `TODO()` stubs that throw NotImplementedError at runtime
- Files:
  - `core/src/main/kotlin/riven/core/service/entity/EntityValidationService.kt:49` - `validateRelationshipEntity()` is completely stubbed
  - `core/src/main/kotlin/riven/core/service/workspace/WorkspaceService.kt:90` - Avatar upload is stubbed
  - `core/src/main/kotlin/riven/core/service/block/BlockTypeService.kt:117` - Critical block type method stubbed
  - `core/src/main/kotlin/riven/core/service/block/BlockService.kt:285` - `deleteBlocks()` is stubbed
- Impact: Runtime failures when these code paths are exercised; relationship validation is non-functional
- Fix approach: Implement the stubbed methods or add explicit feature flags to prevent invocation

**Incomplete Workflow Node Deserialization:**
- Issue: WorkflowNodeDeserializer throws input mismatch exceptions for ACTION, CONTROL_FLOW, HUMAN_INTERACTION, and UTILITY node types
- Files: `core/src/main/kotlin/riven/core/deserializer/WorkflowNodeDeserializer.kt:80-169`
- Impact: Workflows using these node types will fail during JSON parsing
- Fix approach: Implement concrete node classes for each subtype and wire up deserialization routing

**Entity Relationship Data Cleanup Not Implemented:**
- Issue: Deleting relationships does not clean up actual entity relationship data
- Files:
  - `core/src/main/kotlin/riven/core/service/entity/type/EntityTypeRelationshipService.kt:542-546`
  - `core/src/main/kotlin/riven/core/service/entity/type/EntityTypeRelationshipService.kt:598-603`
  - `core/src/main/kotlin/riven/core/service/entity/type/EntityTypeRelationshipService.kt:723`
  - `core/src/main/kotlin/riven/core/service/entity/type/EntityTypeRelationshipService.kt:1010-1016`
  - `core/src/main/kotlin/riven/core/service/entity/type/EntityTypeRelationshipService.kt:1075-1080`
- Impact: Orphaned relationship data remains in entity payloads after relationship type deletion; potential data integrity issues
- Fix approach: Implement entity data migration/cleanup logic before relationship removal

**Email Notifications Not Implemented:**
- Issue: Workspace invite workflow has placeholder comments for email sending
- Files:
  - `core/src/main/kotlin/riven/core/service/workspace/WorkspaceInviteService.kt:84` - Invitation email
  - `core/src/main/kotlin/riven/core/service/workspace/WorkspaceInviteService.kt:145` - Acceptance email
  - `core/src/main/kotlin/riven/core/service/workspace/WorkspaceInviteService.kt:155` - Rejection email
- Impact: Workspace invitations are created but users receive no email notification
- Fix approach: Integrate email service (e.g., SendGrid, SES) and implement email templates

**Workflow DAG Execution Context Incomplete:**
- Issue: Sequential workflow execution does not properly populate data registry between nodes
- Files:
  - `core/src/main/kotlin/riven/core/service/workflow/engine/coordinator/WorkflowCoordinationService.kt:147-148`
  - `core/src/main/kotlin/riven/core/service/workflow/engine/coordinator/WorkflowCoordinationService.kt:358`
- Impact: Node outputs not available to subsequent nodes during DAG execution; sequential workflows may fail
- Fix approach: Implement context propagation between nodes in DAG coordinator

**Block Reference Service Integration Missing:**
- Issue: Block reference resolution returns hardcoded UNSUPPORTED warning
- Files: `core/src/main/kotlin/riven/core/service/block/BlockEnvironmentService.kt:351`
- Impact: Block-to-block references cannot be hydrated; cross-block composition broken
- Fix approach: Implement BlockReferenceService and wire into BlockEnvironmentService

**Entity Payload Mapping Incomplete for Workflows:**
- Issue: CreateEntityActionNode and UpdateEntityActionNode use placeholder empty payloads
- Files:
  - `core/src/main/kotlin/riven/core/models/workflow/actions/UpdateEntityActionNode.kt:70-71`
  - `core/src/main/kotlin/riven/core/models/workflow/actions/CreateEntityActionNode.kt:69-70`
- Impact: Workflow entity creation/updates have no payload data; entities created without field values
- Fix approach: Implement proper payload mapping from workflow node config to entity schema

## Known Bugs

**EntityValidationServiceTest Documents Known Bug:**
- Symptoms: Tests document expected behavior that differs from actual implementation
- Files:
  - `core/src/test/kotlin/riven/core/service/entity/EntityValidationServiceTest.kt:1453`
  - `core/src/test/kotlin/riven/core/service/entity/EntityValidationServiceTest.kt:1510`
- Trigger: Specific validation edge cases
- Workaround: Tests have comments indicating expected vs actual behavior

**Workspace nodeId Reference in WorkflowCoordinationService:**
- Symptoms: Variable `nodeId` referenced but not defined in scope
- Files: `core/src/main/kotlin/riven/core/service/workflow/engine/coordinator/WorkflowCoordinationService.kt:137,156,161,221,225`
- Trigger: Executing workflow nodes
- Workaround: Code appears to use `node.id` or `node` parameter inconsistently

## Security Considerations

**No Credential Exposure Detected:**
- Risk: Low - AuthTokenService properly handles JWT extraction
- Files: `core/src/main/kotlin/riven/core/service/auth/AuthTokenService.kt`
- Current mitigation: JWT claims extracted without exposing secrets; env vars for sensitive config
- Recommendations: Ensure all API keys remain in environment variables; audit `.env` file handling

**CORS and Security Config:**
- Risk: Configuration-dependent
- Files: `core/src/main/kotlin/riven/core/configuration/SecurityConfig.kt` (referenced in CLAUDE.md)
- Current mitigation: Spring Security with OAuth2 Resource Server
- Recommendations: Review CORS allowed origins before production deployment

## Performance Bottlenecks

**Large Service Classes:**
- Problem: EntityTypeRelationshipService is 1,372 lines; complex single-class responsibilities
- Files: `core/src/main/kotlin/riven/core/service/entity/type/EntityTypeRelationshipService.kt`
- Cause: All relationship operations concentrated in one service
- Improvement path: Decompose into smaller focused services (creation, modification, deletion, validation)

**Potential N+1 Query in Block Tree Building:**
- Problem: Block tree traversal may trigger multiple DB queries per child block
- Files: `core/src/main/kotlin/riven/core/service/block/BlockService.kt:247-254`
- Cause: Recursive BFS with lazy entity loading
- Improvement path: Already uses batch fetch in layout-driven approach; ensure BFS path also batches

**Sequential Workflow Node Execution:**
- Problem: DAG parallel execution is "glorified sequential" per code comment
- Files: `core/src/main/kotlin/riven/core/service/workflow/engine/coordinator/WorkflowCoordinationService.kt:96-97`
- Cause: Missing true parallel execution infrastructure
- Improvement path: Implement Temporal child workflows for parallel branches

## Fragile Areas

**EntityTypeRelationshipService Bidirectional Logic:**
- Files: `core/src/main/kotlin/riven/core/service/entity/type/EntityTypeRelationshipService.kt`
- Why fragile: Complex state synchronization between ORIGIN and REFERENCE relationships; cascading updates across multiple entity types
- Safe modification: Always modify relationships through the service layer; never update entity type relationships directly in DB
- Test coverage: 1,986 lines of tests (`EntityTypeRelationshipServiceTest.kt`) - relatively well tested

**Block Environment Transaction Boundary:**
- Files: `core/src/main/kotlin/riven/core/service/block/BlockEnvironmentService.kt:46-119`
- Why fragile: Complex multi-phase operation (filter, normalize, execute, map IDs, save layout) within single transaction
- Safe modification: Test with various operation combinations; verify rollback behavior
- Test coverage: 1,673 lines of tests - good coverage

**Workflow Node Polymorphic Dispatch:**
- Files:
  - `core/src/main/kotlin/riven/core/service/workflow/engine/coordinator/WorkflowCoordinationService.kt:174-182`
  - `core/src/main/kotlin/riven/core/deserializer/WorkflowNodeDeserializer.kt`
- Why fragile: Multiple layers of type discrimination (nodeType -> subType -> concrete class); easy to miss cases
- Safe modification: Add new node types through sealed class hierarchy; update deserializer mapping
- Test coverage: Limited integration tests for workflow execution

## Scaling Limits

**Test Coverage Ratio:**
- Current capacity: 27 test files for 297 source files (~9% file ratio)
- Limit: Integration tests are present but unit test coverage appears incomplete
- Scaling path: Increase unit test coverage, especially for workflow engine and block services

**Large Test Files:**
- Current capacity: Several test files exceed 1,000 lines
- Limit: Maintenance difficulty; slow test feedback
- Scaling path: Split large test files by functionality; use nested test classes

## Dependencies at Risk

**None Identified:**
- No deprecated dependencies detected in main source code
- Kotlin 2.1.21 and Spring Boot 3.5.3 are current versions
- Risk: Monitor Temporal SDK updates for breaking changes in workflow system

## Missing Critical Features

**Impact Analysis Service Stub:**
- Problem: `EntityTypeRelationshipImpactAnalysisService.analyze()` returns empty analysis
- Blocks: Cannot warn users about data loss before destructive schema changes
- Files: Mentioned in CLAUDE.md as known incomplete

**Block Environment Overwrite:**
- Problem: `overwriteBlockEnvironment()` throws NotImplementedError
- Files: `core/src/main/kotlin/riven/core/service/block/BlockEnvironmentService.kt:228-230`
- Blocks: Cannot recover from version conflicts in block editing

**Schema Breaking Change Queries:**
- Problem: Schema validation of existing data is marked with TODOs
- Files:
  - `core/src/main/kotlin/riven/core/service/entity/EntityValidationService.kt:138-141`
  - `core/src/main/kotlin/riven/core/service/entity/EntityValidationService.kt:155-160`
- Blocks: Cannot automatically determine if schema changes are safe based on current data

## Test Coverage Gaps

**Workflow Engine Execution:**
- What's not tested: Full end-to-end workflow execution with complex DAG structures
- Files:
  - `core/src/main/kotlin/riven/core/service/workflow/engine/coordinator/WorkflowCoordinationService.kt`
  - `core/src/main/kotlin/riven/core/service/workflow/coordinator/DagExecutionCoordinator.kt`
- Risk: DAG execution bugs may not be caught; parallel execution issues
- Priority: High - critical business logic

**WorkflowNodeDeserializer Untested Paths:**
- What's not tested: ACTION, CONTROL_FLOW, HUMAN_INTERACTION, UTILITY node types
- Files: `core/src/main/kotlin/riven/core/deserializer/WorkflowNodeDeserializer.kt`
- Risk: These paths throw exceptions; no tests verify error behavior
- Priority: Medium - blocked by implementation

**DefaultBlockEnvironmentService:**
- What's not tested: No dedicated test file found
- Files: `core/src/main/kotlin/riven/core/service/block/DefaultBlockEnvironmentService.kt`
- Risk: Default environment creation may have bugs
- Priority: Medium

**EntityRelationshipService:**
- What's not tested: Entity-level relationship CRUD (vs type-level)
- Files: `core/src/main/kotlin/riven/core/service/entity/EntityRelationshipService.kt`
- Risk: Runtime failures when managing entity relationships
- Priority: High - core feature

---

*Concerns audit: 2026-01-18*
