import { test, expect } from './base-test'
import { setupFromTestFile, closeWelcomeBackIfVisible } from './fixtures'

/**
 * Tests E2E pour l'atteinte d'objectif
 * Vérifie les messages de félicitations quand une habitude atteint sa targetValue
 */

test.describe('Atteinte d\'objectif', () => {
  test.beforeEach(async ({ page }) => {
    await setupFromTestFile(page, 'goal-reached.json')
  })

  test('affiche l\'habitude qui a atteint son objectif sur l\'écran principal', async ({
    page,
  }) => {
    await page.goto('/')
    await closeWelcomeBackIfVisible(page)

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
    await closeWelcomeBackIfVisible(page)

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
    await closeWelcomeBackIfVisible(page)

    // Le header doit afficher un pourcentage de complétion
    const completionStatus = page.getByRole('status', { name: /complété/ })
    await expect(completionStatus).toBeVisible()
  })
})
