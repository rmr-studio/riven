package riven.core.models.block.request

import riven.core.models.block.BlockEnvironment
import java.util.*

data class OverwriteEnvironmentRequest(
    val layoutId: UUID,
    val organisationId: UUID,
    val version: Int,
    val environment: BlockEnvironment,
)