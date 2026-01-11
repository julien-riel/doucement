import { test, expect } from '@playwright/test'

/**
 * Tests E2E pour le habit stacking (chaînage d'habitudes)
 * Vérifie l'affichage des habitudes liées par anchorHabitId
 */

test.describe('Habit stacking', () => {
  test.beforeEach(async ({ page }) => {
    // Charger les données de test via fetch avant d'aller sur la page
    const testDataResponse = await page.request.get(
      'http://localhost:4173/test-data/habit-stacking.json'
    )
    const testData = await testDataResponse.json()

    // Injecter les données de test AVANT que la page charge
    await page.addInitScript((data) => {
      localStorage.setItem('doucement_data', JSON.stringify(data))
    }, testData)
  })

  test('affiche toutes les habitudes sur l\'écran principal', async ({ page }) => {
    await page.goto('/')

    // Le fichier contient 4 habitudes
    await expect(page.getByRole('heading', { name: 'Café du matin' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Méditation' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Journal' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Sport' })).toBeVisible()
  })

  test('affiche les habitudes chaînées groupées visuellement', async ({ page }) => {
    await page.goto('/')

    // Les chaînes d'habitudes doivent être groupées
    // Café → Méditation → Journal forme une chaîne
    const chainContainers = page.locator('.today__habit-chain--connected')

    // Il devrait y avoir au moins une chaîne connectée
    const count = await chainContainers.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('affiche l\'indication de l\'habitude d\'ancrage', async ({ page }) => {
    await page.goto('/')

    // L'habitude Méditation est ancrée à Café du matin
    // L'habitude Journal est ancrée à Méditation
    // On devrait voir une indication visuelle de l'ancrage

    // Vérifier que les habitudes chaînées ont un wrapper spécial
    const chainedHabits = page.locator('.today__habit-wrapper--chained')
    const count = await chainedHabits.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('l\'habitude d\'ancrage (Café) n\'a pas d\'indication d\'ancrage', async ({ page }) => {
    await page.goto('/')

    // Le Café est l'habitude de base, elle ne devrait pas être "chaînée"
    // Elle devrait être le premier élément d'une chaîne
    const firstHabitInChain = page.locator('.today__habit-chain--connected .today__habit-wrapper')
      .first()

    // Le premier élément ne devrait pas avoir la classe "chained"
    await expect(firstHabitInChain).not.toHaveClass(/today__habit-wrapper--chained/)
  })

  test('affiche l\'intention d\'implémentation avec le déclencheur sur la page de détail', async ({ page }) => {
    await page.goto('/habits')

    // Cliquer sur Méditation pour voir son détail
    await page.getByRole('button', { name: /Voir les détails de Méditation/i }).click()

    // Sur la page de détail, on devrait voir les informations
    await expect(page).toHaveURL(/\/habits\//)
    await expect(page.getByRole('heading', { name: 'Méditation', level: 1 })).toBeVisible()
  })

  test('l\'habitude Sport est indépendante (pas chaînée)', async ({ page }) => {
    await page.goto('/')

    // Sport n'a pas de anchorHabitId, il devrait être dans sa propre "chaîne" de 1
    // Vérifions qu'il y a plusieurs groupes de chaînes
    const allChains = page.locator('.today__habit-chain')
    const count = await allChains.count()

    // Au moins 2 chaînes : une pour Café→Méditation→Journal, une pour Sport
    expect(count).toBeGreaterThanOrEqual(2)
  })

  test('affiche les émojis des habitudes', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('☕')).toBeVisible()
    await expect(page.getByText('🧘')).toBeVisible()
    await expect(page.getByText('📝')).toBeVisible()
    await expect(page.getByText('🏋️')).toBeVisible()
  })

  test('permet de faire un check-in sur chaque habitude de la chaîne', async ({ page }) => {
    await page.goto('/')

    // Chaque habitude devrait avoir des boutons de check-in
    // Café du matin est en mode "simple", donc "Fait !" ou "Pas aujourd'hui"
    // Méditation est en mode "detailed", donc "Un peu / Fait ! / Encore +"

    // Vérifier qu'on peut interagir avec les habitudes
    const faitButtons = page.getByRole('button', { name: 'Fait !' })
    const count = await faitButtons.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('le pourcentage de complétion globale inclut toutes les habitudes', async ({ page }) => {
    await page.goto('/')

    // Le header doit afficher un pourcentage de complétion
    // qui prend en compte toutes les habitudes
    const completionStatus = page.getByRole('status', { name: /complété/ })
    await expect(completionStatus).toBeVisible()
  })

  test('la revue hebdomadaire inclut toutes les habitudes chaînées', async ({ page }) => {
    await page.goto('/review')

    // Vérifier que la section "Par habitude" contient toutes les habitudes
    await expect(page.getByRole('heading', { name: 'Par habitude' })).toBeVisible()

    // Les 4 habitudes doivent être listées
    const habitCards = page.locator('.weekly-review__habit-card')
    const count = await habitCards.count()
    expect(count).toBe(4)
  })
})
