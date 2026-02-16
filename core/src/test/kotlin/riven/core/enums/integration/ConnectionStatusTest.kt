package riven.core.enums.integration

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

/**
 * Unit tests for ConnectionStatus state machine.
 *
 * Verifies all valid transitions succeed and key invalid transitions
 * are rejected by the canTransitionTo() method.
 */
class ConnectionStatusTest {

    // ========== PENDING_AUTHORIZATION Transitions ==========

    @Test
    fun `PENDING_AUTHORIZATION can transition to AUTHORIZING`() {
        assertTrue(ConnectionStatus.PENDING_AUTHORIZATION.canTransitionTo(ConnectionStatus.AUTHORIZING))
    }

    @Test
    fun `PENDING_AUTHORIZATION can transition to FAILED`() {
        assertTrue(ConnectionStatus.PENDING_AUTHORIZATION.canTransitionTo(ConnectionStatus.FAILED))
    }

    @Test
    fun `PENDING_AUTHORIZATION can transition to DISCONNECTED`() {
        assertTrue(ConnectionStatus.PENDING_AUTHORIZATION.canTransitionTo(ConnectionStatus.DISCONNECTED))
    }

    @Test
    fun `PENDING_AUTHORIZATION cannot transition to SYNCING`() {
        assertFalse(ConnectionStatus.PENDING_AUTHORIZATION.canTransitionTo(ConnectionStatus.SYNCING))
    }

    @Test
    fun `PENDING_AUTHORIZATION cannot transition to CONNECTED`() {
        assertFalse(ConnectionStatus.PENDING_AUTHORIZATION.canTransitionTo(ConnectionStatus.CONNECTED))
    }

    @Test
    fun `PENDING_AUTHORIZATION cannot transition to HEALTHY`() {
        assertFalse(ConnectionStatus.PENDING_AUTHORIZATION.canTransitionTo(ConnectionStatus.HEALTHY))
    }

    // ========== AUTHORIZING Transitions ==========

    @Test
    fun `AUTHORIZING can transition to CONNECTED`() {
        assertTrue(ConnectionStatus.AUTHORIZING.canTransitionTo(ConnectionStatus.CONNECTED))
    }

    @Test
    fun `AUTHORIZING can transition to FAILED`() {
        assertTrue(ConnectionStatus.AUTHORIZING.canTransitionTo(ConnectionStatus.FAILED))
    }

    @Test
    fun `AUTHORIZING cannot transition to HEALTHY`() {
        assertFalse(ConnectionStatus.AUTHORIZING.canTransitionTo(ConnectionStatus.HEALTHY))
    }

    @Test
    fun `AUTHORIZING cannot transition to SYNCING`() {
        assertFalse(ConnectionStatus.AUTHORIZING.canTransitionTo(ConnectionStatus.SYNCING))
    }

    // ========== CONNECTED Transitions ==========

    @Test
    fun `CONNECTED can transition to SYNCING`() {
        assertTrue(ConnectionStatus.CONNECTED.canTransitionTo(ConnectionStatus.SYNCING))
    }

    @Test
    fun `CONNECTED can transition to HEALTHY`() {
        assertTrue(ConnectionStatus.CONNECTED.canTransitionTo(ConnectionStatus.HEALTHY))
    }

    @Test
    fun `CONNECTED can transition to DISCONNECTING`() {
        assertTrue(ConnectionStatus.CONNECTED.canTransitionTo(ConnectionStatus.DISCONNECTING))
    }

    @Test
    fun `CONNECTED can transition to FAILED`() {
        assertTrue(ConnectionStatus.CONNECTED.canTransitionTo(ConnectionStatus.FAILED))
    }

    @Test
    fun `CONNECTED cannot transition to DEGRADED`() {
        assertFalse(ConnectionStatus.CONNECTED.canTransitionTo(ConnectionStatus.DEGRADED))
    }

    // ========== SYNCING Transitions ==========

    @Test
    fun `SYNCING can transition to HEALTHY`() {
        assertTrue(ConnectionStatus.SYNCING.canTransitionTo(ConnectionStatus.HEALTHY))
    }

    @Test
    fun `SYNCING can transition to DEGRADED`() {
        assertTrue(ConnectionStatus.SYNCING.canTransitionTo(ConnectionStatus.DEGRADED))
    }

    @Test
    fun `SYNCING can transition to FAILED`() {
        assertTrue(ConnectionStatus.SYNCING.canTransitionTo(ConnectionStatus.FAILED))
    }

    @Test
    fun `SYNCING cannot transition to DISCONNECTING`() {
        assertFalse(ConnectionStatus.SYNCING.canTransitionTo(ConnectionStatus.DISCONNECTING))
    }

    // ========== HEALTHY Transitions ==========

    @Test
    fun `HEALTHY can transition to SYNCING`() {
        assertTrue(ConnectionStatus.HEALTHY.canTransitionTo(ConnectionStatus.SYNCING))
    }

    @Test
    fun `HEALTHY can transition to STALE`() {
        assertTrue(ConnectionStatus.HEALTHY.canTransitionTo(ConnectionStatus.STALE))
    }

    @Test
    fun `HEALTHY can transition to DEGRADED`() {
        assertTrue(ConnectionStatus.HEALTHY.canTransitionTo(ConnectionStatus.DEGRADED))
    }

    @Test
    fun `HEALTHY can transition to DISCONNECTING`() {
        assertTrue(ConnectionStatus.HEALTHY.canTransitionTo(ConnectionStatus.DISCONNECTING))
    }

    @Test
    fun `HEALTHY cannot transition to CONNECTED`() {
        assertFalse(ConnectionStatus.HEALTHY.canTransitionTo(ConnectionStatus.CONNECTED))
    }

    // ========== DEGRADED Transitions ==========

    @Test
    fun `DEGRADED can transition to HEALTHY`() {
        assertTrue(ConnectionStatus.DEGRADED.canTransitionTo(ConnectionStatus.HEALTHY))
    }

    @Test
    fun `DEGRADED can transition to STALE`() {
        assertTrue(ConnectionStatus.DEGRADED.canTransitionTo(ConnectionStatus.STALE))
    }

    @Test
    fun `DEGRADED can transition to FAILED`() {
        assertTrue(ConnectionStatus.DEGRADED.canTransitionTo(ConnectionStatus.FAILED))
    }

    @Test
    fun `DEGRADED can transition to DISCONNECTING`() {
        assertTrue(ConnectionStatus.DEGRADED.canTransitionTo(ConnectionStatus.DISCONNECTING))
    }

    @Test
    fun `DEGRADED cannot transition to SYNCING`() {
        assertFalse(ConnectionStatus.DEGRADED.canTransitionTo(ConnectionStatus.SYNCING))
    }

    // ========== STALE Transitions ==========

    @Test
    fun `STALE can transition to SYNCING`() {
        assertTrue(ConnectionStatus.STALE.canTransitionTo(ConnectionStatus.SYNCING))
    }

    @Test
    fun `STALE can transition to DISCONNECTING`() {
        assertTrue(ConnectionStatus.STALE.canTransitionTo(ConnectionStatus.DISCONNECTING))
    }

    @Test
    fun `STALE can transition to FAILED`() {
        assertTrue(ConnectionStatus.STALE.canTransitionTo(ConnectionStatus.FAILED))
    }

    @Test
    fun `STALE cannot transition to HEALTHY`() {
        assertFalse(ConnectionStatus.STALE.canTransitionTo(ConnectionStatus.HEALTHY))
    }

    // ========== DISCONNECTING Transitions ==========

    @Test
    fun `DISCONNECTING can transition to DISCONNECTED`() {
        assertTrue(ConnectionStatus.DISCONNECTING.canTransitionTo(ConnectionStatus.DISCONNECTED))
    }

    @Test
    fun `DISCONNECTING can transition to FAILED`() {
        assertTrue(ConnectionStatus.DISCONNECTING.canTransitionTo(ConnectionStatus.FAILED))
    }

    @Test
    fun `DISCONNECTING cannot transition to CONNECTED`() {
        assertFalse(ConnectionStatus.DISCONNECTING.canTransitionTo(ConnectionStatus.CONNECTED))
    }

    // ========== DISCONNECTED Transitions ==========

    @Test
    fun `DISCONNECTED can transition to PENDING_AUTHORIZATION`() {
        assertTrue(ConnectionStatus.DISCONNECTED.canTransitionTo(ConnectionStatus.PENDING_AUTHORIZATION))
    }

    @Test
    fun `DISCONNECTED cannot transition to SYNCING`() {
        assertFalse(ConnectionStatus.DISCONNECTED.canTransitionTo(ConnectionStatus.SYNCING))
    }

    @Test
    fun `DISCONNECTED cannot transition to CONNECTED`() {
        assertFalse(ConnectionStatus.DISCONNECTED.canTransitionTo(ConnectionStatus.CONNECTED))
    }

    @Test
    fun `DISCONNECTED cannot transition to HEALTHY`() {
        assertFalse(ConnectionStatus.DISCONNECTED.canTransitionTo(ConnectionStatus.HEALTHY))
    }

    // ========== FAILED Transitions ==========

    @Test
    fun `FAILED can transition to PENDING_AUTHORIZATION`() {
        assertTrue(ConnectionStatus.FAILED.canTransitionTo(ConnectionStatus.PENDING_AUTHORIZATION))
    }

    @Test
    fun `FAILED can transition to DISCONNECTED`() {
        assertTrue(ConnectionStatus.FAILED.canTransitionTo(ConnectionStatus.DISCONNECTED))
    }

    @Test
    fun `FAILED cannot transition to SYNCING`() {
        assertFalse(ConnectionStatus.FAILED.canTransitionTo(ConnectionStatus.SYNCING))
    }

    @Test
    fun `FAILED cannot transition to CONNECTED`() {
        assertFalse(ConnectionStatus.FAILED.canTransitionTo(ConnectionStatus.CONNECTED))
    }
}
