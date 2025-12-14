package riven.core.service.schema

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Nested
import riven.core.enums.common.ValidationScope
import riven.core.enums.core.DataFormat
import riven.core.enums.core.DataType
import riven.core.exceptions.SchemaValidationException
import riven.core.models.common.validation.Schema
import riven.core.service.util.TestObjectMapper

class SchemaServiceTest {

    private lateinit var schemaService: SchemaService

    @BeforeEach
    fun setup() {
        schemaService = SchemaService(TestObjectMapper.objectMapper)
    }

    /**
     * Helper function to wrap a single field schema in an OBJECT schema
     */
    private fun wrapField(fieldName: String, fieldSchema: Schema): Schema {
        return Schema(
            type = DataType.OBJECT,
            properties = mapOf(fieldName to fieldSchema)
        )
    }

    // ------------------------------------------------------------------
    // STRING VALIDATION TESTS
    // ------------------------------------------------------------------

    @Nested
    inner class StringValidationTests {

        @Test
        fun `validates string with minLength constraint - success`() {
            val schema = wrapField(
                "username", Schema(
                    type = DataType.STRING,
                    options = Schema.SchemaOptions(minLength = 3)
                )
            )
            val payload = mapOf("username" to "john")

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.isEmpty(), "Should pass minLength validation")
        }

        @Test
        fun `validates string with minLength constraint - failure`() {
            val schema = wrapField(
                "username", Schema(
                    type = DataType.STRING,
                    options = Schema.SchemaOptions(minLength = 5)
                )
            )
            val payload = mapOf("username" to "abc")

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.any { it.contains("too short") })
        }

        @Test
        fun `validates string with maxLength constraint - success`() {
            val schema = wrapField(
                "code", Schema(
                    type = DataType.STRING,
                    options = Schema.SchemaOptions(maxLength = 10)
                )
            )
            val payload = mapOf("code" to "ABC123")

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.isEmpty(), "Should pass maxLength validation")
        }

        @Test
        fun `validates string with maxLength constraint - failure`() {
            val schema = wrapField(
                "code", Schema(
                    type = DataType.STRING,
                    options = Schema.SchemaOptions(maxLength = 5)
                )
            )
            val payload = mapOf("code" to "ABCDEFGH")

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.any { it.contains("too long") })
        }

        @Test
        fun `validates string with regex constraint - success`() {
            val schema = wrapField(
                "code", Schema(
                    type = DataType.STRING,
                    options = Schema.SchemaOptions(regex = "^[A-Z]{3}\\d{3}$")
                )
            )
            val payload = mapOf("code" to "ABC123")

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.isEmpty(), "Should pass regex validation")
        }

        @Test
        fun `validates string with regex constraint - failure`() {
            val schema = wrapField(
                "code", Schema(
                    type = DataType.STRING,
                    options = Schema.SchemaOptions(regex = "^[A-Z]{3}\\d{3}$")
                )
            )
            val payload = mapOf("code" to "abc123")

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.any { it.contains("does not match required pattern") })
        }

        @Test
        fun `validates string with enum constraint - success`() {
            val schema = wrapField(
                "status", Schema(
                    type = DataType.STRING,
                    options = Schema.SchemaOptions(enum = listOf("active", "inactive", "pending"))
                )
            )
            val payload = mapOf("status" to "active")

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.isEmpty(), "Should pass enum validation")
        }

        @Test
        fun `validates string with enum constraint - failure`() {
            val schema = wrapField(
                "status", Schema(
                    type = DataType.STRING,
                    options = Schema.SchemaOptions(enum = listOf("active", "inactive", "pending"))
                )
            )
            val payload = mapOf("status" to "deleted")

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.any { it.contains("must be one of") })
        }

        @Test
        fun `validates email format - success`() {
            val schema = wrapField(
                "email", Schema(
                    type = DataType.STRING,
                    format = DataFormat.EMAIL
                )
            )
            val payload = mapOf("email" to "user@example.com")

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.isEmpty(), "Should pass email validation")
        }

        @Test
        fun `validates email format - failure`() {
            val schema = wrapField(
                "email", Schema(
                    type = DataType.STRING,
                    format = DataFormat.EMAIL
                )
            )
            val payload = mapOf("email" to "invalid-email")

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.any { it.contains("email") })
        }

        @Test
        fun `validates phone format - success`() {
            val schema = wrapField(
                "phone", Schema(
                    type = DataType.STRING,
                    format = DataFormat.PHONE
                )
            )
            val payload = mapOf("phone" to "+14155552671")

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.isEmpty(), "Should pass phone validation")
        }

        @Test
        fun `validates URL format - success`() {
            val schema = wrapField(
                "website", Schema(
                    type = DataType.STRING,
                    format = DataFormat.URL
                )
            )
            val payload = mapOf("website" to "https://example.com")

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.isEmpty(), "Should pass URL validation")
        }

        @Test
        fun `validates date format - success`() {
            val schema = wrapField(
                "birthdate", Schema(
                    type = DataType.STRING,
                    format = DataFormat.DATE
                )
            )
            val payload = mapOf("birthdate" to "2024-01-15")

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.isEmpty(), "Should pass date validation")
        }

        @Test
        fun `validates datetime format - success`() {
            val schema = wrapField(
                "createdAt", Schema(
                    type = DataType.STRING,
                    format = DataFormat.DATETIME
                )
            )
            val payload = mapOf("createdAt" to "2024-01-15T10:30:00Z")

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.isEmpty(), "Should pass datetime validation")
        }
    }

    // ------------------------------------------------------------------
    // NUMBER VALIDATION TESTS
    // ------------------------------------------------------------------

    @Nested
    inner class NumberValidationTests {

        @Test
        fun `validates number with minimum constraint - success`() {
            val schema = wrapField(
                "age", Schema(
                    type = DataType.NUMBER,
                    options = Schema.SchemaOptions(minimum = 18.0)
                )
            )
            val payload = mapOf("age" to 25)

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.isEmpty(), "Should pass minimum validation")
        }

        @Test
        fun `validates number with minimum constraint - failure`() {
            val schema = wrapField(
                "age", Schema(
                    type = DataType.NUMBER,
                    options = Schema.SchemaOptions(minimum = 18.0)
                )
            )
            val payload = mapOf("age" to 16)

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.any { it.contains("below minimum") })
        }

        @Test
        fun `validates number with maximum constraint - success`() {
            val schema = wrapField(
                "rating", Schema(
                    type = DataType.NUMBER,
                    options = Schema.SchemaOptions(maximum = 5.0)
                )
            )
            val payload = mapOf("rating" to 4.5)

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.isEmpty(), "Should pass maximum validation")
        }

        @Test
        fun `validates number with maximum constraint - failure`() {
            val schema = wrapField(
                "rating", Schema(
                    type = DataType.NUMBER,
                    options = Schema.SchemaOptions(maximum = 5.0)
                )
            )
            val payload = mapOf("rating" to 6)

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.any { it.contains("exceeds maximum") })
        }

        @Test
        fun `validates number with range constraint - success`() {
            val schema = wrapField(
                "score", Schema(
                    type = DataType.NUMBER,
                    options = Schema.SchemaOptions(minimum = 0.0, maximum = 100.0)
                )
            )
            val payload = mapOf("score" to 75)

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.isEmpty(), "Should pass range validation")
        }

        @Test
        fun `validates number with enum constraint - success`() {
            val schema = wrapField(
                "priority", Schema(
                    type = DataType.NUMBER,
                    options = Schema.SchemaOptions(enum = listOf(1, 2, 3, 4, 5))
                )
            )
            val payload = mapOf("priority" to 3)

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.isEmpty(), "Should pass enum validation")
        }

        @Test
        fun `validates number with enum constraint - failure`() {
            val schema = wrapField(
                "priority", Schema(
                    type = DataType.NUMBER,
                    options = Schema.SchemaOptions(enum = listOf(1, 2, 3, 4, 5))
                )
            )
            val payload = mapOf("priority" to 6)

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.any { it.contains("must be one of") })
        }

        @Test
        fun `validates percentage format with number - success`() {
            val schema = wrapField(
                "discount", Schema(
                    type = DataType.NUMBER,
                    format = DataFormat.PERCENTAGE
                )
            )
            val payload = mapOf("discount" to 0.25) // 25%

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.isEmpty(), "Should pass percentage validation")
        }

    }

    // ------------------------------------------------------------------
    // BOOLEAN VALIDATION TESTS
    // ------------------------------------------------------------------

    @Nested
    inner class BooleanValidationTests {

        @Test
        fun `validates boolean - success`() {
            val schema = wrapField(
                "active", Schema(
                    type = DataType.BOOLEAN
                )
            )
            val payload = mapOf("active" to true)

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.isEmpty(), "Should pass boolean validation")
        }

        @Test
        fun `validates boolean with enum constraint - success`() {
            val schema = wrapField(
                "confirmed", Schema(
                    type = DataType.BOOLEAN,
                    options = Schema.SchemaOptions(enum = listOf(true))
                )
            )
            val payload = mapOf("confirmed" to true)

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.isEmpty(), "Should pass boolean enum validation")
        }

        @Test
        fun `validates boolean with enum constraint - failure`() {
            val schema = wrapField(
                "confirmed", Schema(
                    type = DataType.BOOLEAN,
                    options = Schema.SchemaOptions(enum = listOf(true))
                )
            )
            val payload = mapOf("confirmed" to false)

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.any { it.contains("must be one of") })
        }
    }

    // ------------------------------------------------------------------
    // OBJECT VALIDATION TESTS
    // ------------------------------------------------------------------

    @Nested
    inner class ObjectValidationTests {

        @Test
        fun `validates object with required properties - success`() {
            val schema = Schema(
                type = DataType.OBJECT,
                properties = mapOf(
                    "name" to Schema(
                        type = DataType.STRING,
                        required = true
                    ),
                    "email" to Schema(
                        type = DataType.STRING,
                        format = DataFormat.EMAIL,
                        required = true
                    )
                )
            )
            val payload = mapOf(
                "name" to "John Doe",
                "email" to "john@example.com"
            )

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.isEmpty(), "Should pass object validation")
        }

        @Test
        fun `validates object with missing required property - failure`() {
            val schema = Schema(
                type = DataType.OBJECT,
                properties = mapOf(
                    "name" to Schema(
                        type = DataType.STRING,
                        required = true
                    ),
                    "email" to Schema(
                        type = DataType.STRING,
                        required = true
                    )
                )
            )
            val payload = mapOf("name" to "John Doe")

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.any { it.contains("required") || it.contains("email") })
        }

        @Test
        fun `validates nested objects - success`() {
            val schema = Schema(
                type = DataType.OBJECT,
                properties = mapOf(
                    "name" to Schema(
                        type = DataType.STRING,
                        required = true
                    ),
                    "address" to Schema(
                        type = DataType.OBJECT,
                        required = true,
                        properties = mapOf(
                            "street" to Schema(
                                type = DataType.STRING,
                                required = true
                            ),
                            "city" to Schema(
                                type = DataType.STRING,
                                required = true
                            )
                        )
                    )
                )
            )
            val payload = mapOf(
                "name" to "ACME Corp",
                "address" to mapOf(
                    "street" to "123 Main St",
                    "city" to "San Francisco"
                )
            )

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.isEmpty(), "Should pass nested object validation")
        }
    }

    // ------------------------------------------------------------------
    // ARRAY VALIDATION TESTS
    // ------------------------------------------------------------------

    @Nested
    inner class ArrayValidationTests {

        @Test
        fun `validates array of strings - success`() {
            val schema = wrapField(
                "tags", Schema(
                    type = DataType.ARRAY,
                    items = Schema(
                        type = DataType.STRING
                    )
                )
            )
            val payload = mapOf("tags" to listOf("kotlin", "java", "spring"))

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.isEmpty(), "Should pass array validation")
        }

        @Test
        fun `validates array with string enum - success`() {
            val schema = wrapField(
                "statuses", Schema(
                    type = DataType.ARRAY,
                    items = Schema(
                        type = DataType.STRING,
                        options = Schema.SchemaOptions(
                            enum = listOf("pending", "active", "completed")
                        )
                    )
                )
            )
            val payload = mapOf("statuses" to listOf("pending", "active"))

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.isEmpty(), "Should pass array with enum validation")
        }

        @Test
        fun `validates array with string enum - failure`() {
            val schema = wrapField(
                "statuses", Schema(
                    type = DataType.ARRAY,
                    items = Schema(
                        type = DataType.STRING,
                        options = Schema.SchemaOptions(
                            enum = listOf("pending", "active", "completed")
                        )
                    )
                )
            )
            val payload = mapOf("statuses" to listOf("pending", "invalid"))

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.any { it.contains("must be one of") })
        }

        @Test
        fun `validates array of objects - success`() {
            val schema = wrapField(
                "contacts", Schema(
                    type = DataType.ARRAY,
                    items = Schema(
                        type = DataType.OBJECT,
                        properties = mapOf(
                            "name" to Schema(
                                type = DataType.STRING,
                                required = true
                            ),
                            "email" to Schema(
                                type = DataType.STRING,
                                format = DataFormat.EMAIL,
                                required = true
                            )
                        )
                    )
                )
            )
            val payload = mapOf(
                "contacts" to listOf(
                    mapOf("name" to "John", "email" to "john@example.com"),
                    mapOf("name" to "Jane", "email" to "jane@example.com")
                )
            )

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.isEmpty(), "Should pass array of objects validation")
        }
    }

    // ------------------------------------------------------------------
    // COMPLEX SCENARIOS
    // ------------------------------------------------------------------

    @Nested
    inner class ComplexValidationTests {

        @Test
        fun `validates location object structure - success`() {
            val schema = wrapField(
                "location", Schema(
                    type = DataType.OBJECT,
                    properties = mapOf(
                        "latitude" to Schema(
                            type = DataType.NUMBER,
                            required = true,
                            options = Schema.SchemaOptions(minimum = -90.0, maximum = 90.0)
                        ),
                        "longitude" to Schema(
                            type = DataType.NUMBER,
                            required = true,
                            options = Schema.SchemaOptions(minimum = -180.0, maximum = 180.0)
                        ),
                        "address" to Schema(
                            type = DataType.STRING
                        )
                    )
                )
            )
            val payload = mapOf(
                "location" to mapOf(
                    "latitude" to 37.7749,
                    "longitude" to -122.4194,
                    "address" to "San Francisco, CA"
                )
            )

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.isEmpty(), "Should pass location validation")
        }

        @Test
        fun `validates multi-select as array of strings with enum - success`() {
            val schema = wrapField(
                "tags", Schema(
                    type = DataType.ARRAY,
                    items = Schema(
                        type = DataType.STRING,
                        options = Schema.SchemaOptions(
                            enum = listOf("bug", "feature", "enhancement", "documentation")
                        )
                    )
                )
            )
            val payload = mapOf("tags" to listOf("bug", "enhancement"))

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.isEmpty(), "Should pass multi-select validation")
        }

        @Test
        fun `validates rating with range constraint - success`() {
            val schema = wrapField(
                "rating", Schema(
                    type = DataType.NUMBER,
                    options = Schema.SchemaOptions(minimum = 0.0, maximum = 5.0)
                )
            )
            val payload = mapOf("rating" to 4.5)

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.isEmpty(), "Should pass rating validation")
        }

        @Test
        fun `validates relationship object - success`() {
            val schema = wrapField(
                "relationship", Schema(
                    type = DataType.OBJECT,
                    properties = mapOf(
                        "id" to Schema(
                            type = DataType.STRING,
                            required = true
                        ),
                        "entityTypeId" to Schema(
                            type = DataType.STRING,
                            required = true
                        )
                    )
                )
            )
            val payload = mapOf(
                "relationship" to mapOf(
                    "id" to "123e4567-e89b-12d3-a456-426614174000",
                    "entityTypeId" to "user"
                )
            )

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.isEmpty(), "Should pass relationship validation")
        }
    }

    // ------------------------------------------------------------------
    // VALIDATION SCOPE TESTS
    // ------------------------------------------------------------------

    @Nested
    inner class ValidationScopeTests {

        @Test
        fun `STRICT mode throws exception on validation failure`() {
            val schema = wrapField(
                "age", Schema(
                    type = DataType.NUMBER,
                    options = Schema.SchemaOptions(minimum = 18.0)
                )
            )
            val payload = mapOf("age" to 16)

            assertThrows(SchemaValidationException::class.java) {
                schemaService.validateOrThrow(schema, payload, ValidationScope.STRICT)
            }
        }

        @Test
        fun `NONE mode skips validation`() {
            val schema = wrapField(
                "age", Schema(
                    type = DataType.NUMBER,
                    options = Schema.SchemaOptions(minimum = 18.0)
                )
            )
            val payload = mapOf("age" to 16)

            val errors = schemaService.validate(schema, payload, ValidationScope.NONE)

            assertTrue(errors.isEmpty(), "NONE mode should skip validation")
        }

        @Test
        fun `SOFT mode allows additional properties`() {
            val schema = Schema(
                type = DataType.OBJECT,
                properties = mapOf(
                    "name" to Schema(
                        type = DataType.STRING,
                        required = true
                    )
                )
            )
            val payload = mapOf(
                "name" to "John",
                "extraField" to "should be allowed in SOFT mode"
            )

            val errors = schemaService.validate(schema, payload, ValidationScope.SOFT)

            assertTrue(errors.isEmpty(), "SOFT mode should allow additional properties")
        }
    }

    // ------------------------------------------------------------------
    // EDGE CASES
    // ------------------------------------------------------------------

    @Nested
    inner class EdgeCaseTests {

        @Test
        fun `validates empty string with minLength`() {
            val schema = wrapField(
                "name", Schema(
                    type = DataType.STRING,
                    options = Schema.SchemaOptions(minLength = 1)
                )
            )
            val payload = mapOf("name" to "")

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.any { it.contains("too short") })
        }

        @Test
        fun `validates exact boundary values for number range`() {
            val schema = wrapField(
                "percentage", Schema(
                    type = DataType.NUMBER,
                    options = Schema.SchemaOptions(minimum = 0.0, maximum = 100.0)
                )
            )

            // Test minimum boundary
            val payloadMin = mapOf("percentage" to 0.0)
            val errorsMin = schemaService.validate(schema, payloadMin)
            assertTrue(errorsMin.isEmpty(), "Should accept minimum boundary value")

            // Test maximum boundary
            val payloadMax = mapOf("percentage" to 100.0)
            val errorsMax = schemaService.validate(schema, payloadMax)
            assertTrue(errorsMax.isEmpty(), "Should accept maximum boundary value")
        }

        @Test
        fun `validates empty array`() {
            val schema = wrapField(
                "tags", Schema(
                    type = DataType.ARRAY,
                    items = Schema(
                        type = DataType.STRING
                    )
                )
            )
            val payload = mapOf("tags" to emptyList<String>())

            val errors = schemaService.validate(schema, payload)

            assertTrue(errors.isEmpty(), "Empty array should be valid")
        }
    }
}
