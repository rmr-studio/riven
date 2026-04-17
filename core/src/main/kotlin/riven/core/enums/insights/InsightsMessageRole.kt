package riven.core.enums.insights

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

@Schema(
    name = "InsightsMessageRole",
    description = "Role of an insights chat message author.",
    enumAsRef = true,
)
enum class InsightsMessageRole {
    @JsonProperty("USER") USER,
    @JsonProperty("ASSISTANT") ASSISTANT,
}
