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
import riven.core.models.response.entity.DeleteEntityResponse
import riven.core.models.response.entity.SaveEntityResponse
import riven.core.service.entity.EntityService
import java.util.*

@RestController
@RequestMapping("/api/v1/entity")
@Tag(name = "entity")
class EntityController(
    private val entityService: EntityService
) {

    @GetMapping("workspace/{workspaceId}")
    @Operation(
        summary = "Get all entity types for an workspace for all provided type keys",
        description = "Retrieves all entity associated with the specified workspace and specified entity types." +
                "This will also fetch all relevant linked entities."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Entity types retrieved successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "Workspace not found")
    )
    fun getEntityByTypeIdInForWorkspace(
        @PathVariable workspaceId: UUID,
        @RequestParam ids: List<UUID>
    ): ResponseEntity<Map<UUID, List<Entity>>> {
        val response = entityService.getEntitiesByTypeIds(
            workspaceId = workspaceId,
            typeIds = ids
        )
        return ResponseEntity.ok(response)
    }

    @GetMapping("workspace/{workspaceId}/type/{id}")
    @Operation(
        summary = "Get all entity types for an workspace for a provided entity type",
        description = "Retrieves all entity associated with the specified workspace and specified entity type." +
                "This will also fetch all relevant linked entities."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Entity types retrieved successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "Workspace not found")
    )
    fun getEntityByTypeIdForWorkspace(
        @PathVariable workspaceId: UUID,
        @PathVariable id: UUID
    ): ResponseEntity<List<Entity>> {
        val response = entityService.getEntitiesByTypeId(
            workspaceId = workspaceId,
            typeId = id
        )
        return ResponseEntity.ok(response)
    }

    @PostMapping("/workspace/{workspaceId}/type/{entityTypeId}")
    @Operation(
        summary = "Saves an entity instance",
        description = "Saves either a new entity, or an updated instance within the specified workspace."
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
        ApiResponse(responseCode = "404", description = "Workspace or entity type not found"),
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
        @PathVariable workspaceId: UUID,
        @PathVariable entityTypeId: UUID,
        @RequestBody request: SaveEntityRequest,
    ): ResponseEntity<SaveEntityResponse> {
        val response = entityService.saveEntity(workspaceId, entityTypeId, request)
        return ResponseEntity.ok(response)
    }


    @DeleteMapping("/workspace/{workspaceId}")
    @Operation(
        summary = "Deletes an entity instance",
        description = "Deleted the specified entity instance within the workspace."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Entity instance deleted successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "Workspace or entity not found")
    )
    fun deleteEntity(
        @PathVariable workspaceId: UUID,
        @RequestBody entityIds: List<UUID>,
    ): ResponseEntity<DeleteEntityResponse> {
        val response = entityService.deleteEntities(workspaceId, entityIds)
        if (response.error != null) {
            return if (response.deletedCount == 0) {
                ResponseEntity.status(404).body(response)
            } else {
                ResponseEntity.status(409).body(response)
            }
        }

        return ResponseEntity.ok(response)
    }
}