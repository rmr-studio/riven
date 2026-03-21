package riven.core.lifecycle

import riven.core.enums.catalog.ManifestType
import riven.core.models.catalog.NormalizedRelationship
import riven.core.models.catalog.NormalizedTargetRule
import riven.core.models.catalog.ResolvedManifest
import riven.core.models.catalog.ResolvedRelationshipSemantics

/**
 * Central registry of all core lifecycle model definitions.
 *
 * Responsibilities:
 * - Collects all model sets (B2C SaaS, DTC E-commerce)
 * - Validates cross-references at boot time (fail fast)
 * - Converts model sets to ResolvedManifest for catalog population
 * - Provides lookup by key for downstream services
 */
object CoreModelRegistry {

    private val allModelSets: List<CoreModelSet> = listOf(
        B2C_SAAS_MODELS,
        DTC_ECOMMERCE_MODELS,
    )

    /** All unique core model definitions across all model sets. */
    val allModels: List<CoreModelDefinition> by lazy {
        allModelSets.flatMap { it.models }.distinctBy { it.key }
    }

    /** Find a model set by its manifest key. */
    fun findModelSet(manifestKey: String): CoreModelSet? {
        return allModelSets.find { it.manifestKey == manifestKey }
    }

    /** Find a model definition by entity type key. */
    fun findModel(key: String): CoreModelDefinition? {
        return allModels.find { it.key == key }
    }

    // ------ Validation ------

    /**
     * Validates all core model definitions for consistency.
     * Called at boot time — throws IllegalStateException on structural errors.
     *
     * Checks:
     * - No duplicate model keys across all model sets
     * - All relationship targets reference existing model keys
     * - All additional relationship sources reference existing model keys within the set
     */
    fun validate() {
        validateNoDuplicateKeys()
        for (modelSet in allModelSets) {
            validateModelSetRelationships(modelSet)
        }
    }

    private fun validateNoDuplicateKeys() {
        // Shared models (same object) appear in multiple sets — that's allowed.
        // Only flag different model objects that collide on the same key.
        val modelsByKey = allModelSets.flatMap { it.models }.groupBy { it.key }
        val conflicts = modelsByKey.filter { (_, models) ->
            models.map { System.identityHashCode(it) }.distinct().size > 1
        }.keys
        check(conflicts.isEmpty()) {
            "Conflicting core model keys found (different objects, same key): $conflicts"
        }

        val setKeys = allModelSets.map { it.manifestKey }
        val dupSets = setKeys.groupBy { it }.filter { it.value.size > 1 }.keys
        check(dupSets.isEmpty()) {
            "Duplicate core model set keys found: $dupSets"
        }
    }

    internal fun validateModelSetRelationships(modelSet: CoreModelSet) {
        val modelKeys = modelSet.models.map { it.key }.toSet()

        // Validate relationships declared on models
        for (model in modelSet.models) {
            for (rel in model.relationships) {
                check(rel.targetModelKey in modelKeys) {
                    "Model '${model.key}' relationship '${rel.key}' targets '${rel.targetModelKey}' " +
                        "which is not in model set '${modelSet.manifestKey}'"
                }
            }
        }

        // Validate additional relationships declared on the model set
        for (rel in modelSet.additionalRelationships) {
            check(rel.sourceModelKey in modelKeys) {
                "Model set '${modelSet.manifestKey}' additional relationship '${rel.key}' has source " +
                    "'${rel.sourceModelKey}' which is not in this model set"
            }
            check(rel.targetModelKey in modelKeys) {
                "Model set '${modelSet.manifestKey}' additional relationship '${rel.key}' targets " +
                    "'${rel.targetModelKey}' which is not in this model set"
            }
        }
    }

    // ------ Conversion to ResolvedManifest ------

    /**
     * Converts a CoreModelSet to a ResolvedManifest for consumption by ManifestUpsertService.
     * This is the bridge between Kotlin core model definitions and the existing catalog pipeline.
     */
    fun toResolvedManifest(modelSet: CoreModelSet): ResolvedManifest {
        val entityTypes = modelSet.models.map { it.toResolvedEntityType() }
        val relationships = collectRelationships(modelSet)

        return ResolvedManifest(
            key = modelSet.manifestKey,
            name = modelSet.name,
            description = modelSet.description,
            type = ManifestType.TEMPLATE,
            manifestVersion = "1.0",
            entityTypes = entityTypes,
            relationships = relationships,
            fieldMappings = emptyList(),
            stale = false,
        )
    }

    /** All ResolvedManifests for boot-time catalog population. */
    fun allResolvedManifests(): List<ResolvedManifest> {
        return allModelSets.map { toResolvedManifest(it) }
    }

    private fun collectRelationships(modelSet: CoreModelSet): List<NormalizedRelationship> {
        // Relationships from individual models
        val modelRelationships = modelSet.models.flatMap { it.toNormalizedRelationships() }

        // Additional relationships from the model set (vertical-specific)
        val additionalRelationships = modelSet.additionalRelationships.map { rel ->
            NormalizedRelationship(
                key = rel.key,
                sourceEntityTypeKey = rel.sourceModelKey,
                name = rel.name,
                cardinalityDefault = rel.cardinality,
                `protected` = true,
                targetRules = listOf(
                    NormalizedTargetRule(
                        targetEntityTypeKey = rel.targetModelKey,
                        cardinalityOverride = rel.cardinality,
                        inverseName = rel.inverseName,
                    )
                ),
                semantics = rel.semantics?.let { s ->
                    ResolvedRelationshipSemantics(definition = s.definition, tags = s.tags)
                },
            )
        }

        return modelRelationships + additionalRelationships
    }
}
