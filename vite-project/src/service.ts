import type { Project, Story, Task } from './model'
import { getAdapter } from './storage'

export class ProjectService {
  async getAll(): Promise<Project[]> {
    return getAdapter().getProjects()
  }

  async create(project: Project): Promise<void> {
    return getAdapter().createProject(project)
  }

  async update(project: Project): Promise<void> {
    return getAdapter().updateProject(project)
  }

  async delete(id: string): Promise<void> {
    return getAdapter().deleteProject(id)
  }
}

export class StoryService {
  async getAll(projectId: string): Promise<Story[]> {
    return getAdapter().getStoriesByProject(projectId)
  }

  async getById(id: string): Promise<Story | undefined> {
    return getAdapter().getStoryById(id)
  }

  async create(story: Story): Promise<void> {
    return getAdapter().createStory(story)
  }

  async update(story: Story): Promise<void> {
    return getAdapter().updateStory(story)
  }

  async delete(id: string): Promise<void> {
    return getAdapter().deleteStory(id)
  }
}

export class TaskService {
  async getByStory(storyId: string): Promise<Task[]> {
    return getAdapter().getTasksByStory(storyId)
  }

  async create(task: Task): Promise<void> {
    return getAdapter().createTask(task)
  }

  async update(task: Task): Promise<void> {
    return getAdapter().updateTask(task)
  }

  async delete(id: string): Promise<void> {
    return getAdapter().deleteTask(id)
  }
}
