import { test, expect } from '@playwright/test'
import { setupPage, TEST_PROJECT } from './helpers/setup'

test.describe('Projekty', () => {
  test('Utworzenie nowego projektu', async ({ page }) => {
    await setupPage(page)

    await page.fill('#name', 'Nowy Projekt')
    await page.fill('#description', 'Opis nowego projektu')
    await page.click('#addBtn')

    await expect(page.locator('#projects')).toContainText('Nowy Projekt')
    await expect(page.locator('#projects')).toContainText('Opis nowego projektu')
  })

  test('Edycja projektu', async ({ page }) => {
    await setupPage(page, { projects: [TEST_PROJECT] })

    await page.click('#projects .edit')

    await expect(page.locator('#name')).toHaveValue(TEST_PROJECT.name)
    await expect(page.locator('#description')).toHaveValue(TEST_PROJECT.description)
    await expect(page.locator('#addBtn')).toHaveText('Zapisz projekt')

    await page.fill('#name', 'Zmieniona Nazwa Projektu')
    await page.fill('#description', 'Zmieniony opis')
    await page.click('#addBtn')

    await expect(page.locator('#projects')).toContainText('Zmieniona Nazwa Projektu')
    await expect(page.locator('#projects')).toContainText('Zmieniony opis')
    await expect(page.locator('#projects')).not.toContainText(TEST_PROJECT.name)
    await expect(page.locator('#addBtn')).toHaveText('Dodaj projekt')
  })

  test('Usunięcie projektu', async ({ page }) => {
    await setupPage(page, { projects: [TEST_PROJECT] })

    await expect(page.locator('#projects')).toContainText(TEST_PROJECT.name)

    await page.click('#projects .delete')

    await expect(page.locator('#projects')).not.toContainText(TEST_PROJECT.name)
    await expect(page.locator('#story-section')).toBeHidden()
  })
})
