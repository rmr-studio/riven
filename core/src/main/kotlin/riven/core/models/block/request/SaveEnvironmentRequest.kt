package riven.core.models.block.request

import riven.core.models.block.layout.TreeLayout
import java.util.*

data class SaveEnvironmentRequest(
    val layoutId: UUID,
    val organisationId: UUID,
    val layout: TreeLayout,
    val version: Int,
    val operations: List<StructuralOperationRequest>,
)