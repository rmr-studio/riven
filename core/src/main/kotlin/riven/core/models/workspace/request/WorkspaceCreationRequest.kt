package riven.core.models.workspace.request

import riven.core.enums.workspace.WorkspacePlan
import riven.core.models.common.Address
import riven.core.models.workspace.WorkspacePaymentDetails

data class WorkspaceCreationRequest(
    val name: String,
    val avatarUrl: String? = null,
    val plan: WorkspacePlan,
    val defaultCurrency: String, // Default currency for the workspace, can be a string representation of the currency code
    val isDefault: Boolean = false,
    val businessNumber: String? = null,
    val taxId: String? = null,
    val address: Address,
    val payment: WorkspacePaymentDetails? = null, // Optional, can be null if not applicable
    val customAttributes: Map<String, Any> = emptyMap() // JSONB for industry-specific fields`
)