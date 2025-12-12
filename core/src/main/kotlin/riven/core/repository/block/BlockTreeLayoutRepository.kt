package riven.core.repository.block

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import riven.core.entity.block.BlockTreeLayoutEntity
import java.util.*

@Repository
interface BlockTreeLayoutRepository : JpaRepository<BlockTreeLayoutEntity, UUID> {
    fun findByEntityId(
        entityId: UUID,
    ): Optional<BlockTreeLayoutEntity>
}
