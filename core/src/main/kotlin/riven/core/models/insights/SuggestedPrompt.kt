package riven.core.models.insights

import riven.core.enums.insights.RequiredDataSignal
import riven.core.enums.insights.SuggestedPromptCategory

/**
 * A curated demo-ready prompt surfaced to the insights chat UI as a clickable suggestion.
 *
 * Suggestions are filtered against the workspace's available data signals and ranked by
 * a relevance score so the highest-impact prompts appear first.
 */
data class SuggestedPrompt(
    val id: String,
    val title: String,
    val prompt: String,
    val category: SuggestedPromptCategory,
    val description: String,
    val score: Int,
    val requiresData: List<RequiredDataSignal>,
)
