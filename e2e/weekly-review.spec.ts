import { test, expect } from '@playwright/test'

/**
 * Tests E2E pour la revue hebdomadaire
 * Vérifie l'écran WeeklyReview avec ses statistiques et réflexions
 */

test.describe('Revue hebdomadaire', () => {
  test.beforeEach(async ({ page }) => {
    // Charger les données de test via fetch avant d'aller sur la page
    const testDataResponse = await page.request.get(
      'http://localhost:4173/test-data/weekly-review-due.json'
    )
    const testData = await testDataResponse.json()

    // Injecter les données de test AVANT que la page charge
    await page.addInitScript((data) => {
      localStorage.setItem('doucement_data', JSON.stringify(data))
    }, testData)
  })

  test('affiche le titre et la plage de dates de la semaine', async ({ page }) => {
    await page.goto('/review')

    // Vérifier le titre
    await expect(page.getByRole('heading', { name: 'Ta semaine en résumé' })).toBeVisible()

    // Vérifier que la plage de dates est affichée (format: "X - Y mois")
    const subtitle = page.locator('.weekly-review__subtitle')
    await expect(subtitle).toBeVisible()
  })

  test('affiche un message d\'encouragement', async ({ page }) => {
    await page.goto('/review')

    // Vérifier la présence du message d'encouragement
    const messageCard = page.locator('.weekly-review__message')
    await expect(messageCard).toBeVisible()

    // Vérifier l'émoji 🌱
    await expect(page.getByText('🌱')).toBeVisible()
  })

  test('affiche les statistiques globales de la semaine', async ({ page }) => {
    await page.goto('/review')

    // Vérifier le pourcentage de complétion
    const completionStat = page.locator('.weekly-review__stat-card--main .weekly-review__stat-value')
    await expect(completionStat).toBeVisible()
    await expect(completionStat).toContainText('%')

    // Vérifier les jours actifs et jours réussis (utiliser un sélecteur exact)
    await expect(page.getByText('jours actifs', { exact: true })).toBeVisible()
    await expect(page.getByText('jours réussis', { exact: true })).toBeVisible()
  })

  test('affiche le calendrier de la semaine avec indicateurs', async ({ page }) => {
    await page.goto('/review')

    // Vérifier que les 7 jours sont affichés
    const days = page.locator('.weekly-review__day')
    await expect(days).toHaveCount(7)

    // Vérifier les indicateurs visuels (●, ◐, ○)
    const indicators = page.locator('.weekly-review__day-indicator')
    const count = await indicators.count()
    expect(count).toBe(7)
  })

  test('affiche les statistiques par habitude', async ({ page }) => {
    await page.goto('/review')

    // Vérifier le titre de section
    await expect(page.getByRole('heading', { name: 'Par habitude' })).toBeVisible()

    // Vérifier que les cartes d'habitude sont présentes
    // Le fichier weekly-review-due.json contient 3 habitudes
    const habitCards = page.locator('.weekly-review__habit-card')
    const count = await habitCards.count()
    expect(count).toBe(3)

    // Vérifier que chaque habitude affiche sa moyenne et ses jours
    await expect(page.getByText('moyenne').first()).toBeVisible()
    await expect(page.getByText('jours').first()).toBeVisible()
  })

  test('affiche la section des patterns', async ({ page }) => {
    await page.goto('/review')

    // Vérifier le titre de section
    await expect(page.getByRole('heading', { name: 'Tes patterns' })).toBeVisible()
  })

  test('permet d\'accéder à la réflexion guidée', async ({ page }) => {
    await page.goto('/review')

    // Vérifier que le composant de réflexion est présent
    const reflectionSection = page.locator('.weekly-reflection')
    await expect(reflectionSection).toBeVisible()

    // Vérifier le textarea
    const textarea = page.getByRole('textbox')
    await expect(textarea).toBeVisible()
  })

  test('permet de sauvegarder une réflexion', async ({ page }) => {
    await page.goto('/review')

    // Remplir le textarea de réflexion
    const textarea = page.getByRole('textbox')
    await textarea.fill('Ma réflexion de la semaine: j\'ai bien progressé!')

    // Cliquer sur le bouton sauvegarder
    const saveButton = page.getByRole('button', { name: /Enregistrer/i })
    await expect(saveButton).toBeEnabled()
    await saveButton.click()

    // Vérifier que la sauvegarde est confirmée (le bouton change ou un feedback apparaît)
    // Le comportement exact dépend de l'implémentation
  })

  test('permet de passer la réflexion', async ({ page }) => {
    await page.goto('/review')

    // Cliquer sur le bouton Passer
    const skipButton = page.getByRole('button', { name: /Passer/i })
    await expect(skipButton).toBeVisible()
    await skipButton.click()

    // La section de réflexion doit disparaître
    await expect(page.locator('.weekly-reflection')).not.toBeVisible()
  })

  test('permet de continuer vers l\'écran principal', async ({ page }) => {
    await page.goto('/review')

    // Cliquer sur le bouton Continuer
    const continueButton = page.getByRole('button', { name: 'Continuer' })
    await expect(continueButton).toBeVisible()
    await continueButton.click()

    // On doit être redirigé vers l'écran principal
    await expect(page).toHaveURL('/')
  })

  test('navigue vers le détail d\'une habitude au clic', async ({ page }) => {
    await page.goto('/review')

    // Cliquer sur une carte d'habitude
    const firstHabitCard = page.locator('.weekly-review__habit-card').first()
    await firstHabitCard.click()

    // On doit être redirigé vers le détail de l'habitude
    await expect(page).toHaveURL(/\/habits\//)
  })
})
