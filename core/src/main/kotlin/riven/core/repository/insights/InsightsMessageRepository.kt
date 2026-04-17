package riven.core.repository.insights

import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import riven.core.entity.insights.InsightsMessageEntity
import java.util.UUID

interface InsightsMessageRepository : JpaRepository<InsightsMessageEntity, UUID> {

    fun findBySessionIdOrderByCreatedAtAsc(sessionId: UUID): List<InsightsMessageEntity>

    fun findBySessionIdOrderByCreatedAtDesc(sessionId: UUID, pageable: Pageable): List<InsightsMessageEntity>
}
