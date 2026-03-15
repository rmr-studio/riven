package riven.core.repository.identity

import org.springframework.data.jpa.repository.JpaRepository
import riven.core.entity.identity.IdentityClusterMemberEntity
import java.util.UUID

/**
 * Repository for IdentityClusterMemberEntity instances.
 */
interface IdentityClusterMemberRepository : JpaRepository<IdentityClusterMemberEntity, UUID>
