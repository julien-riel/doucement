import { test, expect } from './base-test'
import {
  setupLocalStorage,
  createAppData,
  createIncreaseHabit,
  createDecreaseHabit,
  createMaintainHabit,
} from './fixtures'

/**
 * Tests E2E pour l'affichage des habitudes
 * Vérifie le carrousel et le tri par moment de la journée
 */

test.describe('Carrousel d\'habitudes suggérées', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear()
      localStorage.setItem('doucement-language', 'fr')
      localStorage.setItem(
        'doucement_data',
        JSON.stringify({
          schemaVersion: 3,
          habits: [],
          entries: [],
          preferences: { onboardingCompleted: true },
        })
      )
    })
    await page.goto('/create')
    await page.waitForSelector('text=Nouvelle habitude')
  })

  test('affiche le carrousel avec pagination', async ({ page }) => {
    // Le carrousel devrait être visible dans la section Top 6
    const carousel = page.locator('.habit-carousel')
    await expect(carousel).toBeVisible()

    // Vérifier les points de pagination
    const paginationDots = page.locator('.habit-carousel__dot')
    // Au moins 1 point de pagination si plusieurs pages
    const dotsCount = await paginationDots.count()
    expect(dotsCount).toBeGreaterThanOrEqual(1)
  })

  test('navigation par points de pagination', async ({ page }) => {
    // S'il y a plusieurs pages, cliquer sur le 2ème point
    const paginationDots = page.locator('.habit-carousel__dot')
    const dotsCount = await paginationDots.count()

    if (dotsCount > 1) {
      // Le premier point devrait être actif
      await expect(paginationDots.first()).toHaveClass(/habit-carousel__dot--active/)

      // Cliquer sur le 2ème point
      await paginationDots.nth(1).click()

      // Le 2ème point devrait maintenant être actif
      await expect(paginationDots.nth(1)).toHaveClass(/habit-carousel__dot--active/)
    }
  })

  test('navigation par flèches sur desktop', async ({ page }) => {
    // Configurer un viewport desktop
    await page.setViewportSize({ width: 1024, height: 768 })

    const carousel = page.locator('.habit-carousel')
    await expect(carousel).toBeVisible()

    // Vérifier la présence des flèches (seulement sur desktop avec plusieurs pages)
    const paginationDots = page.locator('.habit-carousel__dot')
    const dotsCount = await paginationDots.count()

    if (dotsCount > 1) {
      const nextButton = page.locator('.habit-carousel__arrow--next')
      const prevButton = page.locator('.habit-carousel__arrow--prev')

      await expect(nextButton).toBeVisible()
      await expect(prevButton).toBeVisible()

      // Le bouton précédent devrait être désactivé au début
      await expect(prevButton).toBeDisabled()

      // Cliquer sur suivant
      await nextButton.click()

      // Le bouton précédent devrait maintenant être actif
      await expect(prevButton).toBeEnabled()
    }
  })

  test('sélection d\'une habitude dans le carrousel', async ({ page }) => {
    // Cliquer sur la première habitude du carrousel
    const firstCard = page.locator('.habit-carousel .suggested-habit-card').first()
    await firstCard.click()

    // Devrait passer à l'étape suivante (intentions)
    await expect(page.getByText('Quand et où ?')).toBeVisible()
  })

  test('défilement tactile sur mobile', async ({ page }) => {
    // Configurer un viewport mobile
    await page.setViewportSize({ width: 375, height: 667 })

    const carousel = page.locator('.habit-carousel')
    await expect(carousel).toBeVisible()

    // Les flèches ne devraient pas être visibles sur mobile
    const nextButton = page.locator('.habit-carousel__arrow--next')
    await expect(nextButton).not.toBeVisible()

    // La pagination devrait être visible
    const paginationDots = page.locator('.habit-carousel__dot')
    await expect(paginationDots.first()).toBeVisible()
  })

  test('filtrage par catégorie affiche le carrousel correspondant', async ({ page }) => {
    // Cliquer sur le filtre sommeil
    await page.getByRole('button', { name: '😴' }).click()

    // Le carrousel devrait afficher les habitudes de sommeil
    await expect(page.getByText('Se coucher à heure fixe')).toBeVisible()
  })
})

test.describe('Regroupement par moment de la journée', () => {
  test.beforeEach(async ({ page }) => {
    // Créer des habitudes avec différents moments de la journée
    const testData = createAppData({
      habits: [
        createIncreaseHabit({
          id: 'habit-morning',
          name: 'Méditation matinale',
          emoji: '🧘',
          startValue: 5,
          unit: 'minutes',
          timeOfDay: 'morning',
          trackingMode: 'simple',
        }),
        createIncreaseHabit({
          id: 'habit-afternoon',
          name: 'Marche',
          emoji: '🚶',
          startValue: 10,
          unit: 'minutes',
          timeOfDay: 'afternoon',
        }),
        createIncreaseHabit({
          id: 'habit-evening',
          name: 'Lecture',
          emoji: '📚',
          startValue: 10,
          unit: 'pages',
          timeOfDay: 'evening',
        }),
        createDecreaseHabit({
          id: 'habit-night',
          name: 'Se coucher tôt',
          emoji: '😴',
          startValue: 1,
          unit: 'écart',
          timeOfDay: 'night',
          trackingMode: 'simple',
        }),
        createMaintainHabit({
          id: 'habit-undefined',
          name: 'Eau',
          emoji: '💧',
          startValue: 8,
          unit: 'verres',
          trackingMode: 'counter',
          // Pas de timeOfDay
        }),
      ],
    })
    await setupLocalStorage(page, testData)
    await page.goto('/')
    await page.waitForSelector('.page-today')
  })

  test('affiche les sections par moment de la journée', async ({ page }) => {
    // Vérifier que les sections sont présentes dans le bon ordre
    const sections = page.locator('.time-of-day-section')

    // Il devrait y avoir 5 sections (morning, afternoon, evening, night, undefined)
    await expect(sections).toHaveCount(5)

    // Vérifier les titres des sections (utiliser les labels spécifiques pour éviter les conflits)
    await expect(page.locator('.time-of-day-section__emoji').filter({ hasText: '🌅' })).toBeVisible()
    await expect(page.locator('.time-of-day-section__label').filter({ hasText: 'Matin' })).toBeVisible()

    await expect(page.locator('.time-of-day-section__emoji').filter({ hasText: '☀️' })).toBeVisible()
    await expect(page.locator('.time-of-day-section__label').filter({ hasText: 'Après-midi' })).toBeVisible()

    await expect(page.locator('.time-of-day-section__emoji').filter({ hasText: '🌙' })).toBeVisible()
    await expect(page.locator('.time-of-day-section__label').filter({ hasText: 'Soir' })).toBeVisible()

    await expect(page.locator('.time-of-day-section__emoji').filter({ hasText: '🌃' })).toBeVisible()
    await expect(page.locator('.time-of-day-section__label').filter({ hasText: 'Nuit' })).toBeVisible()

    await expect(page.locator('.time-of-day-section__label').filter({ hasText: 'Autre' })).toBeVisible()
  })

  test('l\'habitude du matin est dans la section matin', async ({ page }) => {
    // Trouver la section matin
    const morningSection = page.locator('.time-of-day-section').filter({ hasText: 'Matin' })

    // Vérifier que l'habitude de méditation est dans cette section
    await expect(morningSection.getByText('Méditation matinale')).toBeVisible()
  })

  test('l\'habitude de l\'après-midi est dans la section après-midi', async ({ page }) => {
    const afternoonSection = page.locator('.time-of-day-section').filter({ hasText: 'Après-midi' })
    await expect(afternoonSection.getByText('Marche')).toBeVisible()
  })

  test('l\'habitude du soir est dans la section soir', async ({ page }) => {
    const eveningSection = page.locator('.time-of-day-section').filter({ hasText: 'Soir' })
    await expect(eveningSection.getByText('Lecture')).toBeVisible()
  })

  test('l\'habitude de nuit est dans la section nuit', async ({ page }) => {
    const nightSection = page.locator('.time-of-day-section').filter({ hasText: 'Nuit' })
    await expect(nightSection.getByText('Se coucher tôt')).toBeVisible()
  })

  test('l\'habitude sans moment est dans la section Autre', async ({ page }) => {
    const otherSection = page.locator('.time-of-day-section').filter({ hasText: 'Autre' })
    await expect(otherSection.getByText('Eau')).toBeVisible()
  })

  test('les sections sont dans l\'ordre chronologique', async ({ page }) => {
    // Vérifier l'ordre des sections: Matin → Après-midi → Soir → Nuit → Autre
    const sectionHeaders = page.locator('.time-of-day-section__header')

    const headers = await sectionHeaders.allTextContents()

    // Trouver les indices
    const morningIndex = headers.findIndex((h) => h.includes('Matin'))
    const afternoonIndex = headers.findIndex((h) => h.includes('Après-midi'))
    const eveningIndex = headers.findIndex((h) => h.includes('Soir'))
    const nightIndex = headers.findIndex((h) => h.includes('Nuit'))
    const otherIndex = headers.findIndex((h) => h.includes('Autre'))

    // Vérifier l'ordre
    expect(morningIndex).toBeLessThan(afternoonIndex)
    expect(afternoonIndex).toBeLessThan(eveningIndex)
    expect(eveningIndex).toBeLessThan(nightIndex)
    expect(nightIndex).toBeLessThan(otherIndex)
  })
})

test.describe('Sections vides masquées', () => {
  test('les sections sans habitudes ne sont pas affichées', async ({ page }) => {
    // Créer seulement une habitude du matin
    const testData = createAppData({
      habits: [
        createIncreaseHabit({
          id: 'habit-morning-only',
          name: 'Yoga',
          emoji: '🧘',
          startValue: 10,
          unit: 'minutes',
          timeOfDay: 'morning',
          trackingMode: 'simple',
        }),
      ],
    })
    await setupLocalStorage(page, testData)

    await page.goto('/')
    await page.waitForSelector('.page-today')

    // Seule la section matin devrait être visible
    await expect(page.getByText('Matin')).toBeVisible()

    // Les autres sections ne devraient pas être présentes
    await expect(page.getByText('Après-midi')).not.toBeVisible()
    await expect(page.getByText('Soir')).not.toBeVisible()
    await expect(page.getByText('Nuit')).not.toBeVisible()
    await expect(page.getByText('Autre')).not.toBeVisible()
  })
})
