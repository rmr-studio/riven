package riven.core.repository.connector

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import riven.core.entity.customsource.CustomSourceConnectionEntity
import java.util.Optional
import java.util.UUID

/**
 * Spring Data JPA repository for [CustomSourceConnectionEntity].
 *
 * Soft-delete filtering is automatic via `@SQLRestriction("deleted = false")`
 * on [riven.core.entity.util.AuditableSoftDeletableEntity] — derived queries
 * here never need to repeat `AND deleted = false`.
 */
@Repository
interface CustomSourceConnectionRepository : JpaRepository<CustomSourceConnectionEntity, UUID> {

    fun findByWorkspaceId(workspaceId: UUID): List<CustomSourceConnectionEntity>

    fun findByIdAndWorkspaceId(id: UUID, workspaceId: UUID): Optional<CustomSourceConnectionEntity>
}
