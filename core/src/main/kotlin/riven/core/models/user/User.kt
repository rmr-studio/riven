package riven.core.models.user

import riven.core.models.organisation.MembershipDetails
import riven.core.models.organisation.Organisation
import java.util.*

data class User(
    val id: UUID,
    var email: String,
    var name: String,
    var phone: String? = null,
    var avatarUrl: String? = null,
    val memberships: List<MembershipDetails> = listOf(),
    var defaultOrganisation: Organisation? = null
)



