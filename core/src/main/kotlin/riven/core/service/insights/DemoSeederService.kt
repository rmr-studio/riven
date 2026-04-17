package riven.core.service.insights

import tools.jackson.databind.ObjectMapper
import io.github.oshai.kotlinlogging.KLogger
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import riven.core.entity.entity.EntityAttributeEntity
import riven.core.entity.entity.EntityEntity
import riven.core.entity.entity.EntityRelationshipEntity
import riven.core.entity.entity.EntityTypeEntity
import riven.core.entity.identity.IdentityClusterEntity
import riven.core.entity.identity.IdentityClusterMemberEntity
import riven.core.entity.insights.InsightsChatSessionEntity
import riven.core.enums.common.icon.IconColour
import riven.core.enums.common.icon.IconType
import riven.core.enums.common.validation.SchemaType
import riven.core.enums.integration.SourceType
import riven.core.models.common.markDeleted
import riven.core.models.common.validation.Schema
import riven.core.repository.entity.EntityAttributeRepository
import riven.core.repository.entity.EntityRelationshipRepository
import riven.core.repository.entity.EntityRepository
import riven.core.repository.entity.EntityTypeRepository
import riven.core.repository.entity.RelationshipDefinitionRepository
import riven.core.repository.identity.IdentityClusterMemberRepository
import riven.core.repository.identity.IdentityClusterRepository
import riven.core.repository.insights.InsightsChatSessionRepository
import java.time.LocalDate
import java.util.UUID
import kotlin.math.min
import kotlin.random.Random

/**
 * Seeds (and tears down) the demo entity pool used by the Insights chat demo.
 *
 * The pool consists of a small set of customer entities, feature-usage events, and
 * identity clusters that the LLM cites by id. All seeded rows carry `demo_session_id`
 * so cleanup can remove only the demo data and leave production rows untouched.
 *
 * Idempotency is enforced by the `demo_pool_seeded` flag on the parent session.
 *
 * NOTE: this seeder uses whatever entity types already exist in the workspace as
 * scaffolding for the seeded entities. If the workspace has no entity types, the
 * pool degrades gracefully to clusters-only (citations remain valid but sparse).
 */
@Service
class DemoSeederService(
    private val sessionRepository: InsightsChatSessionRepository,
    private val entityRepository: EntityRepository,
    private val entityTypeRepository: EntityTypeRepository,
    private val entityAttributeRepository: EntityAttributeRepository,
    private val entityRelationshipRepository: EntityRelationshipRepository,
    private val relationshipDefinitionRepository: RelationshipDefinitionRepository,
    private val clusterRepository: IdentityClusterRepository,
    private val clusterMemberRepository: IdentityClusterMemberRepository,
    private val objectMapper: ObjectMapper,
    private val logger: KLogger,
) {

    companion object {
        private const val CUSTOMER_COUNT = 20
        private const val EVENT_COUNT = 80
        private const val SUMMARY_CUSTOMER_CAP = 20
        private const val SUMMARY_EVENTS_PER_CUSTOMER_CAP = 3
        private val FEATURES = listOf("timeline", "notes", "search", "import", "export", "reports")
        private val FEATURE_WEIGHTS = listOf(0.30, 0.22, 0.20, 0.12, 0.10, 0.06)
        private val ACTIONS = listOf("viewed", "used", "completed", "error")
        private val ACTION_WEIGHTS = listOf(0.20, 0.60, 0.15, 0.05)
        private val PLAN_TIERS = listOf("Free", "Pro", "Enterprise")
        private val FIRST_NAMES = listOf(
            "Sarah", "Marcus", "Priya", "Diego", "Ava", "Jordan", "Wei", "Lena",
            "Tom", "Nia", "Felix", "Rosa", "Kai", "Zara", "Eli", "Mira",
            "Owen", "Leah", "Arjun", "Tess"
        )
        private val LAST_NAMES = listOf(
            "Chen", "Okafor", "Patel", "Alvarez", "Nakamura", "Kim", "Rossi", "Schmidt",
            "Novak", "Johansson", "Cohen", "Mbeki", "Hoang", "Fischer", "Santos", "Wong",
            "Reyes", "Khan", "Marino", "Levy"
        )
        private val CLUSTER_NAMES = listOf("Power users", "At-risk", "New activations", "Enterprise")

        // Candidate attribute label matches (lowercased) for semantic mapping.
        private val CUSTOMER_NAME_KEYS = setOf("name", "display name", "display-name", "full name")
        private val CUSTOMER_EMAIL_KEYS = setOf("email", "email address")
        private val CUSTOMER_PLAN_KEYS = setOf("plan", "tier", "plan tier", "subscription")
        private val CUSTOMER_SIGNUP_KEYS = setOf("signup date", "signup-date", "created at", "created-at", "signed up")
        private val CUSTOMER_LTV_KEYS = setOf("ltv", "lifetime value", "lifetime-value")
        private val EVENT_FEATURE_KEYS = setOf("feature", "feature name", "feature-name")
        private val EVENT_ACTION_KEYS = setOf("action")
        private val EVENT_DATE_KEYS = setOf("date", "event date", "event-date", "occurred at", "occurred-at")
        private val EVENT_COUNT_KEYS = setOf("count", "event count", "event-count")
    }

    /**
     * Idempotently seed the demo pool for [sessionId]. Safe to call from every chat turn —
     * sessions with `demoPoolSeeded = true` are no-ops.
     */
    @Transactional
    fun seedPoolForSession(sessionId: UUID, workspaceId: UUID, userId: UUID) {
        val session = sessionRepository.findById(sessionId).orElse(null) ?: return
        if (session.demoPoolSeeded) {
            logger.debug { "Demo pool already seeded for session $sessionId — skipping" }
            return
        }

        val random = Random(sessionId.leastSignificantBits xor sessionId.mostSignificantBits)

        val customerTypeEntity = pickCustomerEntityType(workspaceId)
        val eventTypeEntity = pickEventEntityType(workspaceId, customerTypeEntity)

        val customerMeta: List<CustomerMeta>
        val customers: List<EntityEntity>
        if (customerTypeEntity != null) {
            val seeded = seedCustomers(workspaceId, sessionId, customerTypeEntity, random)
            customers = seeded.first
            customerMeta = seeded.second
        } else {
            customers = emptyList()
            customerMeta = emptyList()
        }

        if (eventTypeEntity != null && customers.isNotEmpty()) {
            seedEvents(
                workspaceId = workspaceId,
                sessionId = sessionId,
                customerType = customerTypeEntity,
                eventType = eventTypeEntity,
                customers = customers,
                random = random,
            )
        }

        seedClusters(workspaceId, sessionId, userId, customers, random)

        session.demoPoolSeeded = true
        sessionRepository.save(session)

        logger.info {
            "Seeded insights demo pool for session $sessionId " +
                "(customers=${customers.size}, customerMeta=${customerMeta.size})"
        }
    }

    /**
     * Soft-delete every entity, attribute, relationship, and cluster tagged with [sessionId].
     */
    @Transactional
    fun cleanupPoolForSession(sessionId: UUID) {
        val taggedEntities = entityRepository.findByDemoSessionId(sessionId)

        // Explicitly soft-delete attributes and relationships — neither cascades via JPA.
        taggedEntities.groupBy { it.workspaceId }.forEach { (wsId, group) ->
            val ids = group.mapNotNull { it.id }.toTypedArray()
            if (ids.isNotEmpty()) {
                entityAttributeRepository.softDeleteByEntityIds(ids, wsId)
                entityRelationshipRepository.deleteEntities(ids, wsId)
            }
        }

        taggedEntities.forEach { it.markDeleted() }
        if (taggedEntities.isNotEmpty()) entityRepository.saveAll(taggedEntities)

        val taggedClusters = clusterRepository.findByDemoSessionId(sessionId)
        taggedClusters.forEach { it.markDeleted() }
        if (taggedClusters.isNotEmpty()) clusterRepository.saveAll(taggedClusters)

        logger.info {
            "Cleaned up insights demo pool for session $sessionId — soft-deleted ${taggedEntities.size} " +
                "entities, ${taggedClusters.size} clusters"
        }
    }

    /**
     * Apply a planner-proposed augmentation to an already-seeded demo pool. Creates new customer
     * and event rows (plus attributes and cluster memberships where applicable), all tagged with
     * [sessionId] so cleanup remains a single-dimension query.
     *
     * Hard-clamps input to [DemoAugmentationPlanner.MAX_CUSTOMERS] customers and
     * [DemoAugmentationPlanner.MAX_EVENTS] events per call. Never trusts the model.
     *
     * Returns counts for logging — the caller decides whether to proceed regardless of the result.
     */
    @Transactional
    fun applyAugmentationPlan(
        sessionId: UUID,
        workspaceId: UUID,
        userId: UUID,
        plan: AugmentationPlan,
    ): AugmentationResult {
        val session = sessionRepository.findById(sessionId).orElse(null)
            ?: return AugmentationResult(0, 0, 0)
        if (!session.demoPoolSeeded) {
            logger.debug { "Skipping augmentation for unseeded session $sessionId" }
            return AugmentationResult(0, 0, 0)
        }
        if (plan.customers.isEmpty() && plan.events.isEmpty()) {
            return AugmentationResult(0, 0, 0)
        }

        val customerType = pickCustomerEntityType(workspaceId)
        val eventType = pickEventEntityType(workspaceId, customerType)
        val random = Random(
            (sessionId.leastSignificantBits xor sessionId.mostSignificantBits) xor
                System.nanoTime()
        )

        val clampedCustomers = plan.customers.take(DemoAugmentationPlanner.MAX_CUSTOMERS)
        val clampedEvents = plan.events.take(DemoAugmentationPlanner.MAX_EVENTS)
        var skipped = (plan.customers.size - clampedCustomers.size) +
            (plan.events.size - clampedEvents.size)

        val clustersByNameLower = clusterRepository.findByDemoSessionId(sessionId)
            .mapNotNull { c -> c.name?.lowercase()?.trim()?.let { it to c } }
            .toMap()

        // ------ Customers ------
        val nameToEntityId = mutableMapOf<String, UUID>()
        var customersAdded = 0
        if (customerType != null) {
            val result = applyAugmentationCustomers(
                workspaceId = workspaceId,
                sessionId = sessionId,
                userId = userId,
                type = customerType,
                planned = clampedCustomers,
                clustersByNameLower = clustersByNameLower,
                random = random,
            )
            customersAdded = result.added
            skipped += result.skipped
            nameToEntityId.putAll(result.nameToEntityId)
        } else {
            // No customer entity type available — every planned customer is effectively skipped.
            skipped += clampedCustomers.size
        }

        // ------ Events ------
        var eventsAdded = 0
        if (eventType != null && clampedEvents.isNotEmpty()) {
            val result = applyAugmentationEvents(
                workspaceId = workspaceId,
                sessionId = sessionId,
                customerType = customerType,
                eventType = eventType,
                planned = clampedEvents,
                nameToEntityId = nameToEntityId,
            )
            eventsAdded = result.added
            skipped += result.skipped
        } else {
            skipped += clampedEvents.size
        }

        val reasoning = plan.reasoning.take(200)
        logger.info {
            "Augmented pool for session $sessionId: +customers=$customersAdded +events=$eventsAdded " +
                "skipped=$skipped (reason: $reasoning)"
        }
        return AugmentationResult(customersAdded, eventsAdded, skipped)
    }

    /**
     * Build a compact, line-per-entity textual summary of the seeded pool. Used as the
     * cached system-prompt context for the LLM. Embeds key attribute values so the model
     * can cite entities with meaningful labels.
     */
    fun buildPoolSummary(sessionId: UUID): String {
        val entities = entityRepository.findByDemoSessionId(sessionId)
        val clusters = clusterRepository.findByDemoSessionId(sessionId)
        val clusterMemberByEntityId: Map<UUID, String> = clusters.flatMap { cluster ->
            val cid = cluster.id ?: return@flatMap emptyList()
            clusterMemberRepository.findByClusterId(cid).map { member -> member.entityId to (cluster.name ?: "") }
        }.toMap()

        // Load attributes once, indexed by entityId.
        val allEntityIds = entities.mapNotNull { it.id }
        val attributesByEntityId: Map<UUID, List<EntityAttributeEntity>> = if (allEntityIds.isNotEmpty()) {
            entityAttributeRepository.findByEntityIdIn(allEntityIds).groupBy { it.entityId }
        } else emptyMap()

        // Load relationships so event lines can cite their owning customer.
        val relsBySource: Map<UUID, List<EntityRelationshipEntity>> = if (allEntityIds.isNotEmpty()) {
            entityRelationshipRepository.findBySourceIdIn(allEntityIds).groupBy { it.sourceId }
        } else emptyMap()

        // Preload the type-id → schema map so we can resolve attribute labels once.
        val typeIds = entities.map { it.typeId }.distinct()
        val typeById: Map<UUID, EntityTypeEntity> = typeIds.mapNotNull { tid ->
            entityTypeRepository.findById(tid).orElse(null)?.let { tid to it }
        }.toMap()

        val byType = entities.groupBy { it.typeKey }
        val sb = StringBuilder()
        byType.entries.sortedBy { it.key }.forEach { (typeKey, group) ->
            sb.append("--- ").append(typeKey).append(" ---\n")
            val isEventType = typeKey.contains("event", ignoreCase = true) ||
                typeKey.contains("usage", ignoreCase = true)
            val perCustomerEventCount = mutableMapOf<UUID, Int>()
            var customersRendered = 0
            group.forEach { entity ->
                val id = entity.id ?: return@forEach
                val type = typeById[entity.typeId]
                val attrSchema = type?.schema?.properties ?: emptyMap()
                val attrs = attributesByEntityId[id] ?: emptyList()
                val attrValues: Map<UUID, String> = attrs.associate { a ->
                    a.attributeId to valueAsString(a)
                }

                if (isEventType) {
                    // Cap events per owning customer to keep the summary compact.
                    val owner = relsBySource[id]?.firstOrNull()?.targetId
                    if (owner != null) {
                        val count = perCustomerEventCount.getOrDefault(owner, 0)
                        if (count >= SUMMARY_EVENTS_PER_CUSTOMER_CAP) return@forEach
                        perCustomerEventCount[owner] = count + 1
                    }
                } else {
                    if (customersRendered >= SUMMARY_CUSTOMER_CAP) return@forEach
                    customersRendered++
                }

                sb.append(id).append(" | type=").append(typeKey)
                val formatted = formatAttributes(attrSchema, attrValues, isEventType)
                if (formatted.isNotBlank()) sb.append(" | ").append(formatted)
                if (isEventType) {
                    val owner = relsBySource[id]?.firstOrNull()?.targetId
                    if (owner != null) sb.append(" | customer=").append(owner)
                }
                val cluster = clusterMemberByEntityId[id]
                if (cluster != null) sb.append(" | cluster=").append(cluster)
                sb.append('\n')
            }
        }
        sb.append("--- identity_clusters ---\n")
        clusters.forEach { cluster ->
            val id = cluster.id ?: return@forEach
            sb.append(id).append(" | type=identity_cluster | name=").append(cluster.name ?: "").append('\n')
        }
        return sb.toString()
    }

    // ------ Private helpers: entity type selection ------

    private fun pickCustomerEntityType(workspaceId: UUID): EntityTypeEntity? {
        val types = entityTypeRepository.findByworkspaceId(workspaceId)
        if (types.isEmpty()) return null
        return types.firstOrNull {
            it.key.contains("customer", ignoreCase = true) || it.key.contains("contact", ignoreCase = true)
        } ?: types.first()
    }

    private fun pickEventEntityType(workspaceId: UUID, customerType: EntityTypeEntity?): EntityTypeEntity? {
        val types = entityTypeRepository.findByworkspaceId(workspaceId)
        if (types.isEmpty()) return null
        return types.firstOrNull {
            it.key.contains("event", ignoreCase = true) || it.key.contains("usage", ignoreCase = true)
        } ?: types.firstOrNull { it.id != customerType?.id } ?: types.first()
    }

    // ------ Private helpers: seeding ------

    /**
     * Per-customer metadata captured at seed time so we can use consistent values
     * when generating related usage events (e.g. plan tier, signup date).
     */
    private data class CustomerMeta(
        val entityId: UUID,
        val name: String,
        val email: String,
        val plan: String,
        val signupDate: LocalDate,
        val ltv: Int,
    )

    private fun seedCustomers(
        workspaceId: UUID,
        sessionId: UUID,
        type: EntityTypeEntity,
        random: Random,
    ): Pair<List<EntityEntity>, List<CustomerMeta>> {
        val typeId = requireNotNull(type.id) { "Customer entity type must have a non-null id" }
        val identifierKey = UUID.nameUUIDFromBytes("${type.key}-customer-id".toByteArray())
        val toCreate = (1..CUSTOMER_COUNT).map {
            EntityEntity(
                workspaceId = workspaceId,
                typeId = typeId,
                typeKey = type.key,
                identifierKey = identifierKey,
                iconColour = IconColour.NEUTRAL,
                iconType = IconType.FILE,
                sourceType = SourceType.USER_CREATED,
                demoSessionId = sessionId,
            )
        }
        val saved = entityRepository.saveAll(toCreate)

        val today = LocalDate.now()
        val metas = saved.map { entity ->
            val name = "${FIRST_NAMES[random.nextInt(FIRST_NAMES.size)]} ${LAST_NAMES[random.nextInt(LAST_NAMES.size)]}"
            val email = name.lowercase().replace(" ", ".") + "@example.com"
            val plan = PLAN_TIERS[random.nextInt(PLAN_TIERS.size)]
            val signupDate = today.minusDays((random.nextDouble().let { it * it } * 180).toLong())
            val ltv = sampleLtv(random)
            CustomerMeta(
                entityId = requireNotNull(entity.id) { "Saved customer entity id must not be null" },
                name = name,
                email = email,
                plan = plan,
                signupDate = signupDate,
                ltv = ltv,
            )
        }

        persistCustomerAttributes(type, workspaceId, metas)
        return saved to metas
    }

    private fun persistCustomerAttributes(
        type: EntityTypeEntity,
        workspaceId: UUID,
        metas: List<CustomerMeta>,
    ) {
        val typeId = requireNotNull(type.id)
        val props = type.schema.properties ?: return
        val labels = propertiesByLabelLower(props)

        val nameAttr = findAttributeId(labels, CUSTOMER_NAME_KEYS)
        val emailAttr = findAttributeId(labels, CUSTOMER_EMAIL_KEYS)
        val planAttr = findAttributeId(labels, CUSTOMER_PLAN_KEYS)
        val signupAttr = findAttributeId(labels, CUSTOMER_SIGNUP_KEYS)
        val ltvAttr = findAttributeId(labels, CUSTOMER_LTV_KEYS)

        val rows = mutableListOf<EntityAttributeEntity>()
        metas.forEach { meta ->
            if (nameAttr != null) rows += attributeRow(meta.entityId, workspaceId, typeId, nameAttr, SchemaType.TEXT, meta.name)
            if (emailAttr != null) rows += attributeRow(meta.entityId, workspaceId, typeId, emailAttr, SchemaType.EMAIL, meta.email)
            if (planAttr != null) rows += attributeRow(meta.entityId, workspaceId, typeId, planAttr, SchemaType.SELECT, meta.plan)
            if (signupAttr != null) rows += attributeRow(meta.entityId, workspaceId, typeId, signupAttr, SchemaType.DATE, meta.signupDate.toString())
            if (ltvAttr != null) rows += attributeRow(meta.entityId, workspaceId, typeId, ltvAttr, SchemaType.NUMBER, meta.ltv)
        }
        if (rows.isNotEmpty()) entityAttributeRepository.saveAll(rows)
    }

    private data class EventSeed(
        val customerId: UUID,
        val feature: String,
        val action: String,
        val date: LocalDate,
        val count: Int,
    )

    private fun seedEvents(
        workspaceId: UUID,
        sessionId: UUID,
        customerType: EntityTypeEntity?,
        eventType: EntityTypeEntity,
        customers: List<EntityEntity>,
        random: Random,
    ) {
        val typeId = requireNotNull(eventType.id)
        val identifierKey = UUID.nameUUIDFromBytes("${eventType.key}-event-id".toByteArray())
        val today = LocalDate.now()

        val plans = (1..EVENT_COUNT).map {
            val customerIdx = (customers.size - 1) - (random.nextDouble().let { it * it } * (customers.size - 1)).toInt()
            val target = customers[customerIdx.coerceIn(0, customers.size - 1)]
            val daysAgo = (random.nextDouble().let { it * it } * 90).toLong()
            val feature = weightedPick(FEATURES, FEATURE_WEIGHTS, random)
            val action = weightedPick(ACTIONS, ACTION_WEIGHTS, random)
            EventSeed(
                customerId = requireNotNull(target.id),
                feature = feature,
                action = action,
                date = today.minusDays(daysAgo),
                count = 1 + random.nextInt(20),
            )
        }
        val toSave = plans.map { seed ->
            EntityEntity(
                workspaceId = workspaceId,
                typeId = typeId,
                typeKey = eventType.key,
                identifierKey = identifierKey,
                iconColour = IconColour.NEUTRAL,
                iconType = IconType.ACTIVITY,
                sourceType = SourceType.USER_CREATED,
                demoSessionId = sessionId,
                sourceExternalId = "demo-${seed.customerId}-${seed.feature}",
            )
        }
        val savedEntities = entityRepository.saveAll(toSave)
        val zipped = plans.zip(savedEntities)

        persistEventAttributes(eventType, workspaceId, zipped)

        val definitionId = resolveSourceDataDefinitionId(workspaceId, eventType, customerType)
        if (definitionId != null) {
            val relRows = zipped.map { (seed, saved) ->
                EntityRelationshipEntity(
                    workspaceId = workspaceId,
                    sourceId = requireNotNull(saved.id),
                    targetId = seed.customerId,
                    definitionId = definitionId,
                )
            }
            entityRelationshipRepository.saveAll(relRows)
        }
    }

    private fun persistEventAttributes(
        eventType: EntityTypeEntity,
        workspaceId: UUID,
        rows: List<Pair<EventSeed, EntityEntity>>,
    ) {
        val typeId = requireNotNull(eventType.id)
        val props = eventType.schema.properties ?: return
        val labels = propertiesByLabelLower(props)

        val featureAttr = findAttributeId(labels, EVENT_FEATURE_KEYS)
        val actionAttr = findAttributeId(labels, EVENT_ACTION_KEYS)
        val dateAttr = findAttributeId(labels, EVENT_DATE_KEYS)
        val countAttr = findAttributeId(labels, EVENT_COUNT_KEYS)

        val out = mutableListOf<EntityAttributeEntity>()
        rows.forEach { (seed, saved) ->
            val entityId = requireNotNull(saved.id) { "Saved event entity id must not be null" }
            if (featureAttr != null) out += attributeRow(entityId, workspaceId, typeId, featureAttr, SchemaType.SELECT, seed.feature)
            if (actionAttr != null) out += attributeRow(entityId, workspaceId, typeId, actionAttr, SchemaType.SELECT, seed.action)
            if (dateAttr != null) out += attributeRow(entityId, workspaceId, typeId, dateAttr, SchemaType.DATE, seed.date.toString())
            if (countAttr != null) out += attributeRow(entityId, workspaceId, typeId, countAttr, SchemaType.NUMBER, seed.count)
        }
        if (out.isNotEmpty()) entityAttributeRepository.saveAll(out)
    }

    private fun seedClusters(
        workspaceId: UUID,
        sessionId: UUID,
        userId: UUID,
        customers: List<EntityEntity>,
        random: Random,
    ) {
        if (customers.isEmpty()) {
            CLUSTER_NAMES.forEach { name ->
                clusterRepository.save(
                    IdentityClusterEntity(
                        workspaceId = workspaceId,
                        name = name,
                        memberCount = 0,
                        demoSessionId = sessionId,
                    )
                )
            }
            return
        }

        // identity_cluster_members has a unique constraint on entity_id — each customer may
        // belong to at most one cluster. Shuffle once and deal non-overlapping chunks so two
        // clusters can't ever claim the same entity within a single seed run.
        val pool = customers.shuffled(random).toMutableList()
        CLUSTER_NAMES.forEach { name ->
            val cluster = clusterRepository.save(
                IdentityClusterEntity(
                    workspaceId = workspaceId,
                    name = name,
                    memberCount = 0,
                    demoSessionId = sessionId,
                )
            )
            val clusterId = cluster.id ?: return@forEach
            if (pool.isEmpty()) return@forEach

            val desired = 3 + random.nextInt(4) // 3..6
            val take = min(desired, pool.size)
            val members = (0 until take).map { pool.removeAt(0) }
            members.forEach { customer ->
                val cid = customer.id ?: return@forEach
                clusterMemberRepository.save(
                    IdentityClusterMemberEntity(
                        clusterId = clusterId,
                        entityId = cid,
                        joinedBy = userId,
                    )
                )
            }
            cluster.memberCount = members.size
            clusterRepository.save(cluster)
        }
    }

    // ------ Private helpers: augmentation ------

    private data class AugmentCustomerResult(
        val added: Int,
        val skipped: Int,
        val nameToEntityId: Map<String, UUID>,
    )

    private data class AugmentEventResult(val added: Int, val skipped: Int)

    private fun applyAugmentationCustomers(
        workspaceId: UUID,
        sessionId: UUID,
        userId: UUID,
        type: EntityTypeEntity,
        planned: List<PlannedCustomer>,
        clustersByNameLower: Map<String, IdentityClusterEntity>,
        random: Random,
    ): AugmentCustomerResult {
        if (planned.isEmpty()) return AugmentCustomerResult(0, 0, emptyMap())
        val typeId = requireNotNull(type.id) { "Customer entity type must have a non-null id" }
        val identifierKey = UUID.nameUUIDFromBytes("${type.key}-customer-id".toByteArray())

        val toCreate = planned.map {
            EntityEntity(
                workspaceId = workspaceId,
                typeId = typeId,
                typeKey = type.key,
                identifierKey = identifierKey,
                iconColour = IconColour.NEUTRAL,
                iconType = IconType.FILE,
                sourceType = SourceType.USER_CREATED,
                demoSessionId = sessionId,
            )
        }
        val saved = entityRepository.saveAll(toCreate)

        // Build CustomerMeta so we can reuse the existing attribute-persistence logic.
        val today = LocalDate.now()
        val metas = saved.zip(planned).map { (entity, p) ->
            val signupDate = today.minusDays((p.signupDaysAgo ?: random.nextInt(180)).coerceIn(0, 365).toLong())
            val plan = p.plan?.takeIf { it.isNotBlank() }
                ?: PLAN_TIERS[random.nextInt(PLAN_TIERS.size)]
            val email = p.email?.takeIf { it.isNotBlank() }
                ?: (p.name.lowercase().replace(" ", ".") + "@example.com")
            val ltv = p.ltv ?: sampleLtv(random)
            CustomerMeta(
                entityId = requireNotNull(entity.id) { "Saved customer entity id must not be null" },
                name = p.name,
                email = email,
                plan = plan,
                signupDate = signupDate,
                ltv = ltv,
            )
        }

        persistCustomerAttributes(type, workspaceId, metas)

        // Cluster memberships
        var skipped = 0
        val nameToEntityId = mutableMapOf<String, UUID>()
        planned.zip(metas).forEach { (p, meta) ->
            nameToEntityId[p.name] = meta.entityId
            val clusterName = p.cluster?.lowercase()?.trim()
            if (clusterName.isNullOrBlank()) return@forEach
            val cluster = clustersByNameLower[clusterName]
            if (cluster == null) {
                skipped += 1
                return@forEach
            }
            val clusterId = cluster.id ?: return@forEach
            // Defensive: the unique constraint on entity_id forbids a second membership. For brand-new
            // entities this cannot happen, but we still check so tests that short-circuit save can
            // observe the guard.
            val existing = clusterMemberRepository.findByClusterIdAndEntityId(clusterId, meta.entityId)
            if (existing != null) return@forEach
            clusterMemberRepository.save(
                IdentityClusterMemberEntity(
                    clusterId = clusterId,
                    entityId = meta.entityId,
                    joinedBy = userId,
                )
            )
            cluster.memberCount = (cluster.memberCount) + 1
            clusterRepository.save(cluster)
        }

        return AugmentCustomerResult(
            added = saved.size,
            skipped = skipped,
            nameToEntityId = nameToEntityId,
        )
    }

    private fun applyAugmentationEvents(
        workspaceId: UUID,
        sessionId: UUID,
        customerType: EntityTypeEntity?,
        eventType: EntityTypeEntity,
        planned: List<PlannedEvent>,
        nameToEntityId: Map<String, UUID>,
    ): AugmentEventResult {
        if (planned.isEmpty()) return AugmentEventResult(0, 0)
        val typeId = requireNotNull(eventType.id)
        val identifierKey = UUID.nameUUIDFromBytes("${eventType.key}-event-id".toByteArray())
        val today = LocalDate.now()

        // Build resolver for existing-pool customers (by id-string or name attribute match).
        val poolResolver = buildPoolCustomerResolver(sessionId, customerType)

        val resolved = mutableListOf<EventSeed>()
        var skipped = 0
        planned.forEach { p ->
            val customerId = resolveCustomerRef(p.customerRef, nameToEntityId, poolResolver)
            if (customerId == null) {
                skipped += 1
                return@forEach
            }
            val feature = p.feature.lowercase().trim()
            if (feature !in FEATURES) {
                skipped += 1
                return@forEach
            }
            val action = p.action.lowercase().trim().takeIf { it in ACTIONS } ?: "used"
            resolved += EventSeed(
                customerId = customerId,
                feature = feature,
                action = action,
                date = today.minusDays(p.daysAgo.coerceIn(0, 365).toLong()),
                count = p.count.coerceAtLeast(1),
            )
        }

        if (resolved.isEmpty()) return AugmentEventResult(0, skipped)

        val toSave = resolved.map { seed ->
            EntityEntity(
                workspaceId = workspaceId,
                typeId = typeId,
                typeKey = eventType.key,
                identifierKey = identifierKey,
                iconColour = IconColour.NEUTRAL,
                iconType = IconType.ACTIVITY,
                sourceType = SourceType.USER_CREATED,
                demoSessionId = sessionId,
                sourceExternalId = "demo-aug-${seed.customerId}-${seed.feature}",
            )
        }
        val savedEntities = entityRepository.saveAll(toSave)
        val zipped = resolved.zip(savedEntities)
        persistEventAttributes(eventType, workspaceId, zipped)

        val definitionId = resolveSourceDataDefinitionId(workspaceId, eventType, customerType)
        if (definitionId != null) {
            val relRows = zipped.map { (seed, saved) ->
                EntityRelationshipEntity(
                    workspaceId = workspaceId,
                    sourceId = requireNotNull(saved.id),
                    targetId = seed.customerId,
                    definitionId = definitionId,
                )
            }
            entityRelationshipRepository.saveAll(relRows)
        }

        return AugmentEventResult(added = savedEntities.size, skipped = skipped)
    }

    /**
     * Returns a lookup fn that resolves an existing-pool customer reference (by id-string
     * or by a name-like attribute value) to its entity id. Lazy: the DB work is only done if
     * the caller hits an unresolved ref.
     */
    private fun buildPoolCustomerResolver(
        sessionId: UUID,
        customerType: EntityTypeEntity?,
    ): (String) -> UUID? {
        var initialized = false
        var byId: Map<UUID, UUID> = emptyMap()
        var byNameLower: Map<String, UUID> = emptyMap()

        fun init() {
            if (initialized) return
            initialized = true
            val customerTypeId = customerType?.id
            val pooled = entityRepository.findByDemoSessionId(sessionId)
                .filter { customerTypeId == null || it.typeId == customerTypeId }
            val ids = pooled.mapNotNull { it.id }
            byId = ids.associateWith { it }
            if (ids.isEmpty() || customerType == null) return
            val labels = propertiesByLabelLower(customerType.schema.properties ?: emptyMap())
            val nameAttr = findAttributeId(labels, CUSTOMER_NAME_KEYS) ?: return
            val attrs = entityAttributeRepository.findByEntityIdIn(ids)
            byNameLower = attrs
                .filter { it.attributeId == nameAttr }
                .mapNotNull { a ->
                    val name = valueAsString(a).lowercase().trim().takeIf { it.isNotBlank() }
                    if (name != null) name to a.entityId else null
                }
                .toMap()
        }

        return { ref ->
            init()
            val asUuid = runCatching { UUID.fromString(ref) }.getOrNull()
            asUuid?.let { byId[it] } ?: byNameLower[ref.lowercase().trim()]
        }
    }

    private fun resolveCustomerRef(
        ref: String,
        inPlan: Map<String, UUID>,
        poolResolver: (String) -> UUID?,
    ): UUID? {
        inPlan[ref]?.let { return it }
        // case-insensitive in-plan lookup
        inPlan.entries.firstOrNull { it.key.equals(ref, ignoreCase = true) }?.let { return it.value }
        return poolResolver(ref)
    }

    // ------ Private helpers: attribute mapping ------

    /**
     * Finds the relationship definition id to link event → customer. Prefers an explicit
     * SOURCE_DATA-semantic definition (name/label match), otherwise any definition sourced
     * from the event type. Returns null if no suitable definition exists — callers should
     * skip relationship seeding gracefully.
     */
    private fun resolveSourceDataDefinitionId(
        workspaceId: UUID,
        eventType: EntityTypeEntity,
        customerType: EntityTypeEntity?,
    ): UUID? {
        val eventTypeId = eventType.id ?: return null
        val defs = relationshipDefinitionRepository.findByWorkspaceIdAndSourceEntityTypeId(workspaceId, eventTypeId)
        if (defs.isEmpty()) return null
        val preferred = defs.firstOrNull {
            it.name.contains("source", ignoreCase = true) || it.name.contains("customer", ignoreCase = true)
        }
        return (preferred ?: defs.first()).id
    }

    private fun propertiesByLabelLower(props: Map<UUID, Schema<UUID>>): Map<String, UUID> {
        val out = mutableMapOf<String, UUID>()
        props.forEach { (attrId, schema) ->
            val label = schema.label?.lowercase()?.trim()
            if (!label.isNullOrBlank()) out[label] = attrId
            // Also index by the key enum name (lowercased) as a fallback semantic hint.
            out[schema.key.name.lowercase()] = attrId
        }
        return out
    }

    private fun findAttributeId(index: Map<String, UUID>, candidates: Set<String>): UUID? {
        candidates.forEach { key ->
            val hit = index[key.lowercase()]
            if (hit != null) return hit
        }
        // Loose contains-match against any indexed label.
        index.entries.forEach { (label, id) ->
            if (candidates.any { label.contains(it.lowercase()) }) return id
        }
        return null
    }

    private fun attributeRow(
        entityId: UUID,
        workspaceId: UUID,
        typeId: UUID,
        attributeId: UUID,
        schemaType: SchemaType,
        value: Any,
    ): EntityAttributeEntity {
        val node = objectMapper.valueToTree<tools.jackson.databind.JsonNode>(mapOf("value" to value))
        return EntityAttributeEntity(
            entityId = entityId,
            workspaceId = workspaceId,
            typeId = typeId,
            attributeId = attributeId,
            schemaType = schemaType,
            value = node,
        )
    }

    private fun valueAsString(a: EntityAttributeEntity): String {
        val inner = a.value.get("value") ?: a.value
        return when {
            inner == null -> ""
            inner.isTextual -> inner.textValue() ?: ""
            inner.isNumber -> inner.numberValue().toString()
            inner.isBoolean -> inner.booleanValue().toString()
            else -> inner.toString()
        }
    }

    private fun formatAttributes(
        schema: Map<UUID, Schema<UUID>>,
        values: Map<UUID, String>,
        isEvent: Boolean,
    ): String {
        if (values.isEmpty()) return ""
        val order = if (isEvent) {
            listOf(EVENT_FEATURE_KEYS, EVENT_ACTION_KEYS, EVENT_COUNT_KEYS, EVENT_DATE_KEYS)
        } else {
            listOf(CUSTOMER_NAME_KEYS, CUSTOMER_EMAIL_KEYS, CUSTOMER_PLAN_KEYS, CUSTOMER_LTV_KEYS, CUSTOMER_SIGNUP_KEYS)
        }
        val labels = propertiesByLabelLower(schema)
        val pieces = mutableListOf<String>()
        order.forEach { candidates ->
            val id = findAttributeId(labels, candidates) ?: return@forEach
            val v = values[id] ?: return@forEach
            val short = candidates.first().replace(" ", "-")
            pieces += "$short=$v"
        }
        return pieces.joinToString(" ")
    }

    private fun sampleLtv(random: Random): Int {
        val u = random.nextDouble()
        return when {
            u < 0.70 -> random.nextInt(501)
            u < 0.90 -> 500 + random.nextInt(4500)
            else -> 5000 + random.nextInt(45000)
        }
    }

    data class AugmentationResult(
        val customersAdded: Int,
        val eventsAdded: Int,
        val skipped: Int,
    )

    private fun <T> weightedPick(items: List<T>, weights: List<Double>, random: Random): T {
        require(items.size == weights.size) { "items and weights must be same size" }
        val total = weights.sum()
        var r = random.nextDouble() * total
        items.indices.forEach { i ->
            r -= weights[i]
            if (r <= 0.0) return items[i]
        }
        return items.last()
    }
}
