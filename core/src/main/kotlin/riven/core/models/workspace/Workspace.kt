package riven.core.models.workspace

import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import io.swagger.v3.oas.annotations.media.Schema
import riven.core.enums.workspace.WorkspacePlan
import riven.core.models.common.Address
import java.time.ZonedDateTime
import java.util.*

@Schema(requiredProperties = ["id", "name"])
@JsonDeserialize(using = JsonDeserializer.None::class)
data class Workspace(

    val id: UUID,
    var name: String,
    val plan: WorkspacePlan,
    var defaultCurrency: Currency = Currency.getInstance("AUD"), // Default currency for the workspace
    var avatarUrl: String? = null,
    var businessNumber: String? = null,
    var taxId: String? = null,
    var address: Address? = null,
    var workspacePaymentDetails: WorkspacePaymentDetails? = null, // Optional, can be null if not applicabl
    val memberCount: Int,
    val createdAt: ZonedDateTime?,
    val members: List<WorkspaceMember> = listOf(),
    val invites: List<WorkspaceInvite> = listOf()
)
