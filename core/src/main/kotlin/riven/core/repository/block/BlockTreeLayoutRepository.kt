package riven.core.repository.block

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import riven.core.entity.block.BlockTreeLayoutEntity
import riven.core.enums.core.ApplicationEntityType
import java.util.*

@Repository
interface BlockTreeLayoutRepository : JpaRepository<BlockTreeLayoutEntity, UUID> {
    fun findByEntityIdAndEntityType(
        entityId: UUID,
        entityType: ApplicationEntityType
    ): Optional<BlockTreeLayoutEntity>
}
