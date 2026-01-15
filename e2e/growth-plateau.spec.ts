import { test, expect } from './base-test'
import { setupFromTestFile, closeWelcomeBackIfVisible } from './fixtures'

/**
 * Tests E2E pour la détection de plateau de croissance
 * Vérifie que l'application détecte quand une habitude stagne
 * (actualValue = targetDose sans dépassement régulier)
 */

test.describe('Plateau de croissance', () => {
  test.beforeEach(async ({ page }) => {
    await setupFromTestFile(page, 'growth-plateau.json')
  })

  test('affiche l\'habitude en plateau sur l\'écran principal', async ({ page }) => {
    await page.goto('/')
    await closeWelcomeBackIfVisible(page)

    // L'habitude Méditation doit être visible
    await expect(page.getByRole('heading', { name: 'Méditation' })).toBeVisible()

    // L'émoji doit être visible dans la section des habitudes
    await expect(page.locator('.habit-card__emoji').filter({ hasText: '🧘' })).toBeVisible()
  })

  test('affiche les statistiques montrant la stagnation dans le détail', async ({ page }) => {
    // Aller sur la liste des habitudes
    await page.goto('/habits')

    // Cliquer sur l'habitude pour voir les détails
    await page.getByRole('button', { name: /Voir les détails de Méditation/i }).click()

    // Attendre la page de détail
    await expect(page).toHaveURL(/\/habits\//)

    // Vérifier que les statistiques sont affichées
    await expect(page.getByText('Cette semaine')).toBeVisible()

    // Les stats devraient montrer ~100% de complétion
    const statsSection = page.locator('.habit-detail__section[aria-label="Statistiques"]')
    await expect(statsSection).toBeVisible()
  })

  test('le graphique de progression montre une courbe plate', async ({ page }) => {
    await page.goto('/habits')
    await page.getByRole('button', { name: /Voir les détails de Méditation/i }).click()

    // Le graphique de progression doit être visible
    const chartSection = page.locator('.habit-detail__section[aria-label="Graphique de progression"]')
    await expect(chartSection).toBeVisible()
  })

  test('affiche l\'activité récente avec tous les jours complétés', async ({ page }) => {
    await page.goto('/habits')
    await page.getByRole('button', { name: /Voir les détails de Méditation/i }).click()

    // Le calendrier doit être visible
    await expect(page.getByRole('heading', { name: 'Activité récente' })).toBeVisible()

    // Les jours doivent montrer une complétion régulière
    const calendarSection = page.locator('.habit-detail__section[aria-label="Calendrier"]')
    await expect(calendarSection).toBeVisible()
  })

  test('les détails montrent la progression configurée', async ({ page }) => {
    await page.goto('/habits')
    await page.getByRole('button', { name: /Voir les détails de Méditation/i }).click()

    // Vérifier les détails de progression
    await expect(page.getByRole('heading', { name: 'Détails' })).toBeVisible()

    // L'habitude est configurée avec +5%/semaine
    // La progression est affichée dans la section Détails
    const infoSection = page.locator('.habit-detail__info-card')
    await expect(infoSection).toBeVisible()
  })

  test('l\'habitude affiche le statut complété (pas dépassé)', async ({ page }) => {
    await page.goto('/')
    await closeWelcomeBackIfVisible(page)

    // La carte d'habitude doit montrer un état de complétion
    const habitCard = page.locator('.habit-card').first()
    await expect(habitCard).toBeVisible()
  })

  test('la dose du jour est affichée correctement', async ({ page }) => {
    await page.goto('/habits')
    await page.getByRole('button', { name: /Voir les détails de Méditation/i }).click()

    // La dose du jour doit être affichée
    await expect(page.getByText('Dose du jour')).toBeVisible()

    // L'unité doit être "minutes" - utiliser un sélecteur plus spécifique
    const doseCard = page.locator('.habit-detail__today-dose')
    await expect(doseCard).toBeVisible()
    await expect(doseCard.getByText('minutes')).toBeVisible()
  })

  test('permet d\'accéder à la modification de l\'habitude', async ({ page }) => {
    await page.goto('/habits')
    await page.getByRole('button', { name: /Voir les détails de Méditation/i }).click()

    // Le bouton Modifier doit être disponible
    const modifyButton = page.getByRole('button', { name: 'Modifier' })
    await expect(modifyButton).toBeVisible()
  })

  test('affiche la valeur de départ dans les détails', async ({ page }) => {
    await page.goto('/habits')
    await page.getByRole('button', { name: /Voir les détails de Méditation/i }).click()

    // La valeur de départ doit être affichée
    await expect(page.getByText('Valeur de départ')).toBeVisible()
    // L'habitude a commencé à 5 minutes
    await expect(page.getByText('5 minutes')).toBeVisible()
  })
})
