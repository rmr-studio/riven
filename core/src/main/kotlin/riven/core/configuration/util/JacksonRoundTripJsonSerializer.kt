package riven.core.configuration.util

import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.databind.MapperFeature
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.SerializationFeature
import com.fasterxml.jackson.databind.json.JsonMapper
import com.fasterxml.jackson.databind.util.StdDateFormat
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.KotlinModule
import io.hypersistence.utils.hibernate.type.util.JsonSerializer
import java.util.TimeZone

/**
 * Jackson-based deep-copy serializer for hypersistence-utils JSONB columns.
 *
 * Replaces the default [io.hypersistence.utils.hibernate.type.util.ObjectMapperJsonSerializer], which
 * relies on [ObjectMapper.convertValue] + Java serialization cloning and therefore requires every
 * JSONB-mapped Kotlin data class (and every nested value) to implement [java.io.Serializable].
 *
 * Hibernate 7 / hypersistence-utils-hibernate-71 tightened the deep-copy contract: any non-[com.fasterxml.jackson.databind.JsonNode]
 * payload that isn't `Serializable` throws `NonSerializableObjectException` during
 * `AbstractSaveEventListener#cloneAndSubstituteValues`. Our domain models (e.g. [riven.core.models.entity.configuration.ColumnConfiguration])
 * are Kotlin `data class`es that do not implement `Serializable`, so we swap in a JSON-round-trip clone instead.
 *
 * Registered via `hypersistence-utils.properties` (`hibernate.types.json.serializer`).
 *
 * Must have a public no-arg constructor — hypersistence instantiates via reflection.
 */
class JacksonRoundTripJsonSerializer : JsonSerializer {

    override fun <T> clone(value: T?): T? {
        if (value == null) return null
        @Suppress("UNCHECKED_CAST")
        val type = value::class.java as Class<T>
        val json = MAPPER.writeValueAsBytes(value)
        return MAPPER.readValue(json, type)
    }

    companion object {
        // Self-contained mapper so the serializer works before the Spring @Bean ObjectMapper is built
        // (hypersistence instantiates this class during Hibernate bootstrap). Mirrors ObjectMapperConfig.
        private val MAPPER: ObjectMapper = JsonMapper.builder()
            .addModule(KotlinModule.Builder().build())
            .addModule(JavaTimeModule())
            .defaultDateFormat(StdDateFormat().withTimeZone(TimeZone.getTimeZone("UTC")))
            .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
            .enable(MapperFeature.ACCEPT_CASE_INSENSITIVE_ENUMS)
            .build()
    }
}
