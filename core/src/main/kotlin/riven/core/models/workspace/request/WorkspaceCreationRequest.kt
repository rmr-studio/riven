package riven.core.models.workspace.request

import riven.core.enums.workspace.WorkspacePlan

data class WorkspaceCreationRequest(
    val name: String,
    val avatarUrl: String? = null,
    val plan: WorkspacePlan,
    val defaultCurrency: String, // Default currency for the workspace, can be a string representation of the currency code
    val isDefault: Boolean = false,
)