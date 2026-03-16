package riven.core.service.integration

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import riven.core.enums.integration.InstallationStatus

class InstallationStatusTest {

    @Test
    fun `enum has exactly 3 values`() {
        assertEquals(3, InstallationStatus.entries.size)
    }

    // ------ Valid transitions ------

    @Test
    fun `PENDING_CONNECTION can transition to ACTIVE`() {
        assertTrue(InstallationStatus.PENDING_CONNECTION.canTransitionTo(InstallationStatus.ACTIVE))
    }

    @Test
    fun `PENDING_CONNECTION can transition to FAILED`() {
        assertTrue(InstallationStatus.PENDING_CONNECTION.canTransitionTo(InstallationStatus.FAILED))
    }

    @Test
    fun `ACTIVE can transition to FAILED`() {
        assertTrue(InstallationStatus.ACTIVE.canTransitionTo(InstallationStatus.FAILED))
    }

    @Test
    fun `FAILED can transition to PENDING_CONNECTION`() {
        assertTrue(InstallationStatus.FAILED.canTransitionTo(InstallationStatus.PENDING_CONNECTION))
    }

    // ------ Invalid transitions ------

    @Test
    fun `PENDING_CONNECTION cannot transition to itself`() {
        assertFalse(InstallationStatus.PENDING_CONNECTION.canTransitionTo(InstallationStatus.PENDING_CONNECTION))
    }

    @Test
    fun `ACTIVE cannot transition to PENDING_CONNECTION`() {
        assertFalse(InstallationStatus.ACTIVE.canTransitionTo(InstallationStatus.PENDING_CONNECTION))
    }

    @Test
    fun `ACTIVE cannot transition to itself`() {
        assertFalse(InstallationStatus.ACTIVE.canTransitionTo(InstallationStatus.ACTIVE))
    }

    @Test
    fun `FAILED cannot transition to ACTIVE`() {
        assertFalse(InstallationStatus.FAILED.canTransitionTo(InstallationStatus.ACTIVE))
    }

    @Test
    fun `FAILED cannot transition to itself`() {
        assertFalse(InstallationStatus.FAILED.canTransitionTo(InstallationStatus.FAILED))
    }
}
