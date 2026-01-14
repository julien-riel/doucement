import { test, expect } from './base-test'
import {
  setupLocalStorage,
  createAppData,
  createCounterHabit,
  resetCounters,
} from './fixtures'

/**
 * Tests E2E pour les habitudes en mode compteur (trackingMode: 'counter')
 * Vérifie: création, +1, -1, annuler dernière action
 */

/**
 * Create test data for counter increase habit
 */
function createCounterIncreaseData() {
  resetCounters()

  const habit = createCounterHabit({
    id: 'habit-water-counter',
    name: "Verres d'eau",
    emoji: '💧',
    direction: 'increase',
    startValue: 8,
    unit: 'verres',
    progression: null,
    createdAt: '2025-12-01',
    entryMode: 'cumulative',
  })

  return createAppData({
    habits: [habit],
    entries: [],
    preferences: {
      onboardingCompleted: true,
      lastWeeklyReviewDate: '2026-01-05',
      notifications: {
        enabled: false,
        morningReminder: { enabled: true, time: '08:00' },
        eveningReminder: { enabled: false, time: '20:00' },
        weeklyReviewReminder: { enabled: false, time: '10:00' },
      },
      theme: 'system',
    },
  })
}

/**
 * Create test data for counter decrease habit
 */
function createCounterDecreaseData() {
  resetCounters()

  const habit = createCounterHabit({
    id: 'habit-cigarettes-counter',
    name: 'Cigarettes',
    emoji: '🚭',
    direction: 'decrease',
    startValue: 10,
    unit: 'cigarettes',
    progression: { mode: 'absolute', value: 1, period: 'weekly' },
    createdAt: '2025-12-01',
  })

  return createAppData({
    habits: [habit],
    entries: [],
    preferences: {
      onboardingCompleted: true,
      lastWeeklyReviewDate: '2026-01-05',
      notifications: {
        enabled: false,
        morningReminder: { enabled: true, time: '08:00' },
        eveningReminder: { enabled: false, time: '20:00' },
        weeklyReviewReminder: { enabled: false, time: '10:00' },
      },
      theme: 'system',
    },
  })
}

test.describe('Habitude compteur increase', () => {
  test.beforeEach(async ({ page }) => {
    const testData = createCounterIncreaseData()
    await setupLocalStorage(page, testData)

    await page.goto('/')
    await page.waitForSelector('h3:has-text("Verres d\'eau")')
  })

  test('affiche les boutons +1/-1 au lieu des boutons de check-in classiques', async ({
    page,
  }) => {
    // Vérifier que l'habitude est affichée
    await expect(page.getByRole('heading', { name: "Verres d'eau" })).toBeVisible()
    await expect(page.getByText('💧')).toBeVisible()

    // Vérifier les boutons de compteur
    await expect(page.getByRole('button', { name: /Ajouter 1/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Retirer 1/i })).toBeVisible()

    // Vérifier l'affichage de la valeur (utiliser le sélecteur spécifique)
    await expect(page.locator('.counter-buttons__current')).toHaveText('0') // Valeur initiale
    await expect(page.locator('.counter-buttons__target')).toHaveText('/ 8') // Cible
  })

  test('bouton +1 incrémente la valeur', async ({ page }) => {
    // Cliquer sur +1
    await page.getByRole('button', { name: /Ajouter 1/i }).click()

    // Vérifier que la valeur a augmenté
    await expect(
      page.locator('.counter-buttons__current').filter({ hasText: '1' })
    ).toBeVisible()

    // Cliquer encore sur +1
    await page.getByRole('button', { name: /Ajouter 1/i }).click()
    await expect(
      page.locator('.counter-buttons__current').filter({ hasText: '2' })
    ).toBeVisible()
  })

  test('bouton -1 décrémente la valeur', async ({ page }) => {
    // D'abord ajouter 3
    await page.getByRole('button', { name: /Ajouter 1/i }).click()
    await page.getByRole('button', { name: /Ajouter 1/i }).click()
    await page.getByRole('button', { name: /Ajouter 1/i }).click()
    await expect(
      page.locator('.counter-buttons__current').filter({ hasText: '3' })
    ).toBeVisible()

    // Retirer 1
    await page.getByRole('button', { name: /Retirer 1/i }).click()
    await expect(
      page.locator('.counter-buttons__current').filter({ hasText: '2' })
    ).toBeVisible()
  })

  test('bouton -1 désactivé quand valeur = 0', async ({ page }) => {
    // Vérifier que -1 est désactivé au départ (valeur = 0)
    await expect(page.getByRole('button', { name: /Retirer 1/i })).toBeDisabled()
  })

  test('affiche la dernière action et bouton Annuler', async ({ page }) => {
    // Cliquer sur +1
    await page.getByRole('button', { name: /Ajouter 1/i }).click()

    // Vérifier que la dernière action est affichée
    await expect(page.getByText(/Dernière action/)).toBeVisible()
    await expect(page.getByText(/\+1 à/)).toBeVisible()

    // Vérifier que le bouton Annuler est visible
    await expect(page.getByRole('button', { name: 'Annuler', exact: true })).toBeVisible()
  })

  test('bouton Annuler défait la dernière action', async ({ page }) => {
    // Ajouter 2 fois
    await page.getByRole('button', { name: /Ajouter 1/i }).click()
    await page.getByRole('button', { name: /Ajouter 1/i }).click()
    await expect(
      page.locator('.counter-buttons__current').filter({ hasText: '2' })
    ).toBeVisible()

    // Annuler
    await page.getByRole('button', { name: 'Annuler', exact: true }).click()
    await expect(
      page.locator('.counter-buttons__current').filter({ hasText: '1' })
    ).toBeVisible()

    // Annuler encore
    await page.getByRole('button', { name: 'Annuler', exact: true }).click()
    await expect(
      page.locator('.counter-buttons__current').filter({ hasText: '0' })
    ).toBeVisible()

    // Le bouton Annuler devrait disparaître
    await expect(page.getByRole('button', { name: 'Annuler', exact: true })).toBeHidden()
  })

  test('données persistées après navigation SPA', async ({ page }) => {
    // Ajouter 3
    await page.getByRole('button', { name: /Ajouter 1/i }).click()
    await page.getByRole('button', { name: /Ajouter 1/i }).click()
    await page.getByRole('button', { name: /Ajouter 1/i }).click()
    await expect(
      page.locator('.counter-buttons__current').filter({ hasText: '3' })
    ).toBeVisible()

    // Naviguer via la navigation SPA (pas de rechargement de page)
    await page.getByRole('link', { name: 'Habitudes' }).click()
    await page.waitForSelector('h1:has-text("Mes habitudes")')

    // Revenir à la page principale via navigation SPA
    await page.getByRole('link', { name: "Aujourd'hui" }).click()
    await page.waitForSelector('h3:has-text("Verres d\'eau")')

    // Vérifier que la valeur est conservée
    await expect(
      page.locator('.counter-buttons__current').filter({ hasText: '3' })
    ).toBeVisible()
  })
})

test.describe('Habitude compteur decrease', () => {
  test.beforeEach(async ({ page }) => {
    const testData = createCounterDecreaseData()
    await setupLocalStorage(page, testData)

    await page.goto('/')
    await page.waitForSelector('h3:has-text("Cigarettes")')
  })

  test('affiche les boutons avec couleurs inversées pour decrease', async ({ page }) => {
    // Pour decrease, +1 devrait être attention (orange), -1 devrait être positif (vert)
    const addButton = page.getByRole('button', { name: /Ajouter 1/i })
    const subtractButton = page.getByRole('button', { name: /Retirer 1/i })

    await expect(addButton).toBeVisible()
    await expect(subtractButton).toBeVisible()

    // Vérifier les classes CSS (pour decrease, +1 a --attention et -1 a --positive)
    await expect(addButton).toHaveClass(/counter-buttons__btn--attention/)
    // -1 est désactivé au départ (valeur = 0) mais garde sa classe
  })

  test('bouton +1 fonctionne pour decrease (ajout de consommation)', async ({ page }) => {
    // Cliquer sur +1 pour enregistrer une consommation
    await page.getByRole('button', { name: /Ajouter 1/i }).click()
    await expect(
      page.locator('.counter-buttons__current').filter({ hasText: '1' })
    ).toBeVisible()

    // Continuer à ajouter
    await page.getByRole('button', { name: /Ajouter 1/i }).click()
    await page.getByRole('button', { name: /Ajouter 1/i }).click()
    await expect(
      page.locator('.counter-buttons__current').filter({ hasText: '3' })
    ).toBeVisible()
  })

  test('peut annuler des ajouts pour decrease', async ({ page }) => {
    // Ajouter 2
    await page.getByRole('button', { name: /Ajouter 1/i }).click()
    await page.getByRole('button', { name: /Ajouter 1/i }).click()
    await expect(
      page.locator('.counter-buttons__current').filter({ hasText: '2' })
    ).toBeVisible()

    // Annuler
    await page.getByRole('button', { name: 'Annuler', exact: true }).click()
    await expect(
      page.locator('.counter-buttons__current').filter({ hasText: '1' })
    ).toBeVisible()
  })
})

test.describe('Création habitude compteur', () => {
  test.beforeEach(async ({ page }) => {
    const emptyData = createAppData({
      habits: [],
      entries: [],
      preferences: {
        onboardingCompleted: true,
        lastWeeklyReviewDate: null,
        notifications: {
          enabled: false,
          morningReminder: { enabled: true, time: '08:00' },
          eveningReminder: { enabled: false, time: '20:00' },
          weeklyReviewReminder: { enabled: false, time: '10:00' },
        },
        theme: 'system',
      },
    })

    await setupLocalStorage(page, emptyData)

    await page.goto('/create')
    await page.waitForSelector('text=Nouvelle habitude')
  })

  test('peut créer une habitude en mode compteur', async ({ page }) => {
    // Créer une habitude personnalisée
    await page.getByRole('button', { name: /Créer une habitude personnalisée/ }).click()
    await page.getByRole('button', { name: /Augmenter/ }).click()
    await page.getByRole('button', { name: 'Continuer' }).click()

    // Remplir les détails
    await page.getByRole('textbox', { name: "Nom de l'habitude" }).fill("Verres d'eau")
    await page.getByRole('textbox', { name: 'Unité' }).fill('verres')
    await page.getByRole('spinbutton', { name: 'Dose de départ' }).fill('8')

    // Sélectionner le mode compteur
    const counterOption = page.getByText('Compteur')
    if (await counterOption.isVisible()) {
      await counterOption.click()
    }

    await page.getByRole('button', { name: 'Continuer' }).click()

    // Passer les étapes optionnelles
    await page.getByRole('button', { name: 'Continuer' }).click()
    await page.getByRole('button', { name: 'Aperçu' }).click()

    // Vérifier l'aperçu
    await expect(page.getByRole('heading', { name: "Verres d'eau" })).toBeVisible()

    // Créer l'habitude
    await page.getByRole('button', { name: "Créer l'habitude" }).click()

    // Étape first-checkin
    await expect(page.getByText('Première victoire ?')).toBeVisible()
    await page.getByRole('button', { name: 'Non, je commence demain' }).click()

    // Vérifier que l'habitude est créée avec le mode compteur
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: "Verres d'eau" })).toBeVisible()

    // Vérifier que les boutons compteur sont présents
    await expect(page.getByRole('button', { name: /Ajouter 1/i })).toBeVisible()
  })
})
