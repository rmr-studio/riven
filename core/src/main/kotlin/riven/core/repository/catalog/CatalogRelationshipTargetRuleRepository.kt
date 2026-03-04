package riven.core.repository.catalog

import org.springframework.data.jpa.repository.JpaRepository
import riven.core.entity.catalog.CatalogRelationshipTargetRuleEntity
import java.util.*

/**
 * Repository for catalog relationship target rules.
 *
 * Provides queries for finding target rules by their parent relationship.
 */
interface CatalogRelationshipTargetRuleRepository : JpaRepository<CatalogRelationshipTargetRuleEntity, UUID> {

    /**
     * Find all target rules for a given catalog relationship.
     */
    fun findByCatalogRelationshipId(catalogRelationshipId: UUID): List<CatalogRelationshipTargetRuleEntity>
}
