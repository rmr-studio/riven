package riven.core.service.note

import org.junit.jupiter.api.Disabled
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestInstance

/**
 * Parity integration test scaffold for the legacy notes -> entity-backed notes backfill.
 *
 * INTENT
 *   1. Seed N legacy notes (with attachments) via direct NoteRepository writes against a
 *      Testcontainers Postgres instance.
 *   2. Drive the backfill workflow synchronously — either via NoteBackfillWorkflow under
 *      a Temporal TestWorkflowEnvironment, or by invoking the activity impl directly in
 *      a loop until exhaustion.
 *   3. Assert:
 *        - entityRepository.countByWorkspaceIdAndTypeKey(workspaceId, "note") == N;
 *        - for every legacy note_entity_attachments row, an entity_relationships row
 *          exists with definition.systemType=ATTACHMENT, source=migrated note entity,
 *          target=original entityId;
 *        - Note.plaintext round-trips exactly through the projector.
 *
 * STATUS — Phase B
 *   This file is deliberately a `@Disabled` stub. The activity-level idempotency
 *   contract is covered by [riven.core.workflow.migration.NoteBackfillActivitiesImplTest]
 *   (unit-level, Mockito-driven, no DB) — that test is the binding contract for Phase B.
 *
 *   The full DB-level parity IT requires bringing the entire entity ingestion stack
 *   (EntityService + EntityValidationService + EntityAttributeService + identity
 *   match listener + ApplicationEventPublisher chain + Temporal test environment)
 *   under a Testcontainers Spring context, which is outside the Phase B scope per the
 *   plan's operating instructions. The harness will be wired up alongside the
 *   maintenance-window backfill rehearsal — track in `docs/architecture-suggestions.md`.
 */
@Disabled("Phase B scaffold — full DB-level parity IT deferred; activity-level idempotency covered by NoteBackfillActivitiesImplTest")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class NoteParityIT {

    @Test
    fun `backfill produces 1-1 parity between legacy notes and entity-backed notes`() {
        // See class-level KDoc for the intended assertions.
    }
}
