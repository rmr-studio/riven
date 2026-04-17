package riven.core.models.insights

import riven.core.enums.insights.InsightsMessageRole
import java.time.ZonedDateTime
import java.util.UUID

data class InsightsMessageModel(
    val id: UUID,
    val sessionId: UUID,
    val role: InsightsMessageRole,
    val content: String,
    val citations: List<CitationRef>,
    val tokenUsage: TokenUsage?,
    val createdAt: ZonedDateTime?,
    val createdBy: UUID?,
)
