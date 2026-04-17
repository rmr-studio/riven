package riven.core.controller.insights

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import riven.core.models.insights.EnsureDemoReadyResult
import riven.core.models.insights.InsightsChatSessionModel
import riven.core.models.insights.InsightsMessageModel
import riven.core.models.insights.SuggestedPrompt
import riven.core.models.request.insights.CreateSessionRequest
import riven.core.models.request.insights.SendMessageRequest
import riven.core.service.insights.InsightsDemoService
import riven.core.service.insights.InsightsService
import java.util.UUID

@RestController
@RequestMapping("/api/v1/insights")
@Tag(name = "insights")
class InsightsController(
    private val insightsService: InsightsService,
    private val insightsDemoService: InsightsDemoService,
) {

    @PostMapping("/workspace/{workspaceId}/sessions")
    @Operation(
        summary = "Create a new insights chat session",
        description = "Creates an empty chat session in the workspace. The demo entity pool is seeded lazily on the first message."
    )
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Session created"),
        ApiResponse(responseCode = "401", description = "Unauthorised"),
        ApiResponse(responseCode = "403", description = "Forbidden — workspace access denied"),
    )
    fun createSession(
        @PathVariable workspaceId: UUID,
        @Valid @RequestBody request: CreateSessionRequest,
    ): ResponseEntity<InsightsChatSessionModel> {
        val session = insightsService.createSession(workspaceId, request.title)
        return ResponseEntity.status(HttpStatus.CREATED).body(session)
    }

    @GetMapping("/workspace/{workspaceId}/sessions")
    @Operation(summary = "List insights chat sessions for a workspace")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Sessions returned"),
        ApiResponse(responseCode = "401", description = "Unauthorised"),
        ApiResponse(responseCode = "403", description = "Forbidden"),
    )
    fun listSessions(
        @PathVariable workspaceId: UUID,
        pageable: Pageable,
    ): ResponseEntity<Page<InsightsChatSessionModel>> =
        ResponseEntity.ok(insightsService.listSessions(workspaceId, pageable))

    @GetMapping("/workspace/{workspaceId}/sessions/{sessionId}/messages")
    @Operation(summary = "Get the full message history for a session")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Messages returned"),
        ApiResponse(responseCode = "401", description = "Unauthorised"),
        ApiResponse(responseCode = "403", description = "Forbidden"),
        ApiResponse(responseCode = "404", description = "Session not found"),
    )
    fun getMessages(
        @PathVariable workspaceId: UUID,
        @PathVariable sessionId: UUID,
    ): ResponseEntity<List<InsightsMessageModel>> =
        ResponseEntity.ok(insightsService.getSessionMessages(sessionId, workspaceId))

    @PostMapping("/workspace/{workspaceId}/sessions/{sessionId}/messages")
    @Operation(
        summary = "Send a user message and receive an assistant reply",
        description = "Persists the user message, lazily seeds the demo entity pool, calls the LLM, and returns the assistant's reply."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Assistant reply returned"),
        ApiResponse(responseCode = "400", description = "Invalid request"),
        ApiResponse(responseCode = "401", description = "Unauthorised"),
        ApiResponse(responseCode = "403", description = "Forbidden"),
        ApiResponse(responseCode = "404", description = "Session not found"),
        ApiResponse(responseCode = "502", description = "LLM upstream failure"),
    )
    fun sendMessage(
        @PathVariable workspaceId: UUID,
        @PathVariable sessionId: UUID,
        @Valid @RequestBody request: SendMessageRequest,
    ): ResponseEntity<InsightsMessageModel> =
        ResponseEntity.ok(insightsService.sendMessage(sessionId, workspaceId, request.message))

    @DeleteMapping("/workspace/{workspaceId}/sessions/{sessionId}")
    @Operation(
        summary = "Soft-delete an insights chat session",
        description = "Soft-deletes the session and cleans up its seeded demo entity pool."
    )
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "Session deleted"),
        ApiResponse(responseCode = "401", description = "Unauthorised"),
        ApiResponse(responseCode = "403", description = "Forbidden"),
        ApiResponse(responseCode = "404", description = "Session not found"),
    )
    fun deleteSession(
        @PathVariable workspaceId: UUID,
        @PathVariable sessionId: UUID,
    ): ResponseEntity<Void> {
        insightsService.deleteSession(sessionId, workspaceId)
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/workspace/{workspaceId}/demo/suggested-prompts")
    @Operation(
        summary = "Suggested demo prompts for the insights chat",
        description = "Returns a curated, data-signal-aware list of demo-ready prompts ranked by relevance. Prompts whose required data signals are not present in the workspace are filtered out."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Suggested prompts returned"),
        ApiResponse(responseCode = "401", description = "Unauthorised"),
        ApiResponse(responseCode = "403", description = "Forbidden — workspace access denied"),
    )
    fun getSuggestedPrompts(
        @PathVariable workspaceId: UUID,
    ): ResponseEntity<List<SuggestedPrompt>> =
        ResponseEntity.ok(insightsDemoService.suggestPrompts(workspaceId))

    @PostMapping("/workspace/{workspaceId}/demo/ensure-ready")
    @Operation(
        summary = "Ensure the workspace is demo-ready",
        description = "Idempotently seeds a curated set of business definitions (valuable customer, active customer, power user, at risk, retention) so the insights chat and suggested prompts return bespoke results out of the box. Existing definitions matching one of the curated terms (by normalized term) are left untouched."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Seed summary returned"),
        ApiResponse(responseCode = "401", description = "Unauthorised"),
        ApiResponse(responseCode = "403", description = "Forbidden — workspace access denied"),
    )
    fun ensureDemoReady(
        @PathVariable workspaceId: UUID,
    ): ResponseEntity<EnsureDemoReadyResult> =
        ResponseEntity.ok(insightsDemoService.ensureDemoReady(workspaceId))
}
