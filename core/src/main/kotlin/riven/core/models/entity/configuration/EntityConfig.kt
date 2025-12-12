package riven.core.models.entity.configuration

import riven.core.models.common.structure.FormStructure

data class EntityConfig(
    val form: FormStructure,
    val summary: EntityDisplayConfig
)