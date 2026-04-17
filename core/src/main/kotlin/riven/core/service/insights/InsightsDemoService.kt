package riven.core.service.insights

import io.github.oshai.kotlinlogging.KLogger
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import riven.core.enums.entity.semantics.SemanticGroup
import riven.core.enums.insights.RequiredDataSignal
import riven.core.enums.insights.SuggestedPromptCategory
import riven.core.enums.knowledge.DefinitionCategory
import riven.core.enums.knowledge.DefinitionSource
import riven.core.enums.knowledge.DefinitionStatus
import riven.core.models.entity.EntityType
import riven.core.models.insights.EnsureDemoReadyResult
import riven.core.models.insights.SuggestedPrompt
import riven.core.models.request.knowledge.CreateBusinessDefinitionRequest
import riven.core.repository.knowledge.WorkspaceBusinessDefinitionRepository
import riven.core.service.auth.AuthTokenService
import riven.core.service.entity.type.EntityTypeService
import riven.core.service.identity.IdentityReadService
import riven.core.service.knowledge.WorkspaceBusinessDefinitionService
import riven.core.util.TermNormalizationUtil
import java.util.UUID

/**
 * Surfaces a curated, data-signal-aware list of demo-ready prompts for the insights chat UI.
 *
 * Probes the workspace for cheap signals (entity types, identity clusters, active business
 * definitions) and uses them to filter and score a fixed prompt catalog so only prompts the
 * workspace can actually answer well are returned, ranked by relevance.
 */
@Service
class InsightsDemoService(
    private val entityTypeService: EntityTypeService,
    private val identityReadService: IdentityReadService,
    private val businessDefinitionService: WorkspaceBusinessDefinitionService,
    private val businessDefinitionRepository: WorkspaceBusinessDefinitionRepository,
    private val authTokenService: AuthTokenService,
    private val logger: KLogger,
) {

    // ------ Public read operations ------

    /**
     * Returns up to [MAX_RESULTS] suggested prompts ranked by relevance score, descending.
     *
     * Prompts whose required data signals are not all present in the workspace are dropped.
     * Prompts referencing a business definition term are templated against the first matching
     * active definition; if none exists, those prompts are dropped.
     */
    @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
    fun suggestPrompts(workspaceId: UUID): List<SuggestedPrompt> {
        val signals = probeSignals(workspaceId)
        val available = signals.available

        return PROMPT_CATALOG
            .asSequence()
            .filter { template -> template.requiresData.all { it in available } }
            .mapNotNull { template -> renderTemplate(template, signals) }
            .sortedWith(compareByDescending<SuggestedPrompt> { it.score }.thenBy { it.id })
            .take(MAX_RESULTS)
            .toList()
            .also { logger.debug { "Returning ${it.size} suggested prompts for workspace $workspaceId" } }
    }

    // ------ Public mutations ------

    /**
     * Idempotently seed the curated set of demo business definitions for this workspace.
     *
     * For each entry in [DEMO_DEFINITIONS], checks whether a definition with the same
     * normalized term already exists in the workspace (via the repository's
     * `findByWorkspaceIdAndNormalizedTerm`, which respects the soft-delete restriction).
     * Existing definitions are left untouched; missing ones are created via
     * [WorkspaceBusinessDefinitionService.createDefinitionInternal] (which bypasses the
     * ADMIN role check, because access has already been gated by the workspace membership
     * check on this method).
     *
     * Safe to call repeatedly — a second call on a fully-seeded workspace will report
     * `definitionsSeeded = 0, definitionsSkipped = DEMO_DEFINITIONS.size`.
     *
     * @param workspaceId the workspace to seed.
     * @return summary counts of newly seeded vs. already-present definitions.
     */
    @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
    @Transactional
    fun ensureDemoReady(workspaceId: UUID): EnsureDemoReadyResult {
        val userId = authTokenService.getUserId()

        var seeded = 0
        var skipped = 0

        DEMO_DEFINITIONS.forEach { template ->
            val normalizedTerm = TermNormalizationUtil.normalize(template.term)
            val existing = businessDefinitionRepository
                .findByWorkspaceIdAndNormalizedTerm(workspaceId, normalizedTerm)
            if (existing.isPresent) {
                skipped++
            } else {
                businessDefinitionService.createDefinitionInternal(
                    workspaceId = workspaceId,
                    userId = userId,
                    request = CreateBusinessDefinitionRequest(
                        term = template.term,
                        definition = template.definition,
                        category = template.category,
                        source = DEMO_DEFINITION_SOURCE,
                        entityTypeRefs = emptyList(),
                        attributeRefs = emptyList(),
                        isCustomized = false,
                    ),
                )
                seeded++
            }
        }

        logger.info { "Demo workspace $workspaceId ready: seeded=$seeded skipped=$skipped" }
        return EnsureDemoReadyResult(definitionsSeeded = seeded, definitionsSkipped = skipped)
    }

    // ------ Private helpers ------

    private fun probeSignals(workspaceId: UUID): WorkspaceSignals {
        val entityTypes = runCatching { entityTypeService.getWorkspaceEntityTypes(workspaceId) }
            .getOrElse { emptyList() }

        val hasCustomers = hasCustomerEntityType(entityTypes)
        val hasFeatureUsage = hasFeatureUsageEventType(entityTypes)
        val clusterCount = runCatching { identityReadService.listClusters(workspaceId).size }
            .getOrElse { 0 }
        val activeDefinitions = runCatching {
            businessDefinitionService.listDefinitions(workspaceId, DefinitionStatus.ACTIVE)
        }.getOrElse { emptyList() }
        val activeDefinitionTerms = activeDefinitions.map { it.term }

        val available = buildSet {
            if (hasCustomers) add(RequiredDataSignal.CUSTOMER_ENTITIES)
            if (hasFeatureUsage) add(RequiredDataSignal.FEATURE_USAGE_EVENTS)
            if (clusterCount > 0) add(RequiredDataSignal.IDENTITY_CLUSTERS)
            if (activeDefinitionTerms.isNotEmpty()) add(RequiredDataSignal.ACTIVE_BUSINESS_DEFINITIONS)
            // ENTITY_RELATIONSHIPS: the entity type model carries relationship definitions for free
            if (entityTypes.any { it.relationships.isNotEmpty() }) add(RequiredDataSignal.ENTITY_RELATIONSHIPS)
        }

        return WorkspaceSignals(
            available = available,
            clusterCount = clusterCount,
            activeDefinitionTerms = activeDefinitionTerms,
        )
    }

    private fun hasCustomerEntityType(entityTypes: List<EntityType>): Boolean =
        entityTypes.any { type ->
            type.semanticGroup == SemanticGroup.CUSTOMER || matchesAny(type, CUSTOMER_KEYWORDS)
        }

    private fun hasFeatureUsageEventType(entityTypes: List<EntityType>): Boolean =
        entityTypes.any { type -> matchesAny(type, USAGE_KEYWORDS) }

    private fun matchesAny(type: EntityType, keywords: List<String>): Boolean {
        val haystacks = listOf(type.key, type.name.singular, type.name.plural).map { it.lowercase() }
        return haystacks.any { hay -> keywords.any { kw -> hay.contains(kw) } }
    }

    /**
     * Renders a [PromptTemplate] into a [SuggestedPrompt], applying term substitution and
     * signal-aware scoring boosts. Returns null when the template requires a definition term
     * but no active term is available.
     */
    private fun renderTemplate(template: PromptTemplate, signals: WorkspaceSignals): SuggestedPrompt? {
        val matchedTerm = if (template.requiresDefinitionTerm) {
            signals.activeDefinitionTerms.firstOrNull() ?: return null
        } else {
            null
        }

        val renderedPrompt = matchedTerm
            ?.let { template.promptTemplate.replace("{term}", it) }
            ?: template.promptTemplate

        var score = template.baseScore
        if (matchedTerm != null) score += 20
        if (RequiredDataSignal.IDENTITY_CLUSTERS in template.requiresData && signals.clusterCount >= 2) score += 10
        // +5 per matching secondary signal (signals present beyond the first required one).
        val secondarySatisfied = template.requiresData.count { it in signals.available } - 1
        if (secondarySatisfied > 0) score += 5 * secondarySatisfied

        return SuggestedPrompt(
            id = template.id,
            title = template.title,
            prompt = renderedPrompt,
            category = template.category,
            description = template.description,
            score = score,
            requiresData = template.requiresData.toList(),
        )
    }

    private data class WorkspaceSignals(
        val available: Set<RequiredDataSignal>,
        val clusterCount: Int,
        val activeDefinitionTerms: List<String>,
    )

    private data class DemoDefinitionTemplate(
        val term: String,
        val definition: String,
        val category: DefinitionCategory,
    )

    private data class PromptTemplate(
        val id: String,
        val title: String,
        val promptTemplate: String,
        val category: SuggestedPromptCategory,
        val description: String,
        val baseScore: Int,
        val requiresData: Set<RequiredDataSignal>,
        val requiresDefinitionTerm: Boolean = false,
    )

    companion object {
        const val MAX_RESULTS = 12

        /**
         * Source attributed to seeded demo definitions. There is no `DEMO` value in
         * [DefinitionSource], so [DefinitionSource.MANUAL] is used as the closest fit
         * for user-curated, non-onboarding-derived terms.
         */
        private val DEMO_DEFINITION_SOURCE = DefinitionSource.MANUAL

        private val DEMO_DEFINITIONS: List<DemoDefinitionTemplate> = listOf(
            DemoDefinitionTemplate(
                term = "valuable customer",
                category = DefinitionCategory.METRIC,
                definition = "A customer whose lifetime value exceeds \$1,000 OR who is on the Enterprise plan, and who has recorded at least one feature-usage event in the last 30 days. Used when ranking customers for outreach, retention priority, or CSM attention.",
            ),
            DemoDefinitionTemplate(
                term = "active customer",
                category = DefinitionCategory.LIFECYCLE_STAGE,
                definition = "A customer who has logged at least one feature-usage event in the last 14 days. Inactivity beyond that window moves the customer out of the 'active' segment for reporting purposes.",
            ),
            DemoDefinitionTemplate(
                term = "power user",
                category = DefinitionCategory.SEGMENT,
                definition = "A customer who has used 3 or more distinct product features in the last 30 days and recorded at least 20 total feature-usage events in that window. Power users are our most engaged cohort and the primary audience for advanced-feature rollouts.",
            ),
            DemoDefinitionTemplate(
                term = "at risk",
                category = DefinitionCategory.STATUS,
                definition = "A customer who was active in the prior 60 days (logged at least one feature-usage event) but has recorded zero events in the last 14 days. Prioritised for win-back outreach and CSM intervention.",
            ),
            DemoDefinitionTemplate(
                term = "retention",
                category = DefinitionCategory.METRIC,
                definition = "The percentage of customers from a given cohort who remain 'active' (per our active-customer definition) 30 days after signup. Measured monthly across the full customer base and per-cluster.",
            ),
        )

        private val CUSTOMER_KEYWORDS = listOf("customer", "user", "account", "contact")
        private val USAGE_KEYWORDS = listOf("usage", "event", "feature-usage", "feature_usage")

        private val PROMPT_CATALOG: List<PromptTemplate> = listOf(
            PromptTemplate(
                id = "valuable-cohorts-features",
                title = "Most valuable cohorts & features",
                promptTemplate = "Who are my most valuable customer cohorts, and what features are they coming back to use?",
                category = SuggestedPromptCategory.COHORTS,
                description = "Combines customer value with feature stickiness across your active cohorts.",
                baseScore = 100,
                requiresData = setOf(
                    RequiredDataSignal.CUSTOMER_ENTITIES,
                    RequiredDataSignal.FEATURE_USAGE_EVENTS,
                    RequiredDataSignal.IDENTITY_CLUSTERS,
                ),
            ),
            PromptTemplate(
                id = "at-risk-customers",
                title = "Customers at risk of churning",
                promptTemplate = "Which customers look at risk of churning in the next 30 days and why?",
                category = SuggestedPromptCategory.RETENTION,
                description = "Forward-looking churn signals derived from recent engagement patterns.",
                baseScore = 90,
                requiresData = setOf(
                    RequiredDataSignal.CUSTOMER_ENTITIES,
                    RequiredDataSignal.FEATURE_USAGE_EVENTS,
                ),
            ),
            PromptTemplate(
                id = "power-user-profile",
                title = "Power-user profile",
                promptTemplate = "What does our power-user profile look like — which features define them?",
                category = SuggestedPromptCategory.ENGAGEMENT,
                description = "Behavioural fingerprint of your highest-engagement customers.",
                baseScore = 85,
                requiresData = setOf(
                    RequiredDataSignal.CUSTOMER_ENTITIES,
                    RequiredDataSignal.FEATURE_USAGE_EVENTS,
                ),
            ),
            PromptTemplate(
                id = "feature-adoption-30d",
                title = "Feature adoption (last 30 days)",
                promptTemplate = "What does feature adoption look like across the last 30 days?",
                category = SuggestedPromptCategory.ENGAGEMENT,
                description = "Adoption trends per feature over a 30-day window.",
                baseScore = 80,
                requiresData = setOf(RequiredDataSignal.FEATURE_USAGE_EVENTS),
            ),
            PromptTemplate(
                id = "repeat-usage-drivers",
                title = "Top repeat-usage drivers",
                promptTemplate = "Which features drive the most repeat usage?",
                category = SuggestedPromptCategory.ENGAGEMENT,
                description = "Features that pull customers back the most often.",
                baseScore = 80,
                requiresData = setOf(RequiredDataSignal.FEATURE_USAGE_EVENTS),
            ),
            PromptTemplate(
                id = "cluster-comparison",
                title = "Power Users vs At-Risk cluster",
                promptTemplate = "Compare the Power Users cluster to the At-Risk cluster — what's different about their behaviour?",
                category = SuggestedPromptCategory.COMPARISON,
                description = "Side-by-side behavioural breakdown across two key clusters.",
                baseScore = 90,
                requiresData = setOf(
                    RequiredDataSignal.IDENTITY_CLUSTERS,
                    RequiredDataSignal.FEATURE_USAGE_EVENTS,
                ),
            ),
            PromptTemplate(
                id = "top-accounts-by-value",
                title = "Top 10 accounts by value",
                promptTemplate = "Who are our top 10 accounts by value, and what's their engagement trend?",
                category = SuggestedPromptCategory.COHORTS,
                description = "Highest-value accounts paired with their recent engagement direction.",
                baseScore = 75,
                requiresData = setOf(RequiredDataSignal.CUSTOMER_ENTITIES),
            ),
            PromptTemplate(
                id = "activation-bottleneck",
                title = "First-week activation drop-off",
                promptTemplate = "Where do new customers drop off in their first week?",
                category = SuggestedPromptCategory.RETENTION,
                description = "Steps in the early lifecycle where new customers stall out.",
                baseScore = 80,
                requiresData = setOf(
                    RequiredDataSignal.CUSTOMER_ENTITIES,
                    RequiredDataSignal.FEATURE_USAGE_EVENTS,
                ),
            ),
            PromptTemplate(
                id = "winback-candidates",
                title = "Win-back priorities this month",
                promptTemplate = "Who should we prioritise for a win-back campaign this month?",
                category = SuggestedPromptCategory.RETENTION,
                description = "Lapsed customers ranked by win-back potential.",
                baseScore = 80,
                requiresData = setOf(
                    RequiredDataSignal.CUSTOMER_ENTITIES,
                    RequiredDataSignal.FEATURE_USAGE_EVENTS,
                ),
            ),
            PromptTemplate(
                id = "definition-cohort-size",
                title = "Cohort size for a key definition",
                promptTemplate = "Using our definition of '{term}', how many customers qualify and which ones are most notable?",
                category = SuggestedPromptCategory.BUSINESS_DEFINITIONS,
                description = "Applies one of your active business definitions to size and surface the qualifying cohort.",
                baseScore = 95,
                requiresData = setOf(
                    RequiredDataSignal.CUSTOMER_ENTITIES,
                    RequiredDataSignal.ACTIVE_BUSINESS_DEFINITIONS,
                ),
                requiresDefinitionTerm = true,
            ),
            PromptTemplate(
                id = "definition-trend",
                title = "Trend for a key definition",
                promptTemplate = "How has the '{term}' segment trended over the last 90 days?",
                category = SuggestedPromptCategory.BUSINESS_DEFINITIONS,
                description = "90-day trajectory for a segment defined by one of your active definitions.",
                baseScore = 85,
                requiresData = setOf(
                    RequiredDataSignal.ACTIVE_BUSINESS_DEFINITIONS,
                    RequiredDataSignal.FEATURE_USAGE_EVENTS,
                ),
                requiresDefinitionTerm = true,
            ),
            PromptTemplate(
                id = "workspace-overview",
                title = "One-paragraph business overview",
                promptTemplate = "Give me a one-paragraph overview of the current state of the business based on the data available.",
                category = SuggestedPromptCategory.OVERVIEW,
                description = "A quick narrative summary anchored in your current data.",
                baseScore = 60,
                requiresData = setOf(RequiredDataSignal.CUSTOMER_ENTITIES),
            ),
            PromptTemplate(
                id = "feature-x-ytd",
                title = "Feature usage: this quarter vs last",
                promptTemplate = "Which features were most used this quarter compared to last?",
                category = SuggestedPromptCategory.ENGAGEMENT,
                description = "Quarter-over-quarter shift in feature usage.",
                baseScore = 70,
                requiresData = setOf(RequiredDataSignal.FEATURE_USAGE_EVENTS),
            ),
            PromptTemplate(
                id = "enterprise-vs-rest",
                title = "Enterprise vs the rest",
                promptTemplate = "How do Enterprise-plan customers engage differently from the rest?",
                category = SuggestedPromptCategory.COMPARISON,
                description = "Engagement contrasts between your Enterprise tier and everyone else.",
                baseScore = 75,
                requiresData = setOf(
                    RequiredDataSignal.CUSTOMER_ENTITIES,
                    RequiredDataSignal.FEATURE_USAGE_EVENTS,
                ),
            ),
        )
    }
}
