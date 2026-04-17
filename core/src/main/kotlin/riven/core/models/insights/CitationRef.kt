package riven.core.models.insights

import java.util.UUID

/**
 * A reference to an entity cited in an insights chat answer.
 */
data class CitationRef(
    val entityId: UUID,
    val entityType: String,
    val label: String,
)
