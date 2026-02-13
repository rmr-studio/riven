package riven.core.service.integration

import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.stereotype.Service
import riven.core.entity.integration.IntegrationDefinitionEntity
import riven.core.enums.integration.IntegrationCategory
import riven.core.exceptions.NotFoundException
import riven.core.repository.integration.IntegrationDefinitionRepository
import riven.core.util.ServiceUtil.findOrThrow
import java.util.*

/**
 * Service for managing the integration catalog.
 *
 * Provides queries for integration definitions including lookup by slug,
 * filtering by category, and retrieving active integrations.
 */
@Service
class IntegrationDefinitionService(
    private val repository: IntegrationDefinitionRepository
) {
    private val logger = KotlinLogging.logger {}

    /**
     * Get an integration definition by ID.
     *
     * @param id The integration definition ID
     * @return The integration definition
     * @throws NotFoundException if the definition doesn't exist
     */
    fun getById(id: UUID): IntegrationDefinitionEntity {
        return findOrThrow { repository.findById(id) }
    }

    /**
     * Get an integration definition by slug.
     *
     * @param slug The integration slug (e.g., "hubspot")
     * @return The integration definition
     * @throws NotFoundException if the definition doesn't exist
     */
    fun getBySlug(slug: String): IntegrationDefinitionEntity {
        return repository.findBySlug(slug)
            ?: throw NotFoundException("Integration definition not found: $slug")
    }

    /**
     * Get all active integrations.
     *
     * @return List of active integrations
     */
    fun getActiveIntegrations(): List<IntegrationDefinitionEntity> {
        return repository.findByActiveTrue()
    }

    /**
     * Get all integrations in a specific category.
     *
     * @param category The integration category
     * @return List of integrations in the category
     */
    fun getByCategory(category: IntegrationCategory): List<IntegrationDefinitionEntity> {
        return repository.findByCategory(category)
    }

    /**
     * Get all integration definitions.
     *
     * @return List of all integrations
     */
    fun getAll(): List<IntegrationDefinitionEntity> {
        return repository.findAll()
    }
}
