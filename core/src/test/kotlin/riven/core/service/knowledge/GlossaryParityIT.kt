package riven.core.service.knowledge

import org.junit.jupiter.api.Disabled
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestInstance

/**
 * Parity integration test scaffold for the legacy workspace_business_definitions ->
 * entity-backed glossary backfill.
 *
 * INTENT
 *   1. Seed N legacy business definitions (with entityTypeRefs and attributeRefs) via
 *      direct WorkspaceBusinessDefinitionRepository writes against a Testcontainers
 *      Postgres instance.
 *   2. Drive the backfill workflow synchronously — either via GlossaryBackfillWorkflow
 *      under a Temporal TestWorkflowEnvironment, or by invoking the activity impl
 *      directly in a loop until exhaustion.
 *   3. Assert:
 *        - entityRepository.countByWorkspaceIdAndTypeKey(workspaceId, "glossary") == N;
 *        - for every legacy entityTypeRefs entry, an entity_relationships row exists
 *          with definition.systemType=DEFINES, target_kind=ENTITY_TYPE, source=migrated
 *          glossary entity;
 *        - for every legacy attributeRefs entry, an entity_relationships row exists
 *          with definition.systemType=DEFINES, target_kind=ATTRIBUTE;
 *        - WorkspaceBusinessDefinition round-trips exactly through the projector.
 *
 * STATUS — Phase C
 *   This file is deliberately a `@Disabled` stub, mirroring the Phase B NoteParityIT
 *   posture. The activity-level idempotency contract is covered by
 *   [riven.core.workflow.migration.GlossaryBackfillActivitiesImplTest] (unit-level,
 *   Mockito-driven, no DB) — that test is the binding contract for Phase C.
 *
 *   The full DB-level parity IT requires bringing the entire entity ingestion stack
 *   (EntityService + EntityValidationService + EntityAttributeService + identity match
 *   listener + ApplicationEventPublisher chain + Temporal test environment) under a
 *   Testcontainers Spring context, which is outside the Phase C scope per the plan's
 *   operating instructions. The harness will be wired up alongside the maintenance-
 *   window backfill rehearsal — track in `docs/architecture-suggestions.md`.
 */
@Disabled("Phase C scaffold — full DB-level parity IT deferred; activity-level idempotency covered by GlossaryBackfillActivitiesImplTest")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class GlossaryParityIT {

    @Test
    fun `backfill produces 1-1 parity between legacy definitions and entity-backed glossary terms`() {
        // See class-level KDoc for the intended assertions.
    }
}
