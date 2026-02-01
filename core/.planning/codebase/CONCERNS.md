# Codebase Concerns

**Analysis Date:** 2026-01-09

## Tech Debt

**Stubbed Impact Analysis Service:**
- Issue: `EntityTypeRelationshipImpactAnalysisService.analyze()` returns empty analysis immediately
- Files: `core/src/main/kotlin/riven/core/service/entity/type/EntityTypeRelationshipImpactAnalysisService.kt` (lines 20-33)
- Why: Deferred with comment "Todo. Will need to flesh this out later once entity data has been modelled"
- Impact: Relationship modifications that could cause data loss are never analyzed. Users aren't warned about destructive operations.
- Fix approach: Implement impact analysis using lines 35-70 (currently unreachable dead code after early return)

**Incomplete Validation Methods:**
- Issue: `EntityValidationService.validateRelationshipEntity()` is stubbed with `TODO()`
- Files: `core/src/main/kotlin/riven/core/service/entity/EntityValidationService.kt` (line 49)
- Why: Relationship validation not yet implemented
- Impact: Relationship constraints not validated, potentially allowing invalid relationship data
- Fix approach: Implement validation logic checking cardinality, required fields, target entity existence

**Missing Block Deletion Implementation:**
- Issue: `BlockTypeService.deleteBlockType()` and `BlockService.deleteBlocks()` stubbed with `TODO()`
- Files:
  - `core/src/main/kotlin/riven/core/service/block/BlockTypeService.kt` (line 117)
  - `core/src/main/kotlin/riven/core/service/block/BlockService.kt` (line 285)
- Why: Deletion logic deferred
- Impact: Cannot delete block types or blocks, any call to these methods throws `NotImplementedError`
- Fix approach: Implement cascade deletion with proper cleanup of block_children relationships

**Dead Code After Early Return:**
- Issue: 35 lines of unreachable impact analysis code
- Files: `core/src/main/kotlin/riven/core/service/entity/type/EntityTypeRelationshipImpactAnalysisService.kt` (lines 35-70)
- Why: Early return at line 32 makes subsequent code unreachable
- Impact: Maintenance confusion, compiled but never executed
- Fix approach: Either activate this code (remove early return) or delete it entirely

## Known Bugs

**Activity Logging Before Validation:**
- Symptoms: Activity logs written before operations execute, orphaned logs if operations fail
- Trigger: Any `BlockEnvironmentService.saveEnvironment()` call that fails validation
- Files: `core/src/main/kotlin/riven/core/service/block/BlockEnvironmentService.kt` (lines 60-96)
- Workaround: None (logs are already committed)
- Root cause: Activity logging occurs before transactional boundary
- Fix: Move activity logging inside transaction or add compensating cleanup on failure

**TODO() Calls in Production Code:**
- Symptoms: Runtime `NotImplementedError` thrown
- Trigger: Calling any method with `TODO()` placeholder
- Files:
  - `core/src/main/kotlin/riven/core/service/entity/EntityValidationService.kt:49`
  - `core/src/main/kotlin/riven/core/service/workspace/WorkspaceService.kt:90` (avatar file upload)
  - `core/src/main/kotlin/riven/core/service/block/BlockTypeService.kt:117`
  - `core/src/main/kotlin/riven/core/service/block/BlockService.kt:285`
- Workaround: Avoid calling these methods
- Root cause: Incomplete implementation
- Fix: Implement methods or throw descriptive exceptions with error messages

## Security Considerations

**Hardcoded Secrets in .env File:**
- Risk: Production credentials exposed in plaintext
- Files: `core/.env` (contains database password, JWT secret, Supabase keys)
- Current mitigation: None (file should be gitignored but may have been committed previously)
- Recommendations:
  - Move all secrets to secure vault (GitHub Secrets, AWS Secrets Manager, HashiCorp Vault)
  - Create `.env.example` with placeholder values only
  - Rotate all exposed credentials immediately
  - Verify `.env` is in `.gitignore`

**Missing .env.example:**
- Risk: New developers cannot set up project without documentation
- Files: Should exist: `core/.env.example`
- Current mitigation: None
- Recommendations: Create `.env.example` with required keys (no values):
  - `SERVER_PORT`
  - `POSTGRES_DB_JDBC`
  - `JWT_AUTH_URL`
  - `JWT_SECRET_KEY`
  - `SUPABASE_URL`
  - `SUPABASE_KEY`
  - `ORIGIN_API_URL`

**No Validation of Configuration at Startup:**
- Risk: Application starts but fails at first use when config is missing
- Files: `core/src/main/kotlin/riven/core/configuration/properties/SecurityConfigurationProperties.kt`
- Current mitigation: None (lazy initialization)
- Recommendations: Add Spring `@ConfigurationPropertiesValidator` to fail fast on missing config

## Performance Bottlenecks

**Potential N+1 Query in Block Reference Hydration:**
- Problem: Block hydration may fetch references in loops
- Files: `core/src/main/kotlin/riven/core/service/block/BlockReferenceHydrationService.kt` (143 lines)
- Measurement: Not measured (no performance tests)
- Cause: Unclear without seeing full query patterns
- Improvement path: Add integration tests with query logging to verify batch operations

**Large Result Sets Not Paginated:**
- Problem: Relationship queries return unbounded lists
- Files:
  - `core/src/main/kotlin/riven/core/repository/entity/EntityRelationshipRepository.kt` (lines 20-26)
  - `core/src/main/kotlin/riven/core/service/entity/EntityService.kt`
- Measurement: Risk increases with entities having 1000s of relationships
- Cause: No pagination support in repository methods
- Improvement path: Add pagination parameters to repository methods, implement cursor-based pagination

## Fragile Areas

**EntityTypeRelationshipService (1,372 lines):**
- Files: `core/src/main/kotlin/riven/core/service/entity/type/EntityTypeRelationshipService.kt`
- Why fragile: Complex bidirectional relationship synchronization, cardinality inversion, polymorphic relationships
- Common failures: Relationship naming collisions, cardinality conflicts, orphaned inverse relationships
- Safe modification: Add comprehensive tests before changing, document invariants
- Test coverage: Limited (only 11 test files for 5,911+ lines of service code)

**BlockEnvironmentService Transactional Boundaries:**
- Files: `core/src/main/kotlin/riven/core/service/block/BlockEnvironmentService.kt`
- Why fragile: Batch operations in single transaction, activity logging outside transaction
- Common failures: Partial operations on validation failure, orphaned activity logs
- Safe modification: Ensure activity logging is transactional or add compensating cleanup
- Test coverage: Has tests (`BlockEnvironmentServiceTest.kt`)

## Scaling Limits

**Not Applicable (Early Stage):**
- No current scaling limits identified
- Application designed for multi-tenancy with RLS
- Database capacity depends on Supabase plan

## Dependencies at Risk

**Massive IconType Enum (1,670 lines):**
- Risk: Single file containing 700+ icon type enum values
- Files: `core/src/main/kotlin/riven/core/enums/common/icon/IconType.kt`
- Impact: Large compiled class size, maintainability issues
- Migration plan: Split into categories (e.g., `IconTypeArrows.kt`, `IconTypeUI.kt`) or generate from configuration

## Missing Critical Features

**No .env.example File:**
- Problem: New developers cannot set up environment
- Files: Should exist: `core/.env.example`, `client/.env.example`
- Current workaround: None (must reference code or documentation)
- Blocks: Local development setup
- Implementation complexity: Low (create template file)

**No Operational Runbook:**
- Problem: No documentation for production operations
- Files: Should exist: `core/OPERATIONS.md`
- Current workaround: None
- Blocks: Production troubleshooting, failure recovery
- Implementation complexity: Medium (requires operational knowledge)

## Test Coverage Gaps

**Service Layer Insufficiently Tested:**
- What's not tested: EntityTypeService, EntityAttributeService, EntityService (no test files)
- Files:
  - `core/src/main/kotlin/riven/core/service/entity/type/EntityTypeService.kt` (492 lines) - No test file
  - `core/src/main/kotlin/riven/core/service/entity/type/EntityAttributeService.kt` (168 lines) - No test file
  - `core/src/main/kotlin/riven/core/service/entity/EntityService.kt` (371 lines) - No test file
  - `core/src/main/kotlin/riven/core/service/block/BlockReferenceHydrationService.kt` (143 lines) - No test file
- Risk: Critical business logic lacks unit test coverage, refactoring is risky
- Priority: High
- Difficulty to test: Medium (requires mocking repositories and dependencies)

**Complex Relationship Orchestration Undertested:**
- What's not tested: Polymorphic relationship tests, complex cardinality change scenarios
- Files: `core/src/main/kotlin/riven/core/service/entity/type/EntityTypeRelationshipService.kt` (1,372 lines)
- Risk: Bidirectional synchronization, cardinality inversion logic may break
- Priority: High
- Difficulty to test: High (requires comprehensive integration tests)

**Impact Analysis Workflow Not Tested:**
- What's not tested: Full impact analysis flow (currently stubbed)
- Files: `core/src/main/kotlin/riven/core/service/entity/type/EntityTypeRelationshipImpactAnalysisService.kt`
- Risk: When implemented, may not work correctly
- Priority: Medium (implement first, then test)
- Difficulty to test: Medium (requires test data with relationships)

---

*Concerns audit: 2026-01-09*
*Update as issues are fixed or new ones discovered*
