import { AuthService } from './auth'
import type { User } from './model'

const _auth = new AuthService()

export class SessionService {
  getCurrentUser(): User | null {
    return _auth.getCurrentUser()
  }

  setActiveProject(projectId: string): void {
    _auth.setActiveProject(projectId)
  }

  getActiveProjectId(): string | null {
    return _auth.getActiveProjectId()
  }

  getAllUsers(): User[] {
    return _auth.getAllUsers()
  }
}
