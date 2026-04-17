package riven.core.entity.insights

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import riven.core.entity.util.AuditableSoftDeletableEntity
import riven.core.models.insights.InsightsChatSessionModel
import java.time.ZonedDateTime
import java.util.UUID

/**
 * JPA entity for the insights_chat_sessions table — workspace-scoped chat sessions
 * for the Insights AI demo. Sessions track whether the demo entity pool has been seeded
 * so the seeder remains idempotent across multiple turns.
 */
@Entity
@Table(name = "insights_chat_sessions")
data class InsightsChatSessionEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, columnDefinition = "uuid")
    val id: UUID? = null,

    @Column(name = "workspace_id", nullable = false, columnDefinition = "uuid")
    val workspaceId: UUID,

    @Column(name = "title")
    var title: String? = null,

    @Column(name = "demo_pool_seeded", nullable = false)
    var demoPoolSeeded: Boolean = false,

    @Column(name = "last_message_at")
    var lastMessageAt: ZonedDateTime? = null,
) : AuditableSoftDeletableEntity() {

    fun toModel(): InsightsChatSessionModel {
        val id = requireNotNull(this.id) { "InsightsChatSessionEntity must have an ID when mapping to model" }
        return InsightsChatSessionModel(
            id = id,
            workspaceId = workspaceId,
            title = title,
            demoPoolSeeded = demoPoolSeeded,
            lastMessageAt = lastMessageAt,
            createdAt = createdAt,
            updatedAt = updatedAt,
            createdBy = createdBy,
        )
    }
}
