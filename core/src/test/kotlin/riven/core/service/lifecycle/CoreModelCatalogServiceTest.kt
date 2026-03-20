package riven.core.service.lifecycle

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.kotlin.*
import org.junit.jupiter.api.BeforeEach
import riven.core.models.catalog.ResolvedManifest
import riven.core.service.catalog.ManifestUpsertService
import io.github.oshai.kotlinlogging.KLogger

@ExtendWith(org.mockito.junit.jupiter.MockitoExtension::class)
class CoreModelCatalogServiceTest {

    private val upsertService: ManifestUpsertService = mock()
    private val logger: KLogger = mock { on { isInfoEnabled() } doReturn true }
    private lateinit var service: CoreModelCatalogService

    @BeforeEach
    fun setUp() {
        service = CoreModelCatalogService(upsertService, logger)
    }

    @Test
    fun `onApplicationReady upserts all core model sets to catalog`() {
        service.onApplicationReady()

        // Should upsert exactly 2 model sets (b2c-saas and dtc-ecommerce)
        verify(upsertService, times(2)).upsertManifest(any())
    }

    @Test
    fun `onApplicationReady upserts b2c-saas with correct key`() {
        service.onApplicationReady()

        verify(upsertService).upsertManifest(argThat<ResolvedManifest> {
            key == "b2c-saas" && entityTypes.any { it.key == "subscription" }
        })
    }

    @Test
    fun `onApplicationReady upserts dtc-ecommerce with correct key`() {
        service.onApplicationReady()

        verify(upsertService).upsertManifest(argThat<ResolvedManifest> {
            key == "dtc-ecommerce" && entityTypes.any { it.key == "order" }
        })
    }
}
