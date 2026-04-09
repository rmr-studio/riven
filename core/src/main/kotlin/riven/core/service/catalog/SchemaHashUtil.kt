package riven.core.service.catalog

import com.fasterxml.jackson.databind.ObjectMapper
import java.security.MessageDigest

/**
 * Utility for computing deterministic content hashes of entity type schemas.
 *
 * Produces a SHA-256 hex digest from a canonical JSON serialization where all map
 * keys are sorted alphabetically at every nesting level and numeric types are
 * normalized to Double (preventing false mismatches from Jackson Int/Long variance
 * when deserializing JSONB).
 */
object SchemaHashUtil {

    private val objectMapper = ObjectMapper()

    /**
     * Compute a SHA-256 hex digest of the canonical JSON representation of the given schema map.
     */
    fun computeSchemaHash(schema: Map<String, Any>): String {
        val canonical = objectMapper.writeValueAsString(canonicalize(schema))
        return MessageDigest.getInstance("SHA-256")
            .digest(canonical.toByteArray())
            .joinToString("") { "%02x".format(it) }
    }

    /**
     * Recursively sort all map keys and normalize numeric types for deterministic hashing.
     * Handles nested Map, List, and Jackson numeric coercion (Int/Long/Double
     * variance from JSONB deserialization).
     */
    @Suppress("UNCHECKED_CAST")
    private fun canonicalize(value: Any?): Any? = when (value) {
        is Map<*, *> -> value.toSortedMap(compareBy { it.toString() })
            .mapValues { (_, v) -> canonicalize(v) }
        is List<*> -> value.map { canonicalize(it) }
        is Number -> value.toDouble()
        else -> value
    }
}
