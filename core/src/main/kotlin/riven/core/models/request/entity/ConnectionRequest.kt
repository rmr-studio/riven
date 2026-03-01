package riven.core.models.request.entity

import riven.core.enums.integration.SourceType
import java.util.*

data class CreateConnectionRequest(
    val targetEntityId: UUID,
    val semanticContext: String,
    val linkSource: SourceType = SourceType.USER_CREATED,
)

data class UpdateConnectionRequest(
    val semanticContext: String,
)
