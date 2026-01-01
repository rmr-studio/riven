package riven.core.controller.entity

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import riven.core.models.entity.Entity
import riven.core.models.request.entity.SaveEntityRequest
import riven.core.models.response.entity.EntityImpactResponse
import riven.core.models.response.entity.SaveEntityResponse
import riven.core.service.entity.EntityService
import java.util.*

@RestController
@RequestMapping("/api/v1/entity")
@Tag(name = "Entity Management", description = "Endpoints for managing entity instances and their associated data")
class EntityController(
    private val entityService: EntityService
) {

    @GetMapping("organisation/{organisationId}")
    @Operation(
        summary = "Get all entity types for an organisation for all provided type keys",
        description = "Retrieves all entity associated with the specified organisation and specified entity types." +
                "This will also fetch all relevant linked entities."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Entity types retrieved successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "Organisation not found")
    )
    fun getEntityByTypeIdInForOrganisation(
        @PathVariable organisationId: UUID,
        @RequestParam ids: List<UUID>
    ): ResponseEntity<Map<UUID, List<Entity>>> {
        val response = entityService.getEntitiesByTypeIds(
            organisationId = organisationId,
            typeIds = ids
        )
        return ResponseEntity.ok(response)
    }

    @GetMapping("organisation/{organisationId}/type/{id}")
    @Operation(
        summary = "Get all entity types for an organisation for a provided entity type",
        description = "Retrieves all entity associated with the specified organisation and specified entity type." +
                "This will also fetch all relevant linked entities."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Entity types retrieved successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "Organisation not found")
    )
    fun getEntityByTypeIdForOrganisation(
        @PathVariable organisationId: UUID,
        @PathVariable id: UUID
    ): ResponseEntity<List<Entity>> {
        val response = entityService.getEntitiesByTypeId(
            organisationId = organisationId,
            typeId = id
        )
        return ResponseEntity.ok(response)
    }

    @PostMapping("/organisation/{organisationId}/type/{entityTypeId}")
    @Operation(
        summary = "Saves an entity instance",
        description = "Saves either a new entity, or an updated instance within the specified organisation."
    )
    @ApiResponses(
        ApiResponse(
            responseCode = "200", description = "Entity instance saved successfully", content = [
                Content(
                    mediaType = "application/json",
                    schema = Schema(implementation = SaveEntityResponse::class)
                )
            ]
        ),
        ApiResponse(
            responseCode = "400", description = "Invalid entity data provided", content = [
                Content(
                    mediaType = "application/json",
                    schema = Schema(implementation = SaveEntityResponse::class)
                )
            ]
        ),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "Organisation or entity type not found"),
        ApiResponse(
            responseCode = "409", description = "Conflict of data or unconfirmed impacts", content = [
                Content(
                    mediaType = "application/json",
                    schema = Schema(implementation = SaveEntityResponse::class)
                )
            ]
        )
    )
    fun saveEntity(
        @PathVariable organisationId: UUID,
        @PathVariable entityTypeId: UUID,
        @RequestBody request: SaveEntityRequest,
        @RequestParam impactConfirmed: Boolean = false
    ): ResponseEntity<SaveEntityResponse> {
        val response = entityService.saveEntity(organisationId, entityTypeId, request, impactConfirmed)
        return ResponseEntity.ok(response)
    }

    @DeleteMapping("/organisation/{organisationId}/entity/{entityId}")
    @Operation(
        summary = "Deletes an entity instance",
        description = "Deleted the specified entity instance within the organisation."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Entity instance deleted successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "Organisation or entity not found")
    )
    fun deleteEntity(
        @PathVariable organisationId: UUID,
        @PathVariable entityId: UUID
    ): ResponseEntity<EntityImpactResponse> {
        entityService.deleteEntity(organisationId, entityId)
        val response = entityService.deleteEntity(organisationId, entityId)
        return ResponseEntity.ok(response)
    }
}