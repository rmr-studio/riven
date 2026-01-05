package riven.core.projection.user

import riven.core.entity.user.UserEntity

interface UserWorkspaceProjection {
    fun getUserEntity(): UserEntity
    fun getWorkspaceMemberships(): Set<UserWorkspaceMembershipProjection>
}