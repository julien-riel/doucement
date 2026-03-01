import { test, expect } from './base-test'
import {
  setupLocalStorage,
  setupFromTestFile,
  closeBlockingModals,
  createAppData,
  createIncreaseHabit,
  createEntry,
  StatisticsPage,
  getToday,
} from './fixtures'

/**
 * Tests E2E pour la page Statistiques
 * Vérifie la navigation, le changement de période, l'affichage des graphiques
 * et l'état vide
 */

test.describe('Page Statistiques', () => {
  test.describe('Navigation et accès', () => {
    test('navigation vers la page statistiques depuis la nav principale', async ({ page }) => {
      // Load test data from file
      await setupFromTestFile(page, 'full-scenario.json')
      await page.goto('/')

      // Close any blocking popups (WelcomeBack, TransitionSuggestion)
      await closeBlockingModals(page)

      // Click on Statistics link in navigation
      await page.getByRole('link', { name: /Statistiques|Statistics/i }).click()

      // Verify we're on the statistics page
      await expect(page).toHaveURL('/statistics')
      await expect(page.getByRole('heading', { name: 'Mes statistiques' })).toBeVisible()
    })

    test('affiche les statistiques avec des données', async ({ page }) => {
      await setupFromTestFile(page, 'full-scenario.json')

      const statsPage = new StatisticsPage(page)
      await statsPage.goto()

      // Wait for page to load (tablist is visible)
      await expect(statsPage.periodSelector).toBeVisible()

      // Close celebration modals if they appear
      await statsPage.closeCelebrationModalIfVisible()

      // Verify main elements are present
      await statsPage.expectLoaded()

      // Verify period selector tabs
      await expect(page.getByRole('tab', { name: 'Semaine' })).toBeVisible()
      await expect(page.getByRole('tab', { name: 'Mois' })).toBeVisible()
      await expect(page.getByRole('tab', { name: 'Année' })).toBeVisible()

      // Verify StatCards
      await statsPage.expectAverageStat()
      await statsPage.expectActiveDaysStat()
      await statsPage.expectHabitsCountStat()

      // Verify habit selector
      await expect(statsPage.habitSelector).toBeVisible()
    })
  })

  test.describe('Sélecteur de période', () => {
    let statsPage: StatisticsPage

    test.beforeEach(async ({ page }) => {
      await setupFromTestFile(page, 'full-scenario.json')

      statsPage = new StatisticsPage(page)
      await statsPage.goto()

      // Close celebration modals if they appear
      await statsPage.closeCelebrationModalIfVisible()

      // Wait for page to be fully loaded with statistics
      await expect(statsPage.periodSelector).toBeVisible({ timeout: 10000 })
    })

    test('changement de période Semaine', async ({ page }) => {
      await statsPage.selectPeriod('week')
      await statsPage.expectPeriodSelected('week')
    })

    test('changement de période Mois', async () => {
      // Month is selected by default, verify
      await statsPage.expectPeriodSelected('month')
    })

    test('changement de période Année', async () => {
      await statsPage.selectPeriod('year')
      await statsPage.expectPeriodSelected('year')
    })

    test('changement de période Tout', async () => {
      await statsPage.selectPeriod('all')
      await statsPage.expectPeriodSelected('all')
    })
  })

  test.describe("Sélecteur d'habitude", () => {
    test("permet de changer d'habitude", async ({ page }) => {
      await setupFromTestFile(page, 'full-scenario.json')

      const statsPage = new StatisticsPage(page)
      await statsPage.goto()

      // Verify the select exists
      await expect(statsPage.habitSelector).toBeVisible()

      // Change habit
      await statsPage.selectHabitByLabel('🧘 Méditation')

      // Verify option is selected
      await statsPage.expectHabitSelected('habit-meditation-full')
    })
  })

  test.describe('Graphiques', () => {
    let statsPage: StatisticsPage

    test.beforeEach(async ({ page }) => {
      await setupFromTestFile(page, 'full-scenario.json')

      statsPage = new StatisticsPage(page)
      await statsPage.goto()

      // Wait for page to load (tablist is visible) with extended timeout for charts
      await expect(statsPage.periodSelector).toBeVisible({ timeout: 10000 })

      // Close celebration modals if they appear
      await statsPage.closeCelebrationModalIfVisible()
    })

    test('affiche le graphique de progression', async () => {
      await statsPage.expectProgressionChartVisible()
    })

    test('affiche le calendrier heatmap', async () => {
      await statsPage.expectHeatmapVisible()
    })

    test('affiche le graphique de comparaison quand plusieurs habitudes', async ({ page }) => {
      await statsPage.expectComparisonChartVisible()
      // Note: There's an h2 and h3 "Comparaison", use the h2 of the section
      await expect(
        page.locator('.statistics__section-title').filter({ hasText: 'Comparaison' })
      ).toBeVisible()
    })
  })

  test.describe('Section Projections', () => {
    test('affiche la section projections pour une habitude avec targetValue', async ({ page }) => {
      await setupFromTestFile(page, 'full-scenario.json')

      const statsPage = new StatisticsPage(page)
      await statsPage.goto()

      // Push-ups has a targetValue of 50, so projection section should be visible
      // Select Push-ups (should be default)
      await statsPage.selectHabitByLabel('💪 Push-ups')

      // Verify projections section is present
      await statsPage.expectProjectionVisible()
    })
  })

  test.describe('État vide', () => {
    test('affiche un message quand aucune habitude', async ({ page }) => {
      const emptyData = createAppData({
        habits: [],
        entries: [],
        preferences: { onboardingCompleted: true },
      })

      await setupLocalStorage(page, emptyData)

      const statsPage = new StatisticsPage(page)
      await statsPage.goto()

      // Verify empty state message
      await statsPage.expectEmptyState()
      await expect(
        page.getByText(/Crée ta première habitude pour commencer à voir tes statistiques/)
      ).toBeVisible()
    })

    test('affiche un message quand pas assez de données', async ({ page }) => {
      // Create a habit with only 1 entry (below the minimum of 3)
      const today = getToday()
      const habit = createIncreaseHabit({
        id: 'habit-test',
        name: 'Test',
        emoji: '🧪',
        startValue: 10,
        unit: 'unités',
        progression: { mode: 'percentage', value: 5, period: 'weekly' },
        createdAt: today,
      })

      const entry = createEntry({
        id: 'e1',
        habitId: 'habit-test',
        date: today,
        targetDose: 10,
        actualValue: 10,
        createdAt: `${today}T10:00:00Z`,
        updatedAt: `${today}T10:00:00Z`,
      })

      const testData = createAppData({
        habits: [habit],
        entries: [entry],
        preferences: { onboardingCompleted: true },
      })

      await setupLocalStorage(page, testData)

      const statsPage = new StatisticsPage(page)
      await statsPage.goto()

      // Verify "not enough data" message
      await statsPage.expectNotEnoughDataState()
      await expect(page.getByText(/Tu en es à 1 jour/)).toBeVisible()
    })
  })

  test.describe('Accessibilité', () => {
    test('les graphiques ont des labels ARIA', async ({ page }) => {
      await setupFromTestFile(page, 'full-scenario.json')

      const statsPage = new StatisticsPage(page)
      await statsPage.goto()

      // Verify sections with aria-label
      await statsPage.expectAccessibilityLabels()
    })

    test('le sélecteur de période utilise des tabs accessibles', async ({ page }) => {
      await setupFromTestFile(page, 'full-scenario.json')

      const statsPage = new StatisticsPage(page)
      await statsPage.goto()

      // Verify accessible period selector
      await statsPage.expectAccessiblePeriodSelector()
    })
  })
})
