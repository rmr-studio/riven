package riven.core.service.connotation

import io.github.oshai.kotlinlogging.KLogger
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Service
import riven.core.configuration.properties.ConnotationAnalysisConfigurationProperties
import riven.core.enums.activity.Activity
import riven.core.enums.core.ApplicationEntityType
import riven.core.enums.util.OperationType
import riven.core.models.catalog.ConnotationSignals
import riven.core.models.connotation.AnalysisTier
import riven.core.models.connotation.ConnotationStatus
import riven.core.models.connotation.SentimentAnalysisOutcome
import riven.core.models.connotation.SentimentAxis
import riven.core.service.activity.ActivityService
import riven.core.service.activity.log
import riven.core.service.auth.AuthTokenService
import java.time.ZonedDateTime
import java.util.UUID

/**
 * Workspace-scoped sentiment analysis dispatcher.
 *
 * Routes a single-entity analysis request to the tier declared in [ConnotationSignals.tier].
 * Tier 1 delegates to [ConnotationTier1Mapper]. Tier 2/3 throw `NotImplementedError` until
 * those tiers are implemented in later phases.
 *
 * Always returns a [SentimentAxis] — Tier 1 mapping failures are encoded as `status = FAILED`
 * rather than thrown, so the enrichment pipeline can persist the sentinel without aborting
 * RELATIONAL/STRUCTURAL axis writes.
 *
 * Caller is responsible for resolving attribute values from manifest keys to entity-level
 * values before calling. This keeps the service free of repository injections and allows
 * EnrichmentService (which already has the resolved attribute map during enrichment) to
 * pass them through cheaply.
 *
 * Activity logging fires on every analyze call regardless of outcome.
 */
@Service
class ConnotationAnalysisService(
    private val tier1Mapper: ConnotationTier1Mapper,
    private val activityService: ActivityService,
    private val authTokenService: AuthTokenService,
    private val properties: ConnotationAnalysisConfigurationProperties,
    private val logger: KLogger,
) {

    /**
     * Analyze a single entity's sentiment axis using the manifest-declared tier.
     *
     * @param entityId Workspace-scoped entity being analyzed.
     * @param workspaceId Workspace owning the entity (also drives @PreAuthorize).
     * @param signals Manifest-declared connotation signals (tier + scale + theme keys).
     * @param sourceValue Pre-resolved value for `signals.sentimentAttribute` (caller does the manifest-key -> attribute UUID lookup).
     * @param themeValues Pre-resolved values for `signals.themeAttributes` (manifest key -> string value or null).
     * @return Populated [SentimentAxis]; status `ANALYZED` on success, `FAILED` on Tier 1 mapping failure.
     */
    @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
    fun analyze(
        entityId: UUID,
        workspaceId: UUID,
        signals: ConnotationSignals,
        sourceValue: Any?,
        themeValues: Map<String, String?>,
    ): SentimentAxis {
        val userId = authTokenService.getUserId()

        val axis = when (signals.tier) {
            AnalysisTier.TIER_1 -> runTier1(entityId, workspaceId, signals, sourceValue, themeValues)
            AnalysisTier.TIER_2, AnalysisTier.TIER_3 ->
                throw NotImplementedError("Tier ${signals.tier.name} not implemented in Phase B")
        }

        activityService.log(
            activity = Activity.ENTITY_CONNOTATION,
            operation = OperationType.ANALYZE,
            userId = userId,
            workspaceId = workspaceId,
            entityType = ApplicationEntityType.ENTITY_CONNOTATION,
            entityId = entityId,
            "tier" to signals.tier.name,
            "status" to axis.status.name,
            "sentiment" to axis.sentiment,
            "analysisVersion" to axis.analysisVersion,
        )
        return axis
    }

    private fun runTier1(
        entityId: UUID,
        workspaceId: UUID,
        signals: ConnotationSignals,
        sourceValue: Any?,
        themeValues: Map<String, String?>,
    ): SentimentAxis = when (
        val outcome = tier1Mapper.analyze(
            signals = signals,
            sourceValue = sourceValue,
            themeValues = themeValues,
            activeVersion = properties.tier1CurrentVersion,
        )
    ) {
        is SentimentAnalysisOutcome.Success -> outcome.axis
        is SentimentAnalysisOutcome.Failure -> {
            logger.warn {
                "Tier 1 connotation analysis failed for entity=$entityId workspace=$workspaceId " +
                    "reason=${outcome.reason} message=${outcome.message}"
            }
            SentimentAxis(
                status = ConnotationStatus.FAILED,
                analysisTier = AnalysisTier.TIER_1,
                analysisVersion = properties.tier1CurrentVersion,
                analysisModel = "connotation-tier1-${signals.sentimentScale.mappingType.name.lowercase()}-${properties.tier1CurrentVersion}",
                analyzedAt = ZonedDateTime.now(),
            )
        }
    }
}
