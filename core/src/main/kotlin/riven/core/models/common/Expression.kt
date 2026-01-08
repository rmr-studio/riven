package riven.core.models.common

import java.time.Instant
import java.time.temporal.ChronoUnit
import kotlin.math.abs
import kotlin.math.ceil
import kotlin.math.floor
import kotlin.math.roundToInt

enum class Operator {
    ADD, SUBTRACT, MULTIPLY, DIVIDE,
    EQUALS, NOT_EQUALS, GREATER_THAN, LESS_THAN,
    GREATER_EQUALS, LESS_EQUALS,
    AND, OR
}

// Expression types supported
sealed class Expression {
    // Static value: "Hello"
    data class Literal(val value: Any) : Expression()

    // Variable reference: {{trigger.entity.name}}
    data class VariableRef(val path: List<String>) : Expression()

    // Function call: {{uppercase(trigger.entity.name)}}
    data class FunctionCall(
        val function: String,
        val arguments: List<Expression>
    ) : Expression()

    // Binary operation: {{order.total * 1.1}}
    data class BinaryOp(
        val left: Expression,
        val operator: Operator,
        val right: Expression
    ) : Expression()

    // Ternary: {{order.priority == "high" ? "urgent" : "normal"}}
    data class Conditional(
        val condition: Expression,
        val thenExpr: Expression,
        val elseExpr: Expression
    ) : Expression()

    // Template string: "Hello {{customer.name}}, your order {{order.id}} is ready"
    data class Template(val parts: List<Expression>) : Expression()
}

// Built-in functions
val builtInFunctions: Map<String, (arg: List<Any>) -> Any> = mapOf(
    // String functions
    "uppercase" to { args -> (args[0] as String).uppercase() },
    "lowercase" to { args -> (args[0] as String).lowercase() },
    "trim" to { args -> (args[0] as String).trim() },
    "substring" to { args -> (args[0] as String).substring(args[1] as Int, args[2] as Int) },
    "concat" to { args -> args.joinToString("") },
    "split" to { args -> (args[0] as String).split(args[1] as String) },

    // Number functions
    "round" to { args -> (args[0] as Number).toDouble().roundToInt() },
    "floor" to { args -> floor(args[0] as Double) },
    "ceil" to { args -> ceil(args[0] as Double) },
    "abs" to { args -> abs(args[0] as Double) },

    // Date functions
    "now" to { _ -> Instant.now() },
//    "formatDate" to { args -> formatDate(args[0] as Instant, args[1] as String) },
//    "parseDate" to { args -> parseDate(args[0] as String, args[1] as String) },
    "addDays" to { args -> (args[0] as Instant).plus(args[1] as Long, ChronoUnit.DAYS) },

    // Array functions
    "length" to { args -> (args[0] as Collection<*>).size },
    "first" to { args -> (args[0] as List<*>).firstOrNull() },
    "last" to { args -> (args[0] as List<*>).lastOrNull() },
    "filter" to { args -> /* filter implementation */ },
    "map" to { args -> /* map implementation */ },

    // Object functions
    "keys" to { args -> (args[0] as Map<*, *>).keys.toList() },
    "values" to { args -> (args[0] as Map<*, *>).values.toList() },
    "merge" to { args -> args.fold(mutableMapOf<Any, Any>()) { acc, m -> acc.apply { putAll(m as Map<Any, Any>) } } },

    // Utility functions
    "coalesce" to { args -> args.firstOrNull { it != null } },
    "default" to { args -> args[0] ?: args[1] },
    "typeOf" to { args -> args[0]?.javaClass?.simpleName ?: "null" },
    "toJson" to { args -> objectMapper.writeValueAsString(args[0]) },
    "fromJson" to { args -> objectMapper.readValue(args[0] as String, Any::class.java) },
)