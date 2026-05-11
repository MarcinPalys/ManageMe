import type { Project, Story, Task, User, Notification } from '../model'

export interface StorageAdapter {
  // Projects
  getProjects(): Promise<Project[]>
  createProject(project: Project): Promise<void>
  updateProject(project: Project): Promise<void>
  deleteProject(id: string): Promise<void>

  // Stories
  getStoriesByProject(projectId: string): Promise<Story[]>
  getStoryById(id: string): Promise<Story | undefined>
  createStory(story: Story): Promise<void>
  updateStory(story: Story): Promise<void>
  deleteStory(id: string): Promise<void>

  // Tasks
  getTasksByStory(storyId: string): Promise<Task[]>
  createTask(task: Task): Promise<void>
  updateTask(task: Task): Promise<void>
  deleteTask(id: string): Promise<void>

  // Users
  getUsers(): Promise<User[]>
  getUserByEmail(email: string): Promise<User | undefined>
  createUser(user: User): Promise<void>
  updateUser(user: User): Promise<void>

  // Notifications
  getNotificationsForUser(userId: string): Promise<Notification[]>
  getNotificationById(id: string): Promise<Notification | undefined>
  createNotification(notification: Notification): Promise<void>
  updateNotification(notification: Notification): Promise<void>
}
