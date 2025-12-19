package riven.core.controller.entity

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import riven.core.models.entity.EntityType
import riven.core.models.request.entity.CreateEntityTypeRequest
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

    @PostMapping("/")
    @Operation(
        summary = "Create a new entity type",
        description = "Creates and publishes a new entity type for the specified organisation."
    )
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Entity type created successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data"),
        ApiResponse(responseCode = "401", description = "Unauthorized access")
    )
    fun createEntityType(@RequestBody request: CreateEntityTypeRequest): ResponseEntity<EntityType> {
        val newEntityType = entityTypeService.publishEntityType(request)
        return ResponseEntity.status(201).body(newEntityType)
    }

    @PutMapping("/")
    @Operation(
        summary = "Updates an existing entity type",
        description = "Updates the data for an already existing entity type for the specified organisation."
    )
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Entity type created successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data"),
        ApiResponse(responseCode = "401", description = "Unauthorized access")
    )
    fun createEntityType(@RequestBody type: EntityType): ResponseEntity<EntityType> {
        val newEntityType = entityTypeService.updateEntityType(type)
        return ResponseEntity.status(201).body(newEntityType)
    }


}