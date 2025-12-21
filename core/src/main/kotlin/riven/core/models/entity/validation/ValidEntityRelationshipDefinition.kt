package riven.core.models.entity.validation

import jakarta.validation.Constraint
import jakarta.validation.Payload
import kotlin.reflect.KClass

/**
 * Validates EntityRelationshipDefinition constraints:
 * 1. When bidirectional is true, bidirectionalEntityTypeKeys must not be null and must have at least one key
 * 2. When bidirectionalEntityTypeKeys has entries, it must be a subset of entityTypeKeys (when entityTypeKeys has values),
 *    unless allowPolymorphic is true (which accepts any entity type)
 * 3. When allowPolymorphic is false, entityTypeKeys must not be null
 */
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [EntityRelationshipDefinitionValidator::class])
@MustBeDocumented
annotation class ValidEntityRelationshipDefinition(
    val message: String = "Invalid entity relationship definition",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = []
)
