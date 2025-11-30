package riven.core.models.client

import riven.core.enums.client.ClientType
import riven.core.models.block.Block

data class ClientTypeMetadata(
    val type: ClientType,
    val metadata: Map<String, Block>
)
