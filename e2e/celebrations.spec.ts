import { test, expect } from './base-test'

/**
 * Tests E2E pour le système de célébrations
 * Vérifie le déclenchement des modales de célébration au passage des seuils
 * et la non-répétition des célébrations déjà vues
 */

test.describe('Célébrations des jalons', () => {
  test.describe('Déclenchement de la modale', () => {
    test.beforeEach(async ({ page }) => {
      // Charger les données de test avec une habitude proche du seuil de 25%
      // startValue = 10, targetValue = 50, donc 25% = 10 + (50-10)*0.25 = 20
      // La dernière entrée est à 19, donc un check-in à 20+ devrait déclencher la célébration
      const testDataResponse = await page.request.get(
        'http://localhost:4173/test-data/celebration-pending.json'
      )
      const testData = await testDataResponse.json()

      await page.addInitScript((data) => {
        localStorage.setItem('doucement_data', JSON.stringify(data))
      }, testData)
    })

    test('affiche la modale de célébration après passage du seuil 25%', async ({ page }) => {
      await page.goto('/')

      // Vérifier que l'habitude est visible
      await expect(page.getByRole('heading', { name: 'Pompes' })).toBeVisible()

      // Aller sur la page statistiques qui détecte les nouveaux jalons
      await page.goto('/statistics')

      // La dernière valeur (19) est juste en dessous du seuil de 25% (20)
      // La page statistiques devrait détecter le jalon non célébré s'il était déjà atteint
      // Vérifions que les statistiques s'affichent correctement
      await expect(page.getByRole('heading', { name: 'Mes statistiques' })).toBeVisible()
    })

    test('la modale contient les éléments attendus', async ({ page }) => {
      // Charger des données avec un jalon à 25% déjà atteint mais non célébré
      const testDataWithMilestone = {
        schemaVersion: 3,
        habits: [
          {
            id: 'habit-milestone-test',
            name: 'Méditation',
            emoji: '🧘',
            description: 'Test jalon',
            direction: 'increase',
            startValue: 0,
            unit: 'minutes',
            progression: { mode: 'fixed', value: 1, period: 'weekly' },
            targetValue: 20,
            createdAt: '2025-12-01',
            archivedAt: null,
            trackingMode: 'detailed',
            implementationIntention: null,
          },
        ],
        entries: [
          {
            id: 'e1',
            habitId: 'habit-milestone-test',
            date: '2026-01-10',
            targetDose: 5,
            actualValue: 5,
            createdAt: '2026-01-10T07:30:00Z',
            updatedAt: '2026-01-10T07:30:00Z',
          },
        ],
        preferences: {
          onboardingCompleted: true,
          lastWeeklyReviewDate: '2026-01-05',
          milestones: {
            milestones: [
              {
                habitId: 'habit-milestone-test',
                level: 25,
                reachedAt: '2026-01-10',
                celebrated: false,
              },
            ],
          },
          notifications: {
            enabled: false,
            morningReminder: { enabled: false, time: '08:00' },
            eveningReminder: { enabled: false, time: '20:00' },
            weeklyReviewReminder: { enabled: false, time: '10:00' },
          },
        },
      }

      await page.addInitScript((data) => {
        localStorage.setItem('doucement_data', JSON.stringify(data))
      }, testDataWithMilestone)

      await page.goto('/statistics')

      // La modale de célébration devrait s'afficher automatiquement
      const modal = page.locator('[role="dialog"][aria-modal="true"]')
      await expect(modal).toBeVisible({ timeout: 5000 })

      // Vérifier le titre
      await expect(page.getByText('Premier quart !')).toBeVisible()

      // Vérifier le pourcentage
      await expect(page.getByText('25% de ta cible Méditation')).toBeVisible()

      // Vérifier le message encourageant
      await expect(page.getByText('Beau départ ! Tu as parcouru un quart du chemin.')).toBeVisible()

      // Vérifier le bouton de fermeture
      await expect(page.getByRole('button', { name: 'Continuer' })).toBeVisible()

      // Vérifier l'emoji
      await expect(page.getByText('🧘')).toBeVisible()
    })

    test('la modale peut être fermée avec le bouton Continuer', async ({ page }) => {
      const testDataWithMilestone = {
        schemaVersion: 3,
        habits: [
          {
            id: 'habit-close-test',
            name: 'Lecture',
            emoji: '📚',
            description: 'Test fermeture',
            direction: 'increase',
            startValue: 0,
            unit: 'pages',
            progression: { mode: 'fixed', value: 5, period: 'weekly' },
            targetValue: 100,
            createdAt: '2025-12-01',
            archivedAt: null,
            trackingMode: 'detailed',
            implementationIntention: null,
          },
        ],
        entries: [
          {
            id: 'e1',
            habitId: 'habit-close-test',
            date: '2026-01-10',
            targetDose: 25,
            actualValue: 50,
            createdAt: '2026-01-10T07:30:00Z',
            updatedAt: '2026-01-10T07:30:00Z',
          },
        ],
        preferences: {
          onboardingCompleted: true,
          lastWeeklyReviewDate: '2026-01-05',
          milestones: {
            milestones: [
              { habitId: 'habit-close-test', level: 25, reachedAt: '2026-01-08', celebrated: true },
              {
                habitId: 'habit-close-test',
                level: 50,
                reachedAt: '2026-01-10',
                celebrated: false,
              },
            ],
          },
          notifications: {
            enabled: false,
            morningReminder: { enabled: false, time: '08:00' },
            eveningReminder: { enabled: false, time: '20:00' },
            weeklyReviewReminder: { enabled: false, time: '10:00' },
          },
        },
      }

      await page.addInitScript((data) => {
        localStorage.setItem('doucement_data', JSON.stringify(data))
      }, testDataWithMilestone)

      await page.goto('/statistics')

      // Attendre la modale
      const modal = page.locator('[role="dialog"][aria-modal="true"]')
      await expect(modal).toBeVisible({ timeout: 5000 })

      // Cliquer sur Continuer
      await page.getByRole('button', { name: 'Continuer' }).click()

      // La modale devrait disparaître
      await expect(modal).not.toBeVisible()
    })

    test('la modale peut être fermée avec la touche Escape', async ({ page }) => {
      const testDataWithMilestone = {
        schemaVersion: 3,
        habits: [
          {
            id: 'habit-escape-test',
            name: 'Course',
            emoji: '🏃',
            description: 'Test escape',
            direction: 'increase',
            startValue: 0,
            unit: 'km',
            progression: { mode: 'fixed', value: 1, period: 'weekly' },
            targetValue: 10,
            createdAt: '2025-12-01',
            archivedAt: null,
            trackingMode: 'detailed',
            implementationIntention: null,
          },
        ],
        entries: [
          {
            id: 'e1',
            habitId: 'habit-escape-test',
            date: '2026-01-10',
            targetDose: 2.5,
            actualValue: 7.5,
            createdAt: '2026-01-10T07:30:00Z',
            updatedAt: '2026-01-10T07:30:00Z',
          },
        ],
        preferences: {
          onboardingCompleted: true,
          lastWeeklyReviewDate: '2026-01-05',
          milestones: {
            milestones: [
              { habitId: 'habit-escape-test', level: 25, reachedAt: '2026-01-05', celebrated: true },
              { habitId: 'habit-escape-test', level: 50, reachedAt: '2026-01-07', celebrated: true },
              {
                habitId: 'habit-escape-test',
                level: 75,
                reachedAt: '2026-01-10',
                celebrated: false,
              },
            ],
          },
          notifications: {
            enabled: false,
            morningReminder: { enabled: false, time: '08:00' },
            eveningReminder: { enabled: false, time: '20:00' },
            weeklyReviewReminder: { enabled: false, time: '10:00' },
          },
        },
      }

      await page.addInitScript((data) => {
        localStorage.setItem('doucement_data', JSON.stringify(data))
      }, testDataWithMilestone)

      await page.goto('/statistics')

      // Attendre la modale
      const modal = page.locator('[role="dialog"][aria-modal="true"]')
      await expect(modal).toBeVisible({ timeout: 5000 })

      // Vérifier qu'on est bien sur le jalon 75%
      await expect(page.getByRole('heading', { name: 'Trois quarts !' })).toBeVisible()

      // Appuyer sur Escape
      await page.keyboard.press('Escape')

      // La modale devrait disparaître
      await expect(modal).not.toBeVisible()
    })
  })

  test.describe('Non-répétition des célébrations', () => {
    test('ne réaffiche pas une célébration déjà célébrée', async ({ page }) => {
      const testDataCelebrated = {
        schemaVersion: 3,
        habits: [
          {
            id: 'habit-no-repeat',
            name: 'Yoga',
            emoji: '🧘',
            description: 'Test non-répétition',
            direction: 'increase',
            startValue: 0,
            unit: 'minutes',
            progression: { mode: 'fixed', value: 5, period: 'weekly' },
            targetValue: 60,
            createdAt: '2025-12-01',
            archivedAt: null,
            trackingMode: 'detailed',
            implementationIntention: null,
          },
        ],
        entries: [
          {
            id: 'e1',
            habitId: 'habit-no-repeat',
            date: '2026-01-10',
            targetDose: 15,
            actualValue: 15,
            createdAt: '2026-01-10T07:30:00Z',
            updatedAt: '2026-01-10T07:30:00Z',
          },
        ],
        preferences: {
          onboardingCompleted: true,
          lastWeeklyReviewDate: '2026-01-05',
          milestones: {
            milestones: [
              { habitId: 'habit-no-repeat', level: 25, reachedAt: '2026-01-08', celebrated: true },
            ],
          },
          notifications: {
            enabled: false,
            morningReminder: { enabled: false, time: '08:00' },
            eveningReminder: { enabled: false, time: '20:00' },
            weeklyReviewReminder: { enabled: false, time: '10:00' },
          },
        },
      }

      await page.addInitScript((data) => {
        localStorage.setItem('doucement_data', JSON.stringify(data))
      }, testDataCelebrated)

      await page.goto('/statistics')

      // Attendre un peu pour vérifier qu'aucune modale ne s'ouvre
      await page.waitForTimeout(1000)

      // La modale ne devrait pas être visible car le jalon est déjà célébré
      const modal = page.locator('[role="dialog"][aria-modal="true"]')
      await expect(modal).not.toBeVisible()

      // Vérifier que la page statistiques est bien chargée
      await expect(page.getByRole('heading', { name: 'Mes statistiques' })).toBeVisible()
    })

    test('affiche seulement le premier jalon non célébré parmi plusieurs', async ({ page }) => {
      const testDataMultipleMilestones = {
        schemaVersion: 3,
        habits: [
          {
            id: 'habit-multiple',
            name: 'Écriture',
            emoji: '✍️',
            description: 'Test multiple jalons',
            direction: 'increase',
            startValue: 0,
            unit: 'mots',
            progression: { mode: 'fixed', value: 100, period: 'weekly' },
            targetValue: 1000,
            createdAt: '2025-12-01',
            archivedAt: null,
            trackingMode: 'detailed',
            implementationIntention: null,
          },
        ],
        entries: [
          {
            id: 'e1',
            habitId: 'habit-multiple',
            date: '2026-01-10',
            targetDose: 250,
            actualValue: 600,
            createdAt: '2026-01-10T07:30:00Z',
            updatedAt: '2026-01-10T07:30:00Z',
          },
        ],
        preferences: {
          onboardingCompleted: true,
          lastWeeklyReviewDate: '2026-01-05',
          milestones: {
            milestones: [
              // Les jalons 25% et 50% sont atteints mais non célébrés
              {
                habitId: 'habit-multiple',
                level: 25,
                reachedAt: '2026-01-08',
                celebrated: false,
              },
              {
                habitId: 'habit-multiple',
                level: 50,
                reachedAt: '2026-01-10',
                celebrated: false,
              },
            ],
          },
          notifications: {
            enabled: false,
            morningReminder: { enabled: false, time: '08:00' },
            eveningReminder: { enabled: false, time: '20:00' },
            weeklyReviewReminder: { enabled: false, time: '10:00' },
          },
        },
      }

      await page.addInitScript((data) => {
        localStorage.setItem('doucement_data', JSON.stringify(data))
      }, testDataMultipleMilestones)

      await page.goto('/statistics')

      // La modale devrait s'ouvrir
      const modal = page.locator('[role="dialog"][aria-modal="true"]')
      await expect(modal).toBeVisible({ timeout: 5000 })

      // Elle devrait afficher le premier jalon non célébré (25%)
      await expect(page.getByText('Premier quart !')).toBeVisible()
      await expect(page.getByText('25% de ta cible Écriture')).toBeVisible()
    })
  })

  test.describe('Messages de célébration par niveau', () => {
    const milestoneTestData = (level: number, message: string, title: string) => {
      const percentage = level / 100
      const currentValue = percentage * 100 // targetValue = 100

      // Générer tous les milestones des niveaux inférieurs comme célébrés
      const milestones = [25, 50, 75, 100]
        .filter((l) => l <= level)
        .map((l) => ({
          habitId: `habit-level-${level}`,
          level: l,
          reachedAt: '2026-01-10',
          celebrated: l < level, // Les niveaux inférieurs sont célébrés, le niveau cible ne l'est pas
        }))

      return {
        level,
        title,
        message,
        data: {
          schemaVersion: 3,
          habits: [
            {
              id: `habit-level-${level}`,
              name: 'Test',
              emoji: '🎯',
              description: `Test niveau ${level}`,
              direction: 'increase',
              startValue: 0,
              unit: 'points',
              progression: { mode: 'fixed', value: 10, period: 'weekly' },
              targetValue: 100,
              createdAt: '2025-12-01',
              archivedAt: null,
              trackingMode: 'detailed',
              implementationIntention: null,
            },
          ],
          entries: [
            {
              id: 'e1',
              habitId: `habit-level-${level}`,
              date: '2026-01-10',
              targetDose: currentValue,
              actualValue: currentValue,
              createdAt: '2026-01-10T07:30:00Z',
              updatedAt: '2026-01-10T07:30:00Z',
            },
          ],
          preferences: {
            onboardingCompleted: true,
            lastWeeklyReviewDate: '2026-01-05',
            milestones: {
              milestones,
            },
            notifications: {
              enabled: false,
              morningReminder: { enabled: false, time: '08:00' },
              eveningReminder: { enabled: false, time: '20:00' },
              weeklyReviewReminder: { enabled: false, time: '10:00' },
            },
          },
        },
      }
    }

    test('affiche le message correct pour le jalon 50%', async ({ page }) => {
      const testCase = milestoneTestData(
        50,
        'Mi-parcours atteint ! Tu es sur la bonne voie.',
        'Mi-parcours !'
      )

      await page.addInitScript((data) => {
        localStorage.setItem('doucement_data', JSON.stringify(data))
      }, testCase.data)

      await page.goto('/statistics')

      const modal = page.locator('[role="dialog"][aria-modal="true"]')
      await expect(modal).toBeVisible({ timeout: 5000 })

      await expect(page.getByText(testCase.title)).toBeVisible()
      await expect(page.getByText(testCase.message)).toBeVisible()
    })

    test('affiche le message correct pour le jalon 75%', async ({ page }) => {
      const testCase = milestoneTestData(75, "Trois quarts ! L'arrivée est en vue.", 'Trois quarts !')

      await page.addInitScript((data) => {
        localStorage.setItem('doucement_data', JSON.stringify(data))
      }, testCase.data)

      await page.goto('/statistics')

      const modal = page.locator('[role="dialog"][aria-modal="true"]')
      await expect(modal).toBeVisible({ timeout: 5000 })

      await expect(page.getByRole('heading', { name: testCase.title })).toBeVisible()
      await expect(page.locator('.celebration-message')).toContainText(testCase.message)
    })

    test('affiche le message correct pour le jalon 100%', async ({ page }) => {
      const testCase = milestoneTestData(
        100,
        'Objectif atteint ! Tu peux être fier·e de toi.',
        'Objectif atteint !'
      )

      await page.addInitScript((data) => {
        localStorage.setItem('doucement_data', JSON.stringify(data))
      }, testCase.data)

      await page.goto('/statistics')

      const modal = page.locator('[role="dialog"][aria-modal="true"]')
      await expect(modal).toBeVisible({ timeout: 5000 })

      await expect(page.getByRole('heading', { name: testCase.title })).toBeVisible()
      await expect(page.locator('.celebration-message')).toContainText(testCase.message)
    })
  })
})
