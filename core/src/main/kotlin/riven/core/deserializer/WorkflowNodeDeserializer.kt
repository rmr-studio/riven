package riven.core.deserializer

import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.databind.DeserializationContext
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.JsonNode
import riven.core.enums.workflow.*
import riven.core.models.workflow.*
import riven.core.models.workflow.trigger.*
import riven.core.util.getEnumFromField

/**
 * Jackson deserializer for [WorkflowNode].
 *
 * Handles two-level discriminator:
 * 1. First level: `type` field (WorkflowNodeType) - determines node category
 * 2. Second level: `subType` field (WorkflowTriggerType, WorkflowActionType, etc.) - determines concrete class
 *
 * Example JSON:
 * ```json
 * {
 *   "id": "123e4567-e89b-12d3-a456-426614174000",
 *   "version": 1,
 *   "type": "TRIGGER",
 *   "subType": "SCHEDULE",
 *   "cronExpression": "0 0 * * *",
 *   "timeZone": "UTC"
 * }
 * ```
 *
 * Based on the proven Block system pattern (see [MetadataDeserializer]).
 */
class WorkflowNodeDeserializer : JsonDeserializer<WorkflowNode>() {
    override fun deserialize(p: JsonParser, ctxt: DeserializationContext): WorkflowNode {
        val node = p.codec.readTree<JsonNode>(p)

        // Level 1: Extract main category
        val nodeType = ctxt.getEnumFromField<WorkflowNodeType>(
            node,
            "type",
            WorkflowNode::class.java
        )

        // Level 2: Route to category-specific handler
        return when (nodeType) {
            WorkflowNodeType.TRIGGER -> deserializeTriggerNode(p, ctxt, node)
            WorkflowNodeType.ACTION -> deserializeActionNode(p, ctxt, node)
            WorkflowNodeType.CONTROL_FLOW -> deserializeControlNode(p, ctxt, node)
            WorkflowNodeType.HUMAN_INTERACTION -> deserializeHumanNode(p, ctxt, node)
            WorkflowNodeType.UTILITY -> deserializeUtilityNode(p, ctxt, node)
            WorkflowNodeType.FUNCTION -> deserializeFunctionNode(p, ctxt, node)
        }
    }

    /**
     * Deserializes TRIGGER category nodes.
     * Routes to concrete trigger types: SCHEDULE, ENTITY_EVENT, WEBHOOK, FUNCTION.
     */
    private fun deserializeTriggerNode(
        p: JsonParser,
        ctxt: DeserializationContext,
        node: JsonNode
    ): WorkflowTriggerNode {
        val subType = ctxt.getEnumFromField<WorkflowTriggerType>(
            node,
            "subType",
            WorkflowTriggerNode::class.java
        )

        return when (subType) {
            WorkflowTriggerType.ENTITY_EVENT -> p.codec.treeToValue(node, WorkflowEntityEventTriggerNode::class.java)
            WorkflowTriggerType.SCHEDULE -> p.codec.treeToValue(node, WorkflowScheduleTriggerNode::class.java)
            WorkflowTriggerType.WEBHOOK -> p.codec.treeToValue(node, WorkflowWebhookTriggerNode::class.java)
            WorkflowTriggerType.FUNCTION -> p.codec.treeToValue(node, WorkflowFunctionTriggerNode::class.java)
        }
    }

    /**
     * Deserializes ACTION category nodes.
     * TODO: Implement concrete action node classes and update routing.
     */
    private fun deserializeActionNode(
        p: JsonParser,
        ctxt: DeserializationContext,
        node: JsonNode
    ): WorkflowActionNode {
        val subType = ctxt.getEnumFromField<WorkflowActionType>(
            node,
            "subType",
            WorkflowActionNode::class.java
        )

        // TODO: Implement concrete action node classes
        // For now, throw unsupported operation exception
        return ctxt.reportInputMismatch(
            WorkflowActionNode::class.java,
            "Deserialization for ACTION subType '$subType' is not yet implemented. " +
                    "Concrete action node classes need to be created."
        )
    }

    /**
     * Deserializes CONTROL_FLOW category nodes.
     * TODO: Implement concrete control flow node classes and update routing.
     */
    private fun deserializeControlNode(
        p: JsonParser,
        ctxt: DeserializationContext,
        node: JsonNode
    ): WorkflowControlNode {
        val subType = ctxt.getEnumFromField<WorkflowControlType>(
            node,
            "subType",
            WorkflowControlNode::class.java
        )

        // TODO: Implement concrete control flow node classes
        return ctxt.reportInputMismatch(
            WorkflowControlNode::class.java,
            "Deserialization for CONTROL_FLOW subType '$subType' is not yet implemented. " +
                    "Concrete control flow node classes need to be created."
        )
    }

    /**
     * Deserializes HUMAN_INTERACTION category nodes.
     * TODO: Implement concrete human interaction node classes and update routing.
     */
    private fun deserializeHumanNode(
        p: JsonParser,
        ctxt: DeserializationContext,
        node: JsonNode
    ): WorkflowHumanInteractionNode {
        val subType = ctxt.getEnumFromField<WorkflowHumanInteractionType>(
            node,
            "subType",
            WorkflowHumanInteractionNode::class.java
        )

        // TODO: Implement concrete human interaction node classes
        return ctxt.reportInputMismatch(
            WorkflowHumanInteractionNode::class.java,
            "Deserialization for HUMAN_INTERACTION subType '$subType' is not yet implemented. " +
                    "Concrete human interaction node classes need to be created."
        )
    }

    /**
     * Deserializes UTILITY category nodes.
     * TODO: Implement concrete utility node classes and update routing.
     */
    private fun deserializeUtilityNode(
        p: JsonParser,
        ctxt: DeserializationContext,
        node: JsonNode
    ): WorkflowUtilityNode {
        val subType = ctxt.getEnumFromField<WorkflowUtilityActionType>(
            node,
            "subType",
            WorkflowUtilityNode::class.java
        )

        // TODO: Implement concrete utility node classes
        return ctxt.reportInputMismatch(
            WorkflowUtilityNode::class.java,
            "Deserialization for UTILITY subType '$subType' is not yet implemented. " +
                    "Concrete utility node classes need to be created."
        )
    }

    /**
     * Deserializes FUNCTION category nodes.
     * FUNCTION has no subtypes - single concrete implementation.
     */
    private fun deserializeFunctionNode(
        p: JsonParser,
        ctxt: DeserializationContext,
        node: JsonNode
    ): WorkflowFunctionNode {
        // FUNCTION category has no subtypes
        // Return the single concrete implementation
        return p.codec.treeToValue(node, WorkflowFunctionNode::class.java)
    }
}
