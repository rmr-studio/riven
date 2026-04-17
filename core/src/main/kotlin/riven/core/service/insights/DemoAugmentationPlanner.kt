package riven.core.service.insights

import io.github.oshai.kotlinlogging.KLogger
import org.springframework.stereotype.Component
import riven.core.configuration.properties.AnthropicConfigurationProperties
import riven.core.models.knowledge.WorkspaceBusinessDefinition
import riven.core.service.insights.llm.AnthropicChatClient
import riven.core.service.insights.llm.dto.ChatMessage
import tools.jackson.core.json.JsonReadFeature
import tools.jackson.databind.ObjectMapper
import tools.jackson.databind.json.JsonMapper
import java.util.UUID

/**
 * Proposes a small set of additional demo entities and events per user message so the main
 * answering LLM has credible, question-relevant data to cite.
 *
 * The planner is intentionally conservative: it never throws, logs warnings on failure, and
 * returns an empty [AugmentationPlan] when the upstream call fails or the response can't be parsed.
 */
@Component
open class DemoAugmentationPlanner(
    private val anthropicChatClient: AnthropicChatClient,
    private val properties: AnthropicConfigurationProperties,
    private val logger: KLogger,
) {

    companion object {
        internal const val MAX_CUSTOMERS = 8
        internal const val MAX_EVENTS = 30
    }

    private val lenientMapper: ObjectMapper = JsonMapper.builder()
        .enable(JsonReadFeature.ALLOW_UNESCAPED_CONTROL_CHARS)
        .build()

    /**
     * Call the planner LLM with the current pool context and user question. Always returns a
     * plan — empty on any failure.
     */
    open fun plan(
        sessionId: UUID,
        workspaceId: UUID,
        userMessage: String,
        poolSummary: String,
        activeDefinitions: List<WorkspaceBusinessDefinition>,
    ): AugmentationPlan {
        return runCatching {
            val system = buildSystemPrompt(poolSummary, activeDefinitions)
            val messages = listOf(ChatMessage(role = ChatMessage.ROLE_USER, content = userMessage))
            val completion = anthropicChatClient.sendMessage(
                system = system,
                messages = messages,
                modelOverride = properties.plannerModel.ifBlank { properties.model },
                maxTokensOverride = properties.plannerMaxTokens,
            )
            parsePlan(completion.text)
        }.getOrElse { e ->
            logger.warn { "Demo augmentation planner failed for session $sessionId: ${e.message}" }
            AugmentationPlan.empty()
        }
    }

    // ------ Private helpers ------

    private fun buildSystemPrompt(
        poolSummary: String,
        activeDefinitions: List<WorkspaceBusinessDefinition>,
    ): String {
        val defs = if (activeDefinitions.isEmpty()) {
            "- (No custom business definitions configured.)"
        } else {
            activeDefinitions.joinToString("\n") { d ->
                val truncated = if (d.definition.length > 400) d.definition.substring(0, 400) + "…" else d.definition
                "- ${d.term} (${d.category.name}): $truncated"
            }
        }

        return """
            You are a demo seeder. Given a user question and the current entity pool, propose a
            small set of NEW customers and events to add so the question can be answered with
            specific, credible references. Return STRICT JSON only.

            ## Workspace business definitions
            $defs

            ## Constraints
            - Add at most $MAX_CUSTOMERS customers and $MAX_EVENTS events in total. Favor smaller
              additions when the pool already has relevant data.
            - Customer `cluster` must be one of the existing cluster names in the pool, or null.
            - Events can reference a new customer by the exact `name` string you used, or an
              existing customer by their id or name from the pool.
            - Feature must be one of: timeline, notes, search, import, export, reports.
            - Action must be one of: viewed, used, completed, error.
            - If the pool is already rich enough, return
              {"customers":[],"events":[],"reasoning":"sufficient"}.

            ## Output schema
            {
              "customers": [
                {"name": string, "email": string|null, "plan": "Free"|"Pro"|"Enterprise"|null,
                 "ltv": number|null, "signupDaysAgo": number|null, "cluster": string|null,
                 "eventCount": number}
              ],
              "events": [
                {"customerRef": string, "feature": string, "action": string,
                 "count": number, "daysAgo": number}
              ],
              "reasoning": string
            }
            Return only this JSON object. No markdown, no other fields.

            ===== ENTITY POOL =====
            $poolSummary
            ===== END ENTITY POOL =====
        """.trimIndent()
    }

    private fun parsePlan(rawText: String): AugmentationPlan {
        val normalized = normalize(rawText)
        val node = lenientMapper.readTree(normalized)
        val customers = node.get("customers")?.let { arr ->
            if (!arr.isArray) emptyList() else arr.mapNotNull { parseCustomer(it) }
        } ?: emptyList()
        val events = node.get("events")?.let { arr ->
            if (!arr.isArray) emptyList() else arr.mapNotNull { parseEvent(it) }
        } ?: emptyList()
        val reasoning = node.get("reasoning")?.asString() ?: ""
        return AugmentationPlan(customers = customers, events = events, reasoning = reasoning)
    }

    private fun parseCustomer(node: tools.jackson.databind.JsonNode): PlannedCustomer? {
        val name = node.get("name")?.asString()?.takeIf { it.isNotBlank() } ?: return null
        return PlannedCustomer(
            name = name,
            email = node.get("email")?.takeIf { !it.isNull }?.asString(),
            plan = node.get("plan")?.takeIf { !it.isNull }?.asString(),
            ltv = node.get("ltv")?.takeIf { it.isNumber }?.asInt(),
            signupDaysAgo = node.get("signupDaysAgo")?.takeIf { it.isNumber }?.asInt(),
            cluster = node.get("cluster")?.takeIf { !it.isNull }?.asString(),
            eventCount = node.get("eventCount")?.takeIf { it.isNumber }?.asInt() ?: 0,
        )
    }

    private fun parseEvent(node: tools.jackson.databind.JsonNode): PlannedEvent? {
        val ref = node.get("customerRef")?.asString()?.takeIf { it.isNotBlank() } ?: return null
        val feature = node.get("feature")?.asString()?.takeIf { it.isNotBlank() } ?: return null
        return PlannedEvent(
            customerRef = ref,
            feature = feature,
            action = node.get("action")?.asString()?.takeIf { it.isNotBlank() } ?: "used",
            count = node.get("count")?.takeIf { it.isNumber }?.asInt() ?: 1,
            daysAgo = node.get("daysAgo")?.takeIf { it.isNumber }?.asInt() ?: 0,
        )
    }

    private fun normalize(rawText: String): String {
        var text = rawText.trim()
        if (text.startsWith("```")) {
            text = text.removePrefix("```json").removePrefix("```").trim()
            if (text.endsWith("```")) text = text.removeSuffix("```").trim()
        }
        val withOpen = if (text.startsWith("{")) text else "{$text"
        val lastBrace = withOpen.lastIndexOf('}')
        return if (lastBrace >= 0) withOpen.substring(0, lastBrace + 1) else withOpen
    }
}

/** A plan describing new customers and events to add to the demo pool this turn. */
data class AugmentationPlan(
    val customers: List<PlannedCustomer>,
    val events: List<PlannedEvent>,
    val reasoning: String,
) {
    companion object {
        fun empty(): AugmentationPlan = AugmentationPlan(emptyList(), emptyList(), "")
    }
}

data class PlannedCustomer(
    val name: String,
    val email: String? = null,
    val plan: String? = null,
    val ltv: Int? = null,
    val signupDaysAgo: Int? = null,
    val cluster: String? = null,
    val eventCount: Int = 0,
)

data class PlannedEvent(
    val customerRef: String,
    val feature: String,
    val action: String = "used",
    val count: Int = 1,
    val daysAgo: Int = 0,
)
