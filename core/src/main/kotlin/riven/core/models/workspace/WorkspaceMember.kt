package riven.core.models.workspace


import riven.core.enums.workspace.WorkspaceRoles
import riven.core.models.user.UserDisplay
import java.time.ZonedDateTime

data class WorkspaceMember(
    val user: UserDisplay,
    val membershipDetails: MembershipDetails
)

data class MembershipDetails(
    // Optional, only included when a user is viewing their memberships. But not when viewing members of a given workspace
    val workspace: Workspace? = null,
    val role: WorkspaceRoles,
    val memberSince: ZonedDateTime,
)