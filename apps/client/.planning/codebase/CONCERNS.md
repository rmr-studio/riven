# Codebase Concerns

**Analysis Date:** 2026-01-19

## Tech Debt

**Blocks System - Incomplete Save Functionality:**

- Issue: Layout save/conflict resolution partially implemented with TODOs for critical paths
- Files: `components/feature-modules/blocks/context/layout-change-provider.tsx`
- Impact: Users cannot resolve version conflicts when multiple editors modify same layout. "use-theirs" and "keep-mine" conflict resolution paths are stubbed out (lines 574-587)
- Fix approach: Implement complete conflict resolution with server API endpoints for force-overwrite and reload-from-server operations

**Blocks System - Context Migration Needed:**

- Issue: BlockEnvironmentProvider uses React Context when Zustand would be more appropriate
- Files: `components/feature-modules/blocks/context/block-environment-provider.tsx` (line 39)
- Impact: Performance overhead from Context re-renders, more complex state management patterns
- Fix approach: Migrate to Zustand store with selector-based subscriptions (similar to entity type config pattern)

**Entity System - Incomplete Type Constraints:**

- Issue: Entity attribute constraints not fully implemented
- Files: `components/feature-modules/entity/hooks/use-entity-type-table.tsx` (line 204)
- Impact: Additional validation rules (min/max length, regex patterns) cannot be configured through UI
- Fix approach: Add form fields for all constraint types in attribute configuration form

**Entity System - Missing Location Widget:**

- Issue: Location schema type falls back to generic text input
- Files: `components/feature-modules/entity/components/forms/instance/entity-field-registry.tsx` (line 37)
- Impact: No address autocomplete, map selection, or structured location data for location fields
- Fix approach: Create LocationWidget with Google Maps integration (library already available via `@googlemaps/js-api-loader`)

**Blocks System - Inefficient Layout Comparison:**

- Issue: Layout equality check uses JSON.stringify for deep comparison
- Files: `components/feature-modules/blocks/context/layout-change-provider.tsx` (lines 669-677)
- Impact: Performance overhead on every layout change event, O(n) string comparison
- Fix approach: Implement structural diffing with layout hash or incremental dirty tracking

**Rich Editor - Excessive Debug Logging:**

- Issue: Development console logs scattered throughout rich editor without centralized toggle
- Files: `components/ui/rich-editor/block.tsx` (lines 964-1137), `components/ui/rich-editor/handlers/keyboard-handlers.ts` (lines 38-60), `components/ui/rich-editor/handlers/block/block-event-handlers.ts` (lines 80-133)
- Impact: Clutters console in development, potential performance impact from frequent logging
- Fix approach: Replace inline `process.env.NODE_ENV` checks with centralized debug flag in editor store (already has `debug` option at line 284)

**Blocks System - Missing Backend Persistence:**

- Issue: Block operations tracked but save operations incomplete
- Files: `components/feature-modules/blocks/context/block-environment-provider.tsx` (lines 363, 430), `components/feature-modules/blocks/context/tracked-environment-provider.tsx` (line 65), `components/feature-modules/blocks/util/command/commands.ts` (lines 105, 154)
- Impact: Block reordering and list insertion operations don't preserve index correctly on save/reload
- Fix approach: Store original index positions in command metadata, implement proper index restoration

**Blocks System - Incomplete Edit Functionality:**

- Issue: Editable cell save stubbed out with TODO
- Files: `components/ui/data-table/components/cells/editable-cell.tsx` (line 91)
- Impact: Users cannot edit entity data directly in table cells
- Fix approach: Wire up to entity mutation hooks, call EntityInstanceService.updateInstance

**Rich Editor - Image Upload Error Handling:**

- Issue: Cover image upload failures only log to console without user feedback
- Files: `components/ui/rich-editor/block.tsx` (line 674), `components/ui/rich-editor/CoverImage.tsx` (line 70), `components/ui/rich-editor/command-menu.tsx` (lines 236, 334)
- Impact: Silent failures confuse users, no retry mechanism
- Fix approach: Add toast notifications for upload errors, implement retry logic

**Authentication - Incomplete Public Routes:**

- Issue: Public route configuration commented out with TODO
- Files: `components/feature-modules/authentication/util/auth.util.ts` (line 23)
- Impact: May break during continuous integration, route protection incomplete
- Fix approach: Complete public routes list based on app/auth/\* directory structure

**Workspace - Missing Preview Implementation:**

- Issue: Workspace form preview component is a stub
- Files: `components/feature-modules/workspace/components/form/workspace-preview.tsx` (line 9)
- Impact: Users cannot preview workspace appearance before creating
- Fix approach: Implement preview using WorkspaceCard component with form values

## Known Bugs

**Rich Editor - Selection Restoration Failures:**

- Symptoms: Cursor position lost after certain operations, selection not restored after formatting
- Files: `components/ui/rich-editor/handlers/selection-handlers.ts` (lines 174, 196, 317), `components/ui/rich-editor/utils/editor-helpers.ts` (line 541)
- Trigger: Applying formatting to selected text, moving nodes in tree
- Workaround: Multiple fallback strategies in place (warns but doesn't crash)

**Blocks System - Non-Critical Grid Errors:**

- Symptoms: Console debug messages during grid operations: "Grid resize/drag start handler error", "Grid sync error", "ResizeObserver callback error"
- Files: `components/feature-modules/blocks/hooks/use-environment-grid-sync.tsx` (lines 89, 133, 154, 190, 212), `components/feature-modules/blocks/components/sync/widget.sync.tsx` (lines 114, 119), `components/feature-modules/blocks/context/grid-container-provider.tsx` (lines 141, 180, 197, 271, 285, 298, 306), `components/feature-modules/blocks/util/grid/grid.util.ts` (line 22)
- Trigger: During drag/resize operations, especially with nested grids
- Workaround: Errors caught and logged as non-critical, operations continue

**Rich Editor - Tree Operation Warnings:**

- Symptoms: Console warnings for invalid tree operations: "Cannot move a node to itself", "Node not found"
- Files: `components/ui/rich-editor/utils/tree-operations.ts` (lines 214, 306, 313, 320)
- Trigger: Attempting invalid drag operations, race conditions during node deletion
- Workaround: Operations safely rejected with warning

## Security Considerations

**TypeScript Type Safety Bypasses:**

- Risk: Extensive use of `any` type weakens type safety
- Files: `lib/util/utils.ts` (lines 128, 148, 182), `lib/util/form/entity-instance-validation.util.ts` (lines 15, 57, 60, 115), `lib/util/debounce.util.ts` (lines 4, 27, 76), `components/ui/data-table/data-table.tsx` (lines 84, 129-130, 238, 244, 285), `components/ui/data-table/data-table.store.ts` (49 occurrences)
- Current mitigation: Types enforced at API boundaries via OpenAPI schemas
- Recommendations: Replace `any` with proper generic types or union types, especially in utility functions and form validation

**Environment Variables Exposure:**

- Risk: Public environment variables embedded in client bundle
- Files: `lib/util/utils.ts` (line 76), `lib/util/supabase/client.ts` (lines 7-8, 39-40), `lib/util/storage/storage.util.ts` (line 60), `components/feature-modules/authentication/util/auth.util.ts` (line 172)
- Current mitigation: Only NEXT*PUBLIC*\* variables exposed (Next.js convention), Supabase uses anon key (safe for client-side)
- Recommendations: Audit all NEXT*PUBLIC* variables to ensure no sensitive data leaked

**Safari Compatibility Workaround:**

- Risk: Using deprecated `addListener`/`removeListener` API
- Files: `hooks/use-media-query.ts` (line 46)
- Current mitigation: Intentional fallback for Safari < 14 compatibility
- Recommendations: Monitor Safari version adoption, remove when safe

**Experimental API Usage:**

- Risk: EyeDropper API not standardized
- Files: `components/ui/rich-editor/color-picker-index.tsx` (line 281)
- Current mitigation: Type assertion with @ts-expect-error, feature detection before use
- Recommendations: Provide fallback color picker for browsers without EyeDropper support

## Performance Bottlenecks

**Rich Editor - Large Files:**

- Problem: Rich editor core files exceed 1000 lines
- Files: `components/ui/rich-editor/templates.ts` (3930 lines), `components/ui/rich-editor/demo-content.ts` (2573 lines), `components/ui/rich-editor/editor.tsx` (1365 lines), `components/ui/rich-editor/lib/reducer/editor-reducer.ts` (1241 lines), `components/ui/rich-editor/block.tsx` (1138 lines)
- Cause: Monolithic template data, complex editor logic in single files
- Improvement path: Split templates into separate files, extract reducer actions, code-split demo content

**Blocks System - Complex Provider Hierarchy:**

- Problem: Deep provider nesting for block environment (7+ context providers)
- Files: `components/feature-modules/blocks/context/*-provider.tsx` (BlockEnvironmentProvider, GridProvider, LayoutChangeProvider, BlockEditProvider, BlockFocusProvider, LayoutHistoryProvider, TrackedEnvironmentProvider)
- Cause: Feature-rich block system requires multiple context layers
- Improvement path: Consolidate related providers, migrate to Zustand where appropriate, use Context composition patterns

**Data Table - Filter Operations:**

- Problem: Nested value extraction on every filter check
- Files: `components/ui/data-table/data-table.tsx` (line 238)
- Cause: Dynamic property path traversal without memoization
- Improvement path: Memoize accessor functions, use TanStack Table's built-in column accessors

**Date Picker - Complex Component:**

- Problem: DatePicker component is 1064 lines
- Files: `components/ui/forms/date-picker/date-picker.tsx`
- Cause: All date/time logic in single file (formatting, parsing, timezone handling)
- Improvement path: Extract parsing/formatting utilities, split input and calendar components

## Fragile Areas

**Blocks System - GridStack Integration:**

- Files: `components/feature-modules/blocks/hooks/use-environment-grid-sync.tsx`, `components/feature-modules/blocks/context/grid-provider.tsx`, `components/feature-modules/blocks/context/grid-container-provider.tsx`
- Why fragile: Complex two-way synchronization between React state and imperative GridStack API, multiple event listeners, timing-sensitive operations
- Safe modification: Always use the grid lock mechanism via `useBlockFocus`, test drag/resize/nest operations thoroughly, avoid direct GridStack API calls outside providers
- Test coverage: No integration tests for GridStack synchronization

**Blocks System - Layout Version Control:**

- Files: `components/feature-modules/blocks/context/layout-change-provider.tsx`
- Why fragile: Version mismatch detection, ID mapping after save, baseline snapshot management, command history integration
- Safe modification: Never reset localVersion to 0 (see line 33 comment), always check conflict flag before updating cache, preserve idMappings for ID resolution
- Test coverage: No tests for conflict resolution or version control

**Rich Editor - Block Memoization:**

- Files: `components/ui/rich-editor/block.tsx` (lines 960-1137)
- Why fragile: Custom React.memo with complex equality check relies on Zustand structural sharing, node cache must stay synchronized
- Safe modification: Never use `as` type assertions for node data, maintain stable callback references from parent, understand DEBUG flag is development-only
- Test coverage: No tests for memoization logic

**Block Environment - State Synchronization:**

- Files: `components/feature-modules/blocks/context/block-environment-provider.tsx`, `components/feature-modules/blocks/util/environment/environment.util.ts`
- Why fragile: Manual hierarchy/treeIndex/trees map synchronization, imperative tree mutations with success/failure states
- Safe modification: Always update all three maps together (hierarchy, treeIndex, trees), check `success` flag before proceeding, use structuredClone for environment snapshots
- Test coverage: No tests for environment state management

**Entity System - Dynamic Form Generation:**

- Files: `lib/util/form/entity-instance-validation.util.ts`, `components/feature-modules/entity/components/forms/instance/entity-field-registry.tsx`
- Why fragile: Runtime Zod schema construction from entity type definition, registry pattern for dynamic field types
- Safe modification: Always provide default values for new schema types, handle invalid regex patterns gracefully (error logged at line 107), extend registry before using new field types
- Test coverage: No tests for schema validation or form generation

## Scaling Limits

**GridStack Performance:**

- Current capacity: Tested with ~50 widgets per grid
- Limit: GridStack performance degrades with 100+ widgets, especially with nested grids
- Scaling path: Implement virtualization for large block lists, consider pagination for entity reference blocks

**Rich Editor Content Size:**

- Current capacity: Documents up to ~5000 blocks
- Limit: Re-render performance suffers with deep nesting (>10 levels) and large documents
- Scaling path: Implement windowing/virtualization, lazy-load collapsed sections, optimize memo strategy

**Entity Type Attributes:**

- Current capacity: ~50 attributes per entity type
- Limit: Form rendering and validation become slow with 100+ attributes
- Scaling path: Implement tabbed attribute groups, virtualized attribute lists

**TanStack Query Cache:**

- Current capacity: Default cache size handles typical usage
- Limit: No cache eviction strategy configured
- Scaling path: Configure `cacheTime` and `staleTime` appropriately, implement cache size limits

## Dependencies at Risk

**Gridstack:**

- Risk: v12.3.3 uses jQuery internally (heavy dependency), limited TypeScript support
- Impact: Bundle size impact, imperative API conflicts with React patterns
- Migration plan: Monitor for React-native alternatives (react-grid-layout is candidate), consider custom drag-and-drop solution using @dnd-kit (already in dependencies)

**React 19:**

- Risk: Recently released (19.0.0), ecosystem libraries may have compatibility issues
- Impact: Some libraries not yet tested with React 19
- Migration plan: Pin versions, test thoroughly, monitor library update compatibility

**Supabase SDK:**

- Risk: v2.50.0 breaking changes between major versions
- Impact: Authentication and storage patterns may need refactoring
- Migration plan: Pin to 2.x range, plan migration when 3.x stabilizes

## Missing Critical Features

**Undo/Redo for Block Content:**

- Problem: Command system only tracks structural changes, not content edits
- Blocks: Users cannot undo text edits, only layout changes
- Priority: Medium

**Offline Support:**

- Problem: No service worker, no offline caching
- Blocks: Application unusable without network
- Priority: Low

**Real-time Collaboration:**

- Problem: Conflict detection only on save, no live cursors or presence
- Blocks: Users can overwrite each other's changes unknowingly
- Priority: Medium

**Bulk Operations:**

- Problem: No multi-select for blocks, no batch entity operations
- Blocks: Users must modify items one at a time
- Priority: Medium

**Advanced Search:**

- Problem: No full-text search across entities or blocks
- Blocks: Users cannot find content efficiently
- Priority: High

## Test Coverage Gaps

**Blocks System - Integration Tests:**

- What's not tested: GridStack synchronization, layout version control, conflict resolution, ID mapping after save
- Files: `components/feature-modules/blocks/context/layout-change-provider.tsx`, `components/feature-modules/blocks/hooks/use-environment-grid-sync.tsx`, `components/feature-modules/blocks/context/grid-provider.tsx`
- Risk: Version control bugs, grid state desync, lost changes on save
- Priority: High

**Entity System - Form Validation:**

- What's not tested: Dynamic Zod schema generation, entity instance validation, regex pattern validation
- Files: `lib/util/form/entity-instance-validation.util.ts`, `components/feature-modules/entity/components/forms/instance/entity-field-registry.tsx`
- Risk: Invalid data saved, runtime schema errors, regex crashes
- Priority: High

**Rich Editor - Tree Operations:**

- What's not tested: Node movement validation, tree structure integrity, selection restoration
- Files: `components/ui/rich-editor/utils/tree-operations.ts`, `components/ui/rich-editor/handlers/selection-handlers.ts`, `components/ui/rich-editor/lib/reducer/editor-reducer.ts`
- Risk: Corrupted document structure, lost content, selection bugs
- Priority: Medium

**Authentication Flow:**

- What's not tested: OAuth callback handling, session refresh, token exchange
- Files: `components/feature-modules/authentication/util/auth.util.ts`, `app/api/auth/token/callback/route.ts`
- Risk: Authentication failures, security vulnerabilities, session expiration bugs
- Priority: High

**Overall Coverage:**

- Current: Only 3 test files (AddressCard, ContactCard, FallbackBlock) with 6 passing tests
- Gap: ~99% of codebase untested
- Risk: Refactoring breaks functionality, regressions go unnoticed
- Priority: Critical

---

_Concerns audit: 2026-01-19_
