package riven.core.models.response.common

import org.springframework.http.HttpStatus

data class ErrorResponse(
    val statusCode: HttpStatus,
    val message: String,
    val error: String,
    var stackTrace: String? = null
)