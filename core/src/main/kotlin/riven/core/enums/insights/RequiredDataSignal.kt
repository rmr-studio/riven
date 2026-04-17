package riven.core.enums.insights

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

@Schema(
    name = "RequiredDataSignal",
    description = "Workspace data signal a suggested prompt depends on to produce a strong answer.",
    enumAsRef = true,
)
enum class RequiredDataSignal {
    @JsonProperty("CUSTOMER_ENTITIES") CUSTOMER_ENTITIES,
    @JsonProperty("FEATURE_USAGE_EVENTS") FEATURE_USAGE_EVENTS,
    @JsonProperty("IDENTITY_CLUSTERS") IDENTITY_CLUSTERS,
    @JsonProperty("ACTIVE_BUSINESS_DEFINITIONS") ACTIVE_BUSINESS_DEFINITIONS,
    @JsonProperty("ENTITY_RELATIONSHIPS") ENTITY_RELATIONSHIPS,
}
