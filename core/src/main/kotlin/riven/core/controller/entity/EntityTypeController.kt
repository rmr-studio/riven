package riven.core.controller.entity

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import riven.core.models.entity.EntityType
import riven.core.service.entity.EntityTypeService
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
}