package riven.core.lifecycle.models

import riven.core.enums.common.icon.IconColour
import riven.core.enums.common.icon.IconType
import riven.core.enums.entity.LifecycleDomain
import riven.core.enums.entity.semantics.SemanticAttributeClassification
import riven.core.enums.entity.semantics.SemanticGroup
import riven.core.enums.common.validation.SchemaType
import riven.core.enums.core.DataType
import riven.core.lifecycle.AttributeOptions
import riven.core.lifecycle.AttributeSemantics
import riven.core.lifecycle.CoreModelAttribute
import riven.core.lifecycle.CoreModelDefinition

/**
 * Churn Event — records when and why a customer relationship ended.
 */
object ChurnEventModel : CoreModelDefinition(
    key = "churn-event",
    displayNameSingular = "Churn Event",
    displayNamePlural = "Churn Events",
    iconType = IconType.USER_MINUS,
    iconColour = IconColour.RED,
    semanticGroup = SemanticGroup.FINANCIAL,
    lifecycleDomain = LifecycleDomain.RETENTION,
    identifierKey = "reason",
    semanticDefinition = "Records when and why a subscription ended. The terminal lifecycle event for SaaS, with MRR impact tracking.",
    semanticTags = listOf("churn", "retention", "lifecycle", "revenue"),
    attributes = mapOf(
        "reason" to CoreModelAttribute(
            key = "reason", schemaType = SchemaType.SELECT, label = "Reason", dataType = DataType.STRING,
            options = AttributeOptions(enum = listOf("price", "competitor", "no-longer-needed", "poor-experience", "missing-feature", "onboarding-failure", "product-issue", "unknown")),
            semantics = AttributeSemantics(
                definition = "The stated or inferred reason for churning.",
                classification = SemanticAttributeClassification.CATEGORICAL,
                tags = listOf("churn-reason", "analysis"),
            ),
        ),
        "date" to CoreModelAttribute(
            key = "date", schemaType = SchemaType.DATE, label = "Date", dataType = DataType.STRING,
            format = "date", required = true,
            semantics = AttributeSemantics(
                definition = "Date the churn event occurred.",
                classification = SemanticAttributeClassification.TEMPORAL,
                tags = listOf("timeline", "churn"),
            ),
        ),
        "type" to CoreModelAttribute(
            key = "type", schemaType = SchemaType.SELECT, label = "Type", dataType = DataType.STRING,
            options = AttributeOptions(enum = listOf("voluntary", "involuntary"), default = "voluntary"),
            semantics = AttributeSemantics(
                definition = "Whether the customer chose to cancel (voluntary) or was lost due to payment failure etc. (involuntary).",
                classification = SemanticAttributeClassification.CATEGORICAL,
                tags = listOf("churn-type", "classification"),
            ),
        ),
        "mrr-lost" to CoreModelAttribute(
            key = "mrr-lost", schemaType = SchemaType.CURRENCY, label = "MRR Lost", dataType = DataType.NUMBER,
            format = "currency",
            semantics = AttributeSemantics(
                definition = "Monthly recurring revenue lost from this churn event.",
                classification = SemanticAttributeClassification.QUANTITATIVE,
                tags = listOf("revenue-impact", "financial"),
            ),
        ),
        "notes" to CoreModelAttribute(
            key = "notes", schemaType = SchemaType.TEXT, label = "Notes", dataType = DataType.STRING,
            semantics = AttributeSemantics(
                definition = "Additional context about the churn event.",
                classification = SemanticAttributeClassification.FREETEXT,
                tags = listOf("context"),
            ),
        ),
    ),
)
