package riven.core.repository.identity

import org.springframework.data.jpa.repository.JpaRepository
import riven.core.entity.identity.IdentityClusterEntity
import java.util.UUID

/**
 * Repository for IdentityClusterEntity instances.
 */
interface IdentityClusterRepository : JpaRepository<IdentityClusterEntity, UUID>
