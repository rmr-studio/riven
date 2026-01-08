package riven.core.models.common

import riven.core.enums.common.icon.IconColour
import riven.core.enums.common.icon.IconType

data class Icon(
    var icon: IconType,
    var colour: IconColour,
)
