package riven.core.repository.client

import riven.core.entity.client.ClientEntity
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface ClientRepository : JpaRepository<ClientEntity, UUID> {
    fun findByOrganisationId(organisationId: UUID): List<ClientEntity>
}