import type { Project } from './model'
import { ProjectService } from './service'

const service = new ProjectService()

export async function addProject(name: string, description: string): Promise<void> {
  const project: Project = {
    id: crypto.randomUUID(),
    name,
    description
  }
  await service.create(project)
}

export async function getProjects(): Promise<Project[]> {
  return service.getAll()
}

export async function deleteProject(id: string): Promise<void> {
  await service.delete(id)
}
