package riven.core.service.lifecycle

import io.github.oshai.kotlinlogging.KLogger
import org.springframework.boot.context.event.ApplicationReadyEvent
import org.springframework.context.event.EventListener
import org.springframework.stereotype.Service
import riven.core.lifecycle.CoreModelRegistry
import riven.core.service.catalog.ManifestUpsertService

/**
 * Populates the manifest catalog with core lifecycle model definitions at boot time.
 *
 * Runs on ApplicationReadyEvent. ManifestLoaderService also runs on this event (in a
 * separate thread). Both paths converge at ManifestUpsertService which is idempotent —
 * content hash matching prevents duplicate work regardless of execution order.
 *
 * Flow:
 *   1. CoreModelRegistry.validate() — fail fast on broken definitions
 *   2. For each model set: convert to ResolvedManifest → upsert to catalog
 *   3. Log summary
 *
 * ManifestUpsertService handles idempotency — re-running on the same definitions
 * with matching content hash skips child reconciliation.
 */
@Service
class CoreModelCatalogService(
    private val upsertService: ManifestUpsertService,
    private val logger: KLogger,
) {

    @EventListener(ApplicationReadyEvent::class)
    fun onApplicationReady() {
        CoreModelRegistry.validate()

        val manifests = CoreModelRegistry.allResolvedManifests()
        for (manifest in manifests) {
            upsertService.upsertManifest(manifest)
            logger.info { "Core model set '${manifest.key}' loaded: ${manifest.entityTypes.size} entity types, ${manifest.relationships.size} relationships" }
        }

        logger.info { "Core model catalog populated: ${manifests.size} model sets, ${CoreModelRegistry.allModels.size} unique entity types" }
    }
}
