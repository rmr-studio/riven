package riven.core.service.util.factory

import riven.core.entity.organisation.OrganisationEntity
import riven.core.entity.organisation.OrganisationInviteEntity
import riven.core.entity.organisation.OrganisationMemberEntity
import riven.core.entity.user.UserEntity
import riven.core.enums.organisation.OrganisationInviteStatus
import riven.core.enums.organisation.OrganisationRoles
import java.util.*

object OrganisationFactory {

    /**
     * Creates an OrganisationEntity with the given id, name, and member set.
     *
     * @param id The organisation UUID. Defaults to a newly generated UUID.
     * @param name The organisation name. Defaults to "Test Organisation".
     * @param members The mutable set of OrganisationMemberEntity to associate with the organisation. Defaults to an empty set.
     * @return An OrganisationEntity configured with the provided id, name, and members.
     */
    fun createOrganisation(
        id: UUID = UUID.randomUUID(),
        name: String = "Test Organisation",
        members: MutableSet<OrganisationMemberEntity> = mutableSetOf()
    ) = OrganisationEntity(
        id = id,
        name = name,
    ).apply {
        this.members = members
    }

    fun createOrganisationMember(
        user: UserEntity,
        organisationId: UUID,
        role: OrganisationRoles = OrganisationRoles.MEMBER,
    ): OrganisationMemberEntity {
        user.id.let {
            if (it == null) {
                throw IllegalArgumentException("User ID must not be null")
            }

            return OrganisationMemberEntity(
                id = OrganisationMemberEntity.OrganisationMemberKey(
                    organisationId = organisationId,
                    userId = it
                ),
                role = role,
            ).apply {
                this.user = user
            }
        }
    }

    fun createOrganisationInvite(
        email: String,
        organisationId: UUID,
        role: OrganisationRoles = OrganisationRoles.MEMBER,
        token: String = OrganisationInviteEntity.generateSecureToken(),
        invitedBy: UUID = UUID.randomUUID(),
        status: OrganisationInviteStatus = OrganisationInviteStatus.PENDING
    ) = OrganisationInviteEntity(
        id = UUID.randomUUID(),
        email = email,
        organisationId = organisationId,
        role = role,
        token = token,
        inviteStatus = status,
        invitedBy = invitedBy
    )


}