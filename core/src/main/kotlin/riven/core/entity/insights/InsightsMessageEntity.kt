package riven.core.entity.insights

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.hibernate.annotations.Type
import riven.core.entity.util.AuditableSoftDeletableEntity
import riven.core.enums.insights.InsightsMessageRole
import riven.core.models.insights.CitationRef
import riven.core.models.insights.InsightsMessageModel
import riven.core.models.insights.TokenUsage
import java.util.UUID

/**
 * JPA entity for the insights_messages table.
 *
 * Stores user/assistant turns within an insights chat session. Citations and token usage
 * are persisted as JSONB so the LLM response shape can evolve without schema migrations.
 */
@Entity
@Table(name = "insights_messages")
data class InsightsMessageEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, columnDefinition = "uuid")
    val id: UUID? = null,

    @Column(name = "session_id", nullable = false, columnDefinition = "uuid")
    val sessionId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 16)
    val role: InsightsMessageRole,

    @Column(name = "content", nullable = false, columnDefinition = "text")
    val content: String,

    @Type(JsonBinaryType::class)
    @Column(name = "citations", nullable = false, columnDefinition = "jsonb")
    val citations: List<CitationRef> = emptyList(),

    @Type(JsonBinaryType::class)
    @Column(name = "token_usage", columnDefinition = "jsonb")
    val tokenUsage: TokenUsage? = null,
) : AuditableSoftDeletableEntity() {

    fun toModel(): InsightsMessageModel {
        val id = requireNotNull(this.id) { "InsightsMessageEntity must have an ID when mapping to model" }
        return InsightsMessageModel(
            id = id,
            sessionId = sessionId,
            role = role,
            content = content,
            citations = citations,
            tokenUsage = tokenUsage,
            createdAt = createdAt,
            createdBy = createdBy,
        )
    }
}
