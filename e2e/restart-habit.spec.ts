import { test, expect } from './base-test'
import {
  setupLocalStorage,
  createAppData,
  createIncreaseHabit,
  createEntry,
  EditHabitPage,
  TodayPage,
} from './fixtures'

/**
 * Tests E2E pour le "Nouveau départ" d'habitude
 * Vérifie le flux complet : édition → saisir nouvelle valeur → confirmer → dose du jour mise à jour
 */

const HABIT_ID = 'habit-restart-test'

const createRestartTestData = () =>
  createAppData({
    habits: [
      createIncreaseHabit({
        id: HABIT_ID,
        name: 'Push-ups',
        emoji: '💪',
        startValue: 10,
        unit: 'répétitions',
        targetValue: 50,
        createdAt: '2026-01-01',
        progression: {
          mode: 'absolute',
          value: 1,
          period: 'weekly',
        },
      }),
    ],
    entries: [
      createEntry({
        habitId: HABIT_ID,
        date: '2026-02-25',
        targetDose: 18,
        actualValue: 18,
      }),
      createEntry({
        habitId: HABIT_ID,
        date: '2026-02-26',
        targetDose: 18,
        actualValue: 15,
      }),
    ],
  })

/** Locator pour la section "Nouveau départ" */
function restartSection(page: import('@playwright/test').Page) {
  return page.locator('.edit-habit__restart-section')
}

test.describe('Nouveau départ d\'habitude', () => {
  test.beforeEach(async ({ page }) => {
    await setupLocalStorage(page, createRestartTestData())
  })

  test('flux complet : saisir nouvelle valeur, confirmer, dose du jour mise à jour', async ({
    page,
  }) => {
    // 1. Aller à la page d'édition
    const editPage = new EditHabitPage(page)
    await editPage.goto(HABIT_ID)
    await editPage.expectLoaded()

    // 2. Scroller vers la section et vérifier qu'elle est visible
    const section = restartSection(page)
    await section.scrollIntoViewIfNeeded()
    await expect(section).toBeVisible()

    // 3. Vérifier que la valeur actuelle est affichée
    await expect(section.getByText('Valeur actuelle')).toBeVisible()

    // 4. Saisir une nouvelle valeur de départ
    await section.getByLabel('Nouvelle valeur de départ').fill('5')

    // 5. Cliquer sur le bouton "Nouveau départ"
    await section.getByRole('button', { name: 'Nouveau départ' }).click()

    // 6. Vérifier que la confirmation apparaît
    await expect(section.getByText('passera de 10 à 5')).toBeVisible()

    // 7. Confirmer
    await section.getByRole('button', { name: 'Confirmer' }).click()

    // 8. Vérifier la redirection vers la page détail
    await page.waitForURL(new RegExp(`/habits/${HABIT_ID}$`), { timeout: 10000 })

    // 9. Vérifier la nouvelle valeur en naviguant vers Today via le menu (pas page.goto pour éviter que addInitScript ne restaure les données)
    await page.getByRole('link', { name: "Aujourd'hui" }).click()
    await page.waitForSelector('h3:has-text("Push-ups")')

    // La dose du jour devrait refléter la nouvelle valeur de départ (5)
    const habitCard = page.locator('.habit-card').filter({ hasText: 'Push-ups' })
    await expect(habitCard).toBeVisible()
    // La dose cible devrait être 5 (nouvelle startValue, createdAt = aujourd'hui donc pas de progression)
    await expect(habitCard.locator('.habit-card__dose-value')).toContainText('5')
  })

  test('saisir une raison optionnelle pour le nouveau départ', async ({ page }) => {
    const editPage = new EditHabitPage(page)
    await editPage.goto(HABIT_ID)

    const section = restartSection(page)
    await section.scrollIntoViewIfNeeded()

    // Saisir la nouvelle valeur
    await section.getByLabel('Nouvelle valeur de départ').fill('8')

    // Saisir une raison
    await section.getByLabel('Raison (optionnel)').fill('Reprise après une blessure')

    // Cliquer sur "Nouveau départ" puis confirmer
    await section.getByRole('button', { name: 'Nouveau départ' }).click()
    await expect(section.getByText('passera de 10 à 8')).toBeVisible()
    await section.getByRole('button', { name: 'Confirmer' }).click()

    // Vérifier la redirection
    await page.waitForURL(new RegExp(`/habits/${HABIT_ID}$`), { timeout: 10000 })
  })

  test('le bouton est désactivé si valeur invalide', async ({ page }) => {
    const editPage = new EditHabitPage(page)
    await editPage.goto(HABIT_ID)

    const section = restartSection(page)
    await section.scrollIntoViewIfNeeded()

    // Le bouton "Nouveau départ" doit être désactivé sans valeur
    const restartButton = section.getByRole('button', { name: 'Nouveau départ' })
    await expect(restartButton).toBeDisabled()

    // Saisir une valeur invalide (0)
    await section.getByLabel('Nouvelle valeur de départ').fill('0')
    await expect(restartButton).toBeDisabled()

    // Saisir une valeur valide
    await section.getByLabel('Nouvelle valeur de départ').fill('5')
    await expect(restartButton).toBeEnabled()
  })

  test('annuler la confirmation revient au formulaire', async ({ page }) => {
    const editPage = new EditHabitPage(page)
    await editPage.goto(HABIT_ID)

    const section = restartSection(page)
    await section.scrollIntoViewIfNeeded()

    // Saisir une valeur et afficher la confirmation
    await section.getByLabel('Nouvelle valeur de départ').fill('5')
    await section.getByRole('button', { name: 'Nouveau départ' }).click()

    // Vérifier la confirmation
    await expect(section.getByText('passera de 10 à 5')).toBeVisible()

    // Annuler (scoper au bloc de confirmation dans la section restart)
    await section.locator('.edit-habit__restart-confirm').getByRole('button', { name: 'Annuler' }).click()

    // La confirmation doit disparaître, le bouton "Nouveau départ" revient
    await expect(section.getByRole('button', { name: 'Nouveau départ' })).toBeVisible()
  })

  test('l\'historique des entrées est préservé après un nouveau départ', async ({ page }) => {
    const editPage = new EditHabitPage(page)
    await editPage.goto(HABIT_ID)

    const section = restartSection(page)
    await section.scrollIntoViewIfNeeded()

    // Effectuer le nouveau départ
    await section.getByLabel('Nouvelle valeur de départ').fill('5')
    await section.getByRole('button', { name: 'Nouveau départ' }).click()
    await section.getByRole('button', { name: 'Confirmer' }).click()

    // Vérifier la redirection vers la page détail
    await page.waitForURL(new RegExp(`/habits/${HABIT_ID}$`), { timeout: 10000 })

    // Vérifier que les données sont dans localStorage
    const storedData = await page.evaluate(() => {
      const raw = localStorage.getItem('doucement_data')
      return raw ? JSON.parse(raw) : null
    })

    // L'historique des entrées doit toujours être là
    expect(storedData.entries.length).toBe(2)

    // L'habitude doit avoir la nouvelle startValue
    const habit = storedData.habits.find((h: { id: string }) => h.id === HABIT_ID)
    expect(habit.startValue).toBe(5)

    // L'habitude doit avoir un recalibrationHistory avec le restart
    expect(habit.recalibrationHistory).toBeDefined()
    expect(habit.recalibrationHistory.length).toBe(1)
    expect(habit.recalibrationHistory[0].type).toBe('restart')
    expect(habit.recalibrationHistory[0].previousStartValue).toBe(10)
    expect(habit.recalibrationHistory[0].newStartValue).toBe(5)
  })

  test('section invisible pour habitude maintain', async ({ page }) => {
    const maintainData = createAppData({
      habits: [
        {
          id: 'habit-maintain',
          name: 'Eau',
          emoji: '💧',
          direction: 'maintain',
          startValue: 8,
          unit: 'verres',
          progression: null,
          createdAt: '2026-01-01',
          archivedAt: null,
          trackingMode: 'simple',
        },
      ],
    })
    await setupLocalStorage(page, maintainData)

    const editPage = new EditHabitPage(page)
    await editPage.goto('habit-maintain')
    await editPage.expectLoaded()

    // La section "Nouveau départ" ne doit pas être visible pour maintain
    await expect(page.locator('.edit-habit__restart-section')).not.toBeVisible()
  })
})
