package riven.core.models.response.block.internal

import riven.core.entity.block.BlockChildEntity
import java.util.*

data class CascadeRemovalResult(
    val blocksToDelete: Set<UUID>,
    val childEntitiesToDelete: List<BlockChildEntity>
)
