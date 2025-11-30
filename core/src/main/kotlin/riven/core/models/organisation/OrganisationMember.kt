package riven.core.models.organisation


import riven.core.enums.organisation.OrganisationRoles
import riven.core.models.user.UserDisplay
import java.time.ZonedDateTime

data class OrganisationMember(
    val user: UserDisplay,
    val membershipDetails: MembershipDetails
)

data class MembershipDetails(
    // Optional, only included when a user is viewing their memberships. But not when viewing members of a given organisation
    val organisation: Organisation? = null,
    val role: OrganisationRoles,
    val memberSince: ZonedDateTime,
)