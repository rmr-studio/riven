# Phase 7: Error Handling & Retry Logic - Research

**Researched:** 2026-01-22
**Domain:** Temporal retry policies, error classification, execution record error surfacing
**Confidence:** HIGH

## Summary

Researched the Temporal Java SDK for retry policy configuration and error handling patterns, along with strategies for surfacing errors to execution records. The implementation involves three complementary concerns:

1. **Retry Policy Configuration** - Temporal's `RetryOptions` with exponential backoff, jitter, and non-retryable error classification
2. **Error Classification** - Custom exception hierarchy that marks certain errors as non-retryable (4xx, validation errors, deterministic failures)
3. **Error Surfacing** - Structured error model persisted to `workflow_executions` and `workflow_node_executions` tables for debugging and API responses

Key finding: **Temporal handles retry mechanics automatically once configured.** The application's responsibility is to (a) configure appropriate retry policies at the activity level, (b) throw `ApplicationFailure.newNonRetryableFailure()` for errors that should not be retried, and (c) persist error details to the database for surfacing via API.

**Primary recommendation:** Configure retry policies on the `ActivityOptions` in `WorkflowOrchestrationServiceImpl`. Create a custom exception hierarchy that maps to retryable vs. non-retryable errors. Enhance `WorkflowCoordinationService` to catch errors, classify them, and persist structured error details to execution node records. Surface errors via existing API endpoints with structured error response model.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| io.temporal:temporal-sdk | 1.24.1 | RetryOptions, ApplicationFailure | Already in project, authoritative retry handling |
| io.temporal:temporal-kotlin | 1.32.1 | Kotlin extensions for Temporal | Already in project, Kotlin-idiomatic API |
| Spring WebClient | (Spring managed) | HTTP error code detection | Already in project, `onStatus()` for 4xx/5xx handling |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Jackson | (Spring managed) | Error serialization to JSON | Structured error details in JSONB columns |
| kotlin-logging | 7.0.0 | Error logging with context | Already in project, structured log output |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Temporal RetryOptions | Custom retry loop | Loss of durability, state management; Temporal handles this automatically |
| ApplicationFailure | Standard exceptions | Loss of retry control; Temporal won't recognize non-retryable intent |
| Database error storage | Temporal workflow queries | Temporal history is transient; database provides permanent audit trail |

**Installation:**
```kotlin
// Already present - no new dependencies needed
dependencies {
    implementation("io.temporal:temporal-kotlin:1.32.1")
    implementation("io.temporal:temporal-sdk:1.24.1")
}
```

## Architecture Patterns

### Recommended Project Structure
```
src/main/kotlin/riven/core/
├── configuration/
│   └── workflow/
│       └── WorkflowRetryConfigurationProperties.kt  # NEW - externalized retry config
├── exceptions/
│   └── workflow/
│       ├── WorkflowExecutionException.kt            # NEW - execution error hierarchy
│       ├── RetryableWorkflowException.kt            # NEW - retryable marker
│       └── NonRetryableWorkflowException.kt         # NEW - non-retryable marker
├── models/
│   └── workflow/
│       └── engine/
│           └── error/
│               ├── WorkflowExecutionError.kt        # NEW - structured error model
│               ├── NodeExecutionError.kt            # NEW - per-node error details
│               └── RetryAttempt.kt                  # NEW - retry history entry
├── service/
│   └── workflow/
│       └── engine/
│           ├── WorkflowOrchestrationService.kt      # MODIFY - retry options
│           └── coordinator/
│               └── WorkflowCoordinationService.kt   # MODIFY - error handling
```

### Pattern 1: Temporal RetryOptions Configuration
**What:** Configure retry behavior at the activity level via `ActivityOptions.setRetryOptions()`
**When to use:** All activity invocations from workflows
**Example:**
```kotlin
// Source: Temporal Java SDK - RetryOptions.Builder
// File: WorkflowOrchestrationServiceImpl.kt

private val nodeExecutionCoordinator: WorkflowCoordination = Workflow.newActivityStub(
    WorkflowCoordination::class.java,
    ActivityOptions.newBuilder()
        .setStartToCloseTimeout(Duration.ofMinutes(5))
        .setRetryOptions(
            RetryOptions.newBuilder()
                // Retry defaults from CONTEXT.md decisions
                .setMaximumAttempts(3)                    // 3 max attempts
                .setInitialInterval(Duration.ofSeconds(1)) // Start with 1s delay
                .setBackoffCoefficient(2.0)               // Double each time
                .setMaximumInterval(Duration.ofSeconds(30)) // Cap at 30s
                // Non-retryable error types (4xx, validation errors)
                .setDoNotRetry(
                    NonRetryableWorkflowException::class.java.name,
                    IllegalArgumentException::class.java.name,
                    SecurityException::class.java.name,
                    SchemaValidationException::class.java.name
                )
                .build()
        )
        .build()
)
```

### Pattern 2: ApplicationFailure for Non-Retryable Errors
**What:** Throw `ApplicationFailure.newNonRetryableFailure()` to prevent retries regardless of policy
**When to use:** 4xx HTTP errors, validation failures, deterministic errors (CONDITION nodes)
**Example:**
```kotlin
// Source: Temporal Java SDK - ApplicationFailure factory methods
// File: WorkflowCoordinationService.kt

import io.temporal.failure.ApplicationFailure

private fun classifyAndThrowError(e: Exception, nodeType: String): Nothing {
    // Classify error type
    when {
        // 4xx HTTP errors - never retry
        e is WebClientResponseException && e.statusCode.is4xxClientError -> {
            throw ApplicationFailure.newNonRetryableFailure(
                "HTTP client error: ${e.statusCode.value()} ${e.message}",
                "HTTP_CLIENT_ERROR",
                e.statusCode.value()
            )
        }
        // Validation errors - never retry
        e is IllegalArgumentException || e is SchemaValidationException -> {
            throw ApplicationFailure.newNonRetryableFailure(
                "Validation error: ${e.message}",
                "VALIDATION_ERROR"
            )
        }
        // CONDITION nodes - deterministic, never retry
        nodeType == "CONTROL_FLOW" -> {
            throw ApplicationFailure.newNonRetryableFailure(
                "Control flow evaluation failed: ${e.message}",
                "CONTROL_FLOW_ERROR"
            )
        }
        // 5xx HTTP errors - retryable
        e is WebClientResponseException && e.statusCode.is5xxServerError -> {
            throw ApplicationFailure.newFailureWithCause(
                "HTTP server error: ${e.statusCode.value()} ${e.message}",
                "HTTP_SERVER_ERROR",
                e
            )
        }
        // Default - retryable
        else -> {
            throw ApplicationFailure.newFailureWithCause(
                "Execution error: ${e.message}",
                "EXECUTION_ERROR",
                e
            )
        }
    }
}
```

### Pattern 3: Structured Error Model for Persistence
**What:** Data classes that capture comprehensive error details for storage in JSONB columns
**When to use:** Persisting errors to `workflow_executions` and `workflow_node_executions`
**Example:**
```kotlin
// Source: Kotlin data class patterns for JSON serialization
// File: models/workflow/engine/error/WorkflowExecutionError.kt

import java.time.ZonedDateTime
import java.util.UUID

/**
 * Structured error details for workflow execution failures.
 * Stored in workflow_executions.error JSONB column.
 */
data class WorkflowExecutionError(
    val failedNodeId: UUID,
    val failedNodeName: String,
    val errorType: String,         // HTTP_CLIENT_ERROR, VALIDATION_ERROR, etc.
    val message: String,
    val retryCount: Int,
    val timestamp: ZonedDateTime,
    val stackTrace: String? = null // Optional, for debug mode
)

/**
 * Per-node error details with retry history.
 * Stored in workflow_node_executions.error JSONB column.
 */
data class NodeExecutionError(
    val errorType: String,
    val message: String,
    val httpStatusCode: Int? = null,  // For HTTP action errors
    val retryAttempts: List<RetryAttempt>,
    val isFinal: Boolean,              // True if retries exhausted
    val stackTrace: String? = null
)

/**
 * Single retry attempt record.
 */
data class RetryAttempt(
    val attemptNumber: Int,
    val timestamp: ZonedDateTime,
    val errorMessage: String,
    val durationMs: Long
)
```

### Pattern 4: Error Surfacing in API Responses
**What:** Include structured error details in API responses for execution queries
**When to use:** `/api/workflows/executions/{id}` and similar endpoints
**Example:**
```kotlin
// Source: Existing ErrorResponse pattern in ExceptionHandler.kt
// File: models/response/workflow/execution/WorkflowExecutionResponse.kt

data class WorkflowExecutionResponse(
    val id: UUID,
    val workflowDefinitionId: UUID,
    val status: WorkflowStatus,
    val startedAt: ZonedDateTime,
    val completedAt: ZonedDateTime?,
    val durationMs: Long,
    // Error details when status = FAILED
    val error: WorkflowExecutionErrorResponse? = null
)

data class WorkflowExecutionErrorResponse(
    val failedNode: FailedNodeInfo,
    val errorType: String,
    val message: String,
    val retryCount: Int,
    val retriable: Boolean,
    val nodeErrors: List<NodeExecutionErrorResponse>
)

data class FailedNodeInfo(
    val id: UUID,
    val name: String,
    val type: String
)

data class NodeExecutionErrorResponse(
    val nodeId: UUID,
    val nodeName: String,
    val errorType: String,
    val message: String,
    val httpStatusCode: Int?,
    val retryAttempts: Int
)
```

### Pattern 5: Externalized Retry Configuration
**What:** Define retry parameters in `application.yml` for easy tuning without code changes
**When to use:** Production deployment, environment-specific tuning
**Example:**
```yaml
# Source: Spring Boot @ConfigurationProperties pattern
# File: application.yml

riven:
  workflow:
    retry:
      default:
        max-attempts: 3
        initial-interval-seconds: 1
        backoff-coefficient: 2.0
        max-interval-seconds: 30
      http-action:
        max-attempts: 3
        initial-interval-seconds: 2
        backoff-coefficient: 2.0
        max-interval-seconds: 60
        # HTTP status codes that should NOT trigger retry
        non-retryable-status-codes: [400, 401, 403, 404, 422]
      crud-action:
        max-attempts: 2
        initial-interval-seconds: 1
        backoff-coefficient: 2.0
        max-interval-seconds: 10
```

```kotlin
// File: configuration/workflow/WorkflowRetryConfigurationProperties.kt

@ConfigurationProperties("riven.workflow.retry")
data class WorkflowRetryConfigurationProperties(
    val default: RetryConfig = RetryConfig(),
    val httpAction: HttpRetryConfig = HttpRetryConfig(),
    val crudAction: RetryConfig = RetryConfig()
)

data class RetryConfig(
    val maxAttempts: Int = 3,
    val initialIntervalSeconds: Long = 1,
    val backoffCoefficient: Double = 2.0,
    val maxIntervalSeconds: Long = 30
)

data class HttpRetryConfig(
    val maxAttempts: Int = 3,
    val initialIntervalSeconds: Long = 2,
    val backoffCoefficient: Double = 2.0,
    val maxIntervalSeconds: Long = 60,
    val nonRetryableStatusCodes: List<Int> = listOf(400, 401, 403, 404, 422)
)
```

### Anti-Patterns to Avoid
- **Retrying validation errors:** 4xx and validation errors should fail immediately; data won't change
- **Custom retry loops inside activities:** Temporal handles retries; custom loops create nested retry behavior
- **Logging stack traces without structure:** Use structured error models for searchability
- **Swallowing exceptions:** Always propagate via ApplicationFailure for proper Temporal tracking
- **Infinite retries without timeout:** Always set `setMaximumAttempts()` or use timeout-based limits

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Retry with exponential backoff | Custom Thread.sleep loops | Temporal RetryOptions | Handles failures, persistence, metrics |
| Non-retryable error marking | Custom exception flags | ApplicationFailure.newNonRetryableFailure() | Temporal-native, respects policy |
| Retry attempt tracking | Manual counter in database | Temporal Activity.getExecutionContext().info.attempt | Built-in, consistent |
| HTTP error classification | Custom status code parsing | WebClientResponseException.statusCode.is4xxClientError | Spring-native |
| Error serialization | Manual JSON building | Jackson ObjectMapper with data classes | Type-safe, consistent |

**Key insight:** Temporal's retry system is durable and event-sourced. Manual retry logic loses this guarantee. The application's job is to classify errors and let Temporal handle the mechanics.

## Common Pitfalls

### Pitfall 1: Retrying CONDITION Nodes
**What goes wrong:** Deterministic expression evaluations fail repeatedly, wasting time
**Why it happens:** Default retry applies to all nodes
**How to avoid:**
- Mark CONDITION node errors as non-retryable
- Expression evaluation is deterministic; same input = same output = same failure
**Warning signs:** CONDITION nodes with `attempt > 1` in execution records

### Pitfall 2: Not Distinguishing 4xx from 5xx HTTP Errors
**What goes wrong:** 400 Bad Request errors retry 3 times, user waits for inevitable failure
**Why it happens:** All HTTP errors treated the same
**How to avoid:**
- Use `WebClientResponseException.statusCode.is4xxClientError` check
- 4xx = client error, data won't fix itself = non-retryable
- 5xx = server error, transient = retryable
**Warning signs:** 400/401/403/404 errors with multiple retry attempts

### Pitfall 3: Losing Error Context Through Exception Wrapping
**What goes wrong:** Error messages in database show generic "Execution failed" instead of root cause
**Why it happens:** Exceptions wrapped without preserving cause chain
**How to avoid:**
- Use `ApplicationFailure.newFailureWithCause()` to preserve cause
- Store original exception message in structured error model
- Include `stackTrace` in debug mode
**Warning signs:** Users report unhelpful error messages in execution history

### Pitfall 4: Retry Exhaustion Without Clear Feedback
**What goes wrong:** Workflow fails after 3 retries, user doesn't know what happened
**Why it happens:** Only final error stored, retry history lost
**How to avoid:**
- Store `RetryAttempt` list with each attempt's error and timestamp
- Set `isFinal: true` when retries exhausted
- Include `retryCount` in API response
**Warning signs:** Users ask "why did it fail?" when error message doesn't explain retry exhaustion

### Pitfall 5: Blocking on Activity Heartbeat Timeout
**What goes wrong:** Long-running HTTP requests fail even though they're progressing
**Why it happens:** No heartbeat configured, Temporal assumes activity is stuck
**How to avoid:**
- Configure heartbeat for long-running activities (HTTP actions with large responses)
- Use `Activity.getExecutionContext().heartbeat()` for progress indication
- Set appropriate `HeartbeatTimeout` in ActivityOptions
**Warning signs:** HTTP actions timing out after 60s even when the external API responds

## Code Examples

Verified patterns from official sources:

### Complete Retry Configuration in WorkflowOrchestrationServiceImpl
```kotlin
// Source: Temporal Java SDK docs - ActivityOptions and RetryOptions
// https://docs.temporal.io/develop/java/failure-detection

class WorkflowOrchestrationServiceImpl : WorkflowOrchestration {

    /**
     * Activity stub with comprehensive retry configuration.
     *
     * Retry behavior:
     * - Max 3 attempts
     * - 1s initial delay, doubling each retry, capped at 30s
     * - Non-retryable: validation errors, 4xx HTTP, security exceptions
     */
    private val nodeExecutionCoordinator: WorkflowCoordination = Workflow.newActivityStub(
        WorkflowCoordination::class.java,
        ActivityOptions.newBuilder()
            .setStartToCloseTimeout(Duration.ofMinutes(5))
            .setRetryOptions(
                RetryOptions.newBuilder()
                    .setMaximumAttempts(3)
                    .setInitialInterval(Duration.ofSeconds(1))
                    .setBackoffCoefficient(2.0)
                    .setMaximumInterval(Duration.ofSeconds(30))
                    .setDoNotRetry(
                        // Non-retryable error types
                        "NON_RETRYABLE",          // Custom marker type
                        "VALIDATION_ERROR",       // Schema/input validation
                        "HTTP_CLIENT_ERROR",      // 4xx HTTP errors
                        "CONTROL_FLOW_ERROR",     // Deterministic control flow
                        "SECURITY_ERROR"          // Auth/authz errors
                    )
                    .build()
            )
            .build()
    )

    // ... rest of implementation
}
```

### Error Classification in WorkflowCoordinationService
```kotlin
// Source: Temporal Java SDK - ApplicationFailure.newNonRetryableFailure
// https://github.com/temporalio/sdk-java/blob/master/temporal-sdk/src/main/java/io/temporal/failure/ApplicationFailure.java

import io.temporal.failure.ApplicationFailure
import org.springframework.web.reactive.function.client.WebClientResponseException

/**
 * Classifies exceptions and throws appropriate ApplicationFailure.
 *
 * Non-retryable:
 * - 4xx HTTP errors (client errors - data won't change)
 * - Validation errors (input invalid)
 * - CONDITION node errors (deterministic evaluation)
 * - Security exceptions (auth/authz)
 *
 * Retryable:
 * - 5xx HTTP errors (server issues - transient)
 * - Database connection errors (transient)
 * - Network timeouts (transient)
 */
private fun handleExecutionError(
    e: Exception,
    nodeId: UUID,
    nodeName: String,
    nodeType: WorkflowNodeType,
    attempt: Int
): Nothing {
    logger.error(e) { "Node $nodeName failed on attempt $attempt: ${e.message}" }

    when {
        // HTTP 4xx - client error, non-retryable
        e is WebClientResponseException && e.statusCode.is4xxClientError -> {
            throw ApplicationFailure.newNonRetryableFailure(
                "HTTP ${e.statusCode.value()}: ${e.message}",
                "HTTP_CLIENT_ERROR",
                mapOf(
                    "nodeId" to nodeId.toString(),
                    "nodeName" to nodeName,
                    "statusCode" to e.statusCode.value(),
                    "attempt" to attempt
                )
            )
        }

        // HTTP 5xx - server error, retryable
        e is WebClientResponseException && e.statusCode.is5xxServerError -> {
            throw ApplicationFailure.newFailureWithCause(
                "HTTP ${e.statusCode.value()}: ${e.message}",
                "HTTP_SERVER_ERROR",
                e,
                mapOf(
                    "nodeId" to nodeId.toString(),
                    "nodeName" to nodeName,
                    "statusCode" to e.statusCode.value(),
                    "attempt" to attempt
                )
            )
        }

        // Validation errors - non-retryable
        e is IllegalArgumentException || e is SchemaValidationException -> {
            throw ApplicationFailure.newNonRetryableFailure(
                "Validation failed: ${e.message}",
                "VALIDATION_ERROR",
                mapOf(
                    "nodeId" to nodeId.toString(),
                    "nodeName" to nodeName,
                    "attempt" to attempt
                )
            )
        }

        // Security errors - non-retryable
        e is SecurityException -> {
            throw ApplicationFailure.newNonRetryableFailure(
                "Security error: ${e.message}",
                "SECURITY_ERROR",
                mapOf(
                    "nodeId" to nodeId.toString(),
                    "nodeName" to nodeName,
                    "attempt" to attempt
                )
            )
        }

        // CONDITION nodes - deterministic, non-retryable
        nodeType == WorkflowNodeType.CONTROL_FLOW -> {
            throw ApplicationFailure.newNonRetryableFailure(
                "Control flow failed: ${e.message}",
                "CONTROL_FLOW_ERROR",
                mapOf(
                    "nodeId" to nodeId.toString(),
                    "nodeName" to nodeName,
                    "attempt" to attempt
                )
            )
        }

        // Default - retryable
        else -> {
            throw ApplicationFailure.newFailureWithCause(
                "Execution error: ${e.message}",
                "EXECUTION_ERROR",
                e,
                mapOf(
                    "nodeId" to nodeId.toString(),
                    "nodeName" to nodeName,
                    "attempt" to attempt
                )
            )
        }
    }
}
```

### Getting Retry Attempt Number
```kotlin
// Source: Temporal Java SDK - Activity.getExecutionContext()
// https://docs.temporal.io/develop/java/failure-detection

import io.temporal.activity.Activity

/**
 * Get current retry attempt number within activity execution.
 * Attempt starts at 1 for first execution, increments on each retry.
 */
private fun getCurrentAttempt(): Int {
    return Activity.getExecutionContext().info.attempt
}

/**
 * Example usage in node execution.
 */
private fun executeNodeWithRetryTracking(node: WorkflowNode): NodeExecutionResult {
    val attempt = getCurrentAttempt()
    logger.info { "Executing node ${node.name}, attempt $attempt of ${maxAttempts}" }

    // ... execution logic

    // Include attempt in result for persistence
    return NodeExecutionResult(
        nodeId = node.id,
        status = WorkflowStatus.COMPLETED,
        output = output,
        attempt = attempt
    )
}
```

### Persisting Structured Error to Database
```kotlin
// Source: Existing WorkflowCoordinationService pattern

/**
 * Persist comprehensive error details to workflow_node_executions table.
 */
private fun persistNodeError(
    executionId: UUID,
    nodeId: UUID,
    workspaceId: UUID,
    error: Exception,
    nodeType: WorkflowNodeType,
    startTime: ZonedDateTime,
    attempt: Int,
    retryHistory: List<RetryAttempt>
) {
    val errorDetails = NodeExecutionError(
        errorType = classifyErrorType(error, nodeType),
        message = error.message ?: "Unknown error",
        httpStatusCode = (error as? WebClientResponseException)?.statusCode?.value(),
        retryAttempts = retryHistory,
        isFinal = attempt >= maxAttempts || isNonRetryable(error, nodeType),
        stackTrace = if (includeStackTrace) error.stackTraceToString() else null
    )

    val nodeExecution = WorkflowExecutionNodeEntity(
        workspaceId = workspaceId,
        workflowExecutionId = executionId,
        nodeId = nodeId,
        sequenceIndex = 0,
        status = WorkflowStatus.FAILED,
        startedAt = startTime,
        completedAt = ZonedDateTime.now(),
        durationMs = Duration.between(startTime, ZonedDateTime.now()).toMillis(),
        attempt = attempt,
        error = errorDetails,  // JSONB serialized
        input = null,
        output = null
    )

    workflowExecutionNodeRepository.save(nodeExecution)
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom retry loops | Temporal RetryOptions | Temporal SDK default | Durable, event-sourced retries |
| Generic exceptions | ApplicationFailure types | Temporal best practice | Retry control, error classification |
| Manual attempt tracking | Activity.getExecutionContext().info.attempt | Temporal SDK 1.x | Consistent, reliable attempt count |
| Text error messages | Structured error models (JSONB) | 2023+ best practice | Queryable, parseable errors |

**New tools/patterns to consider:**
- **Temporal Search Attributes:** Index error types for workflow queries
- **Temporal Workflow Update:** Allow external retry triggers (deferred to later phase)
- **Structured Logging:** ELK/CloudWatch Logs integration for error aggregation

**Deprecated/outdated:**
- **Manual backoff with Thread.sleep:** Use Temporal's built-in retry mechanics
- **setMaximumAttempts(0) for unlimited:** Use timeout-based limits instead

## Open Questions

Things that couldn't be fully resolved:

1. **Activity Heartbeat for Long HTTP Requests**
   - What we know: HTTP actions could take > 60s for large payloads
   - What's unclear: Whether to implement heartbeat or rely on longer timeout
   - Recommendation: Start with longer `StartToCloseTimeout` (5 min); add heartbeat if specific use cases require

2. **Error Message Localization**
   - What we know: Error messages will be surfaced to users
   - What's unclear: Whether to support i18n error messages
   - Recommendation: Use error codes (`HTTP_CLIENT_ERROR`) for programmatic handling; messages can be mapped to localized strings in frontend

3. **Stack Trace Storage Limits**
   - What we know: Stack traces can be large (100KB+)
   - What's unclear: JSONB storage limits in PostgreSQL
   - Recommendation: Truncate to first 10KB or first 50 lines; include flag `truncated: true`

4. **Retry History Cleanup**
   - What we know: Each retry creates history entries
   - What's unclear: When to purge old retry history
   - Recommendation: Keep for 30 days; implement cleanup job later

## Sources

### Primary (HIGH confidence)
- [Temporal Retry Policies](https://docs.temporal.io/encyclopedia/retry-policies) - Official retry policy documentation
- [Temporal Java SDK Failure Detection](https://docs.temporal.io/develop/java/failure-detection) - RetryOptions, ApplicationFailure
- [Temporal Failures Reference](https://docs.temporal.io/references/failures) - Failure types and propagation
- [Temporal Java SDK ApplicationFailure](https://github.com/temporalio/sdk-java/blob/master/temporal-sdk/src/main/java/io/temporal/failure/ApplicationFailure.java) - Factory methods
- [Temporal Blog - Failure Handling in Practice](https://temporal.io/blog/failure-handling-in-practice) - Best practices

### Secondary (MEDIUM confidence)
- [Spring WebClient Error Handling](https://docs.spring.io/spring-framework/reference/web/webflux-webclient/client-retrieve.html) - onStatus() for HTTP errors
- [Temporal Community - RetryOptions vs ApplicationFailure](https://community.temporal.io/t/retryoptions-donotretry-vs-applicationfailure-newnonretryablefailure/12438) - When to use each
- [Baeldung - Spring REST Error Handling in Kotlin](https://www.baeldung.com/kotlin/spring-rest-error-handling) - Structured error responses

### Tertiary (LOW confidence - needs validation)
- Optimal retry intervals (1s/2.0/30s) - based on general guidance, may need production tuning
- Stack trace truncation limits (10KB) - arbitrary, needs validation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Temporal SDK retry is well-documented, patterns verified
- Architecture: HIGH - Error classification pattern is standard Temporal practice
- Pitfalls: HIGH - Common issues documented in Temporal community
- Code examples: MEDIUM - Adapted from verified patterns, needs integration testing

**Research date:** 2026-01-22
**Valid until:** 2026-02-22 (30 days - Temporal patterns stable)

**Critical constraints:**
- Temporal handles retry mechanics; application classifies errors
- 4xx HTTP errors and CONDITION nodes must be non-retryable
- Structured errors must be persisted for API surfacing
- Configuration via application.yml for deployment flexibility

---

*Phase: 07-error-handling-retry-logic*
*Research completed: 2026-01-22*
*Ready for planning: yes*
