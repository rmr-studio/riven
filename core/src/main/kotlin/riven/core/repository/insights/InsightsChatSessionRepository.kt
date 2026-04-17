package riven.core.repository.insights

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import riven.core.entity.insights.InsightsChatSessionEntity
import java.util.Optional
import java.util.UUID

interface InsightsChatSessionRepository : JpaRepository<InsightsChatSessionEntity, UUID> {

    fun findByIdAndWorkspaceId(id: UUID, workspaceId: UUID): Optional<InsightsChatSessionEntity>

    @Query("""
        SELECT s FROM InsightsChatSessionEntity s
        WHERE s.workspaceId = :workspaceId
        ORDER BY COALESCE(s.lastMessageAt, s.createdAt) DESC
    """)
    fun findByWorkspaceId(workspaceId: UUID, pageable: Pageable): Page<InsightsChatSessionEntity>
}
