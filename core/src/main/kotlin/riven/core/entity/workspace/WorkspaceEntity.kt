package riven.core.entity.workspace

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.*
import org.hibernate.annotations.Type
import riven.core.entity.util.AuditableEntity
import riven.core.enums.workspace.WorkspacePlan
import riven.core.models.common.Address
import riven.core.models.workspace.Workspace
import riven.core.models.workspace.WorkspacePaymentDetails
import java.util.*

@Entity
@Table(
    name = "workspaces",
    uniqueConstraints = [
        UniqueConstraint(name = "workspace_name_unique", columnNames = ["name"])
    ]
)
data class WorkspaceEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "UUID DEFAULT uuid_generate_v4()", nullable = false)
    val id: UUID? = null,

    @Column(name = "name", nullable = false, updatable = true)
    var name: String,

    @Column(name = "default_currency", nullable = false, updatable = true)
    var defaultCurrency: Currency = Currency.getInstance("AUD"), // Default currency for the workspace

    @Column(name = "avatarUrl", nullable = true, updatable = true)
    var avatarUrl: String? = null,

    @Column(name = "member_count", nullable = false, updatable = false)
    val memberCount: Int = 0,

    @Type(JsonBinaryType::class)
    @Column(name = "address", nullable = true, columnDefinition = "jsonb")
    var address: Address? = null,

    @Column(name = "business_number", nullable = true, updatable = true)
    var businessNumber: String? = null,

    @Column(name = "tax_id", nullable = true, updatable = true)
    var taxId: String? = null,

    @Type(JsonBinaryType::class)
    @Column(name = "payment_details", nullable = true, updatable = true, columnDefinition = "jsonb")
    var workspacePaymentDetails: WorkspacePaymentDetails? = null, // Optional, can be null if not applicable

    @Enumerated(EnumType.STRING)
    @Column(name = "plan", nullable = false)
    var plan: WorkspacePlan = WorkspacePlan.FREE, // Default plan is FREE

) : AuditableEntity() {
    @OneToMany(mappedBy = "workspace", cascade = [CascadeType.ALL], fetch = FetchType.LAZY, orphanRemoval = true)
    var members: MutableSet<WorkspaceMemberEntity> = mutableSetOf()

    @OneToMany(mappedBy = "workspace", cascade = [CascadeType.ALL], fetch = FetchType.LAZY, orphanRemoval = true)
    var invites: MutableSet<WorkspaceInviteEntity> = mutableSetOf()
}

/**
 * Converts this WorkspaceEntity into a domain Workspace model.
 *
 * When `includeMetadata` is true, member and invite entities are converted and populated;
 * otherwise those lists are returned empty. The resulting model uses the entity's
 * persisted timestamps (inherited from AuditableEntity).
 *
 * @param includeMetadata If true, include converted members and invites in the returned model.
 * @return A populated [Workspace] domain model representing this entity.
 * @throws IllegalArgumentException if this entity's `id` is null.
 */
fun WorkspaceEntity.toModel(includeMetadata: Boolean = false): Workspace {
    val id = requireNotNull(this.id) { "WorkspaceEntity must have a non-null id" }
    return Workspace(
        id = id,
        name = this.name,
        plan = this.plan,
        defaultCurrency = this.defaultCurrency,
        avatarUrl = this.avatarUrl,
        memberCount = this.memberCount,
        createdAt = this.createdAt,
        businessNumber = this.businessNumber,
        taxId = this.taxId,
        workspacePaymentDetails = this.workspacePaymentDetails,
        members = if (includeMetadata) {
            this.members.map { member -> member.toModel() }
        } else {
            emptyList()
        },
        invites = if (includeMetadata) {
            this.invites.map { invite -> invite.toModel() }
        } else {
            emptyList()
        }
    )
}

/**
 * Converts this domain Workspace model into a persistable WorkspaceEntity.
 *
 * Maps primary scalar and JSON-backed fields (id, name, avatarUrl, memberCount,
 * businessNumber, taxId, workspacePaymentDetails, customAttributes, tileLayout,
 * address, plan). Does not populate relational collections (members, invites) or
 * audit fields — those are handled by the entity lifecycle / base class.
 *
 * @return A new WorkspaceEntity with values copied from this Workspace.
 */
fun Workspace.toEntity(): WorkspaceEntity {
    return WorkspaceEntity(
        id = this.id,
        name = this.name,
        avatarUrl = this.avatarUrl,
        memberCount = this.memberCount,
        businessNumber = this.businessNumber,
        taxId = this.taxId,
        workspacePaymentDetails = this.workspacePaymentDetails,
        address = this.address,
        plan = this.plan
    )
}
