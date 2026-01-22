package riven.core.enums.workflow

/**
 * Status of an execution queue item.
 *
 * Lifecycle: PENDING -> CLAIMED -> DISPATCHED (or FAILED)
 */
enum class ExecutionQueueStatus {
    /** Waiting to be processed by dispatcher */
    PENDING,
    /** Being processed by dispatcher (claimed via SKIP LOCKED) */
    CLAIMED,
    /** Successfully sent to Temporal */
    DISPATCHED,
    /** Failed after max retries or permanent error */
    FAILED
}
