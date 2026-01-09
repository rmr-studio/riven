package riven.core.configuration.workflow

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties("riven.workflow.engine")
data class TemporalEngineConfigurationProperties(
    val target: String,
    val namespace: String? = null,
)