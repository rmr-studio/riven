package riven.core.models.user

import riven.core.models.workspace.MembershipDetails
import riven.core.models.workspace.Workspace
import java.util.*

data class User(
    val id: UUID,
    var email: String,
    var name: String,
    var phone: String? = null,
    var avatarUrl: String? = null,
    val memberships: List<MembershipDetails> = listOf(),
    var defaultWorkspace: Workspace? = null
)



