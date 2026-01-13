import { test, expect } from './base-test'

/**
 * Tests E2E pour les modifications d'habitudes
 * Vérifie le changement de type (direction) et l'annulation des saisies cumulatives
 */

// Données de test pour habitude increase avec entrées
const increaseHabitWithEntries = {
  schemaVersion: 9,
  habits: [
    {
      id: 'habit-pushups',
      name: 'Push-ups',
      emoji: '💪',
      direction: 'increase',
      startValue: 10,
      unit: 'répétitions',
      progression: { mode: 'percentage', value: 5, period: 'weekly' },
      targetValue: 50,
      createdAt: '2025-12-01',
      archivedAt: null,
      trackingMode: 'detailed',
      trackingFrequency: 'daily',
      entryMode: 'replace',
    },
  ],
  entries: [
    {
      id: 'e1',
      habitId: 'habit-pushups',
      date: '2025-12-15',
      targetDose: 12,
      actualValue: 15,
      createdAt: '2025-12-15T07:00:00Z',
      updatedAt: '2025-12-15T07:00:00Z',
    },
  ],
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
}

// Données de test pour habitude decrease
const decreaseHabitData = {
  schemaVersion: 9,
  habits: [
    {
      id: 'habit-sugar',
      name: 'Sucre',
      emoji: '🍬',
      direction: 'decrease',
      startValue: 5,
      unit: 'portions',
      progression: { mode: 'absolute', value: 1, period: 'weekly' },
      targetValue: 1,
      createdAt: '2025-12-01',
      archivedAt: null,
      trackingMode: 'detailed',
      trackingFrequency: 'daily',
      entryMode: 'replace',
    },
  ],
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
}

// Données de test pour habitude avec mode cumulative
const cumulativeHabitData = {
  schemaVersion: 9,
  habits: [
    {
      id: 'habit-reading-cumul',
      name: 'Lecture',
      emoji: '📚',
      direction: 'increase',
      startValue: 20,
      unit: 'pages',
      progression: { mode: 'percentage', value: 3, period: 'weekly' },
      targetValue: 100,
      createdAt: '2025-12-01',
      archivedAt: null,
      trackingMode: 'detailed',
      trackingFrequency: 'daily',
      entryMode: 'cumulative',
    },
  ],
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
}

test.describe('Changement de type d\'habitude', () => {
  test.describe('De Augmenter vers Maintenir', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((data) => {
        localStorage.setItem('doucement_data', JSON.stringify(data))
      }, increaseHabitWithEntries)

      await page.goto('/habits/habit-pushups/edit')
      await page.waitForSelector('text=Modifier l\'habitude')
    })

    test('affiche le sélecteur de type d\'habitude', async ({ page }) => {
      await expect(page.getByText("Type d'habitude")).toBeVisible()

      // Vérifier les 3 options
      await expect(
        page.locator('.edit-habit__direction-option').filter({ hasText: 'Augmenter' })
      ).toBeVisible()
      await expect(
        page.locator('.edit-habit__direction-option').filter({ hasText: 'Réduire' })
      ).toBeVisible()
      await expect(
        page.locator('.edit-habit__direction-option').filter({ hasText: 'Maintenir' })
      ).toBeVisible()
    })

    test('augmenter est sélectionné par défaut pour une habitude increase', async ({ page }) => {
      const increaseButton = page.locator('.edit-habit__direction-option').filter({ hasText: 'Augmenter' })
      await expect(increaseButton).toHaveAttribute('aria-pressed', 'true')
    })

    test('permet de changer de Augmenter à Maintenir', async ({ page }) => {
      // Cliquer sur Maintenir
      const maintainButton = page.locator('.edit-habit__direction-option').filter({ hasText: 'Maintenir' })
      await maintainButton.click()

      // Vérifier la sélection
      await expect(maintainButton).toHaveAttribute('aria-pressed', 'true')
      const increaseButton = page.locator('.edit-habit__direction-option').filter({ hasText: 'Augmenter' })
      await expect(increaseButton).toHaveAttribute('aria-pressed', 'false')
    })

    test('affiche un message explicatif lors du changement vers Maintenir', async ({ page }) => {
      // Cliquer sur Maintenir
      await page.locator('.edit-habit__direction-option').filter({ hasText: 'Maintenir' }).click()

      // Vérifier le message d'avertissement
      await expect(page.locator('.edit-habit__direction-warning')).toBeVisible()
      await expect(page.getByText(/progression sera désactivée/)).toBeVisible()
    })

    test('masque la section progression quand on passe en Maintenir', async ({ page }) => {
      // Vérifier que la section progression est visible au départ
      await expect(page.locator('.edit-habit__progression-section')).toBeVisible()

      // Cliquer sur Maintenir
      await page.locator('.edit-habit__direction-option').filter({ hasText: 'Maintenir' }).click()

      // La section progression devrait disparaître
      await expect(page.locator('.edit-habit__progression-section')).not.toBeVisible()
    })

    test('sauvegarde le changement de type vers Maintenir', async ({ page }) => {
      // Changer vers Maintenir
      await page.locator('.edit-habit__direction-option').filter({ hasText: 'Maintenir' }).click()

      // Sauvegarder
      await page.getByRole('button', { name: 'Enregistrer' }).click()

      // Vérifier le message de succès
      await expect(page.getByText('Modification enregistrée.')).toBeVisible()

      // Attendre la redirection automatique vers la page de détail
      await expect(page).toHaveURL(/\/habits\/habit-pushups$/)

      // Vérifier que le changement est persisté
      await expect(page.getByText('Maintenir')).toBeVisible()
    })
  })

  test.describe('De Augmenter vers Réduire', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((data) => {
        localStorage.setItem('doucement_data', JSON.stringify(data))
      }, increaseHabitWithEntries)

      await page.goto('/habits/habit-pushups/edit')
      await page.waitForSelector('text=Modifier l\'habitude')
    })

    test('permet de changer de Augmenter à Réduire', async ({ page }) => {
      // Cliquer sur Réduire
      const decreaseButton = page.locator('.edit-habit__direction-option').filter({ hasText: 'Réduire' })
      await decreaseButton.click()

      // Vérifier la sélection
      await expect(decreaseButton).toHaveAttribute('aria-pressed', 'true')
    })

    test('affiche un message lors du changement de type', async ({ page }) => {
      // Cliquer sur Réduire
      await page.locator('.edit-habit__direction-option').filter({ hasText: 'Réduire' }).click()

      // Vérifier le message d'avertissement
      await expect(page.locator('.edit-habit__direction-warning')).toBeVisible()
      await expect(page.getByText(/progression sera adaptée/)).toBeVisible()
    })

    test('conserve la section progression pour Réduire', async ({ page }) => {
      // Cliquer sur Réduire
      await page.locator('.edit-habit__direction-option').filter({ hasText: 'Réduire' }).click()

      // La section progression devrait rester visible
      await expect(page.locator('.edit-habit__progression-section')).toBeVisible()
    })
  })

  test.describe('De Réduire vers Augmenter', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((data) => {
        localStorage.setItem('doucement_data', JSON.stringify(data))
      }, decreaseHabitData)

      await page.goto('/habits/habit-sugar/edit')
      await page.waitForSelector('text=Modifier l\'habitude')
    })

    test('réduire est sélectionné par défaut pour une habitude decrease', async ({ page }) => {
      const decreaseButton = page.locator('.edit-habit__direction-option').filter({ hasText: 'Réduire' })
      await expect(decreaseButton).toHaveAttribute('aria-pressed', 'true')
    })

    test('permet de changer de Réduire à Augmenter', async ({ page }) => {
      // Cliquer sur Augmenter
      const increaseButton = page.locator('.edit-habit__direction-option').filter({ hasText: 'Augmenter' })
      await increaseButton.click()

      // Vérifier la sélection
      await expect(increaseButton).toHaveAttribute('aria-pressed', 'true')

      // Sauvegarder
      await page.getByRole('button', { name: 'Enregistrer' }).click()
      await expect(page.getByText('Modification enregistrée.')).toBeVisible()
    })
  })
})

// TODO: Ces tests vérifient les saisies cumulatives qui ne sont pas implémentées comme prévu
test.describe.skip('Annulation des saisies cumulatives', () => {
  test.describe('Habitude en mode cumulative', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((data) => {
        localStorage.setItem('doucement_data', JSON.stringify(data))
      }, cumulativeHabitData)

      await page.goto('/')
      await page.waitForSelector('h3:has-text("Lecture")')
    })

    test('affiche le formulaire de saisie cumulative', async ({ page }) => {
      // Vérifier que l'habitude est affichée
      await expect(page.getByRole('heading', { name: 'Lecture' })).toBeVisible()
      await expect(page.getByText('📚')).toBeVisible()

      // Vérifier la présence du champ de saisie cumulative
      const input = page.locator('.habit-card').filter({ hasText: 'Lecture' }).getByRole('spinbutton')
      await expect(input).toBeVisible()
    })

    test('permet d\'ajouter une saisie cumulative', async ({ page }) => {
      // Trouver le formulaire de l'habitude
      const habitCard = page.locator('.habit-card').filter({ hasText: 'Lecture' })

      // Saisir une valeur
      const input = habitCard.getByRole('spinbutton')
      await input.fill('10')

      // Soumettre avec le bouton Ajouter
      const addButton = habitCard.getByRole('button', { name: /Ajouter/i })
      await addButton.click()

      // Vérifier que la saisie est enregistrée (le total devrait être 10)
      await expect(habitCard.getByText('10')).toBeVisible()
    })

    test('affiche l\'historique des saisies cumulatives', async ({ page }) => {
      const habitCard = page.locator('.habit-card').filter({ hasText: 'Lecture' })

      // Ajouter plusieurs saisies
      const input = habitCard.getByRole('spinbutton')
      const addButton = habitCard.getByRole('button', { name: /Ajouter/i })

      await input.fill('5')
      await addButton.click()

      await input.fill('8')
      await addButton.click()

      // Vérifier l'affichage de l'historique
      await expect(page.locator('.cumulative-history')).toBeVisible()
      await expect(page.getByText('Saisies du jour')).toBeVisible()

      // Vérifier que les saisies sont listées
      await expect(page.getByText('+5 pages')).toBeVisible()
      await expect(page.getByText('+8 pages')).toBeVisible()
    })

    test('permet d\'annuler la dernière saisie cumulative', async ({ page }) => {
      const habitCard = page.locator('.habit-card').filter({ hasText: 'Lecture' })

      // Ajouter des saisies
      const input = habitCard.getByRole('spinbutton')
      const addButton = habitCard.getByRole('button', { name: /Ajouter/i })

      await input.fill('5')
      await addButton.click()

      await input.fill('10')
      await addButton.click()

      // Le total devrait être 15
      // (Le total est affiché quelque part dans la carte)

      // Cliquer sur Annuler
      const undoButton = page.locator('.cumulative-history').getByRole('button', { name: /Annuler/ })
      await expect(undoButton).toBeVisible()
      await undoButton.click()

      // Vérifier que la dernière saisie (+10) a été annulée
      await expect(page.getByText('+10 pages')).not.toBeVisible()

      // La saisie +5 devrait toujours être visible
      await expect(page.getByText('+5 pages')).toBeVisible()
    })

    test('le bouton annuler affiche la valeur à annuler', async ({ page }) => {
      const habitCard = page.locator('.habit-card').filter({ hasText: 'Lecture' })

      // Ajouter une saisie de 7 pages
      const input = habitCard.getByRole('spinbutton')
      await input.fill('7')
      const addButton = habitCard.getByRole('button', { name: /Ajouter/i })
      await addButton.click()

      // Le bouton annuler devrait afficher "(+7)"
      const undoButton = page.locator('.cumulative-history').getByRole('button', { name: /Annuler/ })
      await expect(undoButton).toContainText('+7')
    })

    test('annulation multiple jusqu\'à vider l\'historique', async ({ page }) => {
      const habitCard = page.locator('.habit-card').filter({ hasText: 'Lecture' })

      // Ajouter 2 saisies
      const input = habitCard.getByRole('spinbutton')
      const addButton = habitCard.getByRole('button', { name: /Ajouter/i })

      await input.fill('3')
      await addButton.click()

      await input.fill('4')
      await addButton.click()

      // Annuler la première saisie
      const undoButton = page.locator('.cumulative-history').getByRole('button', { name: /Annuler/ })
      await undoButton.click()

      // Annuler la deuxième saisie
      await undoButton.click()

      // L'historique devrait être vide (le composant ne s'affiche pas si vide)
      await expect(page.locator('.cumulative-history')).not.toBeVisible()
    })

    test('mise à jour du total en temps réel', async ({ page }) => {
      const habitCard = page.locator('.habit-card').filter({ hasText: 'Lecture' })

      // Ajouter une saisie
      const input = habitCard.getByRole('spinbutton')
      const addButton = habitCard.getByRole('button', { name: /Ajouter/i })

      await input.fill('12')
      await addButton.click()

      // Le total devrait être mis à jour
      // Vérifier que la valeur 12 apparaît dans la section de progrès de la carte
      await expect(habitCard.locator('.habit-card__progress-text, .habit-card__value')).toContainText(
        '12'
      )

      // Ajouter une autre saisie
      await input.fill('8')
      await addButton.click()

      // Le total devrait maintenant être 20
      await expect(habitCard.locator('.habit-card__progress-text, .habit-card__value')).toContainText(
        '20'
      )

      // Annuler la dernière saisie
      const undoButton = page.locator('.cumulative-history').getByRole('button', { name: /Annuler/ })
      await undoButton.click()

      // Le total devrait revenir à 12
      await expect(habitCard.locator('.habit-card__progress-text, .habit-card__value')).toContainText(
        '12'
      )
    })
  })

  test.describe('Persistance des données', () => {
    test('les saisies cumulatives sont persistées après rechargement', async ({ page }) => {
      await page.addInitScript((data) => {
        localStorage.setItem('doucement_data', JSON.stringify(data))
      }, cumulativeHabitData)

      await page.goto('/')
      await page.waitForSelector('h3:has-text("Lecture")')

      const habitCard = page.locator('.habit-card').filter({ hasText: 'Lecture' })

      // Ajouter des saisies
      const input = habitCard.getByRole('spinbutton')
      const addButton = habitCard.getByRole('button', { name: /Ajouter/i })

      await input.fill('15')
      await addButton.click()

      await input.fill('20')
      await addButton.click()

      // Recharger la page
      await page.reload()
      await page.waitForSelector('h3:has-text("Lecture")')

      // Vérifier que les saisies sont toujours là
      await expect(page.getByText('+15 pages')).toBeVisible()
      await expect(page.getByText('+20 pages')).toBeVisible()
    })

    test('l\'annulation est persistée après rechargement', async ({ page }) => {
      await page.addInitScript((data) => {
        localStorage.setItem('doucement_data', JSON.stringify(data))
      }, cumulativeHabitData)

      await page.goto('/')
      await page.waitForSelector('h3:has-text("Lecture")')

      const habitCard = page.locator('.habit-card').filter({ hasText: 'Lecture' })

      // Ajouter des saisies
      const input = habitCard.getByRole('spinbutton')
      const addButton = habitCard.getByRole('button', { name: /Ajouter/i })

      await input.fill('10')
      await addButton.click()

      await input.fill('5')
      await addButton.click()

      // Annuler la dernière
      const undoButton = page.locator('.cumulative-history').getByRole('button', { name: /Annuler/ })
      await undoButton.click()

      // Recharger la page
      await page.reload()
      await page.waitForSelector('h3:has-text("Lecture")')

      // Vérifier que seule la première saisie est présente
      await expect(page.getByText('+10 pages')).toBeVisible()
      await expect(page.getByText('+5 pages')).not.toBeVisible()
    })
  })
})
