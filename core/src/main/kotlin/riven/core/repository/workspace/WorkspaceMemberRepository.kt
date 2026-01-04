package riven.core.repository.workspace

import org.springframework.data.jpa.repository.JpaRepository
import riven.core.entity.workspace.WorkspaceMemberEntity
import java.util.*


interface WorkspaceMemberRepository :
    JpaRepository<WorkspaceMemberEntity, WorkspaceMemberEntity.WorkspaceMemberKey> {
    fun deleteByIdworkspaceId(workspaceId: UUID)
    fun findByIdUserId(userId: UUID): List<WorkspaceMemberEntity>
    fun findByIdworkspaceId(workspaceId: UUID): List<WorkspaceMemberEntity>
}