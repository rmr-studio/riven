package riven.core.models.entity.validation

import jakarta.validation.ConstraintValidator
import jakarta.validation.ConstraintValidatorContext
import riven.core.models.entity.configuration.EntityRelationshipDefinition

class EntityRelationshipDefinitionValidator : ConstraintValidator<ValidEntityRelationshipDefinition, EntityRelationshipDefinition> {

    override fun isValid(value: EntityRelationshipDefinition?, context: ConstraintValidatorContext): Boolean {
        if (value == null) {
            return true
        }

        context.disableDefaultConstraintViolation()
        var isValid = true

        // Capture mutable properties to local variables to avoid smart cast issues
        val bidirectional = value.bidirectional
        val bidirectionalEntityTypeKeys = value.bidirectionalEntityTypeKeys
        val allowPolymorphic = value.allowPolymorphic
        val entityTypeKeys = value.entityTypeKeys

        // Rule 1: When bidirectional is true, bidirectionalEntityTypeKeys must not be null and must have at least one key
        if (bidirectional) {
            if (bidirectionalEntityTypeKeys == null) {
                context.buildConstraintViolationWithTemplate(
                    "bidirectionalEntityTypeKeys must not be null when bidirectional is true"
                )
                    .addPropertyNode("bidirectionalEntityTypeKeys")
                    .addConstraintViolation()
                isValid = false
            } else if (bidirectionalEntityTypeKeys.isEmpty()) {
                context.buildConstraintViolationWithTemplate(
                    "bidirectionalEntityTypeKeys must have at least one key when bidirectional is true"
                )
                    .addPropertyNode("bidirectionalEntityTypeKeys")
                    .addConstraintViolation()
                isValid = false
            }
        }

        // Rule 2: When bidirectionalEntityTypeKeys has entries, it must be a subset of entityTypeKeys
        // (unless allowPolymorphic is true or entityTypeKeys is null/empty)
        if (!bidirectionalEntityTypeKeys.isNullOrEmpty()) {
            if (!allowPolymorphic && !entityTypeKeys.isNullOrEmpty()) {
                val entityTypeKeysSet = entityTypeKeys.toSet()
                val invalidKeys = bidirectionalEntityTypeKeys.filter { it !in entityTypeKeysSet }

                if (invalidKeys.isNotEmpty()) {
                    context.buildConstraintViolationWithTemplate(
                        "bidirectionalEntityTypeKeys must be a subset of entityTypeKeys. Invalid keys: ${invalidKeys.joinToString(", ")}"
                    )
                        .addPropertyNode("bidirectionalEntityTypeKeys")
                        .addConstraintViolation()
                    isValid = false
                }
            }
        }

        // Rule 3: When allowPolymorphic is false, entityTypeKeys must not be null
        if (!allowPolymorphic && entityTypeKeys == null) {
            context.buildConstraintViolationWithTemplate(
                "entityTypeKeys must not be null when allowPolymorphic is false"
            )
                .addPropertyNode("entityTypeKeys")
                .addConstraintViolation()
            isValid = false
        }

        return isValid
    }
}
