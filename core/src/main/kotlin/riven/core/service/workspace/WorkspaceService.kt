package riven.core.service.workspace

import io.github.oshai.kotlinlogging.KLogger
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import riven.core.entity.user.toModel
import riven.core.entity.workspace.WorkspaceEntity
import riven.core.entity.workspace.WorkspaceMemberEntity
import riven.core.entity.workspace.toModel
import riven.core.enums.core.ApplicationEntityType
import riven.core.enums.workspace.WorkspaceRoles
import riven.core.exceptions.NotFoundException
import riven.core.models.workspace.Workspace
import riven.core.models.workspace.WorkspaceMember
import riven.core.models.workspace.request.WorkspaceCreationRequest
import riven.core.repository.workspace.WorkspaceMemberRepository
import riven.core.repository.workspace.WorkspaceRepository
import riven.core.service.activity.ActivityService
import riven.core.service.auth.AuthTokenService
import riven.core.service.user.UserService
import riven.core.util.ServiceUtil.findOrThrow
import java.util.*

@Service
class WorkspaceService(
    private val workspaceRepository: WorkspaceRepository,
    private val workspaceMemberRepository: WorkspaceMemberRepository,
    private val userService: UserService,
    private val logger: KLogger,
    private val authTokenService: AuthTokenService,
    private val activityService: ActivityService
) {
    /**
     * Retrieve an workspace by its ID, optionally including metadata.
     *
     * @param includeMetadata When true, include additional metadata such as audit information and team members.
     * @return The workspace model corresponding to the given ID.
     * @throws NotFoundException If no workspace exists with the provided ID.
     */
    @Throws(NotFoundException::class)
    @PreAuthorize("@workspaceSecurity.hasOrg(#workspaceId)")
    fun getWorkspaceById(workspaceId: UUID, includeMetadata: Boolean = false): Workspace {
        return getEntityById(workspaceId).toModel(includeMetadata)
    }

    /**
     * Retrieve the WorkspaceEntity for the given workspaceId.
     *
     * @param workspaceId The UUID of the workspace to fetch.
     * @return The matching WorkspaceEntity.
     * @throws NotFoundException If no workspace exists with the provided id.
     */
    @Throws(NotFoundException::class)
    @PreAuthorize("@workspaceSecurity.hasOrg(#workspaceId)")
    fun getEntityById(workspaceId: UUID): WorkspaceEntity {
        return findOrThrow { workspaceRepository.findById(workspaceId) }
    }

    /**
     * Transactional given our createWorkspace method creates both an Workspace and its first member.
     */
    @Throws(AccessDeniedException::class, IllegalArgumentException::class)
    @Transactional
    fun createWorkspace(request: WorkspaceCreationRequest): Workspace {
        // Gets the user ID from the auth token to act as the Workspace creator
        authTokenService.getUserId().let { userId ->
            // Create and save the workspace entity
            val currency: Currency = try {
                Currency.getInstance(request.defaultCurrency.trim().uppercase())
            } catch (e: IllegalArgumentException) {
                throw IllegalArgumentException("Invalid currency code: ${request.defaultCurrency}")
            }

            val entity = WorkspaceEntity(
                name = request.name,
                avatarUrl = request.avatarUrl,
                plan = request.plan,
                defaultCurrency = currency,
                businessNumber = request.businessNumber,
                address = request.address,
                taxId = request.taxId,
                workspacePaymentDetails = request.payment,
            )
            workspaceRepository.save(entity).run {
                val workspace = this.toModel(includeMetadata = false)
                workspace.run {
                    // Log the activity of creating an workspace
                    activityService.logActivity(
                        activity = riven.core.enums.activity.Activity.WORKSPACE,
                        operation = riven.core.enums.util.OperationType.CREATE,
                        userId = userId,
                        workspaceId = this.id,
                        entityType = ApplicationEntityType.WORKSPACE,
                        entityId = this.id,
                        details = mapOf(
                            "workspaceId" to this.id.toString(),
                            "name" to name
                        )
                    )

                    // Add the creator as the first member/owner of the workspace
                    val key = WorkspaceMemberEntity.WorkspaceMemberKey(
                        workspaceId = this.id,
                        userId = userId
                    )

                    WorkspaceMemberEntity(key, WorkspaceRoles.OWNER).run {
                        workspaceMemberRepository.save(this)
                    }

                    // If this is the first workspace for the user, update their profile to make it their default
                    userService.getUserFromSession().toModel().let {
                        // Membership array should be empty until transaction is over. Meaning we can determine if this is the first workspace made by the user
                        // Can also manually specify for the workspace to become the new default
                        if (it.memberships.isEmpty() || request.isDefault) {
                            it.apply {
                                defaultWorkspace = workspace
                            }.run {
                                userService.updateUserDetails(this)
                            }
                        }
                    }

                    return this
                }

            }
        }

    }

    /**
     * Update an workspace's persisted fields and record the update activity.
     *
     * Logs an WORKSPACE UPDATE activity attributed to the caller.
     *
     * @param workspace The workspace model containing updated fields; must include a valid `id`.
     * @return The updated workspace model reflecting the persisted changes.
     */
    @PreAuthorize("@workspaceSecurity.hasOrgRoleOrHigher(#workspace.id, 'ADMIN')")
    fun updateWorkspace(workspace: Workspace): Workspace {
        authTokenService.getUserId().let { userId ->
            findOrThrow { workspaceRepository.findById(workspace.id) }.run {
                val entity = this.apply {
                    avatarUrl = workspace.avatarUrl
                    name = workspace.name
                    businessNumber = workspace.businessNumber
                    address = workspace.address
                    taxId = workspace.taxId
                    workspacePaymentDetails = workspace.workspacePaymentDetails
                }

                workspaceRepository.save(entity).let { updatedEntity ->
                    // Log the activity of updating an workspace
                    activityService.logActivity(
                        activity = riven.core.enums.activity.Activity.WORKSPACE,
                        operation = riven.core.enums.util.OperationType.UPDATE,
                        userId = userId,
                        workspaceId = requireNotNull(updatedEntity.id),
                        entityType = ApplicationEntityType.WORKSPACE,
                        entityId = updatedEntity.id,
                        details = mapOf(
                            "workspaceId" to updatedEntity.id.toString(),
                            "name" to updatedEntity.name
                        )
                    )
                    return updatedEntity.toModel()
                }
            }
        }
    }

    /**
     * Deletes the workspace identified by [workspaceId] along with all associated membership records.
     *
     * This operation is transactional and logs an WORKSPACE DELETE activity that includes the workspace name.
     *
     * @param workspaceId The UUID of the workspace to delete.
     */
    @PreAuthorize("@workspaceSecurity.hasOrgRoleOrHigher(#workspaceId, 'OWNER')")
    @Transactional
    fun deleteWorkspace(workspaceId: UUID) {
        authTokenService.getUserId().let { userId ->


            // Check if the workspace exists
            val workspace: WorkspaceEntity = findOrThrow { workspaceRepository.findById(workspaceId) }

            // Delete all members associated with the workspace
            workspaceMemberRepository.deleteByIdworkspaceId(workspaceId)

            // Delete the workspace itself
            workspaceRepository.delete(workspace).run {
                // Log the activity of deleting an workspace
                activityService.logActivity(
                    activity = riven.core.enums.activity.Activity.WORKSPACE,
                    operation = riven.core.enums.util.OperationType.DELETE,
                    userId = userId,
                    workspaceId = workspaceId,
                    entityType = ApplicationEntityType.WORKSPACE,
                    entityId = workspaceId,
                    details = mapOf(
                        "workspaceId" to workspaceId.toString(),
                        "name" to workspace.name
                    )
                )

            }
        }
    }

    /**
     * Invoked from Invitation accept action. Users cannot directly add others to an workspace.
     */
    fun addMemberToWorkspace(workspaceId: UUID, userId: UUID, role: WorkspaceRoles): WorkspaceMember {
        // Create and save the new member entity
        val key = WorkspaceMemberEntity.WorkspaceMemberKey(
            workspaceId = workspaceId,
            userId = userId
        )

        return WorkspaceMemberEntity(key, role).run {
            workspaceMemberRepository.save(this).let { entity ->
                entity.toModel()
            }.also {
                logger.info { "User with ID $userId added to workspace $workspaceId with role $role." }
            }
        }
    }

    /**
     * Remove a member from the specified workspace when the caller is authorized to do so.
     *
     * Removes the membership record and records an workspace-member deletion activity.
     *
     * @param workspaceId ID of the workspace to remove the member from.
     * @param member The member to remove.
     * @throws IllegalArgumentException if attempting to remove the workspace owner (ownership must be transferred first).
     */
    @PreAuthorize(
        """
           @workspaceSecurity.isUpdatingWorkspaceMember(#workspaceId, #member) or @workspaceSecurity.isUpdatingSelf(#member)
        """
    )
    fun removeMemberFromWorkspace(workspaceId: UUID, member: WorkspaceMember) {
        authTokenService.getUserId().let { userId ->

            // Assert that the removed member is not currently the owner of the workspace
            if (member.membershipDetails.role == WorkspaceRoles.OWNER) {
                throw IllegalArgumentException("Cannot remove the owner of the workspace. Please transfer ownership first.")
            }

            WorkspaceMemberEntity.WorkspaceMemberKey(
                workspaceId = workspaceId,
                userId = member.user.id
            ).run {
                findOrThrow { workspaceMemberRepository.findById(this) }
                workspaceMemberRepository.deleteById(this)
                activityService.logActivity(
                    activity = riven.core.enums.activity.Activity.WORKSPACE_MEMBER,
                    operation = riven.core.enums.util.OperationType.DELETE,
                    userId = userId,
                    workspaceId = workspaceId,
                    entityType = ApplicationEntityType.USER,
                    entityId = member.user.id,
                    details = mapOf(
                        "userId" to member.user.id.toString(),
                        "workspaceId" to workspaceId.toString()
                    )
                )
            }
        }

    }

    /**
     * Update a member's role within an workspace.
     *
     * This operation persists the new role for the specified member and logs the change. It does not allow assigning or removing the OWNER role; ownership transfers must use the dedicated transfer method.
     *
     * @param workspaceId The workspace's ID.
     * @param member The member to update.
     * @param role The new role to assign to the member.
     * @return The updated workspace member model.
     * @throws IllegalArgumentException If the new role or the member's current role is `OWNER`.
     */
    @PreAuthorize(
        """
        @workspaceSecurity.isUpdatingWorkspaceMember(#workspaceId, #member)
        """
    )
    fun updateMemberRole(
        workspaceId: UUID,
        member: WorkspaceMember,
        role: WorkspaceRoles
    ): WorkspaceMember {
        authTokenService.getUserId().let { userId ->
            // Ensure that if the new role is that of OWNER, that only the current owner can assign it
            if (role == WorkspaceRoles.OWNER || member.membershipDetails.role == WorkspaceRoles.OWNER) {
                throw IllegalArgumentException("Transfer of ownership must be done through a dedicated transfer ownership method.")
            }

            WorkspaceMemberEntity.WorkspaceMemberKey(
                workspaceId = workspaceId,
                userId = member.user.id
            ).run {
                findOrThrow { workspaceMemberRepository.findById(this) }.run {
                    this.apply {
                        this.role = role
                    }

                    workspaceMemberRepository.save(this)
                    activityService.logActivity(
                        activity = riven.core.enums.activity.Activity.WORKSPACE_MEMBER,
                        operation = riven.core.enums.util.OperationType.UPDATE,
                        userId = userId,
                        workspaceId = workspaceId,
                        entityType = ApplicationEntityType.USER,
                        entityId = member.user.id,
                        details = mapOf(
                            "userId" to member.user.id.toString(),
                            "workspaceId" to workspaceId.toString(),
                            "role" to role.toString()
                        )
                    )
                    return this.toModel()
                }
            }
        }
    }
}