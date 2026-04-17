package riven.core.exceptions

/**
 * Thrown when an upstream LLM (Anthropic, OpenAI, etc.) call fails — for example
 * non-2xx HTTP responses, network errors, or invalid response shapes. Mapped to
 * HTTP 502 BAD_GATEWAY by [ExceptionHandler].
 */
class LlmCallException(message: String, cause: Throwable? = null) : RuntimeException(message, cause)

/**
 * Thrown when an LLM response cannot be parsed into the expected structured shape
 * (e.g. malformed JSON answer/citation envelope). Mapped to HTTP 502 BAD_GATEWAY.
 */
class LlmResponseParseException(message: String, cause: Throwable? = null) : RuntimeException(message, cause)
