package riven.core.enums.insights

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

@Schema(
    name = "SuggestedPromptCategory",
    description = "Category grouping for an insights demo suggested prompt.",
    enumAsRef = true,
)
enum class SuggestedPromptCategory {
    @JsonProperty("COHORTS") COHORTS,
    @JsonProperty("ENGAGEMENT") ENGAGEMENT,
    @JsonProperty("RETENTION") RETENTION,
    @JsonProperty("BUSINESS_DEFINITIONS") BUSINESS_DEFINITIONS,
    @JsonProperty("COMPARISON") COMPARISON,
    @JsonProperty("OVERVIEW") OVERVIEW,
}
