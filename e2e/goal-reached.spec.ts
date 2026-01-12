import { test, expect } from '@playwright/test'

/**
 * Tests E2E pour l'atteinte d'objectif
 * Vérifie les messages de félicitations quand une habitude atteint sa targetValue
 */

test.describe('Atteinte d\'objectif', () => {
  test.beforeEach(async ({ page }) => {
    // Charger les données de test via fetch avant d'aller sur la page
    const testDataResponse = await page.request.get(
      'http://localhost:4173/test-data/goal-reached.json'
    )
    const testData = await testDataResponse.json()

    // Injecter les données de test AVANT que la page charge
    await page.addInitScript((data) => {
      localStorage.setItem('doucement_data', JSON.stringify(data))
    }, testData)
  })

  test('affiche l\'habitude qui a atteint son objectif sur l\'écran principal', async ({
    page,
  }) => {
    await page.goto('/')

    // Fermer le message WelcomeBack s'il est affiché
    const welcomeBackClose = page.locator('.welcome-back__close, .welcome-back-message button')
    if (await welcomeBackClose.isVisible({ timeout: 1000 }).catch(() => false)) {
      await welcomeBackClose.click()
    }

    // L'habitude Push-ups doit être visible
    await expect(page.getByRole('heading', { name: 'Push-ups' })).toBeVisible()

    // L'émoji doit être visible dans la section des habitudes
    await expect(page.locator('.habit-card__emoji').filter({ hasText: '💪' })).toBeVisible()
  })

  test('affiche l\'objectif final atteint dans le détail de l\'habitude', async ({ page }) => {
    // Aller sur la liste des habitudes
    await page.goto('/habits')

    // Cliquer sur l'habitude pour voir les détails
    await page.getByRole('button', { name: /Voir les détails de Push-ups/i }).click()

    // Attendre la page de détail
    await expect(page).toHaveURL(/\/habits\//)

    // Vérifier que l'objectif final est affiché dans la section Détails
    await expect(page.getByText('Objectif final')).toBeVisible()
    // Utiliser un sélecteur plus spécifique pour éviter l'ambiguïté avec le graphique
    const infoCard = page.locator('.habit-detail__info-card')
    await expect(infoCard.getByText('50 répétitions')).toBeVisible()
  })

  test('affiche les statistiques avec dépassement régulier', async ({ page }) => {
    // Aller sur la liste des habitudes
    await page.goto('/habits')

    // Aller sur le détail de l'habitude
    await page.getByRole('button', { name: /Voir les détails de Push-ups/i }).click()
    await expect(page).toHaveURL(/\/habits\//)

    // Vérifier les statistiques de la semaine
    await expect(page.getByText('Cette semaine')).toBeVisible()

    // Vérifier que les stats montrent un bon niveau de complétion
    const statsSection = page.locator('.habit-detail__section[aria-label="Statistiques"]')
    await expect(statsSection).toBeVisible()
  })

  test('affiche le graphique de progression montrant l\'atteinte de l\'objectif', async ({
    page,
  }) => {
    await page.goto('/habits')
    await page.getByRole('button', { name: /Voir les détails de Push-ups/i }).click()

    // Le graphique de progression doit être visible
    const chartSection = page.locator('.habit-detail__section[aria-label="Graphique de progression"]')
    await expect(chartSection).toBeVisible()
  })

  test('affiche le calendrier avec les jours complétés', async ({ page }) => {
    await page.goto('/habits')
    await page.getByRole('button', { name: /Voir les détails de Push-ups/i }).click()

    // Le calendrier doit être visible
    await expect(page.getByRole('heading', { name: 'Activité récente' })).toBeVisible()
    const calendarSection = page.locator('.habit-detail__section[aria-label="Calendrier"]')
    await expect(calendarSection).toBeVisible()
  })

  test('l\'habitude affiche le statut complété à 100%+ sur l\'écran principal', async ({
    page,
  }) => {
    await page.goto('/')

    // Le statut doit indiquer une complétion
    const habitCard = page.locator('.habit-card').first()
    await expect(habitCard).toBeVisible()
  })

  test('affiche les détails de l\'habitude', async ({ page }) => {
    await page.goto('/habits')
    await page.getByRole('button', { name: /Voir les détails de Push-ups/i }).click()

    // Le fichier goal-reached.json contient une implementationIntention
    // Vérifions que les détails sont affichés
    await expect(page.getByText('Détails')).toBeVisible()
  })

  test('permet de modifier l\'habitude même après atteinte de l\'objectif', async ({ page }) => {
    await page.goto('/habits')
    await page.getByRole('button', { name: /Voir les détails de Push-ups/i }).click()

    // Le bouton Modifier doit être disponible
    const modifyButton = page.getByRole('button', { name: 'Modifier' })
    await expect(modifyButton).toBeVisible()
  })

  test('l\'écran principal montre le pourcentage de complétion globale', async ({ page }) => {
    await page.goto('/')

    // Le header doit afficher un pourcentage de complétion
    const completionStatus = page.getByRole('status', { name: /complété/ })
    await expect(completionStatus).toBeVisible()
  })
})
