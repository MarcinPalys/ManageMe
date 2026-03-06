import type { User } from "./model";

export class SessionService {
  // Mock użytkownika
  private readonly mockUser: User = {
    id: "user-123",
    firstName: "Marcin",
    lastName: "Palys"
  };

  getCurrentUser(): User {
    return this.mockUser;
  }

  // Zarządzanie aktywnym projektem w LocalStorage
  setActiveProject(projectId: string) {
    localStorage.setItem("active_project_id", projectId);
  }

  getActiveProjectId(): string | null {
    return localStorage.getItem("active_project_id");
  }
}