package riven.core.exceptions

class NotFoundException(message: String) : RuntimeException(message)
class ConflictException(message: String) : RuntimeException(message)
class SupabaseException(message: String) : RuntimeException(message)
class SchemaValidationException(val reasons: List<String>) :
    RuntimeException("Schema validation failed: ${reasons.joinToString("; ")}")
