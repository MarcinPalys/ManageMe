import { AuthService } from './auth'
import type { User } from './model'

const _auth = new AuthService()

export class SessionService {
  async getCurrentUser(): Promise<User | null> {
    return _auth.getCurrentUser()
  }

  setActiveProject(projectId: string): void {
    _auth.setActiveProject(projectId)
  }

  getActiveProjectId(): string | null {
    return _auth.getActiveProjectId()
  }

  async getAllUsers(): Promise<User[]> {
    return _auth.getAllUsers()
  }
}
