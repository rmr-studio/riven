package riven.core.workflow.migration

import org.springframework.dao.DataIntegrityViolationException
import java.sql.SQLException

/**
 * Backfill helpers for distinguishing recoverable unique-constraint races from real integrity
 * violations. Concurrent migration runs may race on the unique key
 * `(workspaceId, sourceIntegrationId, sourceExternalId)` for the same legacy row — that is the
 * "already migrated" case the caller wants to skip. Every other integrity failure (FK, NOT
 * NULL, check constraint) signals a real bug and must be routed to the failure path so the
 * batch counter reflects the issue.
 *
 * PostgreSQL SQLState codes:
 *   - `23505` unique_violation         (skip — already migrated)
 *   - `23503` foreign_key_violation    (fail)
 *   - `23502` not_null_violation       (fail)
 *   - `23514` check_violation          (fail)
 */
internal fun isUniqueViolation(e: DataIntegrityViolationException): Boolean {
    var cause: Throwable? = e
    while (cause != null) {
        if (cause is SQLException && cause.sqlState == "23505") return true
        cause = cause.cause
    }
    return false
}
