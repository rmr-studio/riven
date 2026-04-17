package riven.core.service.insights

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.mockito.kotlin.any
import org.mockito.kotlin.anyOrNull
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.eq
import org.mockito.kotlin.never
import org.mockito.kotlin.reset
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.security.access.AccessDeniedException
import org.springframework.test.context.bean.override.mockito.MockitoBean
import riven.core.configuration.auth.WorkspaceSecurity
import riven.core.enums.entity.semantics.SemanticGroup
import riven.core.enums.knowledge.DefinitionSource
import riven.core.enums.knowledge.DefinitionStatus
import riven.core.enums.workspace.WorkspaceRoles
import riven.core.models.request.knowledge.CreateBusinessDefinitionRequest
import riven.core.models.response.identity.ClusterSummaryResponse
import riven.core.repository.knowledge.WorkspaceBusinessDefinitionRepository
import riven.core.service.auth.AuthTokenService
import riven.core.service.entity.type.EntityTypeService
import riven.core.service.identity.IdentityReadService
import riven.core.service.knowledge.WorkspaceBusinessDefinitionService
import riven.core.service.util.BaseServiceTest
import riven.core.service.util.SecurityTestConfig
import riven.core.service.util.WithUserPersona
import riven.core.service.util.WorkspaceRole
import riven.core.service.util.factory.insights.InsightsFactory
import riven.core.service.util.factory.knowledge.BusinessDefinitionFactory
import riven.core.util.TermNormalizationUtil
import java.time.ZonedDateTime
import java.util.Optional
import java.util.UUID

@SpringBootTest(
    classes = [
        AuthTokenService::class,
        WorkspaceSecurity::class,
        SecurityTestConfig::class,
        InsightsDemoService::class,
    ]
)
@WithUserPersona(
    userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
    email = "test@test.com",
    displayName = "Test User",
    roles = [
        WorkspaceRole(
            workspaceId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
            role = WorkspaceRoles.ADMIN,
        )
    ]
)
class InsightsDemoServiceTest : BaseServiceTest() {

    @MockitoBean private lateinit var entityTypeService: EntityTypeService
    @MockitoBean private lateinit var identityReadService: IdentityReadService
    @MockitoBean private lateinit var businessDefinitionService: WorkspaceBusinessDefinitionService
    @MockitoBean private lateinit var businessDefinitionRepository: WorkspaceBusinessDefinitionRepository

    @Autowired private lateinit var service: InsightsDemoService

    private val curatedTerms = listOf("valuable customer", "active customer", "power user", "at risk", "retention")

    @BeforeEach
    fun setup() {
        reset(entityTypeService, identityReadService, businessDefinitionService, businessDefinitionRepository)
        whenever(entityTypeService.getWorkspaceEntityTypes(any())).thenReturn(emptyList())
        whenever(identityReadService.listClusters(any())).thenReturn(emptyList())
        whenever(businessDefinitionService.listDefinitions(any(), anyOrNull(), anyOrNull()))
            .thenReturn(emptyList())
        whenever(businessDefinitionRepository.findByWorkspaceIdAndNormalizedTerm(any(), any()))
            .thenReturn(Optional.empty())
    }

    @Test
    fun `returns empty list when workspace has no data signals`() {
        val result = service.suggestPrompts(workspaceId)
        assertTrue(result.isEmpty(), "expected no prompts when no signals are available; got: $result")
    }

    @Test
    fun `with only customer entities returns overview and top accounts only`() {
        whenever(entityTypeService.getWorkspaceEntityTypes(workspaceId)).thenReturn(
            listOf(InsightsFactory.createEntityTypeModel(workspaceId = workspaceId))
        )

        val result = service.suggestPrompts(workspaceId)

        val ids = result.map { it.id }.toSet()
        assertEquals(setOf("workspace-overview", "top-accounts-by-value"), ids)
        // No cluster/feature-dependent prompts surfaced
        assertFalse(ids.contains("cluster-comparison"))
        assertFalse(ids.contains("feature-adoption-30d"))
    }

    @Test
    fun `with clusters customers and feature usage returns multi-signal prompts ranked by score desc`() {
        whenever(entityTypeService.getWorkspaceEntityTypes(workspaceId)).thenReturn(
            listOf(
                InsightsFactory.createEntityTypeModel(
                    workspaceId = workspaceId, key = "customer", semanticGroup = SemanticGroup.CUSTOMER,
                ),
                InsightsFactory.createEntityTypeModel(
                    workspaceId = workspaceId,
                    key = "feature_usage_event",
                    singular = "Feature usage event",
                    plural = "Feature usage events",
                    semanticGroup = SemanticGroup.UNCATEGORIZED,
                ),
            )
        )
        whenever(identityReadService.listClusters(workspaceId)).thenReturn(
            listOf(clusterSummary("Power Users"), clusterSummary("At-Risk"))
        )

        val result = service.suggestPrompts(workspaceId)

        val ids = result.map { it.id }
        assertTrue("valuable-cohorts-features" in ids)
        assertTrue("cluster-comparison" in ids)
        assertTrue("at-risk-customers" in ids)
        // Ordering: scores must be non-increasing
        val scores = result.map { it.score }
        assertEquals(scores.sortedDescending(), scores)
        // Top prompt should be the highest base-score multi-signal one (valuable-cohorts-features, base 100)
        assertEquals("valuable-cohorts-features", result.first().id)
    }

    @Test
    fun `definition-cohort-size substitutes term and applies score boost when active definition exists`() {
        whenever(entityTypeService.getWorkspaceEntityTypes(workspaceId)).thenReturn(
            listOf(InsightsFactory.createEntityTypeModel(workspaceId = workspaceId))
        )
        whenever(
            businessDefinitionService.listDefinitions(eq(workspaceId), eq(DefinitionStatus.ACTIVE), anyOrNull())
        ).thenReturn(
            listOf(BusinessDefinitionFactory.createDefinitionModel(workspaceId = workspaceId, term = "active customer"))
        )

        val result = service.suggestPrompts(workspaceId)

        val cohort = result.firstOrNull { it.id == "definition-cohort-size" }
        assertNotNull(cohort, "expected definition-cohort-size prompt to be present")
        assertTrue(cohort!!.prompt.contains("'active customer'"), "expected term to be substituted into prompt: ${cohort.prompt}")
        // base 95 + 20 (term) + 5 (secondary signal: ACTIVE_BUSINESS_DEFINITIONS beyond CUSTOMER_ENTITIES) = 120
        assertEquals(120, cohort.score)

        // definition-trend requires FEATURE_USAGE_EVENTS which is missing — should be dropped
        assertFalse(result.any { it.id == "definition-trend" })
    }

    @Test
    fun `requiresDefinitionTerm prompts are dropped when no active definition exists`() {
        whenever(entityTypeService.getWorkspaceEntityTypes(workspaceId)).thenReturn(
            listOf(InsightsFactory.createEntityTypeModel(workspaceId = workspaceId))
        )
        // Even though we satisfy CUSTOMER_ENTITIES, there's no ACTIVE_BUSINESS_DEFINITIONS signal
        // so definition-cohort-size should be filtered out by the signal-availability check.
        val result = service.suggestPrompts(workspaceId)
        assertFalse(result.any { it.id == "definition-cohort-size" })
    }

    @Test
    fun `result is capped at 12`() {
        // Maximally satisfy every signal so the broadest set of prompts is eligible.
        whenever(entityTypeService.getWorkspaceEntityTypes(workspaceId)).thenReturn(
            listOf(
                InsightsFactory.createEntityTypeModel(workspaceId = workspaceId, key = "customer"),
                InsightsFactory.createEntityTypeModel(
                    workspaceId = workspaceId, key = "feature_usage_event",
                    singular = "Feature usage event", plural = "Feature usage events",
                ),
            )
        )
        whenever(identityReadService.listClusters(workspaceId)).thenReturn(
            listOf(clusterSummary("A"), clusterSummary("B"))
        )
        whenever(
            businessDefinitionService.listDefinitions(eq(workspaceId), eq(DefinitionStatus.ACTIVE), anyOrNull())
        ).thenReturn(
            listOf(BusinessDefinitionFactory.createDefinitionModel(workspaceId = workspaceId, term = "active customer"))
        )

        val result = service.suggestPrompts(workspaceId)

        assertTrue(result.size <= 12, "expected at most 12 prompts, got ${result.size}")
    }

    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "test@test.com",
        displayName = "Test User",
        roles = [WorkspaceRole(workspaceId = "a1b2c3d4-5e6f-7890-abcd-ef1234567890", role = WorkspaceRoles.ADMIN)]
    )
    fun `suggestPrompts blocks user without workspace role`() {
        val otherWorkspaceId = UUID.fromString("f8b1c2d3-4e5f-6789-abcd-ef9876543210")
        assertThrows<AccessDeniedException> {
            service.suggestPrompts(otherWorkspaceId)
        }
    }

    // ------ ensureDemoReady ------

    @Test
    fun `ensureDemoReady seeds all 5 curated definitions when workspace is empty`() {
        whenever(businessDefinitionService.createDefinitionInternal(any(), any(), any()))
            .thenAnswer { inv ->
                val req = inv.getArgument<CreateBusinessDefinitionRequest>(2)
                BusinessDefinitionFactory.createDefinitionModel(workspaceId = workspaceId, term = req.term)
            }

        val result = service.ensureDemoReady(workspaceId)

        assertEquals(5, result.definitionsSeeded)
        assertEquals(0, result.definitionsSkipped)

        val captor = argumentCaptor<CreateBusinessDefinitionRequest>()
        verify(businessDefinitionService, times(5))
            .createDefinitionInternal(eq(workspaceId), eq(userId), captor.capture())
        val createdTerms = captor.allValues.map { it.term }.toSet()
        assertEquals(curatedTerms.toSet(), createdTerms)
        // All seeded definitions use MANUAL source (no DEMO value exists in the enum).
        assertTrue(captor.allValues.all { it.source == DefinitionSource.MANUAL })
    }

    @Test
    fun `ensureDemoReady is idempotent on a fully seeded workspace`() {
        // Every normalized-term lookup returns an existing definition.
        whenever(businessDefinitionRepository.findByWorkspaceIdAndNormalizedTerm(eq(workspaceId), any()))
            .thenAnswer { inv ->
                val normalized = inv.getArgument<String>(1)
                Optional.of(
                    BusinessDefinitionFactory.createDefinition(
                        workspaceId = workspaceId,
                        term = normalized,
                        normalizedTerm = normalized,
                    )
                )
            }

        val result = service.ensureDemoReady(workspaceId)

        assertEquals(0, result.definitionsSeeded)
        assertEquals(5, result.definitionsSkipped)
        verify(businessDefinitionService, never()).createDefinitionInternal(any(), any(), any())
    }

    @Test
    fun `ensureDemoReady seeds only the missing definitions when partially pre-seeded`() {
        val preSeededTerms = setOf("valuable customer", "retention")
        whenever(businessDefinitionRepository.findByWorkspaceIdAndNormalizedTerm(eq(workspaceId), any()))
            .thenAnswer { inv ->
                val normalized = inv.getArgument<String>(1)
                if (normalized in preSeededTerms) {
                    Optional.of(
                        BusinessDefinitionFactory.createDefinition(
                            workspaceId = workspaceId,
                            term = normalized,
                            normalizedTerm = normalized,
                        )
                    )
                } else {
                    Optional.empty()
                }
            }
        whenever(businessDefinitionService.createDefinitionInternal(any(), any(), any()))
            .thenAnswer { inv ->
                val req = inv.getArgument<CreateBusinessDefinitionRequest>(2)
                BusinessDefinitionFactory.createDefinitionModel(workspaceId = workspaceId, term = req.term)
            }

        val result = service.ensureDemoReady(workspaceId)

        assertEquals(3, result.definitionsSeeded)
        assertEquals(2, result.definitionsSkipped)

        val captor = argumentCaptor<CreateBusinessDefinitionRequest>()
        verify(businessDefinitionService, times(3))
            .createDefinitionInternal(eq(workspaceId), eq(userId), captor.capture())
        val createdTerms = captor.allValues.map { it.term }.toSet()
        assertEquals(setOf("active customer", "power user", "at risk"), createdTerms)
    }

    @Test
    fun `ensureDemoReady treats case and whitespace variants as duplicates via TermNormalizationUtil`() {
        // Pre-seed using a messy variant of "active customer" — when normalized, it should still
        // match the curated lookup key, proving the service uses the same util the rest of the
        // domain does.
        val activeCustomerNormalized = TermNormalizationUtil.normalize("active customer")
        val messyVariantNormalized = TermNormalizationUtil.normalize("Active Customer ")
        assertEquals(activeCustomerNormalized, messyVariantNormalized)

        whenever(businessDefinitionRepository.findByWorkspaceIdAndNormalizedTerm(eq(workspaceId), eq(activeCustomerNormalized)))
            .thenReturn(
                Optional.of(
                    BusinessDefinitionFactory.createDefinition(
                        workspaceId = workspaceId,
                        term = "Active Customer ",
                        normalizedTerm = activeCustomerNormalized,
                    )
                )
            )
        whenever(businessDefinitionService.createDefinitionInternal(any(), any(), any()))
            .thenAnswer { inv ->
                val req = inv.getArgument<CreateBusinessDefinitionRequest>(2)
                BusinessDefinitionFactory.createDefinitionModel(workspaceId = workspaceId, term = req.term)
            }

        val result = service.ensureDemoReady(workspaceId)

        assertEquals(4, result.definitionsSeeded)
        assertEquals(1, result.definitionsSkipped)
        // The skipped term must be active customer — it should NOT have been re-created.
        val captor = argumentCaptor<CreateBusinessDefinitionRequest>()
        verify(businessDefinitionService, times(4))
            .createDefinitionInternal(eq(workspaceId), eq(userId), captor.capture())
        val createdTerms = captor.allValues.map { it.term }.toSet()
        assertFalse("active customer" in createdTerms, "active customer was already present and should be skipped")
        assertEquals(setOf("valuable customer", "power user", "at risk", "retention"), createdTerms)
    }

    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "test@test.com",
        displayName = "Test User",
        roles = [WorkspaceRole(workspaceId = "a1b2c3d4-5e6f-7890-abcd-ef1234567890", role = WorkspaceRoles.ADMIN)]
    )
    fun `ensureDemoReady blocks user without workspace role`() {
        val otherWorkspaceId = UUID.fromString("f8b1c2d3-4e5f-6789-abcd-ef9876543210")
        assertThrows<AccessDeniedException> {
            service.ensureDemoReady(otherWorkspaceId)
        }
    }

    private fun clusterSummary(name: String): ClusterSummaryResponse =
        ClusterSummaryResponse(
            id = UUID.randomUUID(),
            workspaceId = workspaceId,
            name = name,
            memberCount = 5,
            createdAt = ZonedDateTime.now(),
        )
}
