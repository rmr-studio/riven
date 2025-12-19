package riven.core.service.entity.type

import org.springframework.stereotype.Service
import riven.core.repository.entity.EntityRelationshipRepository
import riven.core.repository.entity.EntityRepository

@Service
class EntityTypeRelationshipImpactAnalysisService(
    private val entityTypeRepository: EntityRelationshipRepository,
    private val entityRepository: EntityRepository
)