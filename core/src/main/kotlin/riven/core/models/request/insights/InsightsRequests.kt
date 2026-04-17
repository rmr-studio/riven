package riven.core.models.request.insights

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class CreateSessionRequest(
    @field:Size(max = 255)
    val title: String? = null,
)

data class SendMessageRequest(
    @field:NotBlank
    @field:Size(max = 4000)
    val message: String,
)
