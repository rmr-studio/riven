package riven.core.entity.workflow

import jakarta.persistence.Entity
import jakarta.persistence.Table

@Entity
@Table(name = "workflow_definition_versions")
data class WorkflowDefinitionVersionEntity()