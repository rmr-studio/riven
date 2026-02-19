package riven.core.controller.entity

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import riven.core.enums.entity.SemanticMetadataTargetType
import riven.core.models.entity.EntityType
import riven.core.models.entity.EntityTypeSemanticMetadata
import riven.core.models.request.entity.type.CreateEntityTypeRequest
import riven.core.models.request.entity.type.DeleteTypeDefinitionRequest
import riven.core.models.request.entity.type.SaveTypeDefinitionRequest
import riven.core.models.response.entity.type.EntityTypeImpactResponse
import riven.core.models.response.entity.type.EntityTypeWithSemanticsResponse
import riven.core.models.response.entity.type.SemanticMetadataBundle
import riven.core.service.entity.EntityTypeSemanticMetadataService
import riven.core.service.entity.type.EntityTypeService
import java.util.*

@RestController
@RequestMapping("/api/v1/entity/schema")
@Tag(name = "entity")
class EntityTypeController(
    private val entityTypeService: EntityTypeService,
    private val semanticMetadataService: EntityTypeSemanticMetadataService,
) {

    @GetMapping("workspace/{workspaceId}")
    @Operation(
        summary = "Get all entity types for a workspace",
        description = "Retrieves all entity types associated with the specified workspace. " +
            "Pass `?include=semantics` to attach semantic metadata bundles alongside each entity type."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Entity types retrieved successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "Workspace not found")
    )
    fun getEntityTypesForWorkspace(
        @PathVariable workspaceId: UUID,
        @RequestParam(required = false, defaultValue = "") include: List<String>,
    ): ResponseEntity<List<EntityTypeWithSemanticsResponse>> {
        val entityTypes = entityTypeService.getWorkspaceEntityTypes(workspaceId)

        return if ("semantics" in include) {
            val allMetadata = semanticMetadataService.getMetadataForEntityTypes(entityTypes.map { it.id })
            val bundleMap = entityTypes.associate { et ->
                et.id to buildBundle(et.id, allMetadata.filter { m -> m.entityTypeId == et.id })
            }
            ResponseEntity.ok(entityTypes.map { et ->
                EntityTypeWithSemanticsResponse(entityType = et, semantics = bundleMap[et.id])
            })
        } else {
            ResponseEntity.ok(entityTypes.map { et ->
                EntityTypeWithSemanticsResponse(entityType = et, semantics = null)
            })
        }
    }

    @GetMapping("/workspace/{workspaceId}/key/{key}")
    @Operation(
        summary = "Get an entity type by key for a workspace",
        description = "Retrieves a specific entity type by its key associated with the specified workspace. " +
            "Pass `?include=semantics` to attach the semantic metadata bundle."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Entity type retrieved successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "Entity type not found")
    )
    fun getEntityTypeByKeyForWorkspace(
        @PathVariable workspaceId: UUID,
        @PathVariable key: String,
        @RequestParam(required = false, defaultValue = "") include: List<String>,
    ): ResponseEntity<EntityTypeWithSemanticsResponse> {
        val entityTypeEntity = entityTypeService.getByKey(key, workspaceId)
        val entityType = entityTypeEntity.toModel()

        return if ("semantics" in include) {
            val allMetadata = semanticMetadataService.getAllMetadataForEntityType(workspaceId, entityType.id)
            val bundle = buildBundle(entityType.id, allMetadata)
            ResponseEntity.ok(EntityTypeWithSemanticsResponse(entityType = entityType, semantics = bundle))
        } else {
            ResponseEntity.ok(EntityTypeWithSemanticsResponse(entityType = entityType, semantics = null))
        }
    }

    @PostMapping("/workspace/{workspaceId}")
    @Operation(
        summary = "Create a new entity type",
        description = "Creates and publishes a new entity type for the specified workspace."
    )
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Entity type created successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data"),
        ApiResponse(responseCode = "401", description = "Unauthorized access")
    )
    fun createEntityType(
        @PathVariable workspaceId: UUID,
        @RequestBody request: CreateEntityTypeRequest
    ): ResponseEntity<EntityType> {
        val newEntityType = entityTypeService.publishEntityType(workspaceId, request)
        return ResponseEntity.status(HttpStatus.CREATED).body(newEntityType)
    }

    @PutMapping("/workspace/{workspaceId}/configuration")
    @Operation(
        summary = "Updates an existing entity type configuration",
        description = "Updates the data for an already existing entity type for the specified workspace."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Entity type updated successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data"),
        ApiResponse(responseCode = "401", description = "Unauthorized access")
    )
    fun updateEntityType(
        @PathVariable workspaceId: UUID,
        @RequestBody type: EntityType,
    ): ResponseEntity<EntityType> {
        val response = entityTypeService.updateEntityTypeConfiguration(workspaceId, type)
        return ResponseEntity.status(HttpStatus.OK).body(response)
    }

    @DeleteMapping("/workspace/{workspaceId}/key/{key}")
    @Operation(
        summary = "Delete an entity type by key",
        description = "Deletes the specified entity type by its key for the given workspace."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Entity type deleted successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "Entity type not found")
    )
    fun deleteEntityTypeByKey(
        @PathVariable workspaceId: UUID,
        @PathVariable key: String,
        @RequestParam impactConfirmed: Boolean = false,
    ): ResponseEntity<EntityTypeImpactResponse> {
        val response = entityTypeService.deleteEntityType(workspaceId, key, impactConfirmed)
        if (response.impact != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response)
        }
        return ResponseEntity.ok(response)
    }

    @PostMapping("/workspace/{workspaceId}/definition")
    @Operation(
        summary = "Add or update an attribute or relationship",
        description = "Adds or updates an attribute or relationship in the specified entity type for the given workspace."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Entity type definition saved successfully"),
        ApiResponse(
            responseCode = "409",
            description = "Conflict due to cascading impacts on existing entities as a result of aforementioned changes"
        ),
        ApiResponse(responseCode = "400", description = "Invalid request data"),
        ApiResponse(responseCode = "401", description = "Unauthorized access")
    )
    fun saveEntityTypeDefinition(
        @PathVariable workspaceId: UUID,
        @RequestBody request: SaveTypeDefinitionRequest,
        @RequestParam impactConfirmed: Boolean = false,
    ): ResponseEntity<EntityTypeImpactResponse> {
        val response = entityTypeService.saveEntityTypeDefinition(workspaceId, request, impactConfirmed)
        if (response.impact != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response)
        }
        return ResponseEntity.ok(response)
    }

    @DeleteMapping("/workspace/{workspaceId}/definition")
    @Operation(
        summary = "Removes an attribute or relationship from an entity type",
        description = "Removes an attribute or relationship from the specified entity type for the given workspace."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Entity type definition removed successfully"),
        ApiResponse(
            responseCode = "409",
            description = "Conflict due to cascading impacts on existing entities as a result of aforementioned changes"
        ),
        ApiResponse(responseCode = "400", description = "Invalid request data"),
        ApiResponse(responseCode = "401", description = "Unauthorized access")
    )
    fun deleteEntityTypeDefinition(
        @PathVariable workspaceId: UUID,
        @RequestBody request: DeleteTypeDefinitionRequest,
        @RequestParam impactConfirmed: Boolean = false,
    ): ResponseEntity<EntityTypeImpactResponse> {
        val response = entityTypeService.removeEntityTypeDefinition(workspaceId, request, impactConfirmed)
        if (response.impact != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response)
        }
        return ResponseEntity.ok(response)
    }

    // ------ Private helpers ------

    private fun buildBundle(
        entityTypeId: UUID,
        metadata: List<EntityTypeSemanticMetadata>,
    ): SemanticMetadataBundle {
        return SemanticMetadataBundle(
            entityType = metadata.firstOrNull { it.targetType == SemanticMetadataTargetType.ENTITY_TYPE },
            attributes = metadata.filter { it.targetType == SemanticMetadataTargetType.ATTRIBUTE }
                .associateBy { it.targetId },
            relationships = metadata.filter { it.targetType == SemanticMetadataTargetType.RELATIONSHIP }
                .associateBy { it.targetId },
        )
    }
}
