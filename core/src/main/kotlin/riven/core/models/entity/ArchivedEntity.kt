package riven.core.models.entity

import riven.core.entity.util.AuditableModel
import riven.core.models.common.json.JsonObject
import java.time.ZonedDateTime
import java.util.*

data class ArchivedEntity(
    val id: UUID,
    val archivedAt: ZonedDateTime,
    val workspaceId: UUID,
    val entityType: EntityType,
    val typeVersion: Int,
    val name: String?,
    val payload: JsonObject,
    val validationErrors: List<String>? = null,
    override val createdAt: ZonedDateTime? = null,
    override val updatedAt: ZonedDateTime? = null,
    override val createdBy: UUID? = null,
    override val updatedBy: UUID? = null
) : AuditableModel()