package riven.core.service.entity.type

import jakarta.transaction.Transactional
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Service
import riven.core.entity.entity.EntityTypeEntity
import riven.core.enums.activity.Activity
import riven.core.enums.core.ApplicationEntityType
import riven.core.enums.entity.EntityPropertyType
import riven.core.enums.util.OperationType
import riven.core.exceptions.SchemaValidationException
import riven.core.models.entity.EntityType
import riven.core.models.entity.configuration.EntityRelationshipDefinition
import riven.core.models.entity.configuration.EntityTypeOrderingKey
import riven.core.models.request.entity.CreateEntityTypeRequest
import riven.core.repository.entity.EntityRepository
import riven.core.repository.entity.EntityTypeRepository
import riven.core.service.activity.ActivityService
import riven.core.service.auth.AuthTokenService
import riven.core.service.entity.EntityValidationService
import riven.core.util.ServiceUtil
import java.util.UUID

/**
 * Service for managing entity types.
 *
 * Key difference from BlockTypeService: EntityTypes are MUTABLE.
 * Updates modify the existing row rather than creating new versions.
 */
@Service
class EntityTypeService(
    private val entityTypeRepository: EntityTypeRepository,
    private val entityRepository: EntityRepository,
    private val entityValidationService: EntityValidationService,
    private val entityRelationshipService: EntityRelationshipService,
    private val authTokenService: AuthTokenService,
    private val activityService: ActivityService,
) {

    /**
     * Create and publish a new entity type.
     */
    @Transactional
    @PreAuthorize("@organisationSecurity.hasOrg(#request.organisationId)")
    fun publishEntityType(request: CreateEntityTypeRequest): EntityType {
        authTokenService.getUserId().let { userId ->
            // Normalize sourceKey for relationships - set to entity type's own key if not already set
            val normalizedRelationships = request.relationships?.map { rel ->
                if (rel.sourceKey == request.key) {
                    rel  // Already set correctly
                } else {
                    rel.copy(sourceKey = request.key)  // Set to entity type's own key for directly added relationships
                }
            }

            EntityTypeEntity(
                displayNameSingular = request.name.singular,
                displayNamePlural = request.name.plural,
                key = request.key,
                organisationId = request.organisationId,
                identifierKey = request.identifier,
                description = request.description,
                // Protected Entity Types cannot be modified or deleted by users. This will usually occur during an automatic setup process.
                protected = false,
                type = request.type,
                schema = request.schema,
                relationships = normalizedRelationships,
                order = request.order ?: listOf(
                    *(request.schema.properties?.keys ?: listOf()).map { key ->
                        EntityTypeOrderingKey(
                            key,
                            EntityPropertyType.ATTRIBUTE
                        )
                    }.toTypedArray(),
                    *(normalizedRelationships ?: listOf()).map {
                        EntityTypeOrderingKey(
                            it.key,
                            EntityPropertyType.RELATIONSHIP
                        )
                    }.toTypedArray()
                ),
            ).run {
                entityTypeRepository.save(this)
            }.also {
                requireNotNull(it.id)
                entityRelationshipService.syncRelationships(it)
                activityService.logActivity(
                    activity = Activity.ENTITY_TYPE,
                    operation = OperationType.CREATE,
                    userId = userId,
                    organisationId = requireNotNull(it.organisationId) { "Cannot create system entity type" },
                    entityId = it.id,
                    entityType = ApplicationEntityType.ENTITY_TYPE,
                    details = mapOf(
                        "type" to it.key,
                        "version" to 1,
                        "category" to it.type.name
                    )
                )
            }.let {
                return it.toModel()
            }
        }
    }

    /**
     * Update an existing entity type (MUTABLE - updates in place).
     *
     * Unlike BlockTypeService which creates new versions, this updates the existing row.
     * Breaking changes are detected and validated against existing entities.
     */
    @PreAuthorize("@organisationSecurity.hasOrg(#type.organisationId)")
    fun updateEntityType(
        type: EntityType
    ): EntityType {
        val userId = authTokenService.getUserId()
        val existing: EntityTypeEntity = ServiceUtil.findOrThrow { entityTypeRepository.findById(type.id) }

        // Ensure this is not a system type
        val orgId = requireNotNull(existing.organisationId) { "Cannot update system entity type" }

        // Detect breaking changes
        val breakingChanges = entityValidationService.detectSchemaBreakingChanges(
            existing.schema,
            type.schema
        )

        val prevSnapshot: List<EntityRelationshipDefinition>? = existing.relationships.let {
            if (it == null) return@let null
            it.map { rel -> rel.copy() }
        }

        if (breakingChanges.any { it.breaking }) {
            val existingEntities = entityRepository.findByOrganisationIdAndTypeId(orgId, type.id)
            val validationSummary = entityValidationService.validateExistingEntitiesAgainstNewSchema(
                existingEntities,
                type.schema,
            )

            if (validationSummary.invalidCount > 0) {
                throw SchemaValidationException(
                    listOf(
                        "Cannot apply breaking schema changes: ${validationSummary.invalidCount} entities would become invalid. " +
                                "Sample errors: ${
                                    validationSummary.sampleErrors.take(3).map { it.errors.joinToString() }
                                }"
                    )
                )
            }
        }

        // Normalize sourceKey for relationships - preserve sourceKey for bi-directional relationships,
        // set to entity type's own key for directly added relationships
        val normalizedRelationships = type.relationships?.map { rel ->
            if (rel.sourceKey == existing.key) {
                rel  // Already set correctly to this entity type's key (directly added)
            } else if (rel.sourceKey != existing.key && rel.sourceKey.isNotBlank()) {
                rel  // Preserve sourceKey from bi-directional relationship
            } else {
                rel.copy(sourceKey = existing.key)  // Set to entity type's own key for directly added relationships
            }
        }

        // Update in place (NOT create new row)
        existing.apply {
            displayNameSingular = type.name.singular
            displayNamePlural = type.name.plural
            description = type.description
            schema = type.schema
            relationships = normalizedRelationships
            version = existing.version + 1  // Increment for change tracking
        }.run {
            entityTypeRepository.save(this).also { type ->
                entityRelationshipService.syncRelationships(type, prevSnapshot)
                activityService.logActivity(
                    activity = Activity.ENTITY_TYPE,
                    operation = OperationType.UPDATE,
                    userId = userId,
                    organisationId = orgId,
                    entityId = this.id,
                    entityType = ApplicationEntityType.ENTITY_TYPE,
                    details = mapOf(
                        "type" to this.key,
                        "version" to this.version,
                        "breakingChanges" to breakingChanges.filter { it.breaking }.size
                    )
                )
                return this.toModel()
            }
        }
    }

    /**
     * Archive or restore an entity type.
     */
    @PreAuthorize("@organisationSecurity.hasOrg(#id)")
    fun archiveEntityType(id: UUID, status: Boolean) {
        val userId = authTokenService.getUserId()
        val existing = ServiceUtil.findOrThrow { entityTypeRepository.findById(id) }
        val orgId = requireNotNull(existing.organisationId) { "Cannot archive system entity type" }

        if (existing.archived == status) return

        existing.archived = status
        entityTypeRepository.save(existing)

        activityService.logActivity(
            activity = Activity.ENTITY_TYPE,
            operation = if (status) OperationType.ARCHIVE else OperationType.RESTORE,
            userId = userId,
            organisationId = orgId,
            entityId = existing.id,
            entityType = ApplicationEntityType.ENTITY_TYPE,
            details = mapOf(
                "type" to existing.key,
                "archiveStatus" to status
            )
        )
    }

    /**
     * Get all entity types for an organization (including system types).
     */
    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")
    fun getOrganisationEntityTypes(organisationId: UUID): List<EntityType> {
        return ServiceUtil.findManyResults {
            entityTypeRepository.findByOrganisationId(organisationId)
        }.map { it.toModel() }
    }

    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")
    fun getByKey(key: String, organisationId: UUID): EntityTypeEntity {
        return ServiceUtil.findOrThrow { entityTypeRepository.findByOrganisationIdAndKey(organisationId, key) }
    }

    /**
     * Get entity type by ID.
     */
    fun getById(id: UUID): EntityTypeEntity {
        return ServiceUtil.findOrThrow { entityTypeRepository.findById(id) }
    }

    /**
     * Detects bidirectional relationships that were removed or made unidirectional.
     * Returns map of relationship key to list of target entity type keys that need cleanup.
     */
    private fun detectRemovedBidirectionalRelationships(
        oldRelationships: List<EntityRelationshipDefinition>?,
        newRelationships: List<EntityRelationshipDefinition>?
    ): Map<String, List<String>> {
        val removed = mutableMapOf<String, List<String>>()

        oldRelationships?.forEach { oldRel ->
            if (!oldRel.bidirectional || oldRel.bidirectionalEntityTypeKeys.isNullOrEmpty()) {
                return@forEach  // Skip non-bidirectional
            }

            val newRel = newRelationships?.find { it.key == oldRel.key }

            when {
                // Relationship completely removed (handled by detectCompletelyRemovedRelationships)
                newRel == null -> {
                    // Don't add to removed here; it will be handled separately
                }
                // Made unidirectional
                !newRel.bidirectional -> {
                    removed[oldRel.key] = oldRel.bidirectionalEntityTypeKeys
                }
                // Target entity types changed (removed some)
                else -> {
                    val removedTargets = oldRel.bidirectionalEntityTypeKeys -
                            (newRel.bidirectionalEntityTypeKeys ?: emptyList()).toSet()
                    if (removedTargets.isNotEmpty()) {
                        removed[oldRel.key] = removedTargets.toList()
                    }
                }
            }
        }

        return removed
    }

    /**
     * Detects relationships that were completely removed from the entity type definition.
     * Returns list of relationship keys that need instance cleanup.
     */
    private fun detectCompletelyRemovedRelationships(
        oldRelationships: List<EntityRelationshipDefinition>?,
        newRelationships: List<EntityRelationshipDefinition>?
    ): List<String> {
        val newKeys = newRelationships?.map { it.key }?.toSet() ?: emptySet()

        return oldRelationships
            ?.filter { oldRel -> !newKeys.contains(oldRel.key) }
            ?.map { it.key }
            ?: emptyList()
    }

}