package riven.core.models.workflow.node

import org.springframework.web.reactive.function.client.WebClient
import riven.core.service.entity.EntityService
import riven.core.service.workflow.EntityContextService
import riven.core.service.workflow.ExpressionEvaluatorService
import riven.core.service.workflow.ExpressionParserService

/**
 * During runtime, Nodes would need spring injected services to fufill execution operations (ie. Http Requests, External Spring managed services, etc).
 * This class would provide those services to the nodes during execution.
 */
data class NodeExecutionServices(
    val entityService: EntityService,
    val webClient: WebClient,
    val expressionEvaluatorService: ExpressionEvaluatorService,
    val expressionParserService: ExpressionParserService,
    val entityContextService: EntityContextService
)