package riven.core.service.ingestion.adapter

import java.time.Instant

/**
 * Per-call context carrying connection identity and any per-call parameters.
 *
 * Sealed — Phase 1 ships the base plus [NangoCallContext]; Phase 3 will add a
 * `PostgresCallContext` variant carrying pool + schema coordinates.
 */
sealed class AdapterCallContext {
    /** Workspace this adapter call is executing on behalf of. */
    abstract val workspaceId: String
}

/**
 * Call context for Nango-backed adapters.
 *
 * TODO Phase 4: [workspaceId] defaults to `""` because NangoAdapter is
 * registered but not runtime-wired in Phase 1. The Phase 4
 * `IngestionOrchestrator` will populate it from the triggering workflow.
 */
data class NangoCallContext(
    override val workspaceId: String = "",
    val providerConfigKey: String,
    val connectionId: String,
    val model: String,
    val modifiedAfter: Instant? = null,
) : AdapterCallContext()
