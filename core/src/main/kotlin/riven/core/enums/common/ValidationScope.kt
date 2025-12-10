package riven.core.enums.common

enum class ValidationScope {
    SOFT,
    STRICT,
    NONE;
    
    /**
     * Indicates whether the validation scope is soft.
     *
     * @return `true` if the receiver is `SOFT`, `false` otherwise.
     */
    fun ValidationScope.isSoft(): Boolean = this == SOFT

    /**
     * Determines whether the validation scope is strict.
     *
     * @return `true` if the receiver equals `BlockValidationScope.STRICT`, `false` otherwise.
     */
    fun ValidationScope.isStrict(): Boolean = this == STRICT

}

