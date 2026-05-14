import { Page } from '@playwright/test'

export const TEST_USER = {
  id: 'test-user-001',
  firstName: 'Test',
  lastName: 'Developer',
  email: 'test@example.com',
  role: 'developer',
  blocked: false,
}

export const TEST_PROJECT = {
  id: 'test-project-001',
  name: 'Projekt Testowy',
  description: 'Opis testowego projektu',
}

export const TEST_STORY = {
  id: 'test-story-001',
  name: 'Testowa Historyjka',
  description: 'Opis historyjki',
  priority: 'medium',
  projectId: TEST_PROJECT.id,
  ownerId: TEST_USER.id,
  createdAt: '2026-01-01T00:00:00.000Z',
  status: 'todo',
}

export const TEST_TASK = {
  id: 'test-task-001',
  name: 'Testowe Zadanie',
  description: 'Opis zadania',
  priority: 'medium',
  storyId: TEST_STORY.id,
  estimatedTime: 2,
  status: 'todo',
  createdAt: '2026-01-01T00:00:00.000Z',
}

interface SetupOptions {
  projects?: typeof TEST_PROJECT[]
  stories?: typeof TEST_STORY[]
  tasks?: typeof TEST_TASK[]
  activeProjectId?: string
}

export async function setupPage(page: Page, options: SetupOptions = {}): Promise<void> {
  await page.addInitScript(
    ({ user, opts }) => {
      localStorage.clear()
      localStorage.setItem('current_user_id', user.id)
      localStorage.setItem('app_users', JSON.stringify([user]))
      if (opts.projects?.length)
        localStorage.setItem('projects', JSON.stringify(opts.projects))
      if (opts.stories?.length)
        localStorage.setItem('stories', JSON.stringify(opts.stories))
      if (opts.tasks?.length)
        localStorage.setItem('tasks', JSON.stringify(opts.tasks))
      if (opts.activeProjectId)
        localStorage.setItem('active_project_id', opts.activeProjectId)
    },
    { user: TEST_USER, opts: options }
  )

  await page.goto('/')
  await page.waitForSelector('#app-wrapper', { state: 'visible' })
}

export async function dismissPopupIfVisible(page: Page): Promise<void> {
  const popup = page.locator('#notif-popup')
  if (await popup.isVisible({ timeout: 500 }).catch(() => false)) {
    await page.click('#notif-popup-dismiss')
    await popup.waitFor({ state: 'hidden' })
  }
}
