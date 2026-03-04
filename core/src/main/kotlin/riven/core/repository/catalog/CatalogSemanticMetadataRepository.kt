package riven.core.repository.catalog

import org.springframework.data.jpa.repository.JpaRepository
import riven.core.entity.catalog.CatalogSemanticMetadataEntity
import riven.core.enums.entity.semantics.SemanticMetadataTargetType
import java.util.*

/**
 * Repository for catalog semantic metadata.
 *
 * Provides queries for finding semantic metadata by entity type and by
 * the unique combination of entity type + target type + target ID.
 */
interface CatalogSemanticMetadataRepository : JpaRepository<CatalogSemanticMetadataEntity, UUID> {

    /**
     * Find all semantic metadata for a given catalog entity type.
     */
    fun findByCatalogEntityTypeId(catalogEntityTypeId: UUID): List<CatalogSemanticMetadataEntity>

    /**
     * Find a specific semantic metadata entry by its unique composite key.
     */
    fun findByCatalogEntityTypeIdAndTargetTypeAndTargetId(
        catalogEntityTypeId: UUID,
        targetType: SemanticMetadataTargetType,
        targetId: String
    ): CatalogSemanticMetadataEntity?
}
