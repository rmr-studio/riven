package riven.core.repository.organisation

import riven.core.entity.organisation.OrganisationEntity
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface OrganisationRepository : JpaRepository<OrganisationEntity, UUID>