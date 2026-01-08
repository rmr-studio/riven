package riven.core.models.workflow

import org.hibernate.mapping.SoftDeletable
import riven.core.entity.util.AuditableModel
import java.util.*

data class WorkflowDefinitionVersion(
    val id: UUID,
    val version: Int,


    ) : AuditableModel, SoftDeletable