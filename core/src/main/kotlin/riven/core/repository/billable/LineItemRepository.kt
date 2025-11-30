package riven.core.repository.billable

import riven.core.entity.invoice.LineItemEntity
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface LineItemRepository : JpaRepository<LineItemEntity, UUID> {
    fun findByOrganisationId(organisationId: UUID): List<LineItemEntity>
}