import { test, expect } from './base-test'
import {
  setupLocalStorage,
  createAppData,
  createHabit,
  createDecreaseHabit,
  createEmptyAppData,
  CreateHabitPage,
} from './fixtures'

/**
 * Tests E2E pour les modes d'agrégation hebdomadaire
 * - count-days: Compte les jours où l'objectif est atteint
 * - sum-units: Additionne les unités sur toute la semaine
 */

test.describe('Agrégation count-days (jours réussis)', () => {
  test.beforeEach(async ({ page }) => {
    // Données de test pour habitude hebdomadaire avec count-days (ex: se coucher tôt)
    const countDaysData = createAppData({
      habits: [
        createHabit({
          id: 'habit-bedtime-weekly',
          name: 'Se coucher tôt',
          emoji: '🌙',
          direction: 'increase',
          startValue: 3, // Objectif: 3 soirs par semaine
          unit: 'soirs/semaine',
          progression: null,
          trackingMode: 'simple',
          trackingFrequency: 'weekly',
          weeklyAggregation: 'count-days',
        }),
      ],
    })
    await setupLocalStorage(page, countDaysData)
    await page.goto('/')
    await page.waitForSelector('h3:has-text("Se coucher tôt")')
  })

  test('affiche le compteur de jours réussis', async ({ page }) => {
    // Vérifier que l'habitude est affichée
    await expect(page.getByRole('heading', { name: 'Se coucher tôt' })).toBeVisible()
    await expect(page.getByText('🌙').first()).toBeVisible()

    // Pour une habitude weekly simple avec count-days, on devrait voir X/Y jours
    // L'affichage est "0/3 cette semaine"
    await expect(page.getByText('0/3')).toBeVisible()
  })

  test('boutons de check-in simples pour count-days', async ({ page }) => {
    // Mode simple: boutons "Fait" et "Pas aujourd'hui"
    await expect(page.getByRole('button', { name: 'Fait' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Pas aujourd/i })).toBeVisible()
  })

  test('check-in incrémente le compteur de jours', async ({ page }) => {
    // Cliquer sur "Fait"
    await page.getByRole('button', { name: 'Fait' }).click()

    // Le compteur devrait passer à 1/3
    await expect(page.getByText('1/3')).toBeVisible()
  })
})

test.describe('Agrégation sum-units avec compteur daily', () => {
  test.beforeEach(async ({ page }) => {
    // Données de test pour habitude daily avec mode compteur
    const sumUnitsDailyData = createAppData({
      habits: [
        createDecreaseHabit({
          id: 'habit-alcohol-daily',
          name: "Verres d'alcool",
          emoji: '🍷',
          startValue: 3, // Objectif quotidien: max 3 verres
          unit: 'verres',
          trackingMode: 'counter',
          trackingFrequency: 'daily',
          entryMode: 'cumulative',
        }),
      ],
    })
    await setupLocalStorage(page, sumUnitsDailyData)
    await page.goto('/')
    await page.waitForSelector('h3:has-text("Verres d\'alcool")')
  })

  test('affiche les boutons compteur pour habitude daily decrease', async ({ page }) => {
    // Vérifier que l'habitude est affichée
    await expect(page.getByRole('heading', { name: "Verres d'alcool" })).toBeVisible()
    await expect(page.getByText('🍷')).toBeVisible()

    // Pour une habitude daily avec mode counter, on voit les boutons compteur
    await expect(page.getByRole('button', { name: /Ajouter 1/i })).toBeVisible()
  })

  test('boutons compteur avec couleurs decrease', async ({ page }) => {
    // Pour decrease, +1 devrait être attention (ajouter de la consommation)
    const addButton = page.getByRole('button', { name: /Ajouter 1/i })
    await expect(addButton).toBeVisible()
    await expect(addButton).toHaveClass(/counter-buttons__btn--attention/)
  })

  test("ajouter des unités s'accumule dans la journée", async ({ page }) => {
    // Ajouter 2 verres
    await page.getByRole('button', { name: /Ajouter 1/i }).click()
    await page.getByRole('button', { name: /Ajouter 1/i }).click()

    // Le total devrait être 2
    await expect(page.locator('.counter-buttons__current').filter({ hasText: '2' })).toBeVisible()
  })

  test('annuler réduit le total', async ({ page }) => {
    // Ajouter 3 puis annuler 1
    await page.getByRole('button', { name: /Ajouter 1/i }).click()
    await page.getByRole('button', { name: /Ajouter 1/i }).click()
    await page.getByRole('button', { name: /Ajouter 1/i }).click()
    await expect(page.locator('.counter-buttons__current').filter({ hasText: '3' })).toBeVisible()

    await page.getByRole('button', { name: 'Annuler', exact: true }).click()
    await expect(page.locator('.counter-buttons__current').filter({ hasText: '2' })).toBeVisible()
  })
})

test.describe('Agrégation sum-units avec habitude weekly', () => {
  test.beforeEach(async ({ page }) => {
    // Données de test pour habitude hebdomadaire avec sum-units (ex: alcool)
    const sumUnitsData = createAppData({
      habits: [
        createDecreaseHabit({
          id: 'habit-alcohol-weekly',
          name: "Verres d'alcool",
          emoji: '🍷',
          startValue: 7, // Objectif: max 7 verres par semaine
          unit: 'verres/semaine',
          trackingMode: 'counter',
          trackingFrequency: 'weekly',
          weeklyAggregation: 'sum-units',
        }),
      ],
    })
    await setupLocalStorage(page, sumUnitsData)
    await page.goto('/')
    await page.waitForSelector('h3:has-text("Verres d\'alcool")')
  })

  test('affiche le compteur de semaine pour habitude weekly sum-units', async ({ page }) => {
    // Vérifier que l'habitude est affichée
    await expect(page.getByRole('heading', { name: "Verres d'alcool" })).toBeVisible()
    await expect(page.getByText('🍷')).toBeVisible()

    // Les habitudes weekly affichent un compteur X/Y cette semaine
    await expect(page.getByText(/cette semaine/)).toBeVisible()
  })

  test('boutons Fait/Pas aujourd\'hui pour weekly', async ({ page }) => {
    // Les habitudes weekly utilisent les boutons simples
    await expect(page.getByRole('button', { name: 'Fait' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Pas aujourd/i })).toBeVisible()
  })
})

test.describe('Options de création d\'habitude', () => {
  let createHabitPage: CreateHabitPage

  test.beforeEach(async ({ page }) => {
    createHabitPage = new CreateHabitPage(page)
    await setupLocalStorage(page, createEmptyAppData())
    await createHabitPage.goto()
  })

  test('options de mode de suivi sont disponibles', async ({ page }) => {
    // Créer une habitude personnalisée
    await createHabitPage.clickCreateCustomHabit()
    await createHabitPage.selectType('increase')
    await createHabitPage.clickContinue()

    // Remplir les détails
    await createHabitPage.setName('Sport')
    await createHabitPage.setUnit('séances')
    await createHabitPage.setStartValue(3)

    // Vérifier que les options de mode de suivi sont présentes
    await expect(page.getByRole('button', { name: /Simple/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Détaillé/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Compteur/i })).toBeVisible()
  })
})
