package riven.core.service.insights

import io.github.oshai.kotlinlogging.KLogger
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import riven.core.entity.insights.InsightsChatSessionEntity
import riven.core.entity.insights.InsightsMessageEntity
import riven.core.enums.activity.Activity
import riven.core.enums.core.ApplicationEntityType
import riven.core.enums.insights.InsightsMessageRole
import riven.core.enums.knowledge.DefinitionStatus
import riven.core.enums.util.OperationType
import riven.core.models.common.markDeleted
import riven.core.models.insights.InsightsChatSessionModel
import riven.core.models.insights.InsightsMessageModel
import riven.core.repository.entity.EntityRepository
import riven.core.repository.identity.IdentityClusterRepository
import riven.core.repository.insights.InsightsChatSessionRepository
import riven.core.repository.insights.InsightsMessageRepository
import riven.core.service.activity.ActivityService
import riven.core.service.activity.log
import riven.core.service.auth.AuthTokenService
import riven.core.service.insights.llm.AnthropicChatClient
import riven.core.service.knowledge.WorkspaceBusinessDefinitionService
import riven.core.util.ServiceUtil.findOrThrow
import java.time.ZonedDateTime
import java.util.UUID

/**
 * Orchestrates the Insights chat demo: session lifecycle, demo-pool seeding,
 * LLM dispatch, citation validation, and message persistence.
 */
@Service
class InsightsService(
    private val sessionRepository: InsightsChatSessionRepository,
    private val messageRepository: InsightsMessageRepository,
    private val entityRepository: EntityRepository,
    private val clusterRepository: IdentityClusterRepository,
    private val authTokenService: AuthTokenService,
    private val activityService: ActivityService,
    private val demoSeederService: DemoSeederService,
    private val augmentationPlanner: DemoAugmentationPlanner,
    private val businessDefinitionService: WorkspaceBusinessDefinitionService,
    private val anthropicChatClient: AnthropicChatClient,
    private val promptBuilder: PromptBuilder,
    private val parser: InsightsResponseParser,
    private val answerSanitizer: AnswerSanitizer,
    private val logger: KLogger,
) {

    // ------ Public read operations ------

    /** Lists chat sessions for a workspace, most-recently-active first. */
    @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
    fun listSessions(workspaceId: UUID, pageable: Pageable): Page<InsightsChatSessionModel> =
        sessionRepository.findByWorkspaceId(workspaceId, pageable).map { it.toModel() }

    /** Fetches the full ordered message history for a session. */
    @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
    fun getSessionMessages(sessionId: UUID, workspaceId: UUID): List<InsightsMessageModel> {
        val session = findOrThrow { sessionRepository.findByIdAndWorkspaceId(sessionId, workspaceId) }
        return messageRepository.findBySessionIdOrderByCreatedAtAsc(requireNotNull(session.id))
            .map { it.toModel() }
    }

    // ------ Public mutations ------

    /** Creates a new chat session in the given workspace. */
    @Transactional
    @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
    fun createSession(workspaceId: UUID, title: String?): InsightsChatSessionModel {
        val userId = authTokenService.getUserId()
        val saved = sessionRepository.save(
            InsightsChatSessionEntity(
                workspaceId = workspaceId,
                title = title?.takeIf { it.isNotBlank() },
            )
        )

        activityService.log(
            activity = Activity.INSIGHTS_CHAT_SESSION,
            operation = OperationType.CREATE,
            userId = userId,
            workspaceId = workspaceId,
            entityType = ApplicationEntityType.INSIGHTS_CHAT_SESSION,
            entityId = saved.id,
            "title" to saved.title,
        )

        logger.info { "Created insights chat session ${saved.id} for workspace $workspaceId" }
        return saved.toModel()
    }

    /**
     * Sends a user message, lazily seeds the demo pool on first turn, calls the LLM,
     * validates citations, and persists the assistant response.
     */
    @Transactional
    @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
    fun sendMessage(sessionId: UUID, workspaceId: UUID, userMessage: String): InsightsMessageModel {
        require(userMessage.isNotBlank()) { "Message must not be blank" }
        val userId = authTokenService.getUserId()
        val session = findOrThrow { sessionRepository.findByIdAndWorkspaceId(sessionId, workspaceId) }
        val sessionPk = requireNotNull(session.id) { "Session id must not be null" }

        ensurePoolSeeded(session, workspaceId, userId)
        persistUserMessage(sessionPk, userMessage)
        val history = loadHistoryForPrompt(sessionPk)

        val definitions = businessDefinitionService.listDefinitions(
            workspaceId = workspaceId,
            status = DefinitionStatus.ACTIVE,
        )

        // Per-message demo augmentation — grows the pool to credibly answer the current question.
        // Planner + applier failures degrade gracefully: log WARN and proceed with the existing pool.
        runCatching {
            val preSummary = demoSeederService.buildPoolSummary(sessionPk)
            val plan = augmentationPlanner.plan(
                sessionId = sessionPk,
                workspaceId = workspaceId,
                userMessage = userMessage,
                poolSummary = preSummary,
                activeDefinitions = definitions,
            )
            if (plan.customers.isNotEmpty() || plan.events.isNotEmpty()) {
                demoSeederService.applyAugmentationPlan(sessionPk, workspaceId, userId, plan)
            }
        }.onFailure { e ->
            logger.warn(e) { "Demo augmentation step failed for session $sessionPk — continuing with existing pool" }
        }

        // Rebuild pool summary AFTER augmentation so the LLM sees any newly-seeded rows.
        val poolSummary = demoSeederService.buildPoolSummary(sessionPk)
        val systemPrompt = promptBuilder.buildSystem(poolSummary, definitions)
        val messages = promptBuilder.buildMessages(history.dropLast(1), userMessage)

        val completion = anthropicChatClient.sendMessage(systemPrompt, messages)
        val parsed = parser.parse(completion.text)
        val poolEntityIdToType = buildPoolTypeMap(sessionPk)
        val sanitized = answerSanitizer.sanitize(parsed.answer, poolEntityIdToType)

        val assistantEntity = messageRepository.save(
            InsightsMessageEntity(
                sessionId = sessionPk,
                role = InsightsMessageRole.ASSISTANT,
                content = sanitized.content,
                citations = sanitized.citations,
                tokenUsage = completion.usage,
            )
        )

        session.lastMessageAt = ZonedDateTime.now()
        sessionRepository.save(session)

        activityService.log(
            activity = Activity.INSIGHTS_MESSAGE,
            operation = OperationType.CREATE,
            userId = userId,
            workspaceId = workspaceId,
            entityType = ApplicationEntityType.INSIGHTS_MESSAGE,
            entityId = assistantEntity.id,
            "sessionId" to sessionPk.toString(),
            "role" to InsightsMessageRole.ASSISTANT.name,
            "citationCount" to sanitized.citations.size,
        )

        return assistantEntity.toModel()
    }

    /** Soft-deletes a session and cleans up its seeded demo entities/clusters. */
    @Transactional
    @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
    fun deleteSession(sessionId: UUID, workspaceId: UUID) {
        val userId = authTokenService.getUserId()
        val session = findOrThrow { sessionRepository.findByIdAndWorkspaceId(sessionId, workspaceId) }
        val sessionPk = requireNotNull(session.id)

        demoSeederService.cleanupPoolForSession(sessionPk)
        session.markDeleted()
        sessionRepository.save(session)

        activityService.log(
            activity = Activity.INSIGHTS_CHAT_SESSION,
            operation = OperationType.DELETE,
            userId = userId,
            workspaceId = workspaceId,
            entityType = ApplicationEntityType.INSIGHTS_CHAT_SESSION,
            entityId = sessionPk,
        )

        logger.info { "Deleted insights chat session $sessionPk for workspace $workspaceId" }
    }

    // ------ Private helpers ------

    private fun ensurePoolSeeded(session: InsightsChatSessionEntity, workspaceId: UUID, userId: UUID) {
        if (session.demoPoolSeeded) return
        val sessionPk = requireNotNull(session.id)
        demoSeederService.seedPoolForSession(sessionPk, workspaceId, userId)
        // Refresh the local reference so the caller sees demoPoolSeeded = true on the next use.
        sessionRepository.findById(sessionPk).ifPresent { fresh -> session.demoPoolSeeded = fresh.demoPoolSeeded }
    }

    private fun persistUserMessage(sessionId: UUID, content: String) {
        messageRepository.save(
            InsightsMessageEntity(
                sessionId = sessionId,
                role = InsightsMessageRole.USER,
                content = content,
            )
        )
    }

    /**
     * Builds the {entityId -> entityType} map used by [AnswerSanitizer] to validate inline
     * citations. Combines pool entities (typed by `typeKey`) with seeded identity clusters
     * (typed as `"identity_cluster"`).
     */
    private fun buildPoolTypeMap(sessionId: UUID): Map<UUID, String> {
        val out = mutableMapOf<UUID, String>()
        entityRepository.findByDemoSessionId(sessionId).forEach { e ->
            val id = e.id ?: return@forEach
            out[id] = e.typeKey
        }
        clusterRepository.findByDemoSessionId(sessionId).forEach { c ->
            val id = c.id ?: return@forEach
            out[id] = "identity_cluster"
        }
        return out
    }

    /** Loads the most recent 20 messages, in chronological order. */
    private fun loadHistoryForPrompt(sessionId: UUID): List<InsightsMessageModel> {
        val pageable = org.springframework.data.domain.PageRequest.of(0, 20)
        val recentDesc = messageRepository.findBySessionIdOrderByCreatedAtDesc(sessionId, pageable)
        return recentDesc.asReversed().map { it.toModel() }
    }
}
