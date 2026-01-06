package riven.core.controller.workspace

import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import riven.core.enums.workspace.WorkspaceRoles
import riven.core.models.workspace.Workspace
import riven.core.models.workspace.WorkspaceMember
import riven.core.models.workspace.request.WorkspaceCreationRequest
import riven.core.service.workspace.WorkspaceService
import java.util.*

@RestController
@RequestMapping("/api/v1/workspace")
@Tag(name = "Workspace Management", description = "Endpoints for managing workspaces and their members")
class WorkspaceController(
    private val workspaceService: WorkspaceService
) {


    /**
     * Retrieves an workspace by its identifier.
     *
     * @param workspaceId The UUID of the workspace to retrieve.
     * @param includeMetadata If `true`, include additional workspace metadata in the response.
     * @return The requested Workspace contained in the response body (HTTP 200).
     */
    @GetMapping("/{workspaceId}")
    fun getWorkspace(
        @PathVariable workspaceId: UUID,
        @RequestParam includeMetadata: Boolean = false
    ): ResponseEntity<Workspace> {
        val workspace: Workspace = this.workspaceService.getWorkspaceById(
            workspaceId = workspaceId,
            includeMetadata = includeMetadata
        )

        return ResponseEntity.ok(workspace)
    }

    @PostMapping("/")
    fun createWorkspace(@RequestBody workspace: WorkspaceCreationRequest): ResponseEntity<Workspace> {
        val createdWorkspace: Workspace = this.workspaceService.createWorkspace(
            workspace
        )

        return ResponseEntity.status(HttpStatus.CREATED).body(createdWorkspace)
    }


    @PutMapping("/")
    fun updateWorkspace(
        @RequestBody workspace: Workspace
    ): ResponseEntity<Workspace> {
        val updatedWorkspace: Workspace = this.workspaceService.updateWorkspace(
            workspace = workspace
        )

        return ResponseEntity.ok(updatedWorkspace)
    }

    @DeleteMapping("/{workspaceId}")
    fun deleteWorkspace(
        @PathVariable workspaceId: UUID
    ): ResponseEntity<Void> {
        this.workspaceService.deleteWorkspace(workspaceId)
        return ResponseEntity.ok().build()
    }

    @DeleteMapping("/{workspaceId}/member/{memberId}")
    fun removeMemberFromWorkspace(
        @PathVariable workspaceId: UUID,
        @PathVariable memberId: UUID
    ): ResponseEntity<Void> {
        this.workspaceService.removeMemberFromWorkspace(workspaceId, memberId)
        return ResponseEntity.ok().build()
    }

    @PutMapping("/{workspaceId}/member/{memberId}/role/{role}")
    fun updateMemberRole(
        @PathVariable workspaceId: UUID,
        @PathVariable memberId: UUID,
        @PathVariable role: WorkspaceRoles
    ): ResponseEntity<WorkspaceMember> {
        val updatedMember: WorkspaceMember = this.workspaceService.updateMemberRole(
            workspaceId = workspaceId,
            memberId = memberId,
            role = role
        )
        return ResponseEntity.ok(updatedMember)
    }
}