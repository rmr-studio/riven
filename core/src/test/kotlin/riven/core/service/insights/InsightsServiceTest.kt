package riven.core.service.insights

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.mockito.kotlin.any
import org.mockito.kotlin.anyOrNull
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.reset
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.security.access.AccessDeniedException
import org.springframework.test.context.bean.override.mockito.MockitoBean
import riven.core.configuration.auth.WorkspaceSecurity
import riven.core.entity.insights.InsightsChatSessionEntity
import riven.core.entity.insights.InsightsMessageEntity
import riven.core.enums.activity.Activity
import riven.core.enums.core.ApplicationEntityType
import riven.core.enums.insights.InsightsMessageRole
import riven.core.enums.knowledge.DefinitionStatus
import riven.core.enums.util.OperationType
import riven.core.enums.workspace.WorkspaceRoles
import riven.core.exceptions.NotFoundException
import riven.core.models.insights.CitationRef
import riven.core.models.insights.TokenUsage
import riven.core.repository.entity.EntityRepository
import riven.core.repository.identity.IdentityClusterRepository
import riven.core.repository.insights.InsightsChatSessionRepository
import riven.core.repository.insights.InsightsMessageRepository
import riven.core.service.activity.ActivityService
import riven.core.service.auth.AuthTokenService
import riven.core.service.insights.llm.AnthropicChatClient
import riven.core.service.insights.llm.dto.ChatCompletionResult
import riven.core.service.knowledge.WorkspaceBusinessDefinitionService
import riven.core.service.util.BaseServiceTest
import riven.core.service.util.SecurityTestConfig
import riven.core.service.util.WithUserPersona
import riven.core.service.util.WorkspaceRole
import riven.core.service.util.factory.entity.EntityFactory
import riven.core.service.util.factory.insights.InsightsFactory
import riven.core.service.util.factory.knowledge.BusinessDefinitionFactory
import java.util.Optional
import java.util.UUID

@SpringBootTest(
    classes = [
        AuthTokenService::class,
        WorkspaceSecurity::class,
        SecurityTestConfig::class,
        InsightsService::class,
        PromptBuilder::class,
    ]
)
@WithUserPersona(
    userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
    email = "test@test.com",
    displayName = "Test User",
    roles = [
        WorkspaceRole(
            workspaceId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
            role = WorkspaceRoles.ADMIN
        )
    ]
)
class InsightsServiceTest : BaseServiceTest() {

    @MockitoBean private lateinit var sessionRepository: InsightsChatSessionRepository
    @MockitoBean private lateinit var messageRepository: InsightsMessageRepository
    @MockitoBean private lateinit var entityRepository: EntityRepository
    @MockitoBean private lateinit var clusterRepository: IdentityClusterRepository
    @MockitoBean private lateinit var activityService: ActivityService
    @MockitoBean private lateinit var demoSeederService: DemoSeederService
    @MockitoBean private lateinit var augmentationPlanner: DemoAugmentationPlanner
    @MockitoBean private lateinit var businessDefinitionService: WorkspaceBusinessDefinitionService
    @MockitoBean private lateinit var anthropicChatClient: AnthropicChatClient
    @MockitoBean private lateinit var parser: InsightsResponseParser
    @MockitoBean private lateinit var answerSanitizer: AnswerSanitizer

    @Autowired private lateinit var service: InsightsService

    @BeforeEach
    fun setup() {
        reset(
            sessionRepository, messageRepository, entityRepository, clusterRepository, activityService,
            demoSeederService, augmentationPlanner, businessDefinitionService, anthropicChatClient, parser, answerSanitizer,
        )
        whenever(clusterRepository.findByDemoSessionId(any())).thenReturn(emptyList())
        whenever(augmentationPlanner.plan(any(), any(), any(), any(), any()))
            .thenReturn(AugmentationPlan.empty())
        whenever(answerSanitizer.sanitize(any(), any())).thenAnswer { inv ->
            AnswerSanitizer.SanitizedAnswer(content = inv.arguments[0] as String, citations = emptyList())
        }
        whenever(activityService.logActivity(any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(mock())
        whenever(businessDefinitionService.listDefinitions(any(), anyOrNull(), anyOrNull()))
            .thenReturn(emptyList())
    }

    @Nested
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "test@test.com",
        displayName = "Test User",
        roles = [WorkspaceRole(workspaceId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210", role = WorkspaceRoles.ADMIN)]
    )
    inner class CreateSession {

        @Test
        fun `creates session and logs activity`() {
            val savedId = UUID.randomUUID()
            whenever(sessionRepository.save(any<InsightsChatSessionEntity>())).thenAnswer { inv ->
                (inv.arguments[0] as InsightsChatSessionEntity).copy(id = savedId)
            }

            val session = service.createSession(workspaceId, "My session")

            assertNotNull(session.id)
            assertEquals("My session", session.title)
            verify(activityService).logActivity(
                activity = eq(Activity.INSIGHTS_CHAT_SESSION),
                operation = eq(OperationType.CREATE),
                userId = any(),
                workspaceId = eq(workspaceId),
                entityType = eq(ApplicationEntityType.INSIGHTS_CHAT_SESSION),
                entityId = any(),
                timestamp = any(),
                details = any(),
            )
        }
    }

    @Nested
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "test@test.com",
        displayName = "Test User",
        roles = [WorkspaceRole(workspaceId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210", role = WorkspaceRoles.ADMIN)]
    )
    inner class SendMessage {

        @Test
        fun `seeds pool on first turn skips on second and persists assistant reply`() {
            val sessionId = UUID.randomUUID()
            val unseededSession = InsightsFactory.createSession(id = sessionId, workspaceId = workspaceId, demoPoolSeeded = false)
            val seededSession = InsightsFactory.createSession(id = sessionId, workspaceId = workspaceId, demoPoolSeeded = true)
            val poolEntity = EntityFactory.createEntityEntity(id = UUID.randomUUID(), workspaceId = workspaceId)

            // First call: unseeded; second call: seeded; refresh-after-seed read returns seeded.
            whenever(sessionRepository.findByIdAndWorkspaceId(sessionId, workspaceId))
                .thenReturn(Optional.of(unseededSession))
                .thenReturn(Optional.of(seededSession))
            whenever(sessionRepository.findById(sessionId)).thenReturn(Optional.of(seededSession))
            whenever(messageRepository.findBySessionIdOrderByCreatedAtDesc(eq(sessionId), any<Pageable>()))
                .thenReturn(emptyList())
            whenever(entityRepository.findByDemoSessionId(sessionId)).thenReturn(listOf(poolEntity))
            whenever(messageRepository.save(any<InsightsMessageEntity>())).thenAnswer { inv ->
                (inv.arguments[0] as InsightsMessageEntity).copy(id = UUID.randomUUID())
            }
            whenever(sessionRepository.save(any<InsightsChatSessionEntity>())).thenAnswer { it.arguments[0] }
            whenever(demoSeederService.buildPoolSummary(sessionId)).thenReturn("pool")
            whenever(anthropicChatClient.sendMessage(any(), any()))
                .thenReturn(ChatCompletionResult(text = """{"answer":"hi","citations":[]}""", usage = TokenUsage(10, 20, 0, 0)))
            whenever(parser.parse(any())).thenReturn(InsightsResponseParser.ParsedResponse("hi"))

            // First message — should seed
            val first = service.sendMessage(sessionId, workspaceId, "what's up")
            assertEquals(InsightsMessageRole.ASSISTANT, first.role)
            verify(demoSeederService).seedPoolForSession(sessionId, workspaceId, userId)

            // Second message — already seeded
            reset(demoSeederService)
            whenever(demoSeederService.buildPoolSummary(sessionId)).thenReturn("pool")
            service.sendMessage(sessionId, workspaceId, "again")
            verify(demoSeederService, never()).seedPoolForSession(any(), any(), any())
        }

        @Test
        fun `persists token usage on assistant message`() {
            val sessionId = UUID.randomUUID()
            val session = InsightsFactory.createSession(id = sessionId, workspaceId = workspaceId, demoPoolSeeded = true)
            whenever(sessionRepository.findByIdAndWorkspaceId(sessionId, workspaceId)).thenReturn(Optional.of(session))
            whenever(messageRepository.findBySessionIdOrderByCreatedAtDesc(eq(sessionId), any<Pageable>())).thenReturn(emptyList())
            whenever(entityRepository.findByDemoSessionId(sessionId)).thenReturn(emptyList())
            whenever(messageRepository.save(any<InsightsMessageEntity>())).thenAnswer { inv ->
                (inv.arguments[0] as InsightsMessageEntity).copy(id = UUID.randomUUID())
            }
            whenever(sessionRepository.save(any<InsightsChatSessionEntity>())).thenAnswer { it.arguments[0] }
            whenever(demoSeederService.buildPoolSummary(sessionId)).thenReturn("pool")
            val usage = TokenUsage(100, 50, 25, 10)
            whenever(anthropicChatClient.sendMessage(any(), any()))
                .thenReturn(ChatCompletionResult(text = """{"answer":"x","citations":[]}""", usage = usage))
            whenever(parser.parse(any())).thenReturn(InsightsResponseParser.ParsedResponse("x"))

            service.sendMessage(sessionId, workspaceId, "hi")

            val captor = argumentCaptor<InsightsMessageEntity>()
            verify(messageRepository, org.mockito.kotlin.atLeast(2)).save(captor.capture())
            val assistantSave = captor.allValues.first { it.role == InsightsMessageRole.ASSISTANT }
            assertEquals(usage, assistantSave.tokenUsage)
        }

        @Test
        fun `strips invalid citations before persistence`() {
            val sessionId = UUID.randomUUID()
            val session = InsightsFactory.createSession(id = sessionId, workspaceId = workspaceId, demoPoolSeeded = true)
            whenever(sessionRepository.findByIdAndWorkspaceId(sessionId, workspaceId)).thenReturn(Optional.of(session))
            whenever(messageRepository.findBySessionIdOrderByCreatedAtDesc(eq(sessionId), any<Pageable>())).thenReturn(emptyList())
            whenever(entityRepository.findByDemoSessionId(sessionId)).thenReturn(emptyList())
            whenever(messageRepository.save(any<InsightsMessageEntity>())).thenAnswer { inv ->
                (inv.arguments[0] as InsightsMessageEntity).copy(id = UUID.randomUUID())
            }
            whenever(sessionRepository.save(any<InsightsChatSessionEntity>())).thenAnswer { it.arguments[0] }
            whenever(demoSeederService.buildPoolSummary(sessionId)).thenReturn("pool")
            whenever(anthropicChatClient.sendMessage(any(), any()))
                .thenReturn(ChatCompletionResult(text = """{"answer":"x"}""", usage = TokenUsage()))
            whenever(parser.parse(any())).thenReturn(InsightsResponseParser.ParsedResponse("x"))
            // Sanitizer drops everything: empty citations, content unchanged.
            whenever(answerSanitizer.sanitize(any(), any()))
                .thenReturn(AnswerSanitizer.SanitizedAnswer(content = "x", citations = emptyList()))

            val result = service.sendMessage(sessionId, workspaceId, "hi")

            assertEquals(0, result.citations.size)
        }

        @Test
        fun `persists sanitized content and derived citations`() {
            val sessionId = UUID.randomUUID()
            val session = InsightsFactory.createSession(id = sessionId, workspaceId = workspaceId, demoPoolSeeded = true)
            val poolEntityId = UUID.randomUUID()
            val poolEntity = EntityFactory.createEntityEntity(id = poolEntityId, workspaceId = workspaceId, typeKey = "customer")
            whenever(sessionRepository.findByIdAndWorkspaceId(sessionId, workspaceId)).thenReturn(Optional.of(session))
            whenever(messageRepository.findBySessionIdOrderByCreatedAtDesc(eq(sessionId), any<Pageable>())).thenReturn(emptyList())
            whenever(entityRepository.findByDemoSessionId(sessionId)).thenReturn(listOf(poolEntity))
            whenever(messageRepository.save(any<InsightsMessageEntity>())).thenAnswer { inv ->
                (inv.arguments[0] as InsightsMessageEntity).copy(id = UUID.randomUUID())
            }
            whenever(sessionRepository.save(any<InsightsChatSessionEntity>())).thenAnswer { it.arguments[0] }
            whenever(demoSeederService.buildPoolSummary(sessionId)).thenReturn("pool")
            val rawAnswer = "Customers like [Foo](entity:$poolEntityId) demonstrate."
            whenever(anthropicChatClient.sendMessage(any(), any()))
                .thenReturn(ChatCompletionResult(text = """{"answer":"$rawAnswer"}""", usage = TokenUsage()))
            whenever(parser.parse(any())).thenReturn(InsightsResponseParser.ParsedResponse(rawAnswer))
            val cite = CitationRef(entityId = poolEntityId, entityType = "customer", label = "Foo")
            whenever(answerSanitizer.sanitize(eq(rawAnswer), any()))
                .thenReturn(AnswerSanitizer.SanitizedAnswer(content = rawAnswer, citations = listOf(cite)))

            val result = service.sendMessage(sessionId, workspaceId, "hi")

            assertEquals(1, result.citations.size)
            assertEquals(poolEntityId, result.citations.first().entityId)
            assertEquals(rawAnswer, result.content)
        }

        @Test
        fun `fetches active business definitions exactly once per message and passes them to the prompt builder`() {
            val sessionId = UUID.randomUUID()
            val session = InsightsFactory.createSession(id = sessionId, workspaceId = workspaceId, demoPoolSeeded = true)
            val def = BusinessDefinitionFactory.createDefinitionModel(workspaceId = workspaceId, term = "valuable customer")
            whenever(sessionRepository.findByIdAndWorkspaceId(sessionId, workspaceId)).thenReturn(Optional.of(session))
            whenever(messageRepository.findBySessionIdOrderByCreatedAtDesc(eq(sessionId), any<Pageable>())).thenReturn(emptyList())
            whenever(entityRepository.findByDemoSessionId(sessionId)).thenReturn(emptyList())
            whenever(messageRepository.save(any<InsightsMessageEntity>())).thenAnswer { inv ->
                (inv.arguments[0] as InsightsMessageEntity).copy(id = UUID.randomUUID())
            }
            whenever(sessionRepository.save(any<InsightsChatSessionEntity>())).thenAnswer { it.arguments[0] }
            whenever(demoSeederService.buildPoolSummary(sessionId)).thenReturn("pool")
            whenever(businessDefinitionService.listDefinitions(eq(workspaceId), eq(DefinitionStatus.ACTIVE), eq(null)))
                .thenReturn(listOf(def))
            whenever(anthropicChatClient.sendMessage(any(), any()))
                .thenReturn(ChatCompletionResult(text = """{"answer":"x","citations":[]}""", usage = TokenUsage()))
            whenever(parser.parse(any())).thenReturn(InsightsResponseParser.ParsedResponse("x"))

            service.sendMessage(sessionId, workspaceId, "hi")

            verify(businessDefinitionService, org.mockito.kotlin.times(1))
                .listDefinitions(workspaceId, DefinitionStatus.ACTIVE, null)

            // Verify the definitions block — including our term — made it into the cached system prompt.
            val systemCaptor = argumentCaptor<String>()
            verify(anthropicChatClient).sendMessage(systemCaptor.capture(), any())
            assert(systemCaptor.firstValue.contains("valuable customer")) {
                "expected definitions to be rendered into the system prompt"
            }
        }

        @Test
        fun `propagates failures from business definition service without swallowing`() {
            val sessionId = UUID.randomUUID()
            val session = InsightsFactory.createSession(id = sessionId, workspaceId = workspaceId, demoPoolSeeded = true)
            whenever(sessionRepository.findByIdAndWorkspaceId(sessionId, workspaceId)).thenReturn(Optional.of(session))
            whenever(messageRepository.findBySessionIdOrderByCreatedAtDesc(eq(sessionId), any<Pageable>())).thenReturn(emptyList())
            whenever(messageRepository.save(any<InsightsMessageEntity>())).thenAnswer { inv ->
                (inv.arguments[0] as InsightsMessageEntity).copy(id = UUID.randomUUID())
            }
            whenever(demoSeederService.buildPoolSummary(sessionId)).thenReturn("pool")
            org.mockito.kotlin.doThrow(IllegalStateException("definitions boom"))
                .whenever(businessDefinitionService).listDefinitions(any(), any(), anyOrNull())

            val ex = assertThrows<IllegalStateException> {
                service.sendMessage(sessionId, workspaceId, "hi")
            }
            assertEquals("definitions boom", ex.message)
        }

        @Test
        fun `invokes planner and applier in order and passes post-augmentation summary to main LLM`() {
            val sessionId = UUID.randomUUID()
            val session = InsightsFactory.createSession(id = sessionId, workspaceId = workspaceId, demoPoolSeeded = true)
            whenever(sessionRepository.findByIdAndWorkspaceId(sessionId, workspaceId)).thenReturn(Optional.of(session))
            whenever(messageRepository.findBySessionIdOrderByCreatedAtDesc(eq(sessionId), any<Pageable>())).thenReturn(emptyList())
            whenever(entityRepository.findByDemoSessionId(sessionId)).thenReturn(emptyList())
            whenever(messageRepository.save(any<InsightsMessageEntity>())).thenAnswer { inv ->
                (inv.arguments[0] as InsightsMessageEntity).copy(id = UUID.randomUUID())
            }
            whenever(sessionRepository.save(any<InsightsChatSessionEntity>())).thenAnswer { it.arguments[0] }

            val plan = AugmentationPlan(
                customers = listOf(PlannedCustomer(name = "New Person")),
                events = emptyList(),
                reasoning = "question about a segment with no examples",
            )
            whenever(augmentationPlanner.plan(eq(sessionId), eq(workspaceId), any(), any(), any()))
                .thenReturn(plan)
            whenever(demoSeederService.applyAugmentationPlan(eq(sessionId), eq(workspaceId), any(), eq(plan)))
                .thenReturn(DemoSeederService.AugmentationResult(1, 0, 0))
            // Pool summary returns different values across calls: before/after augmentation.
            whenever(demoSeederService.buildPoolSummary(sessionId))
                .thenReturn("pool-before")
                .thenReturn("pool-after")
            whenever(anthropicChatClient.sendMessage(any(), any()))
                .thenReturn(ChatCompletionResult(text = """{"answer":"x"}""", usage = TokenUsage()))
            whenever(parser.parse(any())).thenReturn(InsightsResponseParser.ParsedResponse("x"))

            service.sendMessage(sessionId, workspaceId, "who is at-risk?")

            // Planner fed the pre-augmentation summary.
            val plannerSummaryCaptor = argumentCaptor<String>()
            verify(augmentationPlanner).plan(eq(sessionId), eq(workspaceId), eq("who is at-risk?"), plannerSummaryCaptor.capture(), any())
            assertEquals("pool-before", plannerSummaryCaptor.firstValue)

            // Applier received the plan.
            verify(demoSeederService).applyAugmentationPlan(eq(sessionId), eq(workspaceId), any(), eq(plan))

            // Main LLM saw the post-augmentation summary in its system prompt.
            val systemCaptor = argumentCaptor<String>()
            verify(anthropicChatClient).sendMessage(systemCaptor.capture(), any())
            assert(systemCaptor.firstValue.contains("pool-after")) {
                "expected main LLM to receive post-augmentation summary"
            }
        }

        @Test
        fun `sendMessage still succeeds when planner throws`() {
            val sessionId = UUID.randomUUID()
            val session = InsightsFactory.createSession(id = sessionId, workspaceId = workspaceId, demoPoolSeeded = true)
            whenever(sessionRepository.findByIdAndWorkspaceId(sessionId, workspaceId)).thenReturn(Optional.of(session))
            whenever(messageRepository.findBySessionIdOrderByCreatedAtDesc(eq(sessionId), any<Pageable>())).thenReturn(emptyList())
            whenever(entityRepository.findByDemoSessionId(sessionId)).thenReturn(emptyList())
            whenever(messageRepository.save(any<InsightsMessageEntity>())).thenAnswer { inv ->
                (inv.arguments[0] as InsightsMessageEntity).copy(id = UUID.randomUUID())
            }
            whenever(sessionRepository.save(any<InsightsChatSessionEntity>())).thenAnswer { it.arguments[0] }
            whenever(demoSeederService.buildPoolSummary(sessionId)).thenReturn("pool")
            org.mockito.kotlin.doThrow(RuntimeException("planner boom"))
                .whenever(augmentationPlanner).plan(any(), any(), any(), any(), any())
            whenever(anthropicChatClient.sendMessage(any(), any()))
                .thenReturn(ChatCompletionResult(text = """{"answer":"x"}""", usage = TokenUsage()))
            whenever(parser.parse(any())).thenReturn(InsightsResponseParser.ParsedResponse("x"))

            val result = service.sendMessage(sessionId, workspaceId, "hi")
            assertEquals(InsightsMessageRole.ASSISTANT, result.role)
            verify(demoSeederService, never()).applyAugmentationPlan(any(), any(), any(), any())
        }

        @Test
        fun `sendMessage still succeeds when applier throws`() {
            val sessionId = UUID.randomUUID()
            val session = InsightsFactory.createSession(id = sessionId, workspaceId = workspaceId, demoPoolSeeded = true)
            whenever(sessionRepository.findByIdAndWorkspaceId(sessionId, workspaceId)).thenReturn(Optional.of(session))
            whenever(messageRepository.findBySessionIdOrderByCreatedAtDesc(eq(sessionId), any<Pageable>())).thenReturn(emptyList())
            whenever(entityRepository.findByDemoSessionId(sessionId)).thenReturn(emptyList())
            whenever(messageRepository.save(any<InsightsMessageEntity>())).thenAnswer { inv ->
                (inv.arguments[0] as InsightsMessageEntity).copy(id = UUID.randomUUID())
            }
            whenever(sessionRepository.save(any<InsightsChatSessionEntity>())).thenAnswer { it.arguments[0] }
            whenever(demoSeederService.buildPoolSummary(sessionId)).thenReturn("pool")
            val plan = AugmentationPlan(
                customers = listOf(PlannedCustomer(name = "New Person")),
                events = emptyList(),
                reasoning = "x",
            )
            whenever(augmentationPlanner.plan(any(), any(), any(), any(), any())).thenReturn(plan)
            org.mockito.kotlin.doThrow(RuntimeException("apply boom"))
                .whenever(demoSeederService).applyAugmentationPlan(any(), any(), any(), any())
            whenever(anthropicChatClient.sendMessage(any(), any()))
                .thenReturn(ChatCompletionResult(text = """{"answer":"x"}""", usage = TokenUsage()))
            whenever(parser.parse(any())).thenReturn(InsightsResponseParser.ParsedResponse("x"))

            val result = service.sendMessage(sessionId, workspaceId, "hi")
            assertEquals(InsightsMessageRole.ASSISTANT, result.role)
        }

        @Test
        fun `throws NotFoundException when session does not exist`() {
            val sessionId = UUID.randomUUID()
            whenever(sessionRepository.findByIdAndWorkspaceId(sessionId, workspaceId)).thenReturn(Optional.empty())
            assertThrows<NotFoundException> {
                service.sendMessage(sessionId, workspaceId, "hi")
            }
        }
    }

    @Nested
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "test@test.com",
        displayName = "Test User",
        roles = [WorkspaceRole(workspaceId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210", role = WorkspaceRoles.ADMIN)]
    )
    inner class DeleteSession {

        @Test
        fun `cleans up demo pool then soft-deletes session`() {
            val sessionId = UUID.randomUUID()
            val entity = InsightsFactory.createSession(id = sessionId, workspaceId = workspaceId)
            whenever(sessionRepository.findByIdAndWorkspaceId(sessionId, workspaceId)).thenReturn(Optional.of(entity))
            whenever(sessionRepository.save(any<InsightsChatSessionEntity>())).thenAnswer { it.arguments[0] }

            service.deleteSession(sessionId, workspaceId)

            verify(demoSeederService).cleanupPoolForSession(sessionId)
            val captor = argumentCaptor<InsightsChatSessionEntity>()
            verify(sessionRepository).save(captor.capture())
            assert(captor.firstValue.deleted)
        }
    }

    @Nested
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "test@test.com",
        displayName = "Test User",
        roles = [WorkspaceRole(workspaceId = "a1b2c3d4-5e6f-7890-abcd-ef1234567890", role = WorkspaceRoles.ADMIN)]
    )
    inner class AccessControl {

        private val otherWorkspaceId: UUID = UUID.fromString("f8b1c2d3-4e5f-6789-abcd-ef9876543210")

        @Test
        fun `createSession throws AccessDeniedException for unauthorised workspace`() {
            assertThrows<AccessDeniedException> {
                service.createSession(otherWorkspaceId, "x")
            }
        }

        @Test
        fun `sendMessage throws AccessDeniedException for unauthorised workspace`() {
            assertThrows<AccessDeniedException> {
                service.sendMessage(UUID.randomUUID(), otherWorkspaceId, "hi")
            }
        }

        @Test
        fun `deleteSession throws AccessDeniedException for unauthorised workspace`() {
            assertThrows<AccessDeniedException> {
                service.deleteSession(UUID.randomUUID(), otherWorkspaceId)
            }
        }

        @Test
        fun `listSessions throws AccessDeniedException for unauthorised workspace`() {
            assertThrows<AccessDeniedException> {
                service.listSessions(otherWorkspaceId, PageRequest.of(0, 10))
            }
        }
    }

    @Nested
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "test@test.com",
        displayName = "Test User",
        roles = [WorkspaceRole(workspaceId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210", role = WorkspaceRoles.ADMIN)]
    )
    inner class ListSessions {

        @Test
        fun `returns paged sessions`() {
            val entity = InsightsFactory.createSession(workspaceId = workspaceId)
            whenever(sessionRepository.findByWorkspaceId(eq(workspaceId), any<Pageable>()))
                .thenReturn(PageImpl(listOf(entity)))

            val result = service.listSessions(workspaceId, PageRequest.of(0, 10))
            assertEquals(1, result.content.size)
        }
    }
}
