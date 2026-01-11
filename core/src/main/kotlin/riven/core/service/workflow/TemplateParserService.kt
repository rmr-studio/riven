package riven.core.service.workflow

import org.springframework.stereotype.Service

/**
 * Service for parsing template strings with {{ path.to.data }} syntax.
 *
 * ## Template Syntax
 *
 * Templates use double curly braces to mark data references:
 * - `{{ steps.fetch_leads.output }}` - Access output from previous step
 * - `{{ steps.fetch_leads.output.email }}` - Access nested property
 * - `{{ loop.loop_name.item.field }}` - Loop iteration data (Phase 5+)
 *
 * ## Supported Patterns
 *
 * **Valid templates:**
 * - `{{ steps.node_name.output }}` - Simple property access
 * - `{{ steps.node_name.output.field }}` - Nested property access
 * - `{{  steps.name  }}` - Whitespace around path is trimmed
 * - Path segments can contain: letters, numbers, underscores
 * - Arbitrary nesting depth is supported
 *
 * **Invalid templates:**
 * - `{{ }}` - Empty template (error)
 * - `{{ steps..output }}` - Empty path segment (error)
 * - `{{ steps-name }}` - Invalid characters (only alphanumeric and underscore allowed)
 * - `"Hello {{ user.name }}, you have {{ count }} messages"` - Multiple templates (not supported in v1)
 *
 * ## Error Handling
 *
 * Parsing errors throw IllegalArgumentException with clear messages:
 * - "Empty template" - Template has no path
 * - "Empty path segment" - Path contains consecutive dots
 * - "Invalid path segment" - Segment contains invalid characters
 * - "Unclosed template" - Missing closing braces
 * - "Multiple templates not supported" - More than one {{ }} in string
 *
 * ## Usage Example
 *
 * ```kotlin
 * val parser = TemplateParserService()
 *
 * // Parse template
 * val result = parser.parse("{{ steps.fetch_leads.output.email }}")
 * // result.isTemplate == true
 * // result.path == ["steps", "fetch_leads", "output", "email"]
 *
 * // Parse static string
 * val result2 = parser.parse("static value")
 * // result2.isTemplate == false
 * // result2.rawValue == "static value"
 * ```
 *
 * @see InputResolverService for template resolution against data registry
 */
@Service
class TemplateParserService {

    /**
     * Result of parsing a template string.
     *
     * @property isTemplate true if the string contains a template ({{ }})
     * @property path Path segments if template (e.g., ["steps", "fetch_leads", "output", "email"])
     * @property rawValue Original string if not a template
     */
    data class ParsedTemplate(
        val isTemplate: Boolean,
        val path: List<String>?,
        val rawValue: String?
    )

    /**
     * Regex pattern to match template syntax: {{ path.to.data }}
     *
     * Pattern breakdown:
     * - `\{\{` - Opening braces (escaped)
     * - `\s*` - Optional whitespace
     * - `([a-zA-Z0-9_.]+)` - Capture group: path (alphanumeric, underscore, dots)
     * - `\s*` - Optional whitespace
     * - `\}\}` - Closing braces (escaped)
     */
    private val templatePattern = Regex("""\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}""")

    /**
     * Parse a string that may contain a template.
     *
     * @param input String to parse (may be template or static value)
     * @return ParsedTemplate with isTemplate, path, or rawValue
     * @throws IllegalArgumentException if template syntax is invalid
     */
    fun parse(input: String): ParsedTemplate {
        val matches = templatePattern.findAll(input).toList()

        // No template found - return static value
        if (matches.isEmpty()) {
            return ParsedTemplate(
                isTemplate = false,
                path = null,
                rawValue = input
            )
        }

        // Multiple templates not supported in v1
        if (matches.size > 1) {
            throw IllegalArgumentException(
                "Multiple templates not supported in v1. Found ${matches.size} templates in: $input"
            )
        }

        // Check if template is embedded in larger string
        val match = matches.first()
        if (match.value != input.trim()) {
            throw IllegalArgumentException(
                "Embedded templates not supported. Template must be entire value: $input"
            )
        }

        // Extract path from capture group
        val pathString = match.groupValues[1].trim()

        // Validate path is not empty
        if (pathString.isEmpty()) {
            throw IllegalArgumentException("Empty template: $input")
        }

        // Split path on dots
        val pathSegments = pathString.split(".")

        // Validate path segments
        for (segment in pathSegments) {
            if (segment.isEmpty()) {
                throw IllegalArgumentException("Empty path segment in template: $input")
            }
            if (!segment.matches(Regex("^[a-zA-Z0-9_]+$"))) {
                throw IllegalArgumentException(
                    "Invalid path segment '$segment'. Only alphanumeric and underscore allowed: $input"
                )
            }
        }

        return ParsedTemplate(
            isTemplate = true,
            path = pathSegments,
            rawValue = null
        )
    }

    /**
     * Quick check if a string contains a template.
     *
     * This is faster than full parsing when you only need to know
     * if the string is a template without extracting the path.
     *
     * @param input String to check
     * @return true if string contains {{ }} template syntax
     */
    fun isTemplate(input: String): Boolean {
        return templatePattern.containsMatchIn(input)
    }
}
