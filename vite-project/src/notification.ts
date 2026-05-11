import type { Notification } from './model'
import { getAdapter } from './storage'

export class NotificationService {
  async getForUser(userId: string): Promise<Notification[]> {
    return getAdapter().getNotificationsForUser(userId)
  }

  async getUnreadCount(userId: string): Promise<number> {
    const notifications = await getAdapter().getNotificationsForUser(userId)
    return notifications.filter(n => !n.isRead).length
  }

  async create(notification: Notification): Promise<void> {
    return getAdapter().createNotification(notification)
  }

  async markAsRead(id: string): Promise<void> {
    const notification = await getAdapter().getNotificationById(id)
    if (!notification) return
    return getAdapter().updateNotification({ ...notification, isRead: true })
  }

  async markAllAsRead(userId: string): Promise<void> {
    const notifications = await getAdapter().getNotificationsForUser(userId)
    await Promise.all(
      notifications
        .filter(n => !n.isRead)
        .map(n => getAdapter().updateNotification({ ...n, isRead: true }))
    )
  }

  async getById(id: string): Promise<Notification | undefined> {
    return getAdapter().getNotificationById(id)
  }
}
