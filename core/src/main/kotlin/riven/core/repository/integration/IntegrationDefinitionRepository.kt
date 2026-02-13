package riven.core.repository.integration

import org.springframework.data.jpa.repository.JpaRepository
import riven.core.entity.integration.IntegrationDefinitionEntity
import riven.core.enums.integration.IntegrationCategory
import java.util.*

/**
 * Repository for integration definitions (global catalog).
 *
 * Provides queries for finding integrations by slug, active status, and category.
 */
interface IntegrationDefinitionRepository : JpaRepository<IntegrationDefinitionEntity, UUID> {

    /**
     * Find an integration by its unique slug.
     */
    fun findBySlug(slug: String): IntegrationDefinitionEntity?

    /**
     * Find all active integrations.
     */
    fun findByActiveTrue(): List<IntegrationDefinitionEntity>

    /**
     * Find all integrations in a specific category.
     */
    fun findByCategory(category: IntegrationCategory): List<IntegrationDefinitionEntity>
}
