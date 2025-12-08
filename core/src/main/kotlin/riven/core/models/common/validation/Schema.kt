package riven.core.models.common.validation

import riven.core.enums.core.DataFormat
import riven.core.enums.core.DataType
import riven.core.models.common.json.JsonObject

/**
 * The Schema defines the structure and data storage requirements for a given object.
 *
 * Example JSON Schema:
 * {
 *   "type": "object",
 *   "properties": {
 *     "contacts": {
 *       "type": "array",
 *       "items": {
 *         "type": "object",
 *         "properties": {
 *           "name": { "type": "string" },
 *           "email": { "type": "string", "format": "email" },
 *           "role": { "type": "string" },
 *           "phone": { "type": "string" }
 *         },
 *         "required": ["name", "email"]
 *       }
 *     }
 *   },
 *   "required": ["contacts"]
 * }
 */
data class Schema(
    val name: String,
    val description: String? = null,
    val type: DataType = DataType.OBJECT,
    val format: DataFormat? = null,
    val required: Boolean = false,
    val properties: Map<String, Schema>? = null,
    val items: Schema? = null
) {
    fun toJsonSchema(
        allowAdditionalProperties: Boolean
    ): JsonObject {
        /**
         * Convert a Schema into a JSON Schema (draft 2019-09) fragment represented as a map.
         *
         * Handles object, array, string, number, boolean, and null types and applies format-specific
         * constraints (for example, email, date, uri). For the PERCENTAGE format, emits a union that
         * accepts either a numeric value in the range 0..1 or a percentage string (e.g., "12.5%").
         *
         * @param schema The BlockSchema to convert.
         * @param allowAP When true, object schemas will permit additional properties (`additionalProperties: true`); when false, additional properties are disallowed.
         * @return A map suitable for serialization as a JSON Schema fragment corresponding to the provided schema.
         */
        fun toJs(schema: Schema, allowAP: Boolean): Map<String, Any> {
            return when (schema.type) {
                DataType.OBJECT -> {
                    val props = mutableMapOf<String, Any>()
                    val requiredKeys = mutableListOf<String>()
                    schema.properties?.forEach { (k, v) ->
                        props[k] = toJs(v, allowAP)
                        if (v.required) requiredKeys += k
                    }
                    buildMap {
                        put("type", "object")
                        put("properties", props)
                        put("additionalProperties", allowAP)
                        if (requiredKeys.isNotEmpty()) put("required", requiredKeys)
                    }
                }

                DataType.ARRAY -> {
                    val items = schema.items?.let { toJs(it, allowAP) } ?: emptyMap<String, Any>()
                    mapOf(
                        "type" to "array",
                        "items" to items
                    )
                }

                DataType.STRING -> {
                    // Standard formats/patterns
                    val base = mutableMapOf<String, Any>("type" to "string")
                    when (schema.format) {
                        DataFormat.EMAIL -> base["format"] = "email"
                        DataFormat.PHONE -> base["pattern"] = "^\\+?[1-9]\\d{1,14}\$"
                        DataFormat.CURRENCY -> base["pattern"] = "^[A-Z]{3}\$"
                        DataFormat.PERCENTAGE -> {
                            // Accept string variants like "0%", "20%", "200%", "12.5%"
                            base["pattern"] = "^(\\d+)(\\.\\d+)?%$"
                        }

                        DataFormat.DATE -> base["format"] = "date"
                        DataFormat.DATETIME -> base["format"] = "date-time"
                        DataFormat.URL -> base["format"] = "uri"
                        else -> {}
                    }
                    base
                }

                DataType.NUMBER -> {
                    // For PERCENTAGE, allow numeric 0..1 (interpreted as 0%..100%)
                    if (schema.format == DataFormat.PERCENTAGE) {
                        mapOf(
                            "oneOf" to listOf(
                                mapOf(
                                    "type" to "number",
                                    "minimum" to 0,
                                    "maximum" to 1
                                ),
                                mapOf(
                                    "type" to "string",
                                    "pattern" to "^(\\d+)(\\.\\d+)?%$"
                                )
                            )
                        )
                    } else {
                        mapOf("type" to "number")
                    }
                }

                DataType.BOOLEAN -> mapOf("type" to "boolean")
                DataType.NULL -> mapOf("type" to "null")
            }
        }

        // Special case: if schema.format == PERCENTAGE, always emit union regardless of declared type.
        return if (this.format == DataFormat.PERCENTAGE) {
            mapOf(
                "oneOf" to listOf(
                    mapOf("type" to "number", "minimum" to 0, "maximum" to 1),
                    mapOf("type" to "string", "pattern" to "^(\\d+)(\\.\\d+)?%$")
                )
            )
        } else {
            toJs(this, allowAdditionalProperties)
        }
    }
}

