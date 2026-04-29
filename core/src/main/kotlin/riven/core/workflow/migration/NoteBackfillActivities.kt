package riven.core.workflow.migration

import io.temporal.activity.ActivityInterface
import io.temporal.activity.ActivityMethod
import java.util.UUID

/**
 * Temporal activity contract for the legacy notes -> entity-backed notes backfill.
 *
 * The workflow drives a paginated walk over `notes` rows (via [fetchPage]) and
 * delegates the actual transactional work to [migrateBatch], which is responsible
 * for being idempotent: re-runs over the same `noteId` set must skip already-migrated
 * rows rather than producing duplicates.
 */
@ActivityInterface
interface NoteBackfillActivities {

    @ActivityMethod
    fun fetchPage(workspaceId: UUID, cursor: NoteBackfillCursor?): NoteBackfillPage

    @ActivityMethod
    fun migrateBatch(workspaceId: UUID, noteIds: List<UUID>): NoteBackfillBatchResult
}

/**
 * Stable keyset cursor over `notes(created_at, id)`. Strings are used for `createdAt`
 * to keep the cursor JSON-serialisable across Temporal activity boundaries.
 */
data class NoteBackfillCursor(
    val createdAt: String,
    val noteId: UUID,
)

data class NoteBackfillPage(
    val noteIds: List<UUID>,
    val nextCursor: NoteBackfillCursor?,
)

data class NoteBackfillBatchResult(
    val migrated: Int,
    val skipped: Int,
    val failed: Int,
)
