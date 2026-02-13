package riven.core.service.integration

import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import riven.core.entity.integration.IntegrationConnectionEntity
import riven.core.enums.integration.ConnectionStatus
import riven.core.exceptions.ConflictException
import riven.core.exceptions.InvalidStateTransitionException
import riven.core.repository.integration.IntegrationConnectionRepository
import riven.core.repository.integration.IntegrationDefinitionRepository
import riven.core.service.activity.ActivityService
import riven.core.service.auth.AuthTokenService
import riven.core.util.ServiceUtil.findOrThrow
import java.util.*

/**
 * Service for managing integration connection lifecycle.
 *
 * Enforces the 10-state connection state machine with validation on all
 * status transitions. Provides CRUD operations with workspace security
 * and role-based access control.
 */
@Service
class IntegrationConnectionService(
    private val connectionRepository: IntegrationConnectionRepository,
    private val definitionRepository: IntegrationDefinitionRepository,
    private val nangoClientWrapper: NangoClientWrapper,
    private val activityService: ActivityService,
    private val authTokenService: AuthTokenService
) {
    private val logger = KotlinLogging.logger {}

    /**
     * Get all connections for a workspace.
     *
     * @param workspaceId The workspace ID
     * @return List of connections
     */
    @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
    fun getConnectionsByWorkspace(workspaceId: UUID): List<IntegrationConnectionEntity> {
        return connectionRepository.findByWorkspaceId(workspaceId)
    }

    /**
     * Get a specific workspace's connection to an integration.
     *
     * @param workspaceId The workspace ID
     * @param integrationId The integration definition ID
     * @return The connection, or null if not found
     */
    @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
    fun getConnection(workspaceId: UUID, integrationId: UUID): IntegrationConnectionEntity? {
        return connectionRepository.findByWorkspaceIdAndIntegrationId(workspaceId, integrationId)
    }

    /**
     * Create a new integration connection.
     *
     * Requires ADMIN role. Only one connection per integration per workspace is allowed.
     *
     * @param workspaceId The workspace ID
     * @param integrationId The integration definition ID
     * @param nangoConnectionId The Nango connection ID
     * @return The created connection
     * @throws ConflictException if a connection already exists
     */
    @Transactional
    @PreAuthorize("@workspaceSecurity.hasWorkspaceRole(#workspaceId, T(riven.core.enums.workspace.WorkspaceRoles).ADMIN)")
    fun createConnection(
        workspaceId: UUID,
        integrationId: UUID,
        nangoConnectionId: String
    ): IntegrationConnectionEntity {
        // Verify integration exists
        findOrThrow { definitionRepository.findById(integrationId) }

        // Check for existing connection
        connectionRepository.findByWorkspaceIdAndIntegrationId(workspaceId, integrationId)
            ?.let { throw ConflictException("Connection already exists for this integration in this workspace") }

        val connection = IntegrationConnectionEntity(
            workspaceId = workspaceId,
            integrationId = integrationId,
            nangoConnectionId = nangoConnectionId,
            status = ConnectionStatus.PENDING_AUTHORIZATION
        )

        return connectionRepository.save(connection).also {
            logger.info { "Created integration connection for workspace=$workspaceId, integration=$integrationId" }
        }
    }

    /**
     * Update a connection's status.
     *
     * Validates state transitions using ConnectionStatus.canTransitionTo().
     *
     * @param workspaceId The workspace ID
     * @param connectionId The connection ID
     * @param newStatus The new status
     * @param metadata Optional metadata to merge with existing metadata
     * @return The updated connection
     * @throws InvalidStateTransitionException if the transition is invalid
     */
    @Transactional
    @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
    fun updateConnectionStatus(
        workspaceId: UUID,
        connectionId: UUID,
        newStatus: ConnectionStatus,
        metadata: Map<String, Any>? = null
    ): IntegrationConnectionEntity {
        val connection = findOrThrow { connectionRepository.findById(connectionId) }
        require(connection.workspaceId == workspaceId) { "Connection does not belong to workspace" }

        // Enforce state machine transitions
        if (!connection.status.canTransitionTo(newStatus)) {
            throw InvalidStateTransitionException(
                "Cannot transition from ${connection.status} to $newStatus"
            )
        }

        connection.status = newStatus
        if (metadata != null) {
            connection.connectionMetadata = (connection.connectionMetadata ?: emptyMap()) + metadata
        }

        return connectionRepository.save(connection).also {
            logger.info { "Updated connection $connectionId status: ${connection.status} -> $newStatus" }
        }
    }

    /**
     * Disconnect an integration connection.
     *
     * Requires ADMIN role. Transitions to DISCONNECTING, calls Nango to delete
     * the connection, then transitions to DISCONNECTED. Handles Nango API
     * failures gracefully by still marking the connection as DISCONNECTED locally.
     *
     * @param workspaceId The workspace ID
     * @param connectionId The connection ID
     * @return The disconnected connection
     * @throws InvalidStateTransitionException if disconnection is not allowed from current state
     */
    @Transactional
    @PreAuthorize("@workspaceSecurity.hasWorkspaceRole(#workspaceId, T(riven.core.enums.workspace.WorkspaceRoles).ADMIN)")
    fun disconnectConnection(workspaceId: UUID, connectionId: UUID): IntegrationConnectionEntity {
        val connection = findOrThrow { connectionRepository.findById(connectionId) }
        require(connection.workspaceId == workspaceId) { "Connection does not belong to workspace" }

        if (!connection.status.canTransitionTo(ConnectionStatus.DISCONNECTING)) {
            throw InvalidStateTransitionException(
                "Cannot disconnect from status ${connection.status}"
            )
        }

        // Transition to DISCONNECTING
        connection.status = ConnectionStatus.DISCONNECTING
        connectionRepository.save(connection)

        // Call Nango to delete the connection
        try {
            val definition = findOrThrow { definitionRepository.findById(connection.integrationId) }
            nangoClientWrapper.deleteConnection(
                providerConfigKey = definition.nangoProviderKey,
                connectionId = connection.nangoConnectionId
            )
        } catch (e: Exception) {
            logger.error { "Failed to delete Nango connection: ${e.message}" }
            // Even if Nango delete fails, mark as disconnected locally
        }

        // Transition to DISCONNECTED
        connection.status = ConnectionStatus.DISCONNECTED
        return connectionRepository.save(connection).also {
            logger.info { "Disconnected integration connection $connectionId for workspace=$workspaceId" }
        }
    }
}
