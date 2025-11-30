package riven.core.models.activity

import riven.core.enums.activity.Activity
import riven.core.enums.core.EntityType
import riven.core.enums.util.OperationType
import riven.core.models.common.json.JsonObject
import java.time.ZonedDateTime
import java.util.*

data class ActivityLog(
    val id: UUID,
    val userId: UUID,
    val organisationId: UUID,
    val activity: Activity,
    val operation: OperationType,
    val entityType: EntityType,
    val entityId: UUID? = null,
    val timestamp: ZonedDateTime,
    val details: JsonObject,
)