package riven.core.service.insights

import tools.jackson.databind.ObjectMapper
import tools.jackson.module.kotlin.jacksonObjectMapper
import io.github.oshai.kotlinlogging.KLogger
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.atLeast
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.reset
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import riven.core.entity.entity.EntityAttributeEntity
import riven.core.entity.entity.EntityEntity
import riven.core.entity.entity.EntityRelationshipEntity
import riven.core.entity.entity.EntityTypeEntity
import riven.core.entity.entity.RelationshipDefinitionEntity
import riven.core.entity.identity.IdentityClusterEntity
import riven.core.entity.identity.IdentityClusterMemberEntity
import riven.core.enums.common.validation.SchemaType
import riven.core.enums.core.DataType
import riven.core.models.common.validation.Schema
import riven.core.models.entity.EntityTypeSchema
import riven.core.repository.entity.EntityAttributeRepository
import riven.core.repository.entity.EntityRelationshipRepository
import riven.core.repository.entity.EntityRepository
import riven.core.repository.entity.EntityTypeRepository
import riven.core.repository.entity.RelationshipDefinitionRepository
import riven.core.repository.identity.IdentityClusterMemberRepository
import riven.core.repository.identity.IdentityClusterRepository
import riven.core.repository.insights.InsightsChatSessionRepository
import riven.core.service.util.factory.entity.EntityFactory
import riven.core.service.util.factory.insights.InsightsFactory
import java.util.Optional
import java.util.UUID

class DemoSeederServiceTest {

    private val sessionRepository: InsightsChatSessionRepository = mock()
    private val entityRepository: EntityRepository = mock()
    private val entityTypeRepository: EntityTypeRepository = mock()
    private val entityAttributeRepository: EntityAttributeRepository = mock()
    private val entityRelationshipRepository: EntityRelationshipRepository = mock()
    private val relationshipDefinitionRepository: RelationshipDefinitionRepository = mock()
    private val clusterRepository: IdentityClusterRepository = mock()
    private val clusterMemberRepository: IdentityClusterMemberRepository = mock()
    private val logger: KLogger = mock()
    private val objectMapper: ObjectMapper = jacksonObjectMapper()

    private val seeder = DemoSeederService(
        sessionRepository,
        entityRepository,
        entityTypeRepository,
        entityAttributeRepository,
        entityRelationshipRepository,
        relationshipDefinitionRepository,
        clusterRepository,
        clusterMemberRepository,
        objectMapper,
        logger,
    )

    private val workspaceId = UUID.randomUUID()
    private val sessionId = UUID.randomUUID()
    private val userId = UUID.randomUUID()

    // Stable attribute IDs so the seeder can resolve them by label.
    private val customerNameAttrId = UUID.randomUUID()
    private val customerEmailAttrId = UUID.randomUUID()
    private val customerPlanAttrId = UUID.randomUUID()
    private val customerSignupAttrId = UUID.randomUUID()
    private val customerLtvAttrId = UUID.randomUUID()
    private val eventFeatureAttrId = UUID.randomUUID()
    private val eventActionAttrId = UUID.randomUUID()
    private val eventDateAttrId = UUID.randomUUID()
    private val eventCountAttrId = UUID.randomUUID()

    @BeforeEach
    fun setup() {
        reset(
            sessionRepository, entityRepository, entityTypeRepository, entityAttributeRepository,
            entityRelationshipRepository, relationshipDefinitionRepository,
            clusterRepository, clusterMemberRepository,
        )
        whenever(entityTypeRepository.findByworkspaceId(workspaceId)).thenReturn(emptyList())
        whenever(entityRepository.saveAll(any<List<EntityEntity>>())).thenAnswer { inv ->
            @Suppress("UNCHECKED_CAST")
            (inv.arguments[0] as List<EntityEntity>).map { it.copy(id = UUID.randomUUID()) }
        }
        whenever(entityAttributeRepository.saveAll(any<List<EntityAttributeEntity>>())).thenAnswer { it.arguments[0] }
        whenever(entityRelationshipRepository.saveAll(any<List<EntityRelationshipEntity>>())).thenAnswer { it.arguments[0] }
        whenever(clusterRepository.save(any<IdentityClusterEntity>())).thenAnswer { inv ->
            (inv.arguments[0] as IdentityClusterEntity).copy(id = UUID.randomUUID())
        }
        whenever(clusterMemberRepository.save(any<IdentityClusterMemberEntity>())).thenAnswer { inv ->
            (inv.arguments[0] as IdentityClusterMemberEntity).copy(id = UUID.randomUUID())
        }
        whenever(sessionRepository.save(any<riven.core.entity.insights.InsightsChatSessionEntity>())).thenAnswer { it.arguments[0] }
    }

    // ------ Customer entity type schema fixtures ------

    private fun customerSchema(): EntityTypeSchema = Schema(
        key = SchemaType.OBJECT,
        type = DataType.OBJECT,
        properties = mapOf(
            customerNameAttrId to Schema(key = SchemaType.TEXT, type = DataType.STRING, label = "Name"),
            customerEmailAttrId to Schema(key = SchemaType.EMAIL, type = DataType.STRING, label = "Email"),
            customerPlanAttrId to Schema(key = SchemaType.SELECT, type = DataType.STRING, label = "Plan"),
            customerSignupAttrId to Schema(key = SchemaType.DATE, type = DataType.STRING, label = "Signup date"),
            customerLtvAttrId to Schema(key = SchemaType.NUMBER, type = DataType.NUMBER, label = "LTV"),
        ),
    )

    private fun eventSchema(): EntityTypeSchema = Schema(
        key = SchemaType.OBJECT,
        type = DataType.OBJECT,
        properties = mapOf(
            eventFeatureAttrId to Schema(key = SchemaType.SELECT, type = DataType.STRING, label = "Feature name"),
            eventActionAttrId to Schema(key = SchemaType.SELECT, type = DataType.STRING, label = "Action"),
            eventDateAttrId to Schema(key = SchemaType.DATE, type = DataType.STRING, label = "Date"),
            eventCountAttrId to Schema(key = SchemaType.NUMBER, type = DataType.NUMBER, label = "Count"),
        ),
    )

    private fun customerType(): EntityTypeEntity = EntityFactory.createEntityType(
        key = "customer",
        workspaceId = workspaceId,
        schema = customerSchema(),
        identifierKey = customerNameAttrId,
    )

    private fun eventType(): EntityTypeEntity = EntityFactory.createEntityType(
        key = "feature_usage_event",
        workspaceId = workspaceId,
        schema = eventSchema(),
        identifierKey = eventFeatureAttrId,
    )

    // ------ Tests ------

    @Test
    fun `idempotent — second call no-ops when demoPoolSeeded is true`() {
        val seededSession = InsightsFactory.createSession(id = sessionId, workspaceId = workspaceId, demoPoolSeeded = true)
        whenever(sessionRepository.findById(sessionId)).thenReturn(Optional.of(seededSession))

        seeder.seedPoolForSession(sessionId, workspaceId, userId)

        verify(entityRepository, never()).saveAll(any<List<EntityEntity>>())
        verify(entityAttributeRepository, never()).saveAll(any<List<EntityAttributeEntity>>())
        verify(clusterRepository, never()).save(any<IdentityClusterEntity>())
    }

    @Test
    fun `creates clusters and tags them with sessionId on first call`() {
        val unseededSession = InsightsFactory.createSession(id = sessionId, workspaceId = workspaceId, demoPoolSeeded = false)
        whenever(sessionRepository.findById(sessionId)).thenReturn(Optional.of(unseededSession))

        seeder.seedPoolForSession(sessionId, workspaceId, userId)

        val captor = argumentCaptor<IdentityClusterEntity>()
        verify(clusterRepository, atLeast(4)).save(captor.capture())
        assertTrue(captor.allValues.any { it.demoSessionId == sessionId })
    }

    @Test
    fun `seeds customer attribute rows when matching schema attributes exist`() {
        val unseededSession = InsightsFactory.createSession(id = sessionId, workspaceId = workspaceId, demoPoolSeeded = false)
        whenever(sessionRepository.findById(sessionId)).thenReturn(Optional.of(unseededSession))
        whenever(entityTypeRepository.findByworkspaceId(workspaceId))
            .thenReturn(listOf(customerType(), eventType()))
        whenever(relationshipDefinitionRepository.findByWorkspaceIdAndSourceEntityTypeId(any(), any()))
            .thenReturn(emptyList())

        seeder.seedPoolForSession(sessionId, workspaceId, userId)

        val captor = argumentCaptor<List<EntityAttributeEntity>>()
        verify(entityAttributeRepository, atLeast(1)).saveAll(captor.capture())
        val flat = captor.allValues.flatten()
        val ids = flat.map { it.attributeId }.toSet()
        // Customer attrs should be present.
        assertTrue(ids.contains(customerNameAttrId), "expected customer name attribute to be seeded")
        assertTrue(ids.contains(customerPlanAttrId), "expected customer plan attribute to be seeded")
        assertTrue(ids.contains(customerLtvAttrId), "expected customer LTV attribute to be seeded")
        // Event attrs should be present.
        assertTrue(ids.contains(eventFeatureAttrId), "expected event feature attribute to be seeded")
        assertTrue(ids.contains(eventActionAttrId), "expected event action attribute to be seeded")
    }

    @Test
    fun `seeds event-to-customer relationships when a relationship definition exists`() {
        val unseededSession = InsightsFactory.createSession(id = sessionId, workspaceId = workspaceId, demoPoolSeeded = false)
        whenever(sessionRepository.findById(sessionId)).thenReturn(Optional.of(unseededSession))
        val cType = customerType()
        val eType = eventType()
        whenever(entityTypeRepository.findByworkspaceId(workspaceId)).thenReturn(listOf(cType, eType))

        val defId = UUID.randomUUID()
        whenever(relationshipDefinitionRepository.findByWorkspaceIdAndSourceEntityTypeId(workspaceId, eType.id!!))
            .thenReturn(
                listOf(
                    RelationshipDefinitionEntity(
                        id = defId,
                        workspaceId = workspaceId,
                        sourceEntityTypeId = eType.id!!,
                        name = "Customer",
                        cardinalityDefault = riven.core.enums.entity.EntityRelationshipCardinality.MANY_TO_ONE,
                    )
                )
            )

        seeder.seedPoolForSession(sessionId, workspaceId, userId)

        val captor = argumentCaptor<List<EntityRelationshipEntity>>()
        verify(entityRelationshipRepository, atLeast(1)).saveAll(captor.capture())
        val allRels = captor.allValues.flatten()
        assertTrue(allRels.isNotEmpty(), "expected relationships to be seeded")
        assertTrue(allRels.all { it.definitionId == defId })
    }

    @Test
    fun `cleanup soft-deletes entities, attributes, and relationships tagged with sessionId`() {
        val tagged1 = EntityFactory.createEntityEntity(id = UUID.randomUUID(), workspaceId = workspaceId)
            .also { it.demoSessionId = sessionId }
        val tagged2 = EntityFactory.createEntityEntity(id = UUID.randomUUID(), workspaceId = workspaceId)
            .also { it.demoSessionId = sessionId }
        whenever(entityRepository.findByDemoSessionId(sessionId)).thenReturn(listOf(tagged1, tagged2))
        whenever(clusterRepository.findByDemoSessionId(sessionId)).thenReturn(emptyList())

        seeder.cleanupPoolForSession(sessionId)

        val entityCaptor = argumentCaptor<List<EntityEntity>>()
        verify(entityRepository).saveAll(entityCaptor.capture())
        assertTrue(entityCaptor.firstValue.all { it.deleted })

        verify(entityAttributeRepository).softDeleteByEntityIds(any(), org.mockito.kotlin.eq(workspaceId))
        verify(entityRelationshipRepository).deleteEntities(any(), org.mockito.kotlin.eq(workspaceId))
    }

    @Test
    fun `buildPoolSummary includes attribute values and relationship context`() {
        val cType = customerType()
        val eType = eventType()
        val customerId = UUID.randomUUID()
        val eventId = UUID.randomUUID()
        val customer = EntityFactory.createEntityEntity(id = customerId, workspaceId = workspaceId, typeKey = "customer", typeId = cType.id!!)
        val event = EntityFactory.createEntityEntity(id = eventId, workspaceId = workspaceId, typeKey = "feature_usage_event", typeId = eType.id!!)

        whenever(entityRepository.findByDemoSessionId(sessionId)).thenReturn(listOf(customer, event))
        whenever(clusterRepository.findByDemoSessionId(sessionId)).thenReturn(emptyList())
        whenever(entityTypeRepository.findById(cType.id!!)).thenReturn(Optional.of(cType))
        whenever(entityTypeRepository.findById(eType.id!!)).thenReturn(Optional.of(eType))

        val customerAttrs = listOf(
            makeAttr(customerId, customerPlanAttrId, SchemaType.SELECT, "Pro"),
            makeAttr(customerId, customerLtvAttrId, SchemaType.NUMBER, 4200),
            makeAttr(customerId, customerNameAttrId, SchemaType.TEXT, "Sarah Chen"),
        )
        val eventAttrs = listOf(
            makeAttr(eventId, eventFeatureAttrId, SchemaType.SELECT, "search"),
            makeAttr(eventId, eventActionAttrId, SchemaType.SELECT, "used"),
            makeAttr(eventId, eventCountAttrId, SchemaType.NUMBER, 12),
        )
        whenever(entityAttributeRepository.findByEntityIdIn(listOf(customerId, eventId)))
            .thenReturn(customerAttrs + eventAttrs)
        whenever(entityRelationshipRepository.findBySourceIdIn(listOf(customerId, eventId)))
            .thenReturn(
                listOf(
                    EntityRelationshipEntity(
                        id = UUID.randomUUID(),
                        workspaceId = workspaceId,
                        sourceId = eventId,
                        targetId = customerId,
                        definitionId = UUID.randomUUID(),
                    )
                )
            )

        val out = seeder.buildPoolSummary(sessionId)

        assertTrue(out.contains("customer"), "expected customer type header")
        assertTrue(out.contains("feature_usage_event"), "expected event type header")
        assertTrue(out.contains("Sarah Chen"), "expected customer name in summary")
        assertTrue(out.contains("plan=Pro"), "expected plan attribute in summary")
        assertTrue(out.contains("ltv=4200"), "expected ltv attribute in summary")
        assertTrue(out.contains("feature=search"), "expected event feature in summary")
        assertTrue(out.contains("customer=$customerId"), "expected event to reference owning customer")
    }

    private fun makeAttr(entityId: UUID, attributeId: UUID, type: SchemaType, value: Any): EntityAttributeEntity {
        val json: tools.jackson.databind.JsonNode = objectMapper.valueToTree(mapOf("value" to value))
        return EntityAttributeEntity(
            id = UUID.randomUUID(),
            entityId = entityId,
            workspaceId = workspaceId,
            typeId = UUID.randomUUID(),
            attributeId = attributeId,
            schemaType = type,
            value = json,
        )
    }

    // ------ applyAugmentationPlan tests ------

    @Test
    fun `applyAugmentationPlan creates customers and events tagged with session id`() {
        val seededSession = InsightsFactory.createSession(id = sessionId, workspaceId = workspaceId, demoPoolSeeded = true)
        whenever(sessionRepository.findById(sessionId)).thenReturn(Optional.of(seededSession))
        whenever(entityTypeRepository.findByworkspaceId(workspaceId)).thenReturn(listOf(customerType(), eventType()))
        whenever(clusterRepository.findByDemoSessionId(sessionId)).thenReturn(emptyList())
        whenever(relationshipDefinitionRepository.findByWorkspaceIdAndSourceEntityTypeId(any(), any()))
            .thenReturn(emptyList())

        val plan = AugmentationPlan(
            customers = listOf(
                PlannedCustomer(name = "Ada Lovelace", plan = "Pro", ltv = 5000, eventCount = 2),
                PlannedCustomer(name = "Grace Hopper", plan = "Enterprise", signupDaysAgo = 120),
            ),
            events = listOf(
                PlannedEvent(customerRef = "Ada Lovelace", feature = "timeline", action = "used", count = 3, daysAgo = 1),
                PlannedEvent(customerRef = "Grace Hopper", feature = "reports", action = "viewed", count = 1, daysAgo = 5),
            ),
            reasoning = "needed prominent users",
        )

        val result = seeder.applyAugmentationPlan(sessionId, workspaceId, userId, plan)

        assertTrue(result.customersAdded == 2)
        assertTrue(result.eventsAdded == 2)

        val entityCaptor = argumentCaptor<List<EntityEntity>>()
        verify(entityRepository, atLeast(2)).saveAll(entityCaptor.capture())
        val allEntities = entityCaptor.allValues.flatten()
        assertTrue(allEntities.all { it.demoSessionId == sessionId })
    }

    @Test
    fun `applyAugmentationPlan clamps oversized plans`() {
        val seededSession = InsightsFactory.createSession(id = sessionId, workspaceId = workspaceId, demoPoolSeeded = true)
        whenever(sessionRepository.findById(sessionId)).thenReturn(Optional.of(seededSession))
        whenever(entityTypeRepository.findByworkspaceId(workspaceId)).thenReturn(listOf(customerType(), eventType()))
        whenever(clusterRepository.findByDemoSessionId(sessionId)).thenReturn(emptyList())
        whenever(relationshipDefinitionRepository.findByWorkspaceIdAndSourceEntityTypeId(any(), any()))
            .thenReturn(emptyList())

        val customers = (1..15).map { PlannedCustomer(name = "C$it") }
        // Reference only customers within the clamped window (C1..C8) so resolution succeeds for all kept events.
        val events = (1..50).map { PlannedEvent(customerRef = "C${(it % 8) + 1}", feature = "search") }
        val plan = AugmentationPlan(customers = customers, events = events, reasoning = "")

        val result = seeder.applyAugmentationPlan(sessionId, workspaceId, userId, plan)

        assertEquals(DemoAugmentationPlanner.MAX_CUSTOMERS, result.customersAdded)
        assertEquals(DemoAugmentationPlanner.MAX_EVENTS, result.eventsAdded)
        // (15 - 8) + (50 - 30) = 7 + 20 = 27 over-the-cap skips
        assertTrue(result.skipped >= 27)
    }

    @Test
    fun `applyAugmentationPlan assigns customer to matching cluster and increments skipped for unknown cluster`() {
        val seededSession = InsightsFactory.createSession(id = sessionId, workspaceId = workspaceId, demoPoolSeeded = true)
        whenever(sessionRepository.findById(sessionId)).thenReturn(Optional.of(seededSession))
        whenever(entityTypeRepository.findByworkspaceId(workspaceId)).thenReturn(listOf(customerType(), eventType()))

        val clusterId = UUID.randomUUID()
        val cluster = IdentityClusterEntity(
            id = clusterId,
            workspaceId = workspaceId,
            name = "Power users",
            memberCount = 0,
            demoSessionId = sessionId,
        )
        whenever(clusterRepository.findByDemoSessionId(sessionId)).thenReturn(listOf(cluster))
        whenever(clusterMemberRepository.findByClusterIdAndEntityId(any(), any())).thenReturn(null)
        whenever(relationshipDefinitionRepository.findByWorkspaceIdAndSourceEntityTypeId(any(), any()))
            .thenReturn(emptyList())

        val plan = AugmentationPlan(
            customers = listOf(
                PlannedCustomer(name = "In Cluster", cluster = "power users"), // case-insensitive match
                PlannedCustomer(name = "No Cluster", cluster = "Nonexistent"),
            ),
            events = emptyList(),
            reasoning = "",
        )

        val result = seeder.applyAugmentationPlan(sessionId, workspaceId, userId, plan)

        assertEquals(2, result.customersAdded)
        // Unknown cluster ref contributes 1 skipped.
        assertTrue(result.skipped >= 1)
        verify(clusterMemberRepository).save(any<IdentityClusterMemberEntity>())
    }

    @Test
    fun `applyAugmentationPlan resolves event to planned customer and skips unresolvable refs`() {
        val seededSession = InsightsFactory.createSession(id = sessionId, workspaceId = workspaceId, demoPoolSeeded = true)
        whenever(sessionRepository.findById(sessionId)).thenReturn(Optional.of(seededSession))
        whenever(entityTypeRepository.findByworkspaceId(workspaceId)).thenReturn(listOf(customerType(), eventType()))
        whenever(clusterRepository.findByDemoSessionId(sessionId)).thenReturn(emptyList())
        whenever(entityRepository.findByDemoSessionId(sessionId)).thenReturn(emptyList())
        whenever(entityAttributeRepository.findByEntityIdIn(any())).thenReturn(emptyList())
        whenever(relationshipDefinitionRepository.findByWorkspaceIdAndSourceEntityTypeId(any(), any()))
            .thenReturn(emptyList())

        val plan = AugmentationPlan(
            customers = listOf(PlannedCustomer(name = "Linked Customer")),
            events = listOf(
                PlannedEvent(customerRef = "Linked Customer", feature = "search"),
                PlannedEvent(customerRef = "Unknown Ghost", feature = "search"),
            ),
            reasoning = "",
        )

        val result = seeder.applyAugmentationPlan(sessionId, workspaceId, userId, plan)

        assertEquals(1, result.customersAdded)
        assertEquals(1, result.eventsAdded) // the one unresolvable event was skipped
        assertTrue(result.skipped >= 1)
    }

    @Test
    fun `applyAugmentationPlan is a no-op when session is not yet seeded`() {
        val unseeded = InsightsFactory.createSession(id = sessionId, workspaceId = workspaceId, demoPoolSeeded = false)
        whenever(sessionRepository.findById(sessionId)).thenReturn(Optional.of(unseeded))

        val plan = AugmentationPlan(
            customers = listOf(PlannedCustomer(name = "x")),
            events = emptyList(),
            reasoning = "",
        )
        val result = seeder.applyAugmentationPlan(sessionId, workspaceId, userId, plan)
        assertEquals(0, result.customersAdded)
        verify(entityRepository, never()).saveAll(any<List<EntityEntity>>())
    }

    @Test
    fun `applyAugmentationPlan persists attribute rows for matching schema keys`() {
        val seededSession = InsightsFactory.createSession(id = sessionId, workspaceId = workspaceId, demoPoolSeeded = true)
        whenever(sessionRepository.findById(sessionId)).thenReturn(Optional.of(seededSession))
        whenever(entityTypeRepository.findByworkspaceId(workspaceId)).thenReturn(listOf(customerType(), eventType()))
        whenever(clusterRepository.findByDemoSessionId(sessionId)).thenReturn(emptyList())
        whenever(relationshipDefinitionRepository.findByWorkspaceIdAndSourceEntityTypeId(any(), any()))
            .thenReturn(emptyList())

        val plan = AugmentationPlan(
            customers = listOf(PlannedCustomer(name = "Ada", plan = "Pro", ltv = 1000)),
            events = emptyList(),
            reasoning = "",
        )
        seeder.applyAugmentationPlan(sessionId, workspaceId, userId, plan)

        val captor = argumentCaptor<List<EntityAttributeEntity>>()
        verify(entityAttributeRepository, atLeast(1)).saveAll(captor.capture())
        val attrIds = captor.allValues.flatten().map { it.attributeId }.toSet()
        assertTrue(attrIds.contains(customerNameAttrId))
        assertTrue(attrIds.contains(customerPlanAttrId))
        assertTrue(attrIds.contains(customerLtvAttrId))
    }

    @Test
    fun `buildPoolSummary does not throw when no attributes or relationships exist`() {
        val e = EntityFactory.createEntityEntity(id = UUID.randomUUID(), workspaceId = workspaceId, typeKey = "customer")
        whenever(entityRepository.findByDemoSessionId(sessionId)).thenReturn(listOf(e))
        whenever(clusterRepository.findByDemoSessionId(sessionId)).thenReturn(emptyList())
        whenever(entityAttributeRepository.findByEntityIdIn(any())).thenReturn(emptyList())
        whenever(entityRelationshipRepository.findBySourceIdIn(any())).thenReturn(emptyList())
        whenever(entityTypeRepository.findById(any<UUID>())).thenReturn(Optional.empty())

        val out = seeder.buildPoolSummary(sessionId)

        assertTrue(out.contains(e.id.toString()))
    }

}
