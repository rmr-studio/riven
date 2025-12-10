package riven.core.models.response.block

import riven.core.models.block.BlockEnvironment

data class OverwriteEnvironmentResponse(
    val success: Boolean,
    val environment: BlockEnvironment
)