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
import riven.core.models.entity.relationship.analysis.EntityTypePolymorphicCandidates
import riven.core.service.entity.type.EntityRelationshipService
import java.util.*

@RestController
@RequestMapping("/api/v1/entity/relationship")
@Tag(
    name = "Entity Type Management",
    description = "Endpoints for managing isolated operations related to an entities types relationship configuration"
)
class EntityRelationshipController(
    private val entityRelationshipService: EntityRelationshipService
) {
    @GetMapping("organisation/{organisationId}")
    @Operation(
        summary = "Get all polymorphic candidates to opt-in to bi-directional relationships",
        description = "Retrieves all entity types with open polymorphic relationships that can be candidates for bi-directional relationships when creating a new entity type."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Polymorphic candidates retrieved successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "Organisation not found")
    )
    fun getPolymorphicCandidatesForOrganisation(@PathVariable organisationId: UUID): ResponseEntity<List<EntityTypePolymorphicCandidates>> {
        val candidates = entityRelationshipService.findEligiblePolymorphicRelationships(organisationId)
        return ResponseEntity.ok(candidates)
    }
}

