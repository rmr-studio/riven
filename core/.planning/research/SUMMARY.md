# Project Research Summary

**Project:** Workflow Engine - Node Output Metadata Infrastructure
**Domain:** Workflow orchestration metadata system
**Researched:** 2026-02-10
**Confidence:** HIGH

## Executive Summary

This research addresses how to expose typed output schemas for workflow nodes to enable frontend builder UI features like output preview and template autocomplete. The system needs to declare what fields each node produces (e.g., "Create Entity outputs entityId, entityTypeId, and payload") so the frontend can wire nodes together and suggest template paths like `{{ steps.createEntity.output.entityId }}`.

The recommended approach extends the existing companion object pattern already proven in this codebase. Each `WorkflowNodeConfig` companion object declares `outputSchema: List<WorkflowNodeOutputField>` alongside the existing `configSchema` and `metadata` fields. The `WorkflowNodeConfigRegistry` discovers these via reflection at startup and exposes them through the existing `/api/v1/workflow/definitions/nodes` API endpoint. This requires zero new dependencies, maintains architectural consistency, and builds directly on established patterns.

The critical risk is schema-runtime mismatch: developers adding fields to `NodeOutput` data classes but forgetting to update companion object schemas. Prevention requires unit tests validating that schema keys match `toMap()` keys, plus code review discipline. For dynamic outputs (like entity queries with runtime-determined attributes), use generic `MAP` types rather than attempting static nested schemas. The architecture naturally scales to 50+ node types without tooling changes.

## Key Findings

### Recommended Stack

The solution requires no new dependencies or external technologies. It's purely a pattern extension within the existing Kotlin/Spring Boot architecture. The companion object pattern (already used for `configSchema` and `metadata`) provides static discoverability via reflection, type safety at compile time, and automatic API exposure through the existing registry system.

**Core technologies:**
- **Companion Object Pattern**: Static metadata declaration alongside config classes - proven by existing `configSchema` implementation
- **Reflection-based Discovery**: `WorkflowNodeConfigRegistry` extracts metadata at startup - reuses existing registration logic with nullable fallback
- **Sealed Interface Hierarchy**: `NodeOutput` types provide compile-time guarantees - schema mirrors runtime structure for consistency
- **Jackson Serialization**: Automatic JSON exposure via REST API - existing OpenAPI documentation generation handles new fields

**Key versions/constraints:**
- No version constraints (uses existing Kotlin 2.1.x stdlib and Spring Boot infrastructure)
- Backward compatible: nodes without `outputSchema` default to empty list

### Expected Features

**Must have (table stakes):**
- **Static Output Field Declaration** - Frontend must know what fields each node type produces for wiring UI
- **Field Name + Type Declaration** - Exact keys (matching `toMap()`) and semantic types (UUID, STRING, NUMBER, etc.) for template resolution
- **Registry Key Declaration** - Document what WorkflowDataStore paths become available (e.g., "steps.{nodeName}.output")
- **Output Schema in Node Metadata** - Extend `/api/v1/workflow/definitions/nodes` response with `outputSchema` field
- **Deterministic Field List** - All fields known at design time (no runtime discovery) for predictable UI

**Should have (competitive):**
- **Human-Readable Labels** - Field descriptions for UI display ("Entity ID" not just "entityId") to improve UX
- **Nullable Indicators** - Mark optional fields (e.g., `HttpResponseOutput.body`) so frontend handles gracefully
- **Computed Field Declaration** - Include derived fields (like `HttpResponseOutput.success` computed from `statusCode`) in schema
- **Array Element Type** - Declare type of list items for nested autocomplete

**Defer (v2+):**
- **Nested Object Schema** - Full schema for complex outputs with recursive structure (high complexity for MVP)
- **Conditional Field Availability** - Fields that only exist under certain conditions (adds conditional logic complexity)
- **Runtime Schema Computation** - Dynamic schemas based on node config (requires service injection into static context)
- **Multiple Output Variants** - Different output shapes per config variation (too complex for initial implementation)

### Architecture Approach

Output metadata integrates into the existing three-layer architecture: companion objects declare metadata (config layer), `WorkflowNodeConfigRegistry` discovers and caches it (service layer), and `WorkflowDefinitionController` exposes it via REST (controller layer). The pattern follows the established `configSchema` approach with no novel architectural decisions required.

**Major components:**

1. **Data Model** (`WorkflowNodeOutputField`, `OutputFieldType` enum) - Describes output structure parallel to `WorkflowNodeConfigField` for inputs
2. **Companion Object Declarations** - Each node config's companion object adds `val outputSchema = listOf(...)` alongside existing metadata
3. **Registry Enhancement** - `NodeSchemaEntry` extended with `outputMetadata: WorkflowNodeOutputMetadata?` field extracted via reflection
4. **API Response Extension** - `WorkflowNodeMetadata` automatically includes output schema; existing endpoint unchanged
5. **Frontend Integration** - Consumes output metadata for node inspector preview, template autocomplete, and visual wiring validation

**Data flow:** Registration time (startup) → Registry reflects companion objects → Caches schemas in memory. Request time → API returns cached schemas. Execution time → unchanged (metadata is declarative, doesn't affect runtime).

### Critical Pitfalls

1. **Schema-Runtime Mismatch** - Adding fields to `NodeOutput` but forgetting to update companion `outputSchema` causes fields to work at runtime but be invisible in frontend. Prevention: unit test validating schema keys match `toMap()` keys, code review checklist, optional registry validation warning.

2. **Template Resolution Path Mismatch** - Schema declaring keys (e.g., "entityId") that don't match actual `toMap()` keys (e.g., "entity_id") causes template resolution failures. Prevention: enforce camelCase convention consistently, unit test that schema keys exist in `toMap()` output, integration test for template resolution.

3. **Dynamic Schema Assumptions** - Declaring static nested schema for outputs with runtime-determined structure (like entity queries returning different attributes per entity type) creates misleading autocomplete. Prevention: use generic `MAP` type for dynamic structures, document in description that structure is runtime-determined, consider computed schemas in Phase 6 if specificity needed.

4. **Missing Nullable Indicators** - Not marking optional fields as `nullable = true` when NodeOutput type is nullable causes frontend to expect always-present values. Prevention: review `NodeOutput` for nullable types (`String?`, etc.) and mark schema accordingly.

5. **Forgetting Registration** - Adding output schema to companion object but not registering node in `WorkflowNodeConfigRegistry.registerAllNodes()` causes silent failures where node exists in code but not in API. Prevention: add to registry immediately after creating config, integration test verifying all known types appear in response.

## Implications for Roadmap

Based on research, suggested phase structure follows the natural build order: data model first (no dependencies), companion declarations second (depends on model), registry enhancement third (depends on both), with API exposure automatic. The pattern enables incremental adoption - high-value nodes first, expand coverage later.

### Phase 1: Core Data Model Infrastructure
**Rationale:** Foundation components have zero dependencies and are required by all subsequent work. Pure data classes and enums can be built and tested independently.
**Delivers:** `WorkflowNodeOutputField` model, `WorkflowNodeOutputFieldType` enum, base types for schema declaration
**Addresses:** Static Output Field Declaration (table stakes), Field Type Declaration (table stakes)
**Avoids:** Build order issues by establishing foundation first

### Phase 2: Registry Enhancement
**Rationale:** Extend discovery and caching infrastructure before declaring schemas ensures consistent pattern when nodes start adopting.
**Delivers:** Enhanced `NodeSchemaEntry` and `WorkflowNodeMetadata` with `outputSchema` field, reflection-based extraction in registry
**Addresses:** Output Schema in Node Metadata (table stakes), Registry Key Declaration (table stakes)
**Uses:** Existing reflection pattern from configSchema discovery, Jackson serialization for API
**Implements:** Non-breaking registry enhancement (nullable for backward compatibility)
**Avoids:** Schema-Runtime Mismatch with optional validation warnings in registry

### Phase 3: Action Node Schema Declarations
**Rationale:** High-value nodes (entity CRUD, HTTP requests) provide most frontend utility. Start here to prove pattern and gather feedback.
**Delivers:** Output schemas for CREATE_ENTITY, UPDATE_ENTITY, DELETE_ENTITY, QUERY_ENTITY, HTTP_REQUEST action nodes
**Addresses:** Human-Readable Labels (differentiator), Computed Field Declaration (differentiator)
**Avoids:** Dynamic Schema Assumptions by using generic MAP for entity payloads, Template Resolution Path Mismatch with consistent key naming
**Notes:** Incremental adoption - add 5 core action nodes, validate pattern works end-to-end

### Phase 4: Control Flow & Trigger Coverage
**Rationale:** Complete schema coverage enables frontend to wire all node types. Control flow and triggers produce simpler outputs than actions.
**Delivers:** Output schemas for CONDITION control nodes and trigger nodes (webhook, schedule, etc.)
**Addresses:** Deterministic Field List (table stakes) - all node types now have schemas
**Avoids:** Forgetting Registration by verifying all types registered in integration tests

### Phase 5: Validation & Testing
**Rationale:** Comprehensive testing catches schema-runtime mismatches before frontend integration. Documentation enables maintenance.
**Delivers:** Unit tests for schema-toMap key parity, integration tests for API responses, validation warnings in registry, developer documentation
**Addresses:** All pitfall prevention strategies from PITFALLS.md
**Avoids:** Schema-Runtime Mismatch (critical pitfall) with automated validation

### Phase Ordering Rationale

- **Data Model → Registry → Declarations** follows build dependencies: model has no dependencies, registry needs model, declarations use both
- **Action Nodes → Control Flow** prioritizes high-value nodes with complex outputs before simpler control flow outputs
- **Validation Last** enables testing entire pattern once all node types have schemas
- **Incremental Adoption** allows starting with 5 action nodes in Phase 3, proving pattern before expanding coverage
- **Phase 3-4 Parallelizable** after Phase 2 completes - different node type schemas are independent

This ordering avoids build order issues (Phase 1 foundation), proves pattern with high-value nodes (Phase 3), then expands coverage (Phase 4) before comprehensive testing (Phase 5).

### Research Flags

Phases with standard patterns (skip research-phase):
- **All Phases** - This entire project extends existing proven patterns (companion objects, registry reflection, REST API exposure). No external integrations, no novel architecture, minimal complexity. Research complete; proceed directly to implementation.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero new dependencies; uses existing Kotlin reflection, Jackson serialization, Spring Boot patterns already proven in codebase |
| Features | HIGH | Table stakes validated against existing codebase analysis (NodeOutput implementations, template resolution system); differentiators derived from established low-code platform patterns |
| Architecture | HIGH | Direct extension of existing companion object + registry + API pattern; all integration points already exist and proven |
| Pitfalls | HIGH | Derived from codebase architecture analysis; schema-runtime mismatch is inherent to dual-declaration pattern, others are Kotlin/reflection common pitfalls |

**Overall confidence:** HIGH

Research based on direct codebase analysis with clear architectural fit. No external API dependencies, no sparse documentation concerns, no novel patterns requiring validation. The companion object + reflection pattern already works for `configSchema`; output schema is a parallel application of the same approach.

### Gaps to Address

**Dynamic Entity Query Output Schema:** `QueryEntityOutput` returns entities with runtime-determined attributes based on entity type schema. Research recommends generic `MAP` type for MVP (frontend shows as untyped map access) with computed schema as Phase 6+ enhancement if specific autocomplete needed. This requires service injection into static companion context (architectural complexity). Address during Phase 3 by confirming generic MAP approach provides sufficient UX.

**Output Schema Versioning:** Current approach assumes output structure is stable within major version. If breaking output changes needed, create new node subtype (e.g., `CREATE_ENTITY_V2`) rather than versioning output schema. Document this convention during Phase 5 (validation phase) and confirm it aligns with workflow versioning strategy.

**Computed vs Stored Fields:** Some outputs include computed properties (like `HttpResponseOutput.success` derived from `statusCode`). Research recommends including ALL properties from `toMap()` in schema (both stored and computed) since frontend needs complete template availability. Validate this approach during Phase 3 HTTP_REQUEST implementation.

**Annotation Processor for Validation:** Manual schema declarations risk schema-runtime mismatch despite unit tests. At 50+ nodes, consider annotation processor to auto-validate or generate schemas from `NodeOutput` classes. Current assessment: manual approach scales to 50+ nodes; defer automation until proven pain point. Revisit during Phase 5 if testing reveals frequent mismatch issues.

## Sources

### Primary (HIGH confidence)
- Existing codebase analysis:
  - `/core/src/main/kotlin/riven/core/models/workflow/node/config/WorkflowNodeConfig.kt` - Sealed interface and companion object pattern
  - `/core/src/main/kotlin/riven/core/service/workflow/WorkflowNodeConfigRegistry.kt` - Reflection-based registration and schema discovery
  - `/core/src/main/kotlin/riven/core/models/workflow/engine/state/NodeOutput.kt` - Output type hierarchy and `toMap()` implementation
  - `/core/src/main/kotlin/riven/core/models/workflow/node/config/WorkflowNodeConfigField.kt` - Input schema pattern to mirror for outputs
  - `/core/src/main/kotlin/riven/core/controller/workflow/WorkflowDefinitionController.kt` - Existing API endpoint for node metadata
  - `/docs/system-design/domains/Workflows/Node Execution/WorkflowNodeConfig.md` - Architecture documentation for companion object pattern

### Secondary (MEDIUM confidence)
- Workflow engine patterns from training data (pre-2025):
  - n8n node schema declaration patterns (INodeProperties for output metadata)
  - Temporal/Cadence activity output handling (type system vs explicit schema tradeoffs)
  - Zapier/visual workflow builder template autocomplete UX patterns

All architectural decisions validated against existing codebase patterns rather than external sources. MEDIUM confidence sources inform feature expectations (table stakes from visual workflow builders) but don't drive technical implementation.

---
*Research completed: 2026-02-10*
*Ready for roadmap: yes*
