package riven.core.models.block.response.internal

import riven.core.entity.block.BlockChildEntity


data class MovePreparationResult(
    val childEntitiesToDelete: List<BlockChildEntity>,
    val childEntitiesToSave: List<BlockChildEntity>
)
