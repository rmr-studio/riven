package riven.core.models.workspace

import riven.core.enums.workspace.WorkspaceInviteStatus
import riven.core.enums.workspace.WorkspaceRoles
import java.time.ZonedDateTime
import java.util.*

data class WorkspaceInvite(
    val id: UUID,
    val workspaceId: UUID,
    val email: String,
    val inviteToken: String,
    val invitedBy: UUID? = null,
    val createdAt: ZonedDateTime,
    val expiresAt: ZonedDateTime,
    val role: WorkspaceRoles,
    val status: WorkspaceInviteStatus
)
