package riven.core.models.response.entity

data class EntityImpactResponse(
    // Return the updated entity(s) after the update operation
    val error: String? = null,
    val updatedEntities: Map<String, Any>? = null,
    val impact: Any? = null
)