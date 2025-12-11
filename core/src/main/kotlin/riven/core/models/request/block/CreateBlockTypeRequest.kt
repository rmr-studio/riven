package riven.core.models.request.block

import riven.core.enums.common.ValidationScope
import riven.core.models.block.display.BlockDisplay
import riven.core.models.common.validation.Schema
import java.util.*

data class CreateBlockTypeRequest(
    // The unique key for the block type.
    val key: String,
    // The name of the block type.
    val name: String,
    // An optional description of the block type.
    val description: String?,
    // The validation mode for the block type.
    val mode: ValidationScope = ValidationScope.STRICT,
    // The schema defining the structure of the block's data.
    val schema: Schema,
    // The display configuration for rendering the block.
    val display: BlockDisplay,
    // The ID of the organisation creating the block type.
    val organisationId: UUID
)