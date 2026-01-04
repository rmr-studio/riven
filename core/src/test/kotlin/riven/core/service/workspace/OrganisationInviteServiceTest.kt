package riven.core.service.workspace

import io.github.oshai.kotlinlogging.KLogger
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.mockito.Mockito
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Import
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.test.context.bean.override.mockito.MockitoBean
import riven.core.configuration.auth.WorkspaceSecurity
import riven.core.entity.user.UserEntity
import riven.core.entity.workspace.WorkspaceEntity
import riven.core.entity.workspace.WorkspaceInviteEntity
import riven.core.entity.workspace.WorkspaceMemberEntity
import riven.core.enums.workspace.WorkspaceInviteStatus
import riven.core.enums.workspace.WorkspaceRoles
import riven.core.exceptions.ConflictException
import riven.core.repository.workspace.WorkspaceInviteRepository
import riven.core.repository.workspace.WorkspaceMemberRepository
import riven.core.service.activity.ActivityService
import riven.core.service.auth.AuthTokenService
import riven.core.service.util.WithUserPersona
import riven.core.service.util.WorkspaceRole
import riven.core.service.util.factory.UserFactory
import riven.core.service.util.factory.WorkspaceFactory
import java.util.*

@SpringBootTest(
    classes = [
        WorkspaceSecurity::class,
        AuthTokenService::class,
        WorkspaceInviteServiceTest.TestConfig::class,
        WorkspaceInviteService::class,
    ]
)
class WorkspaceInviteServiceTest {

    @Configuration
    @EnableMethodSecurity(prePostEnabled = true)
    @Import(WorkspaceSecurity::class)
    class TestConfig

    private val userId: UUID = UUID.fromString("f8b1c2d3-4e5f-6789-abcd-ef0123456789")

    // Two Workspace Ids that belong to the user
    private val workspaceId1: UUID = UUID.fromString("f8b1c2d3-4e5f-6789-abcd-ef9876543210")
    private val workspaceId2: UUID = UUID.fromString("e9b1c2d3-4e5f-6789-abcd-ef9876543210")

    @Autowired
    private lateinit var workspaceInviteService: WorkspaceInviteService

    @MockitoBean
    private lateinit var workspaceMemberRepository: WorkspaceMemberRepository

    @MockitoBean
    private lateinit var workspaceInviteRepository: WorkspaceInviteRepository

    @MockitoBean
    private lateinit var workspaceService: WorkspaceService

    @MockitoBean
    private lateinit var activityService: ActivityService

    @MockitoBean
    private lateinit var logger: KLogger

    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "email@email.com",
        displayName = "Jared Tucker",
        roles = [
            WorkspaceRole(
                workspaceId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
                role = WorkspaceRoles.OWNER
            ),
            WorkspaceRole(
                workspaceId = "e9b1c2d3-4e5f-6789-abcd-ef9876543210",
                role = WorkspaceRoles.MEMBER
            )
        ]
    )
    fun `handle workspace invitation creation`() {

        val targetEmail: String = "email2@email.com"

        val user: UserEntity = UserFactory.createUser(
            // Different user ID to test member removal
            id = userId,
            email = "email@email.com"
        )

        val key = WorkspaceMemberEntity.WorkspaceMemberKey(
            workspaceId = workspaceId1,
            userId = userId
        )


        val member: WorkspaceMemberEntity = WorkspaceFactory.createWorkspaceMember(
            workspaceId = workspaceId1,
            user = user,
            role = WorkspaceRoles.ADMIN
        ).let {
            it.run {
                Mockito.`when`(workspaceMemberRepository.findById(key)).thenReturn(Optional.of(this))
            }
            it
        }

        // Workspace that the user is an owner of, so has permissions to invite users to
        val workspace1: WorkspaceEntity = WorkspaceFactory.createWorkspace(
            id = workspaceId1,
            name = "Test Workspace 1",
            members = mutableSetOf(member)
        )

        // Workspace that the user is a developer of, so should not have any permissions to invite users to
        WorkspaceFactory.createWorkspace(
            id = workspaceId2,
            name = "Test Workspace 2"
        )

        val inviteEntity: WorkspaceInviteEntity = WorkspaceFactory.createWorkspaceInvite(
            email = targetEmail,
            workspaceId = workspaceId1,
            role = WorkspaceRoles.MEMBER,
            invitedBy = userId,
        )

        Mockito.`when`(workspaceMemberRepository.findByIdworkspaceId(workspaceId1))
            .thenReturn(workspace1.members.toList())
        Mockito.`when`(workspaceInviteRepository.save(Mockito.any<WorkspaceInviteEntity>()))
            .thenReturn(inviteEntity)

        assertThrows<AccessDeniedException> {
            workspaceInviteService.createWorkspaceInvitation(
                workspaceId2,
                targetEmail,
                WorkspaceRoles.MEMBER
            )
        }

        workspaceInviteService.createWorkspaceInvitation(
            workspaceId1,
            // Using a different email to test the invitation creation
            targetEmail,
            WorkspaceRoles.MEMBER
        )

    }

    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "email@email.com",
        displayName = "Jared Tucker",
        roles = [
            WorkspaceRole(
                workspaceId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
                role = WorkspaceRoles.OWNER
            )
        ]
    )
    fun `handle rejection of invitation creation if user is already a member`() {
        // Test setup for a user trying to create an invitation for an email that is already a member of the workspace
        val targetEmail: String = "email@email.com"

        val user: UserEntity = UserFactory.createUser(
            // Different user ID to test member removal
            id = userId,
            email = "email@email.com"
        )

        val key = WorkspaceMemberEntity.WorkspaceMemberKey(
            workspaceId = workspaceId1,
            userId = userId
        )

        val member: WorkspaceMemberEntity = WorkspaceFactory.createWorkspaceMember(
            workspaceId = workspaceId1,
            user = user,
            role = WorkspaceRoles.ADMIN
        ).let {
            it.run {
                Mockito.`when`(workspaceMemberRepository.findById(key)).thenReturn(Optional.of(this))
            }
            it
        }

        // Workspace that the user is an owner of, so has permissions to invite users to
        val workspace1: WorkspaceEntity = WorkspaceFactory.createWorkspace(
            id = workspaceId1,
            name = "Test Workspace 1",
            members = mutableSetOf(member)
        )

        Mockito.`when`(workspaceMemberRepository.findByIdworkspaceId(workspaceId1))
            .thenReturn(workspace1.members.toList())

        assertThrows<ConflictException> {
            workspaceInviteService.createWorkspaceInvitation(
                workspaceId1,
                targetEmail,
                WorkspaceRoles.MEMBER
            )
        }
    }

    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "email@email.com",
        displayName = "Jared Tucker",
        roles = [
            WorkspaceRole(
                workspaceId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
                role = WorkspaceRoles.OWNER
            )
        ]
    )
    fun `handle rejection if invitation role is of type owner`() {
        assertThrows<IllegalArgumentException> {
            workspaceInviteService.createWorkspaceInvitation(
                workspaceId1,
                "email@email.com2",
                WorkspaceRoles.OWNER
            )
        }
    }

    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "email@email.com",
        displayName = "Jared Tucker",
        roles = []
    )
    fun `handle invitation acceptance`() {
        val userEmail = "email@email.com"
        val token: String = WorkspaceInviteEntity.generateSecureToken()

        // Workspace that the user is an owner of, so has permissions to invite users to
        WorkspaceFactory.createWorkspace(
            id = workspaceId1,
            name = "Test Workspace 1",
        )

        val user: UserEntity = UserFactory.createUser(
            // Different user ID to test member removal
            id = userId,
            email = userEmail
        )

        val inviteEntity: WorkspaceInviteEntity = WorkspaceFactory.createWorkspaceInvite(
            email = userEmail,
            workspaceId = workspaceId1,
            role = WorkspaceRoles.MEMBER,
            token = token,
        )

        Mockito.`when`(workspaceInviteRepository.findByToken(token)).thenReturn(Optional.of(inviteEntity))
        Mockito.`when`(workspaceInviteRepository.save(Mockito.any<WorkspaceInviteEntity>()))
            .thenReturn(inviteEntity.let {
                it.copy().apply {
                    inviteStatus = WorkspaceInviteStatus.ACCEPTED
                }
            })
        Mockito.`when`(workspaceMemberRepository.save(Mockito.any<WorkspaceMemberEntity>()))
            .thenReturn(
                WorkspaceMemberEntity(
                    WorkspaceMemberEntity.WorkspaceMemberKey(
                        workspaceId = workspaceId1,
                        userId = userId
                    ),
                    WorkspaceRoles.MEMBER
                ).apply {
                    this.user = user
                }
            )

        workspaceInviteService.handleInvitationResponse(token, accepted = true)
        Mockito.verify(workspaceInviteRepository).save(Mockito.any<WorkspaceInviteEntity>())
        Mockito.verify(workspaceService).addMemberToWorkspace(
            workspaceId = workspaceId1,
            userId = userId,
            role = WorkspaceRoles.MEMBER
        )
    }

    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "email@email.com",
        displayName = "Jared Tucker",
        roles = []
    )
    fun `handle invitation rejection`() {
        val userEmail = "email@email.com"
        val token: String = WorkspaceInviteEntity.generateSecureToken()

        // Workspace that the user is an owner of, so has permissions to invite users to
        WorkspaceFactory.createWorkspace(
            id = workspaceId1,
            name = "Test Workspace 1",
        )

        val user: UserEntity = UserFactory.createUser(
            // Different user ID to test member removal
            id = userId,
            email = userEmail
        )

        val inviteEntity: WorkspaceInviteEntity = WorkspaceFactory.createWorkspaceInvite(
            email = userEmail,
            workspaceId = workspaceId1,
            role = WorkspaceRoles.MEMBER,
            token = token,
        )

        Mockito.`when`(workspaceInviteRepository.findByToken(token)).thenReturn(Optional.of(inviteEntity))
        Mockito.`when`(workspaceInviteRepository.save(Mockito.any<WorkspaceInviteEntity>()))
            .thenReturn(inviteEntity.let {
                it.copy().apply {
                    inviteStatus = WorkspaceInviteStatus.DECLINED
                }
            })
        Mockito.`when`(workspaceMemberRepository.save(Mockito.any<WorkspaceMemberEntity>()))
            .thenReturn(
                WorkspaceMemberEntity(
                    WorkspaceMemberEntity.WorkspaceMemberKey(
                        workspaceId = workspaceId1,
                        userId = userId
                    ),
                    WorkspaceRoles.MEMBER
                ).apply {
                    this.user = user
                }
            )

        workspaceInviteService.handleInvitationResponse(token, accepted = false)
        Mockito.verify(workspaceInviteRepository).save(Mockito.any<WorkspaceInviteEntity>())
        Mockito.verify(workspaceMemberRepository, Mockito.never()).save(Mockito.any<WorkspaceMemberEntity>())
    }

    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "email@email.com",
        displayName = "Jared Tucker",
        roles = []
    )
    fun `handle rejection if trying to accept an invitation that is not meant for the user`() {
        // Ensure email does not match current email in JWT
        val userEmail = "email2@email.com"
        val token: String = WorkspaceInviteEntity.generateSecureToken()

        val inviteEntity: WorkspaceInviteEntity = WorkspaceFactory.createWorkspaceInvite(
            email = userEmail,
            workspaceId = workspaceId1,
            role = WorkspaceRoles.MEMBER,
            token = token,
        )

        Mockito.`when`(workspaceInviteRepository.findByToken(token)).thenReturn(Optional.of(inviteEntity))

        assertThrows<AccessDeniedException> {
            workspaceInviteService.handleInvitationResponse(token, accepted = true)
        }
    }

    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "email@email.com",
        displayName = "Jared Tucker",
        roles = []
    )
    fun `handle rejection if trying to accept an invitation that is not pending`() {
        // Ensure email does not match current email in JWT
        val userEmail = "email@email.com"
        val token: String = WorkspaceInviteEntity.generateSecureToken()

        val inviteEntity: WorkspaceInviteEntity = WorkspaceFactory.createWorkspaceInvite(
            email = userEmail,
            workspaceId = workspaceId1,
            role = WorkspaceRoles.MEMBER,
            token = token,
            status = WorkspaceInviteStatus.EXPIRED
        )

        Mockito.`when`(workspaceInviteRepository.findByToken(token)).thenReturn(Optional.of(inviteEntity))

        assertThrows<IllegalArgumentException> {
            workspaceInviteService.handleInvitationResponse(token, accepted = true)
        }
    }

    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "email@email.com",
        displayName = "Jared Tucker",
        roles = [
            WorkspaceRole(
                workspaceId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
                role = WorkspaceRoles.OWNER
            )
        ]
    )
    fun `handle rejection if trying to revoke an invitation that is not pending`() {
        val userEmail = "email@email.com"

        val inviteEntity: WorkspaceInviteEntity = WorkspaceFactory.createWorkspaceInvite(
            email = userEmail,
            workspaceId = workspaceId1,
            role = WorkspaceRoles.MEMBER,
            status = WorkspaceInviteStatus.ACCEPTED
        )

        inviteEntity.id.let {
            if (it == null) throw IllegalArgumentException("Invite ID cannot be null")

            Mockito.`when`(workspaceInviteRepository.findById(it)).thenReturn(Optional.of(inviteEntity))

            assertThrows<IllegalArgumentException> {
                workspaceInviteService.revokeWorkspaceInvite(workspaceId1, it)
            }
        }
    }

    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "email@email.com",
        displayName = "Jared Tucker",
        roles = [
            WorkspaceRole(
                workspaceId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
                role = WorkspaceRoles.MEMBER
            )
        ]
    )
    fun `handle rejection if trying to revoke an invitation with invalid permissions`() {
        val userEmail = "email@email.com"

        val inviteEntity: WorkspaceInviteEntity = WorkspaceFactory.createWorkspaceInvite(
            email = userEmail,
            workspaceId = workspaceId1,
            role = WorkspaceRoles.MEMBER,
            status = WorkspaceInviteStatus.PENDING
        )

        inviteEntity.id.let {
            if (it == null) throw IllegalArgumentException("Invite ID cannot be null")

            Mockito.`when`(workspaceInviteRepository.findById(it)).thenReturn(Optional.of(inviteEntity))

            assertThrows<AccessDeniedException> {
                workspaceInviteService.revokeWorkspaceInvite(workspaceId1, it)
            }
        }

    }
}