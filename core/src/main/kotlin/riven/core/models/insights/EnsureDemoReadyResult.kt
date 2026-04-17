package riven.core.models.insights

/**
 * Result of [riven.core.service.insights.InsightsDemoService.ensureDemoReady].
 *
 * @property definitionsSeeded number of curated business definitions newly created in this call.
 * @property definitionsSkipped number of curated business definitions that already existed and were left untouched.
 */
data class EnsureDemoReadyResult(
    val definitionsSeeded: Int,
    val definitionsSkipped: Int,
)
