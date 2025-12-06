package riven.core.models.block.request

import riven.core.models.block.BlockType
import riven.core.models.block.metadata.Metadata
import java.util.*

/**
 * Request to create a new block within a block environment
 */
data class CreateBlockRequest(
    val type: BlockType,
    val payload: Metadata,
    val name: String,
    val parentId: UUID? = null,
    // Only applicable to List nodes
    val index: Int? = null
)