package riven.core.controller.entity

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import riven.core.models.entity.EntityType
import riven.core.models.request.entity.type.CreateEntityTypeRequest
import riven.core.models.request.entity.type.DeleteTypeDefinitionRequest
import riven.core.models.request.entity.type.SaveTypeDefinitionRequest
import riven.core.models.response.entity.type.EntityTypeImpactResponse
import riven.core.service.entity.type.EntityTypeService
import java.util.*

@RestController
@RequestMapping("/api/v1/entity/schema")
@Tag(name = "Entity Type Management", description = "Endpoints for managing entity types and their configurations")
class EntityTypeController(
    private val entityTypeService: EntityTypeService
) {

    @GetMapping("organisation/{organisationId}")
    @Operation(
        summary = "Get all entity types for an organisation",
        description = "Retrieves all entity types associated with the specified organisation."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Entity types retrieved successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "Organisation not found")
    )
    fun getEntityTypesForOrganisation(@PathVariable organisationId: UUID): ResponseEntity<List<EntityType>> {
        val entityTypes = entityTypeService.getOrganisationEntityTypes(organisationId)
        return ResponseEntity.ok(entityTypes)
    }

    @GetMapping("/organisation/{organisationId}/key/{key}")
    @Operation(
        summary = "Get an entity type by key for an organisation",
        description = "Retrieves a specific entity type by its key associated with the specified organisation."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Entity type retrieved successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "Entity type not found")
    )
    fun getEntityTypeByKeyForOrganisation(
        @PathVariable organisationId: UUID,
        @PathVariable key: String
    ): ResponseEntity<EntityType> {
        val entityType = entityTypeService.getByKey(key, organisationId)
        return ResponseEntity.ok(entityType.toModel())
    }

    @PostMapping("/organisation/{organisationId}")
    @Operation(
        summary = "Create a new entity type",
        description = "Creates and publishes a new entity type for the specified organisation."
    )
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Entity type created successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data"),
        ApiResponse(responseCode = "401", description = "Unauthorized access")
    )
    fun createEntityType(
        @PathVariable organisationId: UUID,
        @RequestBody request: CreateEntityTypeRequest
    ): ResponseEntity<EntityType> {
        val newEntityType = entityTypeService.publishEntityType(organisationId, request)
        return ResponseEntity.status(HttpStatus.CREATED).body(newEntityType)
    }

    @PutMapping("/organisation/{organisationId}/configuration")
    @Operation(
        summary = "Updates an existing entity type configuration",
        description = "Updates the data for an already existing entity type for the specified organisation."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Entity type updated successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data"),
        ApiResponse(responseCode = "401", description = "Unauthorized access")
    )
    fun updateEntityType(
        @PathVariable organisationId: UUID,
        @RequestBody type: EntityType,
    ): ResponseEntity<EntityType> {
        val response = entityTypeService.updateEntityTypeConfiguration(organisationId, type)
        return ResponseEntity.status(HttpStatus.OK).body(response)
    }

    @DeleteMapping("/organisation/{organisationId}/key/{key}")
    @Operation(
        summary = "Delete an entity type by key",
        description = "Deletes the specified entity type by its key for the given organisation."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Entity type deleted successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "Entity type not found")
    )
    fun deleteEntityTypeByKey(
        @PathVariable organisationId: UUID,
        @PathVariable key: String,
        @RequestParam impactConfirmed: Boolean = false,
    ): ResponseEntity<EntityTypeImpactResponse> {
        val response = entityTypeService.deleteEntityType(organisationId, key, impactConfirmed)
        if (response.impact != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response)
        }
        return ResponseEntity.ok(response)
    }

    @PostMapping("/organisation/{organisationId}/definition")
    @Operation(
        summary = "Add or update an attribute or relationship",
        description = "Adds or updates an attribute or relationship in the specified entity type for the given organisation."
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
        @PathVariable organisationId: UUID,
        @RequestBody request: SaveTypeDefinitionRequest,
        @RequestParam impactConfirmed: Boolean = false,
    ): ResponseEntity<EntityTypeImpactResponse> {
        val response = entityTypeService.saveEntityTypeDefinition(organisationId, request, impactConfirmed)
        if (response.impact != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response)
        }
        return ResponseEntity.ok(response)
    }

    @DeleteMapping("/organisation/{organisationId}/definition")
    @Operation(
        summary = "Removes an attribute or relationship from an entity type",
        description = "Removes an attribute or relationship from the specified entity type for the given organisation."
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
        @PathVariable organisationId: UUID,
        @RequestBody request: DeleteTypeDefinitionRequest,
        @RequestParam impactConfirmed: Boolean = false,
    ): ResponseEntity<EntityTypeImpactResponse> {
        val response = entityTypeService.removeEntityTypeDefinition(organisationId, request, impactConfirmed)
        if (response.impact != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response)
        }
        return ResponseEntity.ok(response)
    }
}