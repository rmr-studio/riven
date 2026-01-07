package riven.core.models.common

import java.time.ZonedDateTime

interface SoftDeletable {
    var deleted: Boolean
    var deletedAt: ZonedDateTime?
}