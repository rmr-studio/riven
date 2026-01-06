//package riven.core.service.util.factory
//
//import riven.core.entity.user.UserEntity
//import riven.core.entity.workspace.WorkspaceEntity
//import riven.core.entity.workspace.WorkspaceInviteEntity
//import riven.core.entity.workspace.WorkspaceMemberEntity
//import riven.core.enums.workspace.WorkspaceInviteStatus
//import riven.core.enums.workspace.WorkspaceRoles
//import java.util.*
//
//object WorkspaceFactory {
//
//    /**
//     * Creates an WorkspaceEntity with the given id, name, and member set.
//     *
//     * @param id The workspace UUID. Defaults to a newly generated UUID.
//     * @param name The workspace name. Defaults to "Test Workspace".
//     * @param members The mutable set of WorkspaceMemberEntity to associate with the workspace. Defaults to an empty set.
//     * @return An WorkspaceEntity configured with the provided id, name, and members.
//     */
//    fun createWorkspace(
//        id: UUID = UUID.randomUUID(),
//        name: String = "Test Workspace",
//        members: MutableSet<WorkspaceMemberEntity> = mutableSetOf()
//    ) = WorkspaceEntity(
//        id = id,
//        name = name,
//    ).apply {
//        this.members = members
//    }
//
//    fun createWorkspaceMember(
//        user: UserEntity,
//        workspaceId: UUID,
//        role: WorkspaceRoles = WorkspaceRoles.MEMBER,
//    ): WorkspaceMemberEntity {
//        user.id.let {
//            if (it == null) {
//                throw IllegalArgumentException("User ID must not be null")
//            }
//
//            return WorkspaceMemberEntity(
//                id = WorkspaceMemberEntity.WorkspaceMemberKey(
//                    workspaceId = workspaceId,
//                    userId = it
//                ),
//                role = role,
//            ).apply {
//                this.user = user
//            }
//        }
//    }
//
//    fun createWorkspaceInvite(
//        email: String,
//        workspaceId: UUID,
//        role: WorkspaceRoles = WorkspaceRoles.MEMBER,
//        token: String = WorkspaceInviteEntity.generateSecureToken(),
//        invitedBy: UUID = UUID.randomUUID(),
//        status: WorkspaceInviteStatus = WorkspaceInviteStatus.PENDING
//    ) = WorkspaceInviteEntity(
//        id = UUID.randomUUID(),
//        email = email,
//        workspaceId = workspaceId,
//        role = role,
//        token = token,
//        inviteStatus = status,
//        invitedBy = invitedBy
//    )
//
//
//}