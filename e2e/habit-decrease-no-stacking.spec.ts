import { test, expect } from './base-test'
import {
  setupLocalStorage,
  createAppData,
  createIncreaseHabit,
  CreateHabitPage,
} from './fixtures'

/**
 * Tests E2E pour vérifier que le habit stacking n'est pas proposé
 * pour les habitudes de type decrease
 */

test.describe('Habitude decrease - pas de habit stacking', () => {
  let createHabitPage: CreateHabitPage

  test.beforeEach(async ({ page }) => {
    createHabitPage = new CreateHabitPage(page)

    // Créer des données avec une habitude existante pour pouvoir tester le stacking
    const testData = createAppData({
      habits: [
        createIncreaseHabit({
          id: 'existing-habit',
          name: 'Push-ups',
          emoji: '💪',
          startValue: 10,
          unit: 'répétitions',
        }),
      ],
    })
    await setupLocalStorage(page, testData)
  })

  test('création habitude increase: le sélecteur d\'ancrage est visible', async ({ page }) => {
    await createHabitPage.goto()

    // Créer une habitude personnalisée de type Augmenter
    await createHabitPage.clickCreateCustomHabit()
    await createHabitPage.selectType('increase')
    await createHabitPage.clickContinue()

    // Remplir les détails
    await createHabitPage.setName('Méditation')
    await createHabitPage.setUnit('minutes')
    await createHabitPage.clickContinue()

    // À l'étape Intentions, le sélecteur d'ancrage devrait être visible
    await createHabitPage.expectIntentionsStep()

    // Vérifier que la section d'ancrage est présente pour une habitude increase
    await expect(page.getByText('Après quelle habitude ?')).toBeVisible()
  })

  test('création habitude decrease: le sélecteur d\'ancrage n\'est PAS visible', async ({ page }) => {
    await createHabitPage.goto()

    // Créer une habitude personnalisée de type Réduire
    await createHabitPage.clickCreateCustomHabit()
    await createHabitPage.selectType('decrease')
    await createHabitPage.clickContinue()

    // Remplir les détails
    await createHabitPage.setName('Cigarettes')
    await createHabitPage.setUnit('cigarettes')
    await createHabitPage.clickContinue()

    // À l'étape Intentions
    await createHabitPage.expectIntentionsStep()

    // Le sélecteur d'ancrage NE devrait PAS être visible pour une habitude decrease
    await expect(page.getByText('Après quelle habitude ?')).not.toBeVisible()
  })

  test('création habitude maintain: le sélecteur d\'ancrage est visible', async ({ page }) => {
    await createHabitPage.goto()

    // Créer une habitude personnalisée de type Maintenir
    await createHabitPage.clickCreateCustomHabit()
    await createHabitPage.selectType('maintain')
    await createHabitPage.clickContinue()

    // Remplir les détails
    await createHabitPage.setName('Eau')
    await createHabitPage.setStartValue(8)
    await createHabitPage.setUnit('verres')
    await createHabitPage.clickContinue()

    // À l'étape Intentions, le sélecteur d'ancrage devrait être visible
    await createHabitPage.expectIntentionsStep()

    // Vérifier que la section d'ancrage est présente pour une habitude maintain
    await expect(page.getByText('Après quelle habitude ?')).toBeVisible()
  })
})
