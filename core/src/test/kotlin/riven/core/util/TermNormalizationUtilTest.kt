package riven.core.util

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class TermNormalizationUtilTest {

    @Test
    fun `normalizes to lowercase`() {
        assertEquals("retention rate", TermNormalizationUtil.normalize("Retention Rate"))
    }

    @Test
    fun `trims whitespace`() {
        assertEquals("active customer", TermNormalizationUtil.normalize("  Active Customer  "))
    }

    @Test
    fun `strips single trailing s for simple plurals`() {
        assertEquals("active customer", TermNormalizationUtil.normalize("active customers"))
    }

    @Test
    fun `handles combined normalization`() {
        assertEquals("active customer", TermNormalizationUtil.normalize("  Active Customers  "))
    }

    @Test
    fun `preserves terms not ending in s`() {
        assertEquals("churn", TermNormalizationUtil.normalize("Churn"))
    }

    @Test
    fun `preserves words with double s like address`() {
        assertEquals("address", TermNormalizationUtil.normalize("address"))
    }

    @Test
    fun `preserves words with double s like business`() {
        assertEquals("business", TermNormalizationUtil.normalize("business"))
    }

    @Test
    fun `strips trailing s from simple plural words`() {
        assertEquals("car", TermNormalizationUtil.normalize("cars"))
    }
}
