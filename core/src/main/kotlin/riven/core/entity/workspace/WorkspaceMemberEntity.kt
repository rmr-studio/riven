package riven.core.entity.workspace

import jakarta.persistence.*
import riven.core.entity.user.UserEntity
import riven.core.entity.user.toDisplay
import riven.core.enums.workspace.WorkspaceRoles
import riven.core.models.workspace.MembershipDetails
import riven.core.models.workspace.WorkspaceMember
import java.time.ZonedDateTime
import java.util.*

@Entity
@Table(
    name = "workspace_members",
)
data class WorkspaceMemberEntity(
    // User ID + Workspace ID as composite key
    @EmbeddedId
    val id: WorkspaceMemberKey,

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, updatable = true)
    var role: WorkspaceRoles,

    @Column(name = "member_since", nullable = false, updatable = false)
    val memberSince: ZonedDateTime = ZonedDateTime.now(),
) {
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", referencedColumnName = "id", insertable = false, updatable = false)
    var user: UserEntity? = null

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "workspace_id",
        referencedColumnName = "id",
        insertable = false,
        updatable = false
    )
    var workspace: WorkspaceEntity? = null

    @Embeddable
    data class WorkspaceMemberKey(
        @Column(name = "workspace_id", nullable = false)
        val workspaceId: UUID,

        @Column(name = "user_id", nullable = false)
        val userId: UUID
    )
}

fun WorkspaceMemberEntity.toModel(): WorkspaceMember {
    this.user.let {
        if (it == null) {
            throw IllegalArgumentException("WorkspaceMemberEntity must have a non-null user")
        }

        if (it.id == null) {
            throw IllegalArgumentException("UserEntity must have a non-null id")
        }

        return WorkspaceMember(
            user = it.toDisplay(),
            membershipDetails = this.toDetails(),
        )
    }
}

/**
 * Convert WorkspaceMemberEntity to MembershipDetails
 * This excludes user and workspace details and will be used to hold a user's membership info for their profile.
 */
fun WorkspaceMemberEntity.toDetails(includeWorkspace: Boolean = false): MembershipDetails {
    return MembershipDetails(
        workspace = if (includeWorkspace) {
            this.workspace?.toModel(includeMetadata = false)
        } else {
            null
        },
        role = role,
        memberSince = memberSince,
    )
}

