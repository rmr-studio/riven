package riven.core.enums.integration

enum class ConnectionStatus {
    PENDING_AUTHORIZATION,
    AUTHORIZING,
    CONNECTED,
    SYNCING,
    HEALTHY,
    DEGRADED,
    STALE,
    DISCONNECTING,
    DISCONNECTED,
    FAILED;

    fun canTransitionTo(newStatus: ConnectionStatus): Boolean {
        return when (this) {
            PENDING_AUTHORIZATION -> newStatus in setOf(AUTHORIZING, FAILED, DISCONNECTED)
            AUTHORIZING -> newStatus in setOf(CONNECTED, FAILED)
            CONNECTED -> newStatus in setOf(SYNCING, HEALTHY, DISCONNECTING, FAILED)
            SYNCING -> newStatus in setOf(HEALTHY, DEGRADED, FAILED)
            HEALTHY -> newStatus in setOf(SYNCING, STALE, DEGRADED, DISCONNECTING)
            DEGRADED -> newStatus in setOf(HEALTHY, STALE, FAILED, DISCONNECTING)
            STALE -> newStatus in setOf(SYNCING, DISCONNECTING, FAILED)
            DISCONNECTING -> newStatus in setOf(DISCONNECTED, FAILED)
            DISCONNECTED -> newStatus in setOf(PENDING_AUTHORIZATION)
            FAILED -> newStatus in setOf(PENDING_AUTHORIZATION, DISCONNECTED)
        }
    }
}
