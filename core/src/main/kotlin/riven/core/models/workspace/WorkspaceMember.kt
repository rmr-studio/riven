package riven.core.models.workspace


import riven.core.enums.workspace.WorkspaceDisplay
import riven.core.enums.workspace.WorkspaceRoles
import riven.core.models.user.UserDisplay
import java.time.ZonedDateTime

data class WorkspaceMember(
    val workspace: WorkspaceDisplay,
    val user: UserDisplay,
    val role: WorkspaceRoles,
    val memberSince: ZonedDateTime,
)

