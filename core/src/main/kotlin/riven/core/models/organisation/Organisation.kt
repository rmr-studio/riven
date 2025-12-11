package riven.core.models.organisation

import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import io.swagger.v3.oas.annotations.media.Schema
import riven.core.enums.organisation.OrganisationPlan
import riven.core.models.common.Address
import java.time.ZonedDateTime
import java.util.*

@Schema(requiredProperties = ["type", "id", "name"])
@JsonDeserialize(using = JsonDeserializer.None::class)
data class Organisation(

    val id: UUID,
    var name: String,
    val plan: OrganisationPlan,
    var defaultCurrency: Currency = Currency.getInstance("AUD"), // Default currency for the organisation
    var avatarUrl: String? = null,
    var businessNumber: String? = null,
    var taxId: String? = null,
    var address: Address? = null,
    var organisationPaymentDetails: OrganisationPaymentDetails? = null, // Optional, can be null if not applicabl
    val memberCount: Int,
    val createdAt: ZonedDateTime?,
    val members: List<OrganisationMember> = listOf(),
    val invites: List<OrganisationInvite> = listOf()
)
