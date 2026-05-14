import { test, expect } from '@playwright/test'
import {
  setupPage,
  TEST_PROJECT,
  TEST_STORY,
  TEST_TASK,
  dismissPopupIfVisible,
} from './helpers/setup'

test.describe('Zadania (Taski)', () => {
  test('Utworzenie nowego zadania', async ({ page }) => {
    await setupPage(page, {
      projects: [TEST_PROJECT],
      stories: [TEST_STORY],
      activeProjectId: TEST_PROJECT.id,
    })

    await page.locator('#col-todo .card b').click()
    await expect(page.locator('#task-view-header')).toBeVisible()

    await page.fill('#taskName', 'Nowe Zadanie')
    await page.fill('#taskDesc', 'Opis nowego zadania')
    await page.fill('#taskTime', '3')
    await page.selectOption('#taskPriority', 'high')
    await page.click('#addTaskBtn')
    await dismissPopupIfVisible(page)

    await expect(page.locator('#col-todo')).toContainText('Nowe Zadanie')
  })

  test('Zmiana statusu zadania (oznaczenie jako done)', async ({ page }) => {
    await setupPage(page, {
      projects: [TEST_PROJECT],
      stories: [TEST_STORY],
      tasks: [TEST_TASK],
      activeProjectId: TEST_PROJECT.id,
    })

    await page.locator('#col-todo .card b').click()
    await expect(page.locator('#task-view-header')).toBeVisible()

    await expect(page.locator('#col-todo')).toContainText(TEST_TASK.name)

    await page.locator('#col-todo .done-task').click()
    await dismissPopupIfVisible(page)

    await expect(page.locator('#col-done')).toContainText(TEST_TASK.name)
    await expect(page.locator('#col-todo')).not.toContainText(TEST_TASK.name)
  })

  test('Zmiana statusu zadania przez modal', async ({ page }) => {
    await setupPage(page, {
      projects: [TEST_PROJECT],
      stories: [TEST_STORY],
      tasks: [TEST_TASK],
      activeProjectId: TEST_PROJECT.id,
    })

    await page.locator('#col-todo .card b').first().click()
    await expect(page.locator('#task-view-header')).toBeVisible()

    await page.locator('#col-todo .card b').click()
    await expect(page.locator('#taskModal')).toBeVisible()
    await expect(page.locator('#taskDetails')).toContainText(TEST_TASK.name)

    await page.click('#finishTaskBtn')
    await dismissPopupIfVisible(page)

    await expect(page.locator('#col-done')).toContainText(TEST_TASK.name)
  })

  test('Usunięcie zadania', async ({ page }) => {
    await setupPage(page, {
      projects: [TEST_PROJECT],
      stories: [TEST_STORY],
      tasks: [TEST_TASK],
      activeProjectId: TEST_PROJECT.id,
    })

    await page.locator('#col-todo .card b').click()
    await expect(page.locator('#task-view-header')).toBeVisible()

    await expect(page.locator('#col-todo')).toContainText(TEST_TASK.name)

    await page.locator('#col-todo .delete-task').click()
    await dismissPopupIfVisible(page)

    await expect(page.locator('#col-todo')).not.toContainText(TEST_TASK.name)
  })
})
