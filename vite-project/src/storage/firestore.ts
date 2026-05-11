import { initializeApp, getApps } from 'firebase/app'
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  writeBatch
} from 'firebase/firestore'
import type { Firestore } from 'firebase/firestore'
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID
} from '../config'
import type { StorageAdapter } from './adapter'
import type { Project, Story, Task, User, Notification } from '../model'

let _db: Firestore | null = null

function db(): Firestore {
  if (_db) return _db

  if (!FIREBASE_PROJECT_ID) {
    throw new Error(
      'Brak konfiguracji Firebase. Uzupełnij zmienne VITE_FIREBASE_* w pliku .env.'
    )
  }

  const app = getApps().length ? getApps()[0] : initializeApp({
    apiKey: FIREBASE_API_KEY,
    authDomain: FIREBASE_AUTH_DOMAIN,
    projectId: FIREBASE_PROJECT_ID,
    storageBucket: FIREBASE_STORAGE_BUCKET,
    messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
    appId: FIREBASE_APP_ID
  })

  _db = getFirestore(app)
  return _db
}

async function fetchAll<T>(col: string): Promise<T[]> {
  const snap = await getDocs(collection(db(), col))
  return snap.docs.map(d => d.data() as T)
}

async function fetchWhere<T>(col: string, field: string, value: string): Promise<T[]> {
  const q = query(collection(db(), col), where(field, '==', value))
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as T)
}

async function upsert(col: string, id: string, data: object): Promise<void> {
  await setDoc(doc(db(), col, id), data)
}

async function remove(col: string, id: string): Promise<void> {
  await deleteDoc(doc(db(), col, id))
}

export class FirestoreAdapter implements StorageAdapter {
  async getProjects(): Promise<Project[]> {
    return fetchAll<Project>('projects')
  }

  async createProject(project: Project): Promise<void> {
    await upsert('projects', project.id, project)
  }

  async updateProject(project: Project): Promise<void> {
    await upsert('projects', project.id, project)
  }

  async deleteProject(id: string): Promise<void> {
    const batch = writeBatch(db())
    batch.delete(doc(db(), 'projects', id))

    const stories = await fetchWhere<Story>('stories', 'projectId', id)
    for (const story of stories) {
      batch.delete(doc(db(), 'stories', story.id))
      const tasks = await fetchWhere<Task>('tasks', 'storyId', story.id)
      tasks.forEach(t => batch.delete(doc(db(), 'tasks', t.id)))
    }

    await batch.commit()
  }

  async getStoriesByProject(projectId: string): Promise<Story[]> {
    return fetchWhere<Story>('stories', 'projectId', projectId)
  }

  async getStoryById(id: string): Promise<Story | undefined> {
    const snap = await getDoc(doc(db(), 'stories', id))
    return snap.exists() ? (snap.data() as Story) : undefined
  }

  async createStory(story: Story): Promise<void> {
    await upsert('stories', story.id, story)
  }

  async updateStory(story: Story): Promise<void> {
    await upsert('stories', story.id, story)
  }

  async deleteStory(id: string): Promise<void> {
    const batch = writeBatch(db())
    batch.delete(doc(db(), 'stories', id))
    const tasks = await fetchWhere<Task>('tasks', 'storyId', id)
    tasks.forEach(t => batch.delete(doc(db(), 'tasks', t.id)))
    await batch.commit()
  }

  async getTasksByStory(storyId: string): Promise<Task[]> {
    return fetchWhere<Task>('tasks', 'storyId', storyId)
  }

  async createTask(task: Task): Promise<void> {
    await upsert('tasks', task.id, task)
  }

  async updateTask(task: Task): Promise<void> {
    await upsert('tasks', task.id, task)
  }

  async deleteTask(id: string): Promise<void> {
    await remove('tasks', id)
  }

  async getUsers(): Promise<User[]> {
    return fetchAll<User>('users')
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const users = await fetchWhere<User>('users', 'email', email)
    return users[0]
  }

  async createUser(user: User): Promise<void> {
    await upsert('users', user.id, user)
  }

  async updateUser(user: User): Promise<void> {
    await upsert('users', user.id, user)
  }

  async getNotificationsForUser(userId: string): Promise<Notification[]> {
    const all = await fetchWhere<Notification>('notifications', 'recipientId', userId)
    return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  async getNotificationById(id: string): Promise<Notification | undefined> {
    const snap = await getDoc(doc(db(), 'notifications', id))
    return snap.exists() ? (snap.data() as Notification) : undefined
  }

  async createNotification(notification: Notification): Promise<void> {
    await upsert('notifications', notification.id, notification)
  }

  async updateNotification(notification: Notification): Promise<void> {
    await upsert('notifications', notification.id, notification)
  }
}
