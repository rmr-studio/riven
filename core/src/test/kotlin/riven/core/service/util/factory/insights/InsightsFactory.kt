package riven.core.service.util.factory.insights

import riven.core.entity.insights.InsightsChatSessionEntity
import riven.core.entity.insights.InsightsMessageEntity
import riven.core.enums.common.icon.IconColour
import riven.core.enums.common.icon.IconType
import riven.core.enums.common.validation.SchemaType
import riven.core.enums.core.DataType
import riven.core.enums.entity.LifecycleDomain
import riven.core.enums.entity.semantics.SemanticGroup
import riven.core.enums.insights.InsightsMessageRole
import riven.core.enums.insights.RequiredDataSignal
import riven.core.enums.insights.SuggestedPromptCategory
import riven.core.models.common.Icon
import riven.core.models.common.display.DisplayName
import riven.core.models.common.validation.Schema
import riven.core.models.entity.EntityType
import riven.core.models.entity.RelationshipDefinition
import riven.core.models.insights.CitationRef
import riven.core.models.insights.SuggestedPrompt
import riven.core.models.insights.TokenUsage
import java.time.ZonedDateTime
import java.util.UUID

object InsightsFactory {

    /**
     * Creates a minimal [EntityType] domain model for InsightsDemoService tests.
     * Defaults to a customer-shaped semantic group with a singular/plural name.
     */
    fun createEntityTypeModel(
        id: UUID = UUID.randomUUID(),
        workspaceId: UUID = UUID.randomUUID(),
        key: String = "customer",
        singular: String = "Customer",
        plural: String = "Customers",
        semanticGroup: SemanticGroup = SemanticGroup.CUSTOMER,
        relationships: List<RelationshipDefinition> = emptyList(),
    ): EntityType = EntityType(
        id = id,
        key = key,
        version = 1,
        icon = Icon(type = IconType.ACTIVITY, colour = IconColour.NEUTRAL),
        name = DisplayName(singular = singular, plural = plural),
        protected = false,
        identifierKey = UUID.randomUUID(),
        semanticGroup = semanticGroup,
        lifecycleDomain = LifecycleDomain.UNCATEGORIZED,
        workspaceId = workspaceId,
        schema = Schema(type = DataType.OBJECT, key = SchemaType.OBJECT),
        relationships = relationships,
        createdAt = ZonedDateTime.now(),
        updatedAt = ZonedDateTime.now(),
        createdBy = null,
        updatedBy = null,
    )

    fun createSuggestedPrompt(
        id: String = "test-prompt",
        title: String = "Test prompt",
        prompt: String = "What can you tell me?",
        category: SuggestedPromptCategory = SuggestedPromptCategory.OVERVIEW,
        description: String = "A test prompt",
        score: Int = 50,
        requiresData: List<RequiredDataSignal> = listOf(RequiredDataSignal.CUSTOMER_ENTITIES),
    ): SuggestedPrompt = SuggestedPrompt(
        id = id,
        title = title,
        prompt = prompt,
        category = category,
        description = description,
        score = score,
        requiresData = requiresData,
    )

    fun createSession(
        id: UUID = UUID.randomUUID(),
        workspaceId: UUID,
        title: String? = "Demo session",
        demoPoolSeeded: Boolean = false,
        lastMessageAt: ZonedDateTime? = null,
        deleted: Boolean = false,
    ): InsightsChatSessionEntity = InsightsChatSessionEntity(
        id = id,
        workspaceId = workspaceId,
        title = title,
        demoPoolSeeded = demoPoolSeeded,
        lastMessageAt = lastMessageAt,
    ).also {
        it.deleted = deleted
        it.createdAt = ZonedDateTime.now()
        it.updatedAt = ZonedDateTime.now()
    }

    fun createMessage(
        id: UUID = UUID.randomUUID(),
        sessionId: UUID,
        role: InsightsMessageRole = InsightsMessageRole.USER,
        content: String = "Hello",
        citations: List<CitationRef> = emptyList(),
        tokenUsage: TokenUsage? = null,
    ): InsightsMessageEntity = InsightsMessageEntity(
        id = id,
        sessionId = sessionId,
        role = role,
        content = content,
        citations = citations,
        tokenUsage = tokenUsage,
    ).also {
        it.createdAt = ZonedDateTime.now()
        it.updatedAt = ZonedDateTime.now()
    }
}
