package riven.core.models.workspace


import riven.core.enums.workspace.WorkspaceRoles
import riven.core.models.user.UserDisplay
import java.time.ZonedDateTime

data class WorkspaceMember(
    val user: UserDisplay,
    val role: WorkspaceRoles,
    val memberSince: ZonedDateTime,
)

