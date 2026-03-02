package riven.core.models.request.entity

import riven.core.enums.integration.SourceType
import java.util.*

data class AddRelationshipRequest(
    val targetEntityId: UUID,
    val definitionId: UUID? = null,
    val semanticContext: String? = null,
    val linkSource: SourceType = SourceType.USER_CREATED,
)

data class UpdateRelationshipRequest(
    val semanticContext: String,
)
