package riven.core.repository.block

import org.springframework.data.jpa.repository.JpaRepository
import riven.core.entity.block.BlockEntity
import java.util.*

interface BlockRepository : JpaRepository<BlockEntity, UUID> {
    /**
     * Retrieves all non-archived blocks belonging to the specified workspace.
     *
     * @param workspaceId UUID of the workspace whose active (not archived) blocks should be returned.
     * @return A list of BlockEntity instances for the workspace where `archived` is false.
     */
    fun findByworkspaceIdAndArchivedFalse(workspaceId: UUID): List<BlockEntity>
}