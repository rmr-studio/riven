package riven.core.configuration.properties

import org.springframework.boot.context.properties.ConfigurationProperties

/**
 * Active sentiment-analysis versions per tier.
 *
 * The Tier 1 mapper stamps [tier1CurrentVersion] onto every `SentimentAxis` it
 * produces. The reanalyze admin op uses these values to identify version-mismatch
 * rows and re-enqueue them for fresh analysis.
 *
 * Tier 2/3 versions reserved; not used in Phase B.
 *
 * Discovered via `@ConfigurationPropertiesScan` declared on `CoreApplication`.
 */
@ConfigurationProperties(prefix = "riven.connotation")
data class ConnotationAnalysisConfigurationProperties(
    val tier1CurrentVersion: String = "v1",
    val tier2CurrentVersion: String = "v1",
    val tier3CurrentVersion: String? = null,
)
