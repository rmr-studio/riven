package riven.core.models.response.notification

import riven.core.models.notification.NotificationInboxItem
import java.time.ZonedDateTime

data class NotificationInboxResponse(
    val notifications: List<NotificationInboxItem>,
    val nextCursor: ZonedDateTime?,
    val unreadCount: Long,
)
