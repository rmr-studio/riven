package riven.core.service.catalog

import com.fasterxml.jackson.databind.JsonNode
import io.github.oshai.kotlinlogging.KLogger
import org.springframework.boot.context.event.ApplicationReadyEvent
import org.springframework.context.event.EventListener
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import riven.core.enums.catalog.ManifestType
import riven.core.models.catalog.ScannedManifest
import riven.core.repository.catalog.ManifestCatalogRepository
import riven.core.repository.integration.IntegrationDefinitionRepository

/**
 * Orchestrates the full manifest loading pipeline on application startup.
 * Coordinates scan -> resolve -> upsert with stale-based reconciliation.
 * Does NOT use @Transactional on the main method -- each manifest is
 * upserted in its own transaction via ManifestUpsertService.
 */
@Service
class ManifestLoaderService(
    private val scannerService: ManifestScannerService,
    private val resolverService: ManifestResolverService,
    private val upsertService: ManifestUpsertService,
    private val manifestCatalogRepository: ManifestCatalogRepository,
    private val integrationDefinitionRepository: IntegrationDefinitionRepository,
    private val logger: KLogger
) {

    /** Triggers the full manifest load pipeline after application startup. */
    @EventListener(ApplicationReadyEvent::class)
    fun onApplicationReady(event: ApplicationReadyEvent) {
        loadAllManifests()
    }

    // ------ Core Orchestration ------

    /**
     * Loads all manifests from classpath: marks existing entries stale,
     * scans and upserts models -> templates -> integrations, syncs
     * integration definitions, and logs a summary.
     */
    fun loadAllManifests() {
        manifestCatalogRepository.markAllStale()

        var skipped = 0

        // ------ Load Models ------
        val scannedModels = scannerService.scanModels()
        val modelIndex = mutableMapOf<String, JsonNode>()
        var modelsLoaded = 0

        for (scanned in scannedModels) {
            try {
                val resolved = resolverService.resolveManifest(scanned, emptyMap())
                upsertService.upsertManifest(resolved)
                if (!resolved.stale) {
                    modelIndex[scanned.key] = scanned.json
                    modelsLoaded++
                }
            } catch (e: Exception) {
                logger.warn(e) { "Failed to load model manifest: ${scanned.key}" }
                skipped++
            }
        }

        // ------ Load Templates ------
        val scannedTemplates = scannerService.scanTemplates()
        var templatesLoaded = 0

        for (scanned in scannedTemplates) {
            try {
                val resolved = resolverService.resolveManifest(scanned, modelIndex)
                upsertService.upsertManifest(resolved)
                if (!resolved.stale) {
                    templatesLoaded++
                }
            } catch (e: Exception) {
                logger.warn(e) { "Failed to load template manifest: ${scanned.key}" }
                skipped++
            }
        }

        // ------ Load Integrations ------
        val scannedIntegrations = scannerService.scanIntegrations()
        var integrationsLoaded = 0

        for (scanned in scannedIntegrations) {
            try {
                val resolved = resolverService.resolveManifest(scanned, emptyMap())
                upsertService.upsertManifest(resolved)
                if (!resolved.stale) {
                    integrationsLoaded++
                }
            } catch (e: Exception) {
                logger.warn(e) { "Failed to load integration manifest: ${scanned.key}" }
                skipped++
            }
        }

        // ------ Sync Integration Definitions ------
        syncIntegrationDefinitionsStale()

        // ------ Summary Log ------
        val staleCount = manifestCatalogRepository.findByStaleTrue().size
        logger.info { "Manifest load complete: $modelsLoaded models, $templatesLoaded templates, $integrationsLoaded integrations loaded. $staleCount stale. $skipped skipped." }
    }

    // ------ Private Helpers ------

    @Transactional
    protected fun syncIntegrationDefinitionsStale() {
        val integrationCatalogEntries = manifestCatalogRepository.findByManifestType(ManifestType.INTEGRATION)
        for (entry in integrationCatalogEntries) {
            val definition = integrationDefinitionRepository.findBySlug(entry.key) ?: continue
            if (definition.stale != entry.stale) {
                definition.stale = entry.stale
                integrationDefinitionRepository.save(definition)
            }
        }
    }
}
