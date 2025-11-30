package riven.core.models.block.response

import riven.core.models.block.BlockEnvironment

data class OverwriteEnvironmentResponse(
    val success: Boolean,
    val environment: BlockEnvironment
)