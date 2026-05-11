import type { StorageAdapter } from './adapter'
import type { Project, Story, Task, User, Notification } from '../model'

const KEYS = {
  projects: 'projects',
  stories: 'stories',
  tasks: 'tasks',
  users: 'app_users',
  notifications: 'notifications'
} as const

function load<T>(key: string): T[] {
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : []
}

function save<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items))
}

export class LocalStorageAdapter implements StorageAdapter {
  async getProjects(): Promise<Project[]> {
    return load<Project>(KEYS.projects)
  }

  async createProject(project: Project): Promise<void> {
    const all = load<Project>(KEYS.projects)
    all.push(project)
    save(KEYS.projects, all)
  }

  async updateProject(project: Project): Promise<void> {
    save(KEYS.projects, load<Project>(KEYS.projects).map(p => p.id === project.id ? project : p))
  }

  async deleteProject(id: string): Promise<void> {
    save(KEYS.projects, load<Project>(KEYS.projects).filter(p => p.id !== id))
    const stories = load<Story>(KEYS.stories)
    const deletedStoryIds = stories.filter(s => s.projectId === id).map(s => s.id)
    save(KEYS.stories, stories.filter(s => s.projectId !== id))
    save(KEYS.tasks, load<Task>(KEYS.tasks).filter(t => !deletedStoryIds.includes(t.storyId)))
  }

  async getStoriesByProject(projectId: string): Promise<Story[]> {
    return load<Story>(KEYS.stories).filter(s => s.projectId === projectId)
  }

  async getStoryById(id: string): Promise<Story | undefined> {
    return load<Story>(KEYS.stories).find(s => s.id === id)
  }

  async createStory(story: Story): Promise<void> {
    const all = load<Story>(KEYS.stories)
    all.push(story)
    save(KEYS.stories, all)
  }

  async updateStory(story: Story): Promise<void> {
    save(KEYS.stories, load<Story>(KEYS.stories).map(s => s.id === story.id ? story : s))
  }

  async deleteStory(id: string): Promise<void> {
    save(KEYS.stories, load<Story>(KEYS.stories).filter(s => s.id !== id))
    save(KEYS.tasks, load<Task>(KEYS.tasks).filter(t => t.storyId !== id))
  }

  async getTasksByStory(storyId: string): Promise<Task[]> {
    return load<Task>(KEYS.tasks).filter(t => t.storyId === storyId)
  }

  async createTask(task: Task): Promise<void> {
    const all = load<Task>(KEYS.tasks)
    all.push(task)
    save(KEYS.tasks, all)
  }

  async updateTask(task: Task): Promise<void> {
    save(KEYS.tasks, load<Task>(KEYS.tasks).map(t => t.id === task.id ? task : t))
  }

  async deleteTask(id: string): Promise<void> {
    save(KEYS.tasks, load<Task>(KEYS.tasks).filter(t => t.id !== id))
  }

  async getUsers(): Promise<User[]> {
    return load<User>(KEYS.users)
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return load<User>(KEYS.users).find(u => u.email === email)
  }

  async createUser(user: User): Promise<void> {
    const all = load<User>(KEYS.users)
    all.push(user)
    save(KEYS.users, all)
  }

  async updateUser(user: User): Promise<void> {
    save(KEYS.users, load<User>(KEYS.users).map(u => u.id === user.id ? user : u))
  }

  async getNotificationsForUser(userId: string): Promise<Notification[]> {
    return load<Notification>(KEYS.notifications)
      .filter(n => n.recipientId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  async getNotificationById(id: string): Promise<Notification | undefined> {
    return load<Notification>(KEYS.notifications).find(n => n.id === id)
  }

  async createNotification(notification: Notification): Promise<void> {
    const all = load<Notification>(KEYS.notifications)
    all.push(notification)
    save(KEYS.notifications, all)
  }

  async updateNotification(notification: Notification): Promise<void> {
    save(KEYS.notifications, load<Notification>(KEYS.notifications).map(n => n.id === notification.id ? notification : n))
  }
}
