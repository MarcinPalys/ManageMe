import type { Notification } from './model'

const NOTIFICATIONS_KEY = 'notifications'

export class NotificationService {
  private getAll(): Notification[] {
    const data = localStorage.getItem(NOTIFICATIONS_KEY)
    return data ? JSON.parse(data) : []
  }

  private saveAll(notifications: Notification[]): void {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications))
  }

  getForUser(userId: string): Notification[] {
    return this.getAll()
      .filter(n => n.recipientId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  getUnreadCount(userId: string): number {
    return this.getAll().filter(n => n.recipientId === userId && !n.isRead).length
  }

  create(notification: Notification): void {
    const notifications = this.getAll()
    notifications.push(notification)
    this.saveAll(notifications)
  }

  markAsRead(id: string): void {
    const notifications = this.getAll().map(n =>
      n.id === id ? { ...n, isRead: true } : n
    )
    this.saveAll(notifications)
  }

  markAllAsRead(userId: string): void {
    const notifications = this.getAll().map(n =>
      n.recipientId === userId ? { ...n, isRead: true } : n
    )
    this.saveAll(notifications)
  }

  getById(id: string): Notification | undefined {
    return this.getAll().find(n => n.id === id)
  }
}
