package riven.core.models.insights

import java.time.ZonedDateTime
import java.util.UUID

data class InsightsChatSessionModel(
    val id: UUID,
    val workspaceId: UUID,
    val title: String?,
    val demoPoolSeeded: Boolean,
    val lastMessageAt: ZonedDateTime?,
    val createdAt: ZonedDateTime?,
    val updatedAt: ZonedDateTime?,
    val createdBy: UUID?,
)
