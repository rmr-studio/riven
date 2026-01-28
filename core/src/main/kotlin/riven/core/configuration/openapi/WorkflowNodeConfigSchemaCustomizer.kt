package riven.core.configuration.openapi

import io.swagger.v3.core.converter.AnnotatedType
import io.swagger.v3.core.converter.ModelConverters
import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.media.ComposedSchema
import io.swagger.v3.oas.models.media.Discriminator
import io.swagger.v3.oas.models.media.Schema
import org.springdoc.core.customizers.OpenApiCustomizer
import org.springframework.stereotype.Component
import riven.core.models.workflow.node.config.WorkflowFunctionConfig
import riven.core.models.workflow.node.config.actions.WorkflowCreateEntityActionConfig
import riven.core.models.workflow.node.config.actions.WorkflowDeleteEntityActionConfig
import riven.core.models.workflow.node.config.actions.WorkflowHttpRequestActionConfig
import riven.core.models.workflow.node.config.actions.WorkflowQueryEntityActionConfig
import riven.core.models.workflow.node.config.actions.WorkflowUpdateEntityActionConfig
import riven.core.models.workflow.node.config.controls.WorkflowConditionControlConfig
import riven.core.models.workflow.node.config.trigger.WorkflowEntityEventTriggerConfig
import riven.core.models.workflow.node.config.trigger.WorkflowFunctionTriggerConfig
import riven.core.models.workflow.node.config.trigger.WorkflowScheduleTriggerConfig
import riven.core.models.workflow.node.config.trigger.WorkflowWebhookTriggerConfig
import kotlin.reflect.KClass

/**
 * OpenAPI customizer that registers all [riven.core.models.workflow.node.config.WorkflowNodeConfig]
 * implementations for OpenAPI schema generation.
 *
 * ## Why This Exists
 *
 * SpringDoc/OpenAPI doesn't automatically discover polymorphic subtypes when using
 * a custom Jackson deserializer. This customizer bridges that gap by explicitly
 * registering all concrete implementations.
 *
 * ## Adding New Node Types
 *
 * When you create a new workflow node config implementation:
 *
 * 1. Add `@Schema(name = "YourNewConfig", description = "...")` to the class
 * 2. Add the class to the appropriate list below (TRIGGER_CONFIGS, ACTION_CONFIGS, etc.)
 * 3. Update [riven.core.deserializer.WorkflowNodeConfigDeserializer] to handle deserialization
 *
 * This keeps OpenAPI registration in sync with the deserializer.
 *
 * ## Example
 *
 * ```kotlin
 * // 1. Create new config with @Schema annotation
 * @Schema(name = "WorkflowMyNewActionConfig", description = "...")
 * @JsonTypeName("workflow_my_new_action")
 * data class WorkflowMyNewActionConfig(...) : WorkflowActionConfig
 *
 * // 2. Add to ACTION_CONFIGS list below
 * private val ACTION_CONFIGS: List<KClass<*>> = listOf(
 *     ...
 *     WorkflowMyNewActionConfig::class,
 * )
 *
 * // 3. Update WorkflowNodeConfigDeserializer.deserializeActionConfig()
 * ```
 */
@Component
class WorkflowNodeConfigSchemaCustomizer : OpenApiCustomizer {

    companion object {
        /**
         * Trigger node config implementations.
         * Add new trigger configs here.
         */
        private val TRIGGER_CONFIGS: List<KClass<*>> = listOf(
            WorkflowScheduleTriggerConfig::class,
            WorkflowEntityEventTriggerConfig::class,
            WorkflowWebhookTriggerConfig::class,
            WorkflowFunctionTriggerConfig::class,
        )

        /**
         * Action node config implementations.
         * Add new action configs here.
         */
        private val ACTION_CONFIGS: List<KClass<*>> = listOf(
            WorkflowCreateEntityActionConfig::class,
            WorkflowUpdateEntityActionConfig::class,
            WorkflowDeleteEntityActionConfig::class,
            WorkflowQueryEntityActionConfig::class,
            WorkflowHttpRequestActionConfig::class,
        )

        /**
         * Control flow node config implementations.
         * Add new control configs here.
         */
        private val CONTROL_CONFIGS: List<KClass<*>> = listOf(
            WorkflowConditionControlConfig::class,
            // Future: WorkflowSwitchControlConfig, WorkflowLoopControlConfig, etc.
        )

        /**
         * Utility node config implementations.
         * Add new utility configs here.
         */
        private val UTILITY_CONFIGS: List<KClass<*>> = listOf(
            // Future: WorkflowTransformUtilityConfig, WorkflowLogUtilityConfig, etc.
        )

        /**
         * Parse node config implementations.
         * Add new parse configs here.
         */
        private val PARSE_CONFIGS: List<KClass<*>> = listOf(
            // Future: WorkflowJsonParseConfig, WorkflowAiParseConfig, etc.
        )

        /**
         * Standalone configs (no subtype).
         */
        private val STANDALONE_CONFIGS: List<KClass<*>> = listOf(
            WorkflowFunctionConfig::class,
        )

        /**
         * All workflow node config implementations.
         */
        val ALL_CONFIGS: List<KClass<*>> = TRIGGER_CONFIGS +
                ACTION_CONFIGS +
                CONTROL_CONFIGS +
                UTILITY_CONFIGS +
                PARSE_CONFIGS +
                STANDALONE_CONFIGS
    }

    override fun customise(openApi: OpenAPI) {
        val components = openApi.components ?: return

        if (ALL_CONFIGS.isEmpty()) {
            return
        }

        // Get the model converter to generate schemas for each config class
        val modelConverters = ModelConverters.getInstance()

        // Generate and register schemas for each config class
        val oneOfSchemas = mutableListOf<Schema<Any>>()

        for (configClass in ALL_CONFIGS) {
            val schemaName = configClass.simpleName ?: continue

            // Generate schema for this class using ModelConverters
            val resolvedSchemas = modelConverters.readAll(AnnotatedType(configClass.java))

            // Add all resolved schemas to components (includes the main schema and any nested types)
            resolvedSchemas.forEach { (name, schema) ->
                components.addSchemas(name, schema)
            }

            // Add reference to the oneOf list
            oneOfSchemas.add(Schema<Any>().`$ref`("#/components/schemas/$schemaName"))
        }

        // Create composed schema with oneOf
        val composedSchema = ComposedSchema().apply {
            oneOf = oneOfSchemas
            discriminator = Discriminator().apply {
                propertyName = "type"
            }
            description = "Polymorphic workflow node configuration. Discriminated by 'type' and 'subType' fields."
        }

        // Register the parent schema
        components.addSchemas("WorkflowNodeConfig", composedSchema)
    }
}
