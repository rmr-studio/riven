package riven.core.lifecycle

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertDoesNotThrow
import org.junit.jupiter.api.Assertions.*
import riven.core.enums.catalog.ManifestType

class CoreModelRegistryTest {

    @Test
    fun `validate passes for built-in model sets`() {
        assertDoesNotThrow { CoreModelRegistry.validate() }
    }

    @Test
    fun `allModels returns unique models across all sets`() {
        val models = CoreModelRegistry.allModels
        val keys = models.map { it.key }
        assertEquals(keys.distinct().size, keys.size, "All model keys should be unique")
        assertTrue(keys.contains("customer"), "Should contain customer")
        assertTrue(keys.contains("support-ticket"), "Should contain support-ticket")
    }

    @Test
    fun `findModelSet returns correct set for b2c-saas`() {
        val set = requireNotNull(CoreModelRegistry.findModelSet("b2c-saas")) {
            "b2c-saas model set should exist"
        }
        assertEquals("B2C SaaS", set.name)
        assertTrue(set.models.any { it.key == "subscription" })
        assertFalse(set.models.any { it.key == "order" })
    }

    @Test
    fun `findModelSet returns correct set for dtc-ecommerce`() {
        val set = requireNotNull(CoreModelRegistry.findModelSet("dtc-ecommerce")) {
            "dtc-ecommerce model set should exist"
        }
        assertEquals("DTC E-commerce", set.name)
        assertTrue(set.models.any { it.key == "order" })
        assertFalse(set.models.any { it.key == "subscription" })
    }

    @Test
    fun `findModelSet returns null for unknown key`() {
        assertNull(CoreModelRegistry.findModelSet("unknown"))
    }

    @Test
    fun `findModel returns CustomerModel for customer key`() {
        val model = requireNotNull(CoreModelRegistry.findModel("customer")) {
            "customer model should exist"
        }
        assertEquals("Customer", model.displayNameSingular)
    }

    @Test
    fun `toResolvedManifest produces valid manifest for b2c-saas`() {
        val modelSet = requireNotNull(CoreModelRegistry.findModelSet("b2c-saas")) {
            "b2c-saas model set should exist"
        }
        val manifest = CoreModelRegistry.toResolvedManifest(modelSet)

        assertEquals("b2c-saas", manifest.key)
        assertEquals(ManifestType.TEMPLATE, manifest.type)
        assertFalse(manifest.stale)
        assertTrue(manifest.entityTypes.isNotEmpty())
        assertTrue(manifest.relationships.isNotEmpty())
        assertTrue(manifest.fieldMappings.isEmpty())

        // Verify entity types match model count
        assertEquals(modelSet.models.size, manifest.entityTypes.size)

        // Verify customer entity type has correct attributes
        val customer = requireNotNull(manifest.entityTypes.find { it.key == "customer" }) {
            "customer entity type should exist in manifest"
        }
        assertEquals("Customer", customer.displayNameSingular)
        assertEquals("CUSTOMER", customer.semanticGroup)
        assertEquals("UNCATEGORIZED", customer.lifecycleDomain)
        assertFalse(customer.readonly)
        assertTrue(customer.schema.containsKey("email"))
    }

    @Test
    fun `toResolvedManifest includes both model and additional relationships`() {
        val modelSet = requireNotNull(CoreModelRegistry.findModelSet("b2c-saas")) {
            "b2c-saas model set should exist"
        }
        val manifest = CoreModelRegistry.toResolvedManifest(modelSet)

        // Model-declared relationships (from CustomerModel)
        val supportTicketRel = manifest.relationships.find { it.key == "customer-support-tickets" }
        assertNotNull(supportTicketRel, "Should include model-declared relationship")

        // Additional relationships (from B2CSaasModels)
        val subscriptionRel = manifest.relationships.find { it.key == "customer-subscriptions" }
        assertNotNull(subscriptionRel, "Should include additional model set relationship")
    }

    @Test
    fun `allResolvedManifests returns one manifest per model set`() {
        val manifests = CoreModelRegistry.allResolvedManifests()
        assertEquals(2, manifests.size)
        assertTrue(manifests.any { it.key == "b2c-saas" })
        assertTrue(manifests.any { it.key == "dtc-ecommerce" })
    }
}
