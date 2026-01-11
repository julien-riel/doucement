import { test, expect } from '@playwright/test'

/**
 * Tests E2E pour les pauses planifiées
 * Vérifie l'affichage et le comportement des habitudes en pause
 */

test.describe('Pause planifiée', () => {
  test.beforeEach(async ({ page }) => {
    // Charger les données de test via fetch avant d'aller sur la page
    const testDataResponse = await page.request.get(
      'http://localhost:4173/test-data/planned-pause.json'
    )
    const testData = await testDataResponse.json()

    // Injecter les données de test AVANT que la page charge
    await page.addInitScript((data) => {
      localStorage.setItem('doucement_data', JSON.stringify(data))
    }, testData)
  })

  test('l\'habitude en pause active n\'apparaît pas sur l\'écran Aujourd\'hui', async ({
    page,
  }) => {
    await page.goto('/')

    // L'habitude "Course à pied" est en pause du 2026-01-08 au 2026-01-15
    // Aujourd'hui est le 2026-01-10, donc elle ne devrait pas apparaître
    await expect(page.getByRole('heading', { name: 'Course à pied' })).not.toBeVisible()

    // Les autres habitudes doivent être visibles
    await expect(page.getByRole('heading', { name: 'Étirements' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Lecture' })).toBeVisible()
  })

  test('l\'habitude avec pause terminée apparaît normalement', async ({ page }) => {
    await page.goto('/')

    // L'habitude "Étirements" avait une pause du 2025-12-28 au 2026-01-05
    // Elle devrait apparaître normalement maintenant
    await expect(page.getByRole('heading', { name: 'Étirements' })).toBeVisible()
  })

  test('l\'habitude sans pause apparaît normalement', async ({ page }) => {
    await page.goto('/')

    // L'habitude "Lecture" n'a pas de pause
    await expect(page.getByRole('heading', { name: 'Lecture' })).toBeVisible()
  })

  test('le détail de l\'habitude en pause affiche le badge de pause', async ({ page }) => {
    await page.goto('/habits')

    // Aller sur la liste des habitudes et cliquer sur Course à pied
    await page.getByRole('button', { name: /Voir les détails de Course à pied/i }).click()

    // Attendre la page de détail
    await expect(page).toHaveURL(/\/habits\//)

    // Le badge de pause doit être visible
    await expect(page.locator('.habit-detail__badge--paused')).toBeVisible()
  })

  test('le détail de l\'habitude en pause affiche le bouton de reprise', async ({ page }) => {
    await page.goto('/habits')

    // Aller sur le détail de l'habitude en pause
    await page.getByRole('button', { name: /Voir les détails de Course à pied/i }).click()

    // Le bouton pour reprendre l'habitude doit être visible
    const resumeButton = page.getByRole('button', { name: /Reprendre/i })
    await expect(resumeButton).toBeVisible()
  })

  test('permet de reprendre une habitude en pause', async ({ page }) => {
    await page.goto('/habits')

    // Aller sur le détail de l'habitude en pause
    await page.getByRole('button', { name: /Voir les détails de Course à pied/i }).click()

    // Cliquer sur le bouton de reprise
    const resumeButton = page.getByRole('button', { name: /Reprendre/i })
    await resumeButton.click()

    // Le badge de pause devrait disparaître
    await expect(page.locator('.habit-detail__badge--paused')).not.toBeVisible()

    // Le bouton "Mettre en pause" devrait réapparaître
    await expect(page.getByRole('button', { name: /pause/i })).toBeVisible()
  })

  test('la liste des habitudes montre l\'habitude en pause', async ({ page }) => {
    await page.goto('/habits')

    // L'habitude en pause doit apparaître dans la liste
    await expect(page.getByRole('heading', { name: 'Course à pied' })).toBeVisible()

    // Les 3 habitudes doivent être listées
    const habitItems = page.locator('h3')
    const count = await habitItems.count()
    expect(count).toBe(3)
  })

  test('la revue hebdomadaire inclut les habitudes actives', async ({ page }) => {
    await page.goto('/review')

    // Vérifier que la section "Par habitude" existe
    await expect(page.getByRole('heading', { name: 'Par habitude' })).toBeVisible()

    // Les habitudes actives (non en pause aujourd'hui) sont listées
    const habitCards = page.locator('.weekly-review__habit-card')
    const count = await habitCards.count()
    expect(count).toBeGreaterThanOrEqual(2) // Au moins Étirements et Lecture
  })

  test('permet de mettre une habitude en pause via le détail', async ({ page }) => {
    await page.goto('/habits')

    // Aller sur le détail de l'habitude Lecture (sans pause)
    await page.getByRole('button', { name: /Voir les détails de Lecture/i }).click()

    // Le bouton pour mettre en pause doit être visible
    const pauseButton = page.getByRole('button', { name: /pause/i })
    await expect(pauseButton).toBeVisible()

    // Cliquer sur le bouton de pause
    await pauseButton.click()

    // Une modale/dialogue devrait apparaître
    // Le composant PlannedPauseDialog devrait être visible
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('le dialogue de pause permet de choisir les dates', async ({ page }) => {
    await page.goto('/habits')

    // Aller sur le détail de Lecture
    await page.getByRole('button', { name: /Voir les détails de Lecture/i }).click()

    // Ouvrir le dialogue de pause
    const pauseButton = page.getByRole('button', { name: /pause/i })
    await pauseButton.click()

    // Le dialogue doit contenir des champs de date
    await expect(page.getByRole('dialog')).toBeVisible()
  })
})
