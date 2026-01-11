import { test, expect } from '@playwright/test'

/**
 * Tests E2E pour la détection d'absence
 * Vérifie que le WelcomeBackMessage s'affiche après 2+ jours sans check-in
 */

test.describe('Détection d\'absence', () => {
  test.beforeEach(async ({ page }) => {
    // Charger les données de test via fetch avant d'aller sur la page
    const testDataResponse = await page.request.get(
      'http://localhost:4173/test-data/absence-detected.json'
    )
    const testData = await testDataResponse.json()

    // Injecter les données de test AVANT que la page charge
    await page.addInitScript((data) => {
      localStorage.setItem('doucement_data', JSON.stringify(data))
    }, testData)
  })

  test('affiche le message de bienvenue après une absence', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.welcome-back')

    // Vérifier que le message de bienvenue est affiché
    const welcomeMessage = page.locator('.welcome-back')
    await expect(welcomeMessage).toBeVisible()

    // Vérifier la présence de l'icône 👋
    await expect(page.getByText('👋')).toBeVisible()

    // Vérifier que le message est bienveillant (pas de culpabilisation)
    // Le message doit contenir un texte d'encouragement
    const messageText = page.locator('.welcome-back__subtitle')
    await expect(messageText).toBeVisible()
  })

  test('affiche les habitudes négligées dans le message', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.welcome-back')

    // Vérifier que les habitudes négligées sont listées
    // Le fichier absence-detected.json contient 2 habitudes
    const habitsList = page.locator('.welcome-back__habits')
    await expect(habitsList).toBeVisible()

    // Vérifier que les noms des habitudes sont affichés
    await expect(page.locator('.welcome-back__habit-name').first()).toBeVisible()
  })

  test('permet de fermer le message de bienvenue', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.welcome-back')

    // Trouver et cliquer sur le bouton de fermeture
    const dismissButton = page.getByRole('button', { name: 'Fermer le message' })
    await expect(dismissButton).toBeVisible()
    await dismissButton.click()

    // Le message de bienvenue doit disparaître
    await expect(page.locator('.welcome-back')).not.toBeVisible()

    // Le message d'encouragement normal doit apparaître
    await expect(page.locator('.encouraging-message')).toBeVisible()
  })

  test('affiche les habitudes après fermeture du message de bienvenue', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.welcome-back')

    // Fermer le message
    await page.getByRole('button', { name: 'Fermer le message' }).click()

    // Les habitudes doivent être affichées
    await expect(page.getByRole('heading', { name: 'Lecture' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Marche' })).toBeVisible()
  })

  test('indique le nombre de jours depuis la dernière entrée pour chaque habitude', async ({
    page,
  }) => {
    await page.goto('/')
    await page.waitForSelector('.welcome-back')

    // Vérifier qu'on affiche le nombre de jours pour au moins une habitude
    const dayIndicators = page.locator('.welcome-back__habit-days')
    const count = await dayIndicators.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })
})
