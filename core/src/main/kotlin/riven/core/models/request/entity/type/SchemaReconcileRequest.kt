package riven.core.models.request.entity.type

import java.util.*

data class SchemaReconcileRequest(
    val entityTypeIds: List<UUID>,
    val impactConfirmed: Boolean = false,
)
