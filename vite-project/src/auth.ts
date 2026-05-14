import type { User, UserRole } from './model'
import { SUPER_ADMIN_EMAIL } from './config'
import { getAdapter } from './storage'

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
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes))
}

export class AuthService {
  async getCurrentUser(): Promise<User | null> {
    const id = localStorage.getItem(CURRENT_USER_KEY)
    if (!id) return null
    const users = await getAdapter().getUsers()
    return users.find(u => u.id === id) ?? null
  }

  async handleGoogleCredential(credential: string): Promise<{ user: User; isNew: boolean }> {
    const payload = decodeGoogleJwt(credential)
    const existing = await getAdapter().getUserByEmail(payload.email)

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

    await getAdapter().createUser(user)
    localStorage.setItem(CURRENT_USER_KEY, user.id)
    return { user, isNew: true }
  }

  logout(): void {
    localStorage.removeItem(CURRENT_USER_KEY)
  }

  async getAllUsers(): Promise<User[]> {
    return getAdapter().getUsers()
  }

  async getAdmins(): Promise<User[]> {
    const users = await getAdapter().getUsers()
    return users.filter(u => u.role === 'admin')
  }

  async updateUser(user: User): Promise<void> {
    return getAdapter().updateUser(user)
  }

  setActiveProject(projectId: string): void {
    localStorage.setItem(ACTIVE_PROJECT_KEY, projectId)
  }

  clearActiveProject(): void {
    localStorage.removeItem(ACTIVE_PROJECT_KEY)
  }

  getActiveProjectId(): string | null {
    return localStorage.getItem(ACTIVE_PROJECT_KEY)
  }
}
