package riven.core.configuration.properties

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "riven.rate-limit")
data class RateLimitConfigurationProperties(
    val enabled: Boolean = true,
    val authenticatedRpm: Long = 200,
    val anonymousRpm: Long = 30,
    val cacheMaxSize: Long = 10_000,
    val cacheExpireMinutes: Long = 10
)
