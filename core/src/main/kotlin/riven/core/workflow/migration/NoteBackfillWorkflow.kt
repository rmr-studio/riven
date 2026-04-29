package riven.core.workflow.migration

import io.temporal.activity.ActivityOptions
import io.temporal.workflow.Workflow
import io.temporal.workflow.WorkflowInterface
import io.temporal.workflow.WorkflowMethod
import java.time.Duration
import java.util.UUID

/**
 * Paginated, idempotent backfill of legacy `notes` rows into the entity layer.
 *
 * One run per workspace. Iterates pages of `noteIds` until [NoteBackfillPage.nextCursor]
 * is null. Each page is delegated to [NoteBackfillActivities.migrateBatch], which is
 * the unit of idempotency — re-running the workflow against an already-migrated workspace
 * yields a result of (migrated=0, skipped=N, failed=0).
 */
@WorkflowInterface
interface NoteBackfillWorkflow {

    @WorkflowMethod
    fun run(workspaceId: UUID): NoteBackfillBatchResult
}

class NoteBackfillWorkflowImpl : NoteBackfillWorkflow {

    private val activities: NoteBackfillActivities = Workflow.newActivityStub(
        NoteBackfillActivities::class.java,
        ActivityOptions.newBuilder()
            .setStartToCloseTimeout(Duration.ofMinutes(5))
            .setHeartbeatTimeout(Duration.ofMinutes(2))
            .build(),
    )

    override fun run(workspaceId: UUID): NoteBackfillBatchResult {
        var totalMigrated = 0
        var totalSkipped = 0
        var totalFailed = 0
        var cursor: NoteBackfillCursor? = null

        while (true) {
            val page = activities.fetchPage(workspaceId, cursor)
            if (page.noteIds.isEmpty()) break
            val result = activities.migrateBatch(workspaceId, page.noteIds)
            totalMigrated += result.migrated
            totalSkipped += result.skipped
            totalFailed += result.failed
            cursor = page.nextCursor ?: break
        }

        return NoteBackfillBatchResult(totalMigrated, totalSkipped, totalFailed)
    }
}
