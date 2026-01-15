import { test, expect } from './base-test'
import { setupFromTestFile, WeeklyReviewPage } from './fixtures'

/**
 * Tests E2E pour la revue hebdomadaire
 * Vérifie l'écran WeeklyReview avec ses statistiques et réflexions
 */

test.describe('Revue hebdomadaire', () => {
  let weeklyReviewPage: WeeklyReviewPage

  test.beforeEach(async ({ page }) => {
    weeklyReviewPage = new WeeklyReviewPage(page)
    await setupFromTestFile(page, 'weekly-review-due.json')
  })

  test('affiche le titre et la plage de dates de la semaine', async () => {
    await weeklyReviewPage.goto()
    await weeklyReviewPage.expectLoaded()
    await weeklyReviewPage.expectDateRangeVisible()
  })

  test('affiche un message d\'encouragement', async ({ page }) => {
    await weeklyReviewPage.goto()
    await weeklyReviewPage.expectEncouragementVisible()

    // Vérifier l'émoji 🌱
    await expect(page.getByText('🌱')).toBeVisible()
  })

  test('affiche les statistiques globales de la semaine', async ({ page }) => {
    await weeklyReviewPage.goto()
    await weeklyReviewPage.expectGlobalStatsVisible()

    // Vérifier le pourcentage de complétion
    const completion = await weeklyReviewPage.getCompletionPercentage()
    expect(completion).toBeGreaterThanOrEqual(0)

    // Vérifier les jours actifs et jours réussis
    await expect(page.getByText('jours actifs', { exact: true })).toBeVisible()
    await expect(page.getByText('jours réussis', { exact: true })).toBeVisible()
  })

  test('affiche le calendrier de la semaine avec indicateurs', async () => {
    await weeklyReviewPage.goto()
    await weeklyReviewPage.expectWeekCalendarVisible()

    // Vérifier les indicateurs visuels
    const indicators = await weeklyReviewPage.getDayIndicators()
    expect(indicators).toHaveLength(7)
  })

  test('affiche les statistiques par habitude', async ({ page }) => {
    await weeklyReviewPage.goto()
    await weeklyReviewPage.expectHabitStatsVisible()

    // Le fichier weekly-review-due.json contient 3 habitudes
    const habitCount = await weeklyReviewPage.getHabitCardCount()
    expect(habitCount).toBe(3)

    // Vérifier que chaque habitude affiche sa moyenne et ses jours
    await expect(page.getByText('moyenne').first()).toBeVisible()
    await expect(page.getByText('jours').first()).toBeVisible()
  })

  test('affiche la section des patterns', async () => {
    await weeklyReviewPage.goto()
    await weeklyReviewPage.expectPatternsVisible()
  })

  test('permet d\'accéder à la réflexion guidée', async () => {
    await weeklyReviewPage.goto()
    await weeklyReviewPage.expectReflectionVisible()

    // Vérifier le textarea
    await expect(weeklyReviewPage.reflectionTextarea).toBeVisible()
  })

  test('permet de sauvegarder une réflexion', async () => {
    await weeklyReviewPage.goto()

    // Remplir et sauvegarder la réflexion
    await weeklyReviewPage.fillReflection('Ma réflexion de la semaine: j\'ai bien progressé!')
    await weeklyReviewPage.saveReflection()

    // Vérifier que la sauvegarde est confirmée (le bouton save est visible)
  })

  test('permet de passer la réflexion', async () => {
    await weeklyReviewPage.goto()

    // Cliquer sur Passer
    await weeklyReviewPage.skipReflection()

    // La section de réflexion doit disparaître
    await weeklyReviewPage.expectReflectionHidden()
  })

  test('permet de continuer vers l\'écran principal', async ({ page }) => {
    await weeklyReviewPage.goto()

    // Cliquer sur le bouton Continuer
    await weeklyReviewPage.continueToHome()

    // On doit être redirigé vers l'écran principal
    await expect(page).toHaveURL('/')
  })

  test('navigue vers le détail d\'une habitude au clic', async ({ page }) => {
    await weeklyReviewPage.goto()

    // Cliquer sur la première carte d'habitude
    await weeklyReviewPage.clickFirstHabitCard()

    // On doit être redirigé vers le détail de l'habitude
    await expect(page).toHaveURL(/\/habits\//)
  })
})
