package riven.core.entity.workflow

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.*
import org.hibernate.annotations.Type
import riven.core.enums.workflow.ExecutionQueueStatus
import java.time.ZonedDateTime
import java.util.*

/**
 * JPA entity for the execution queue table.
 *
 * Represents a workflow execution request waiting to be dispatched to Temporal.
 * Queue items progress through: PENDING -> CLAIMED -> DISPATCHED (or FAILED)
 *
 * Uses PostgreSQL FOR UPDATE SKIP LOCKED for concurrent-safe claiming.
 */
@Entity
@Table(
    name = "workflow_execution_queue",
    indexes = [
        Index(name = "idx_execution_queue_workspace", columnList = "workspace_id, status")
    ]
)
data class ExecutionQueueEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, columnDefinition = "uuid")
    val id: UUID? = null,

    @Column(name = "workspace_id", nullable = false, columnDefinition = "uuid")
    val workspaceId: UUID,

    @Column(name = "workflow_definition_id", nullable = false, columnDefinition = "uuid")
    val workflowDefinitionId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    var status: ExecutionQueueStatus = ExecutionQueueStatus.PENDING,

    @Column(name = "created_at", nullable = false, columnDefinition = "timestamptz")
    val createdAt: ZonedDateTime = ZonedDateTime.now(),

    @Column(name = "claimed_at", columnDefinition = "timestamptz")
    var claimedAt: ZonedDateTime? = null,

    @Column(name = "dispatched_at", columnDefinition = "timestamptz")
    var dispatchedAt: ZonedDateTime? = null,

    @Type(JsonBinaryType::class)
    @Column(name = "input", columnDefinition = "jsonb")
    val input: Any? = null,

    @Column(name = "attempt_count", nullable = false)
    var attemptCount: Int = 0,

    @Column(name = "last_error", columnDefinition = "text")
    var lastError: String? = null
)
