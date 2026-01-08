package riven.core.models.workflow.execution

import riven.core.enums.workflow.WorkflowStatus
import java.time.Duration
import java.time.ZonedDateTime
import java.util.*

sealed interface ExecutionRecord {
    val id: UUID
    val workspaceId: UUID

    // Execution Summary
    val status: WorkflowStatus
    val startedAt: ZonedDateTime
    val completedAt: ZonedDateTime?
    val duration: Duration

    // Execution Records
    // TODO: Replace with proper payload types
    val error: Any?
    val input: Any?
    val output: Any?
}