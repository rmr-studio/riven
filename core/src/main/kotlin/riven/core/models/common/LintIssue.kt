package riven.core.models.common

import riven.core.enums.common.validation.IssueLevel

data class LintIssue(
    val path: String,
    val level: IssueLevel,
    val message: String,
)