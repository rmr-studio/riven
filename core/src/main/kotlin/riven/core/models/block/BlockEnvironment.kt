package riven.core.models.block

import riven.core.models.block.tree.BlockTree
import riven.core.models.block.tree.BlockTreeLayout

data class BlockEnvironment(
    val layout: BlockTreeLayout,
    val trees: List<BlockTree>,
)