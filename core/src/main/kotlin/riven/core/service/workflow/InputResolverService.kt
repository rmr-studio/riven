package riven.core.service.workflow

import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.stereotype.Service
import riven.core.models.workflow.environment.WorkflowExecutionContext

private val log = KotlinLogging.logger {}

/**
 * Service for resolving template references against the workflow data registry.
 *
 * ## Resolution Algorithm
 *
 * 1. **Template Detection:** Check if value is a String containing {{ }}
 * 2. **Registry Lookup:** First segment must be "steps", second is node name
 * 3. **Property Traversal:** Navigate nested maps using remaining path segments
 * 4. **Graceful Degradation:** Return null for missing data, log warnings
 *
 * ## Template Types
 *
 * **Exact Templates:** Entire string is a template
 * - Input: `"{{ steps.fetch_leads.output.email }}"`
 * - Returns resolved value as-is (any type)
 *
 * **Embedded Templates:** Templates within a larger string
 * - Input: `"Welcome to {{ steps.user.name }}"`
 * - Resolves each template and replaces it in the string
 * - Returns final string with substitutions
 * - Supports multiple templates: `"Hello {{ steps.user.name }}, you have {{ steps.inbox.count }} messages"`
 *
 * ## Template Resolution Flow
 *
 * Given template: `{{ steps.fetch_leads.output.email }}`
 *
 * 1. Parse path: `["steps", "fetch_leads", "output", "email"]`
 * 2. Validate first segment is "steps"
 * 3. Lookup node "fetch_leads" in dataRegistry
 * 4. Extract "output" field from NodeExecutionData
 * 5. Traverse "email" property in output map
 * 6. Return resolved value or null if not found
 *
 * ## Error Handling Strategy
 *
 * **Errors (throw exception):**
 * - Invalid template syntax (parsing errors)
 * - First segment not "steps" (unsupported path type)
 *
 * **Warnings (log + return null):**
 * - Node not found in registry (may not have executed yet)
 * - Property not found in node output (missing field)
 * - Type error (accessing property on non-map value)
 *
 * Graceful degradation allows nodes to handle missing data appropriately
 * (e.g., use default values, skip optional operations).
 *
 * ## Recursive Resolution
 *
 * `resolveAll()` walks configuration maps recursively:
 * - Resolves templates in nested maps and lists
 * - Preserves structure (maps stay maps, lists stay lists)
 * - Static values returned unchanged
 *
 * ## Usage Example
 *
 * ```kotlin
 * val context = WorkflowExecutionContext(...)
 *
 * // Populate registry with node output
 * context.dataRegistry["fetch_leads"] = NodeExecutionData(
 *     output = mapOf(
 *         "output" to mapOf("email" to "user@example.com")
 *     )
 * )
 *
 * // Resolve template
 * val email = resolver.resolve("{{ steps.fetch_leads.output.email }}", context)
 * // email == "user@example.com"
 *
 * // Resolve config map
 * val config = mapOf(
 *     "to" to "{{ steps.fetch_leads.output.email }}",
 *     "subject" to "Welcome!"
 * )
 * val resolved = resolver.resolveAll(config, context)
 * // resolved == mapOf("to" to "user@example.com", "subject" to "Welcome!")
 * ```
 *
 * @property templateParserService Parser for template syntax
 */
@Service
class InputResolverService(
    private val templateParserService: TemplateParserService
) {

    /**
     * Resolve a single value that may contain a template.
     *
     * @param templateOrValue Value to resolve (String template or static value)
     * @param context Workflow execution context containing data registry
     * @return Resolved value from registry, or original value if not a template
     */
    fun resolve(
        templateOrValue: Any?,
        context: WorkflowExecutionContext
    ): Any? {
        // Only strings can be templates
        if (templateOrValue !is String) {
            return templateOrValue
        }

        // Parse template
        val parsed = templateParserService.parse(templateOrValue)

        // Not a template - return as-is
        if (!parsed.isTemplate) {
            return parsed.rawValue
        }

        // Handle embedded templates (e.g., "Welcome to {{steps.node.output}}")
        if (parsed.isEmbeddedTemplate) {
            return resolveEmbeddedTemplates(parsed, context)
        }

        // Single exact template - resolve from registry
        val path = parsed.path ?: return null

        return resolveTemplatePath(path, context)
    }

    /**
     * Resolve embedded templates within a larger string.
     *
     * Takes a string like "Welcome to {{steps.node.output}}, you have {{steps.other.count}} items"
     * and replaces each template with its resolved value.
     *
     * @param parsed Parsed template containing embedded templates
     * @param context Workflow execution context
     * @return String with all templates replaced by resolved values, or null if any resolution fails
     */
    private fun resolveEmbeddedTemplates(
        parsed: TemplateParserService.ParsedTemplate,
        context: WorkflowExecutionContext
    ): String? {
        var result = parsed.templateString ?: return null

        // Resolve each embedded template and replace in string
        for (embeddedTemplate in parsed.embeddedTemplates.orEmpty()) {
            val resolvedValue = resolveTemplatePath(embeddedTemplate.path, context)

            // If resolution fails, return null (graceful degradation)
            if (resolvedValue == null) {
                log.warn { "Failed to resolve embedded template ${embeddedTemplate.placeholder} in string: ${parsed.templateString}" }
                return null
            }

            // Convert resolved value to string and replace placeholder
            val stringValue = when (resolvedValue) {
                is String -> resolvedValue
                is Number -> resolvedValue.toString()
                is Boolean -> resolvedValue.toString()
                else -> {
                    log.warn { "Cannot convert ${resolvedValue::class.simpleName} to string for embedded template: ${embeddedTemplate.placeholder}" }
                    resolvedValue.toString()
                }
            }

            result = result.replace(embeddedTemplate.placeholder, stringValue)
        }

        return result
    }

    /**
     * Resolve a template path from the data registry.
     *
     * @param path Path segments (e.g., ["steps", "fetch_leads", "output", "email"])
     * @param context Workflow execution context
     * @return Resolved value from registry, or null if not found
     */
    private fun resolveTemplatePath(
        path: List<String>,
        context: WorkflowExecutionContext
    ): Any? {
        // Path must start with "steps" (only supported type in Phase 4.1)
        if (path.isEmpty() || path[0] != "steps") {
            throw IllegalArgumentException(
                "Template path must start with 'steps'. Got: ${path.firstOrNull()}"
            )
        }

        // Path must have at least 2 segments: steps.nodeName
        if (path.size < 2) {
            throw IllegalArgumentException(
                "Template path must include node name: steps.<nodeName>. Got: $path"
            )
        }

        // Extract node name (second segment)
        val nodeName = path[1]

        // Lookup node in registry
        val nodeData = context.dataRegistry[nodeName]
        if (nodeData == null) {
            log.warn { "Node '$nodeName' not found in registry. Available nodes: ${context.dataRegistry.keys}" }
            return null
        }

        // Check if node execution succeeded
        if (nodeData.status != "COMPLETED") {
            log.warn { "Node '$nodeName' did not complete successfully (status: ${nodeData.status}). Cannot resolve template." }
            return null
        }

        // Start traversal from node output
        var current: Any? = nodeData.output

        // Determine starting index for path traversal
        // If path[2] is "output", skip it since we're already at nodeData.output
        val startIndex = if (path.size > 2 && path[2] == "output") {
            3 // Skip "steps", nodeName, and "output"
        } else {
            2 // Skip "steps" and nodeName
        }

        // Traverse remaining path segments
        for (i in startIndex until path.size) {
            val segment = path[i]

            when (current) {
                null -> {
                    log.debug { "Cannot traverse segment '$segment' - current value is null. Path: $path" }
                    return null
                }
                is Map<*, *> -> {
                    current = current[segment]
                    if (current == null) {
                        log.debug { "Property '$segment' not found in node '$nodeName' output. Path: $path" }
                        return null
                    }
                }
                else -> {
                    log.warn { "Cannot access property '$segment' on non-map value (type: ${current!!::class.simpleName}). Path: $path" }
                    return null
                }
            }
        }

        return current
    }

    /**
     * Recursively resolve all templates in a configuration map.
     *
     * Walks the config structure and resolves any template strings found.
     * Preserves the structure of maps and lists.
     *
     * @param config Configuration map potentially containing templates
     * @param context Workflow execution context containing data registry
     * @return Resolved configuration with templates replaced by values
     */
    fun resolveAll(
        config: Map<String, Any?>,
        context: WorkflowExecutionContext
    ): Map<String, Any?> {
        return config.mapValues { (key, value) ->
            resolveValue(value, context)
        }
    }

    /**
     * Recursively resolve a value (handles nested maps and lists).
     *
     * @param value Value to resolve (may be primitive, map, list, or template)
     * @param context Workflow execution context
     * @return Resolved value
     */
    private fun resolveValue(
        value: Any?,
        context: WorkflowExecutionContext
    ): Any? {
        return when (value) {
            is String -> resolve(value, context)
            is Map<*, *> -> {
                // Recursively resolve nested map
                @Suppress("UNCHECKED_CAST")
                (value as Map<String, Any?>).mapValues { (_, v) ->
                    resolveValue(v, context)
                }
            }
            is List<*> -> {
                // Recursively resolve list items
                value.map { item ->
                    resolveValue(item, context)
                }
            }
            else -> value // Primitives, nulls, other types pass through
        }
    }
}
