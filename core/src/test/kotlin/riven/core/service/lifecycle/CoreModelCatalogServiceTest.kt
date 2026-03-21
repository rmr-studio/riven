package riven.core.service.lifecycle

import io.github.oshai.kotlinlogging.KLogger
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.kotlin.*
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.bean.override.mockito.MockitoBean
import riven.core.models.catalog.ResolvedManifest
import riven.core.service.catalog.ManifestUpsertService

@SpringBootTest(classes = [CoreModelCatalogService::class])
class CoreModelCatalogServiceTest {

    @MockitoBean
    private lateinit var upsertService: ManifestUpsertService

    @MockitoBean
    private lateinit var logger: KLogger

    @Autowired
    private lateinit var service: CoreModelCatalogService

    @BeforeEach
    fun setUp() {
        // Clear invocations from ApplicationReadyEvent firing during context startup
        clearInvocations(upsertService)
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
