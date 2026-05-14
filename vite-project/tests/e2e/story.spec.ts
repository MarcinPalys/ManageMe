import { test, expect } from '@playwright/test'
import { setupPage, TEST_PROJECT, TEST_STORY, dismissPopupIfVisible } from './helpers/setup'

test.describe('Historyjki', () => {
  test('Utworzenie nowej historyjki', async ({ page }) => {
    await setupPage(page, {
      projects: [TEST_PROJECT],
      activeProjectId: TEST_PROJECT.id,
    })

    await page.fill('#storyName', 'Nowa Historyjka')
    await page.fill('#storyDesc', 'Opis nowej historyjki')
    await page.selectOption('#storyPriority', 'high')
    await page.click('#addStoryBtn')

    await expect(page.locator('#col-todo')).toContainText('Nowa Historyjka')
  })

  test('Zmiana statusu historyjki (todo → doing → done)', async ({ page }) => {
    await setupPage(page, {
      projects: [TEST_PROJECT],
      stories: [TEST_STORY],
      activeProjectId: TEST_PROJECT.id,
    })

    await expect(page.locator('#col-todo')).toContainText(TEST_STORY.name)

    await page.locator('#col-todo .card .next').click()
    await expect(page.locator('#col-doing')).toContainText(TEST_STORY.name)

    await page.locator('#col-doing .card .next').click()
    await expect(page.locator('#col-done')).toContainText(TEST_STORY.name)
  })

  test('Usunięcie historyjki', async ({ page }) => {
    await setupPage(page, {
      projects: [TEST_PROJECT],
      stories: [TEST_STORY],
      activeProjectId: TEST_PROJECT.id,
    })

    await expect(page.locator('#col-todo')).toContainText(TEST_STORY.name)

    await page.locator('#col-todo .card .delete-story').click()

    await expect(page.locator('#col-todo')).not.toContainText(TEST_STORY.name)
    await dismissPopupIfVisible(page)
  })

  test('Przejście do tasków historyjki i powrót', async ({ page }) => {
    await setupPage(page, {
      projects: [TEST_PROJECT],
      stories: [TEST_STORY],
      activeProjectId: TEST_PROJECT.id,
    })

    await page.locator('#col-todo .card b').click()

    await expect(page.locator('#task-view-header')).toBeVisible()
    await expect(page.locator('#selected-story-name')).toContainText(TEST_STORY.name)

    await page.click('#backToStoriesBtn')

    await expect(page.locator('#task-view-header')).toBeHidden()
    await expect(page.locator('#col-todo')).toContainText(TEST_STORY.name)
  })
})
