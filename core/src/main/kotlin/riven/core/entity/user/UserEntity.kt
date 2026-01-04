package riven.core.entity.user

import jakarta.persistence.*
import riven.core.entity.workspace.WorkspaceEntity
import riven.core.entity.workspace.WorkspaceMemberEntity
import riven.core.entity.workspace.toDetails
import riven.core.entity.workspace.toModel
import riven.core.models.user.User
import riven.core.models.user.UserDisplay
import java.time.ZonedDateTime
import java.util.*

@Entity
@Table(
    name = "users",
)
data class UserEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    val id: UUID? = null,

    @Column(name = "name", nullable = false)
    var name: String,

    @Column(name = "email", nullable = false)
    var email: String,

    @Column(name = "phone", nullable = true)
    var phone: String?,

    @Column(name = "avatar_url", nullable = true)
    var avatarUrl: String? = null,

    @Column(
        name = "created_at",
        nullable = false,
        updatable = false
    ) var createdAt: ZonedDateTime = ZonedDateTime.now(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "default_workspace_id", referencedColumnName = "id", insertable = true, updatable = true)
    var defaultWorkspace: WorkspaceEntity? = null,

    @Column(name = "updated_at", nullable = false) var updatedAt: ZonedDateTime = ZonedDateTime.now()
) {
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    var workspaces: MutableSet<WorkspaceMemberEntity> = mutableSetOf()

    @PrePersist
    fun onPrePersist() {
        createdAt = ZonedDateTime.now()
        updatedAt = ZonedDateTime.now()
    }

    @PreUpdate
    fun onPreUpdate() {
        updatedAt = ZonedDateTime.now()
    }
}

fun UserEntity.toModel(): User {
    this.id.let {
        if (it == null) {
            throw IllegalArgumentException("UserEntity id cannot be null")
        }
        return User(
            id = it,
            email = this.email,
            phone = this.phone,
            name = this.name,
            avatarUrl = this.avatarUrl,
            memberships = this.workspaces.map { membership -> membership.toDetails(includeWorkspace = true) },
            defaultWorkspace = this.defaultWorkspace?.toModel(includeMetadata = false),
        )
    }
}

fun UserEntity.toDisplay(): UserDisplay {
    this.id.let {
        if (it == null) {
            throw IllegalArgumentException("UserEntity id cannot be null")
        }
        return UserDisplay(
            id = it,
            email = this.email,
            name = this.name,
            avatarUrl = this.avatarUrl,
        )
    }
}