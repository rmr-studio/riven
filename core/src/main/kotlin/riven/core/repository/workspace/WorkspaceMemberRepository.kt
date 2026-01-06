package riven.core.repository.workspace

import org.springframework.data.jpa.repository.JpaRepository
import riven.core.entity.workspace.WorkspaceMemberEntity
import java.util.*


interface WorkspaceMemberRepository :
    JpaRepository<WorkspaceMemberEntity, UUID> {

    fun findByWorkspaceId(workspaceId: UUID): List<WorkspaceMemberEntity>

    fun findByWorkspaceIdAndUserId(
        workspaceId: UUID,
        userId: UUID
    ): Optional<WorkspaceMemberEntity>
}