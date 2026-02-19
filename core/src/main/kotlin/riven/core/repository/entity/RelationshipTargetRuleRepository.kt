package riven.core.repository.entity

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import riven.core.entity.entity.RelationshipTargetRuleEntity
import java.util.*

@Repository
interface RelationshipTargetRuleRepository : JpaRepository<RelationshipTargetRuleEntity, UUID> {

    fun findByRelationshipDefinitionId(definitionId: UUID): List<RelationshipTargetRuleEntity>

    fun findByRelationshipDefinitionIdIn(definitionIds: List<UUID>): List<RelationshipTargetRuleEntity>

    fun deleteByRelationshipDefinitionId(definitionId: UUID)

    @Query("""
        SELECT rtr FROM RelationshipTargetRuleEntity rtr
        WHERE rtr.targetEntityTypeId = :entityTypeId
        AND rtr.inverseVisible = true
    """)
    fun findInverseVisibleByTargetEntityTypeId(entityTypeId: UUID): List<RelationshipTargetRuleEntity>

    @Query("""
        SELECT rtr FROM RelationshipTargetRuleEntity rtr
        WHERE rtr.targetEntityTypeId IN :entityTypeIds
        AND rtr.inverseVisible = true
    """)
    fun findInverseVisibleByTargetEntityTypeIdIn(entityTypeIds: List<UUID>): List<RelationshipTargetRuleEntity>
}
