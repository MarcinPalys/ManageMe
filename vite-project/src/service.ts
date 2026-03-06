import type { Project, Story } from "./model"

const PROJECTS_KEY = "projects"
const STORIES_KEY = "stories"

// --- SERWIS PROJEKTÓW ---
export class ProjectService {
  getAll(): Project[] {
    const data = localStorage.getItem(PROJECTS_KEY)
    return data ? JSON.parse(data) : []
  }

  saveAll(projects: Project[]) {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects))
  }

  create(project: Project) {
    const projects = this.getAll()
    projects.push(project)
    this.saveAll(projects)
  }

  update(updatedProject: Project) {
    const projects = this.getAll().map(p =>
      p.id === updatedProject.id ? updatedProject : p
    )
    this.saveAll(projects)
  }

  delete(id: string) {
    const projects = this.getAll().filter(p => p.id !== id)
    this.saveAll(projects)
    
    const allStories = this.getGlobalStories()
    const filteredStories = allStories.filter(s => s.projectId !== id)
    localStorage.setItem(STORIES_KEY, JSON.stringify(filteredStories))
  }

  private getGlobalStories(): Story[] {
    const data = localStorage.getItem(STORIES_KEY)
    return data ? JSON.parse(data) : []
  }
}

export class StoryService {
  getAll(projectId: string): Story[] {
    const data = localStorage.getItem(STORIES_KEY)
    const allStories: Story[] = data ? JSON.parse(data) : []
    return allStories.filter(story => story.projectId === projectId)
  }

  private getAllFromStorage(): Story[] {
    const data = localStorage.getItem(STORIES_KEY)
    return data ? JSON.parse(data) : []
  }

  saveAll(storiesInProject: Story[], projectId: string) {
    const allStories = this.getAllFromStorage()
    const otherProjectsStories = allStories.filter(s => s.projectId !== projectId)
    const updatedTotalList = [...otherProjectsStories, ...storiesInProject]
    
    localStorage.setItem(STORIES_KEY, JSON.stringify(updatedTotalList))
  }

  create(story: Story) {
    const allStories = this.getAllFromStorage()
    allStories.push(story)
    localStorage.setItem(STORIES_KEY, JSON.stringify(allStories))
  }

  update(updatedStory: Story) {
    const allStories = this.getAllFromStorage()
    const updatedList = allStories.map(s =>
      s.id === updatedStory.id ? updatedStory : s
    )
    localStorage.setItem(STORIES_KEY, JSON.stringify(updatedList))
  }

  delete(id: string) {
    const allStories = this.getAllFromStorage()
    const filteredList = allStories.filter(s => s.id !== id)
    localStorage.setItem(STORIES_KEY, JSON.stringify(filteredList))
  }
}