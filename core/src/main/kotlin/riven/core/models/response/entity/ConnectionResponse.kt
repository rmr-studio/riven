package riven.core.models.response.entity

import riven.core.enums.integration.SourceType
import java.time.ZonedDateTime
import java.util.*

data class ConnectionResponse(
    val id: UUID,
    val sourceEntityId: UUID,
    val targetEntityId: UUID,
    val semanticContext: String?,
    val linkSource: SourceType,
    val createdAt: ZonedDateTime?,
    val updatedAt: ZonedDateTime?,
)
