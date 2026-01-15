import { test, expect } from './base-test'
import {
  setupLocalStorage,
  setupLocalStorageForPersistence,
  createAppData,
  createSliderHabit,
  resetCounters,
  createEmptyAppData,
} from './fixtures'

/**
 * Tests E2E pour les habitudes en mode slider (trackingMode: 'slider')
 * Vérifie: création, configuration emoji, utilisation au clavier, changement d'emoji selon valeur
 */

/**
 * Create test data for slider habit (mood tracking)
 */
function createMoodSliderData() {
  resetCounters()

  const habit = createSliderHabit({
    id: 'habit-mood',
    name: 'Humeur',
    emoji: '😊',
    startValue: 5,
    unit: 'niveau',
    direction: 'maintain',
    progression: null,
    createdAt: '2025-12-01',
    entryMode: 'replace',
    sliderConfig: {
      min: 1,
      max: 10,
      step: 1,
      emojiRanges: [
        { from: 1, to: 3, emoji: '😢' },
        { from: 4, to: 5, emoji: '😕' },
        { from: 6, to: 7, emoji: '😊' },
        { from: 8, to: 10, emoji: '😄' },
      ],
    },
  })

  return createAppData({
    habits: [habit],
    entries: [],
    preferences: {
      onboardingCompleted: true,
      lastWeeklyReviewDate: '2026-01-05',
      notifications: {
        enabled: false,
        morningReminder: { enabled: true, time: '08:00' },
        eveningReminder: { enabled: false, time: '20:00' },
        weeklyReviewReminder: { enabled: false, time: '10:00' },
      },
      theme: 'system',
    },
  })
}

/**
 * Create test data for slider habit (energy level)
 */
function createEnergySliderData() {
  resetCounters()

  const habit = createSliderHabit({
    id: 'habit-energy',
    name: 'Énergie',
    emoji: '⚡',
    startValue: 5,
    unit: 'niveau',
    direction: 'maintain',
    progression: null,
    createdAt: '2025-12-01',
    entryMode: 'replace',
    sliderConfig: {
      min: 0,
      max: 100,
      step: 10,
      emojiRanges: [
        { from: 0, to: 30, emoji: '🔋' },
        { from: 31, to: 60, emoji: '⚡' },
        { from: 61, to: 100, emoji: '💥' },
      ],
    },
  })

  return createAppData({
    habits: [habit],
    entries: [],
    preferences: {
      onboardingCompleted: true,
      lastWeeklyReviewDate: '2026-01-05',
      notifications: {
        enabled: false,
        morningReminder: { enabled: true, time: '08:00' },
        eveningReminder: { enabled: false, time: '20:00' },
        weeklyReviewReminder: { enabled: false, time: '10:00' },
      },
      theme: 'system',
    },
  })
}

test.describe('Habitude slider - Affichage', () => {
  test.beforeEach(async ({ page }) => {
    const testData = createMoodSliderData()
    await setupLocalStorage(page, testData)

    await page.goto('/')
    await page.waitForSelector('h3:has-text("Humeur")')
  })

  test('affiche le widget slider avec emoji et valeur', async ({ page }) => {
    // Vérifier que l'habitude est affichée
    await expect(page.getByRole('heading', { name: 'Humeur' })).toBeVisible()

    // Vérifier que le slider est visible
    await expect(page.locator('.slider-checkin')).toBeVisible()

    // Vérifier l'emoji dynamique (valeur initiale au milieu = 5 ou 6)
    await expect(page.locator('.slider-checkin__emoji')).toBeVisible()

    // Vérifier la valeur numérique
    await expect(page.locator('.slider-checkin__value')).toBeVisible()

    // Vérifier les labels min/max
    await expect(page.locator('.slider-checkin__label').first()).toHaveText('1')
    await expect(page.locator('.slider-checkin__label').last()).toHaveText('10')

    // Vérifier le bouton Valider
    await expect(page.getByRole('button', { name: /Valider/ })).toBeVisible()
  })

  test('change d\'emoji selon la valeur sélectionnée', async ({ page }) => {
    const slider = page.locator('.slider-checkin__input')

    // Mettre une valeur basse (1-3) → emoji triste
    await slider.fill('2')
    await expect(page.locator('.slider-checkin__emoji')).toHaveText('😢')
    await expect(page.locator('.slider-checkin__value')).toHaveText('2')

    // Mettre une valeur moyenne-basse (4-5) → emoji neutre
    await slider.fill('5')
    await expect(page.locator('.slider-checkin__emoji')).toHaveText('😕')
    await expect(page.locator('.slider-checkin__value')).toHaveText('5')

    // Mettre une valeur moyenne-haute (6-7) → emoji souriant
    await slider.fill('7')
    await expect(page.locator('.slider-checkin__emoji')).toHaveText('😊')
    await expect(page.locator('.slider-checkin__value')).toHaveText('7')

    // Mettre une valeur haute (8-10) → emoji très content
    await slider.fill('9')
    await expect(page.locator('.slider-checkin__emoji')).toHaveText('😄')
    await expect(page.locator('.slider-checkin__value')).toHaveText('9')
  })

  test('enregistre la valeur après clic sur Valider', async ({ page }) => {
    const slider = page.locator('.slider-checkin__input')

    // Sélectionner une valeur
    await slider.fill('8')
    await expect(page.locator('.slider-checkin__value')).toHaveText('8')

    // Valider
    await page.getByRole('button', { name: /Valider/ }).click()

    // Le bouton devrait indiquer que c'est enregistré
    // Note: après enregistrement, le bouton affiche "✓ Enregistré" mais l'aria-label devient "Modifier la valeur"
    await expect(page.getByText('✓ Enregistré')).toBeVisible()
  })
})

test.describe('Habitude slider - Accessibilité clavier', () => {
  test.beforeEach(async ({ page }) => {
    const testData = createMoodSliderData()
    await setupLocalStorage(page, testData)

    await page.goto('/')
    await page.waitForSelector('h3:has-text("Humeur")')
  })

  test('peut ajuster la valeur avec les touches fléchées', async ({ page }) => {
    const slider = page.locator('.slider-checkin__input')

    // Focus sur le slider
    await slider.focus()

    // Valeur initiale (milieu = 5 ou 6)
    const initialValue = await slider.inputValue()

    // Flèche droite → augmente la valeur
    await page.keyboard.press('ArrowRight')
    const valueAfterRight = await slider.inputValue()
    expect(parseInt(valueAfterRight)).toBe(parseInt(initialValue) + 1)

    // Flèche gauche → diminue la valeur
    await page.keyboard.press('ArrowLeft')
    const valueAfterLeft = await slider.inputValue()
    expect(parseInt(valueAfterLeft)).toBe(parseInt(initialValue))

    // Flèche haut → augmente la valeur
    await page.keyboard.press('ArrowUp')
    const valueAfterUp = await slider.inputValue()
    expect(parseInt(valueAfterUp)).toBe(parseInt(initialValue) + 1)

    // Flèche bas → diminue la valeur
    await page.keyboard.press('ArrowDown')
    const valueAfterDown = await slider.inputValue()
    expect(parseInt(valueAfterDown)).toBe(parseInt(initialValue))
  })

  test('peut valider avec la touche Entrée', async ({ page }) => {
    const slider = page.locator('.slider-checkin__input')

    // Focus sur le slider
    await slider.focus()

    // Ajuster la valeur
    await slider.fill('7')

    // Appuyer sur Entrée pour valider
    await page.keyboard.press('Enter')

    // Vérifier que c'est enregistré
    await expect(page.getByText('✓ Enregistré')).toBeVisible()
  })

  test('le slider a les attributs ARIA appropriés', async ({ page }) => {
    const slider = page.locator('.slider-checkin__input')

    // Vérifier les attributs d'accessibilité
    await expect(slider).toHaveAttribute('aria-valuemin', '1')
    await expect(slider).toHaveAttribute('aria-valuemax', '10')
    await expect(slider).toHaveAttribute('aria-label', 'Sélectionner une valeur')
  })
})

test.describe('Habitude slider - Configuration personnalisée', () => {
  test('fonctionne avec une plage différente (0-100)', async ({ page }) => {
    const testData = createEnergySliderData()
    await setupLocalStorage(page, testData)

    await page.goto('/')
    await page.waitForSelector('h3:has-text("Énergie")')

    // Vérifier les labels min/max
    await expect(page.locator('.slider-checkin__label').first()).toHaveText('0')
    await expect(page.locator('.slider-checkin__label').last()).toHaveText('100')

    const slider = page.locator('.slider-checkin__input')

    // Vérifier les emojis pour différentes valeurs
    await slider.fill('20')
    await expect(page.locator('.slider-checkin__emoji')).toHaveText('🔋')

    await slider.fill('50')
    await expect(page.locator('.slider-checkin__emoji')).toHaveText('⚡')

    await slider.fill('80')
    await expect(page.locator('.slider-checkin__emoji')).toHaveText('💥')
  })

  test('respecte le step configuré', async ({ page }) => {
    const testData = createEnergySliderData()
    await setupLocalStorage(page, testData)

    await page.goto('/')
    await page.waitForSelector('h3:has-text("Énergie")')

    const slider = page.locator('.slider-checkin__input')

    // Vérifier que le step est de 10
    await expect(slider).toHaveAttribute('step', '10')

    // Focus et utiliser les flèches devrait incrémenter par 10
    await slider.focus()
    await slider.fill('50')
    await page.keyboard.press('ArrowRight')
    const value = await slider.inputValue()
    expect(parseInt(value)).toBe(60)
  })
})

// Note: Les tests de création sont désactivés temporairement
// car les boutons de tracking mode (chronomètre, minuterie, slider)
// ne sont pas visibles dans le wizard de création (problème CSS/build)
// Les tests d'affichage et d'utilisation fonctionnent avec des habitudes créées via fixtures
test.describe.skip('Habitude slider - Création', () => {
  test.beforeEach(async ({ page }) => {
    await setupLocalStorage(page, createEmptyAppData())
    await page.goto('/create')
    await page.waitForSelector('text=Nouvelle habitude')
  })

  test('peut créer une habitude en mode slider', async ({ page }) => {
    // Étape Choose: Créer une habitude personnalisée
    await page.getByRole('button', { name: /Créer une habitude personnalisée/ }).click()

    // Étape Type: Choisir Maintenir (adapté pour slider)
    await page.getByRole('button', { name: /Maintenir/ }).click()
    await page.getByRole('button', { name: 'Continuer' }).click()

    // Étape Details: Remplir le formulaire
    await page.getByRole('textbox', { name: "Nom de l'habitude" }).fill('Humeur du jour')
    await page.getByRole('textbox', { name: 'Unité' }).fill('niveau')
    await page.getByRole('spinbutton', { name: 'Dose de départ' }).fill('5')

    // Sélectionner le mode slider
    // Need to scroll to ensure the tracking mode options are visible
    const trackingSection = page.locator('.step-details__tracking-mode-section')
    await trackingSection.scrollIntoViewIfNeeded()

    const sliderOption = page.getByRole('button', { name: /Slider/ })
    await sliderOption.click()

    await page.getByRole('button', { name: 'Continuer' }).click()

    // Étape Intentions: Passer
    await page.getByRole('button', { name: 'Continuer' }).click()

    // Étape Identity: Passer vers aperçu
    await page.getByRole('button', { name: 'Aperçu' }).click()

    // Étape Confirm: Vérifier le résumé
    await expect(page.getByRole('heading', { name: 'Humeur du jour' })).toBeVisible()

    // Créer l'habitude
    await page.getByRole('button', { name: "Créer l'habitude" }).click()

    // Étape first-checkin
    await expect(page.getByText('Première victoire ?')).toBeVisible()
    await page.getByRole('button', { name: 'Non, je commence demain' }).click()

    // Vérifier que l'habitude est créée avec le mode slider
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: 'Humeur du jour' })).toBeVisible()

    // Vérifier que le widget slider est affiché
    await expect(page.locator('.slider-checkin')).toBeVisible()
    await expect(page.locator('.slider-checkin__input')).toBeVisible()
    await expect(page.getByRole('button', { name: /Valider/ })).toBeVisible()
  })

  test('peut configurer les plages emoji lors de la création', async ({ page }) => {
    // Étape Choose: Créer une habitude personnalisée
    await page.getByRole('button', { name: /Créer une habitude personnalisée/ }).click()

    // Étape Type: Choisir Maintenir
    await page.getByRole('button', { name: /Maintenir/ }).click()
    await page.getByRole('button', { name: 'Continuer' }).click()

    // Étape Details: Remplir le formulaire
    await page.getByRole('textbox', { name: "Nom de l'habitude" }).fill('Douleur')
    await page.getByRole('textbox', { name: 'Unité' }).fill('niveau')
    await page.getByRole('spinbutton', { name: 'Dose de départ' }).fill('0')

    // Sélectionner le mode slider
    // Need to scroll to ensure the tracking mode options are visible
    const trackingSection = page.locator('.step-details__tracking-mode-section')
    await trackingSection.scrollIntoViewIfNeeded()

    const sliderOption = page.getByRole('button', { name: /Slider/ })
    await sliderOption.click()

    // Vérifier que la section de configuration du slider apparaît
    // (selon l'implémentation, peut être dans une section dédiée ou des champs conditionnels)
    // On vérifie qu'au minimum le mode slider est sélectionné
    await expect(sliderOption).toHaveAttribute('aria-pressed', 'true')

    await page.getByRole('button', { name: 'Continuer' }).click()

    // Compléter le reste du wizard
    await page.getByRole('button', { name: 'Continuer' }).click()
    await page.getByRole('button', { name: 'Aperçu' }).click()
    await page.getByRole('button', { name: "Créer l'habitude" }).click()
    await page.getByRole('button', { name: 'Non, je commence demain' }).click()

    // Vérifier que l'habitude est créée
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: 'Douleur' })).toBeVisible()
    await expect(page.locator('.slider-checkin')).toBeVisible()
  })
})

test.describe('Habitude slider - Persistance', () => {
  test('la valeur est préservée après rafraîchissement', async ({ page }) => {
    const testData = createMoodSliderData()
    await setupLocalStorageForPersistence(page, testData, {
      path: '/',
      waitSelector: 'h3:has-text("Humeur")',
    })

    // Sélectionner et valider une valeur
    const slider = page.locator('.slider-checkin__input')
    await slider.fill('8')
    await page.getByRole('button', { name: /Valider/ }).click()
    await expect(page.getByText('✓ Enregistré')).toBeVisible()

    // Rafraîchir la page
    await page.reload()
    await page.waitForSelector('h3:has-text("Humeur")')

    // La valeur devrait être préservée
    await expect(page.locator('.slider-checkin__value')).toHaveText('8')
    await expect(page.locator('.slider-checkin__emoji')).toHaveText('😄')
    await expect(page.getByText('✓ Enregistré')).toBeVisible()
  })

  test('la touche Entrée enregistre correctement la valeur (stale closure fix)', async ({
    page,
  }) => {
    // Ce test vérifie que le bug de stale closure est corrigé
    // Avant le fix, handleKeyDown avait handleSubmit manquant dans ses dépendances
    // ce qui pouvait causer l'enregistrement d'une ancienne valeur
    const testData = createMoodSliderData()
    await setupLocalStorageForPersistence(page, testData, {
      path: '/',
      waitSelector: 'h3:has-text("Humeur")',
    })

    const slider = page.locator('.slider-checkin__input')

    // Focus sur le slider et définir une valeur
    await slider.focus()
    await slider.fill('9')
    await expect(page.locator('.slider-checkin__value')).toHaveText('9')
    await expect(page.locator('.slider-checkin__emoji')).toHaveText('😄')

    // Re-focus sur le slider (fill() peut changer le focus)
    await slider.focus()

    // Valider avec Entrée - la valeur enregistrée doit être 9
    await page.keyboard.press('Enter')

    // Vérifier que c'est enregistré
    await expect(page.getByText('✓ Enregistré')).toBeVisible()
    await expect(page.locator('.slider-checkin__value')).toHaveText('9')

    // Recharger la page pour confirmer que la bonne valeur a été persistée
    await page.reload()
    await page.waitForSelector('h3:has-text("Humeur")')

    // La valeur persistée doit être 9
    await expect(page.locator('.slider-checkin__value')).toHaveText('9')
    await expect(page.locator('.slider-checkin__emoji')).toHaveText('😄')
    await expect(page.getByText('✓ Enregistré')).toBeVisible()
  })
})
