package riven.core.repository.catalog

import org.springframework.data.jpa.repository.JpaRepository
import riven.core.entity.catalog.ManifestCatalogEntity
import riven.core.enums.catalog.ManifestType
import java.util.*

/**
 * Repository for manifest catalog entries.
 *
 * Provides queries for finding manifests by key, type, and key+type combination.
 */
interface ManifestCatalogRepository : JpaRepository<ManifestCatalogEntity, UUID> {

    /**
     * Find all manifests with the given key (may span multiple manifest types).
     */
    fun findByKey(key: String): List<ManifestCatalogEntity>

    /**
     * Find all manifests of a given type (MODEL, TEMPLATE, INTEGRATION).
     */
    fun findByManifestType(manifestType: ManifestType): List<ManifestCatalogEntity>

    /**
     * Find a single manifest by its unique key + type combination.
     */
    fun findByKeyAndManifestType(key: String, manifestType: ManifestType): ManifestCatalogEntity?
}
