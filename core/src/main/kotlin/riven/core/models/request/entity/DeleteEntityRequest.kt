package riven.core.models.request.entity

import riven.core.enums.entity.EntitySelectType
import riven.core.models.entity.query.filter.QueryFilter
import riven.core.validation.entity.ValidBulkDeleteEntityRequest
import java.util.*

@ValidBulkDeleteEntityRequest
data class BulkDeleteEntityRequest(
    val type: EntitySelectType,
    val entityTypeId: UUID? = null,
    val entityIds: List<UUID>? = null,
    val filter: QueryFilter? = null,
    val excludeIds: List<UUID>? = null,
)
