import type { User, UserRole } from './model'
import { SUPER_ADMIN_EMAIL } from './config'

const USERS_KEY = 'app_users'
const CURRENT_USER_KEY = 'current_user_id'
const ACTIVE_PROJECT_KEY = 'active_project_id'

interface GoogleJwtPayload {
  sub: string
  email: string
  given_name?: string
  family_name?: string
  name?: string
}

function decodeGoogleJwt(token: string): GoogleJwtPayload {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(atob(base64))
}

export class AuthService {
  private getStoredUsers(): User[] {
    const data = localStorage.getItem(USERS_KEY)
    return data ? JSON.parse(data) : []
  }

  private saveUsers(users: User[]): void {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  }

  getCurrentUser(): User | null {
    const id = localStorage.getItem(CURRENT_USER_KEY)
    if (!id) return null
    return this.getStoredUsers().find(u => u.id === id) ?? null
  }

  handleGoogleCredential(credential: string): { user: User; isNew: boolean } {
    const payload = decodeGoogleJwt(credential)
    const users = this.getStoredUsers()
    const existing = users.find(u => u.email === payload.email)

    if (existing) {
      localStorage.setItem(CURRENT_USER_KEY, existing.id)
      return { user: existing, isNew: false }
    }

    const role: UserRole = payload.email === SUPER_ADMIN_EMAIL ? 'admin' : 'guest'
    const user: User = {
      id: crypto.randomUUID(),
      firstName: payload.given_name ?? payload.email.split('@')[0],
      lastName: payload.family_name ?? '',
      email: payload.email,
      role,
      blocked: false
    }

    users.push(user)
    this.saveUsers(users)
    localStorage.setItem(CURRENT_USER_KEY, user.id)
    return { user, isNew: true }
  }

  logout(): void {
    localStorage.removeItem(CURRENT_USER_KEY)
  }

  getAllUsers(): User[] {
    return this.getStoredUsers()
  }

  getAdmins(): User[] {
    return this.getStoredUsers().filter(u => u.role === 'admin')
  }

  updateUser(user: User): void {
    const users = this.getStoredUsers().map(u => u.id === user.id ? user : u)
    this.saveUsers(users)
  }

  setActiveProject(projectId: string): void {
    localStorage.setItem(ACTIVE_PROJECT_KEY, projectId)
  }

  getActiveProjectId(): string | null {
    return localStorage.getItem(ACTIVE_PROJECT_KEY)
  }
}
