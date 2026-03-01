import { test, expect } from './base-test'
import {
  setupLocalStorage,
  createAppData,
  createIncreaseHabit,
  createDecreaseHabit,
  createMaintainHabit,
  createEntry,
  TodayPage,
  addDays,
  getToday,
} from './fixtures'

/**
 * Tests E2E pour les messages de progression adaptatifs
 * Vérifie que les messages s'affichent correctement sur la page du jour
 *
 * Scénarios :
 * - Premier jour : message d'encouragement
 * - Habitude avec historique : message avec valeur veille + progression cumulée
 * - Habitude maintain : aucun message
 */

test.describe('Messages de progression adaptatifs', () => {
  test('message premier jour pour habitude créée aujourd\'hui', async ({ page }) => {
    const today = getToday()

    const testData = createAppData({
      habits: [
        createIncreaseHabit({
          id: 'habit-first-day',
          name: 'Méditation',
          emoji: '🧘',
          startValue: 5,
          unit: 'minutes',
          createdAt: today,
        }),
      ],
    })
    await setupLocalStorage(page, testData)

    const todayPage = new TodayPage(page)
    await todayPage.gotoAndWaitForHabit('Méditation')

    // Vérifier que le message "premier jour" est affiché
    const habitCard = todayPage.getHabitCard('Méditation')
    await expect(habitCard.locator('.habit-card__progression')).toContainText(
      "C'est le début de ton aventure"
    )
  })

  test('message avec valeur veille et progression cumulée pour habitude increase', async ({
    page,
  }) => {
    const today = getToday()

    // Habitude créée il y a 3 semaines avec progression +1/semaine
    // startValue=10, créée il y a 21 jours => target dose ~ 13
    const createdAt = addDays(today, -21)

    const testData = createAppData({
      habits: [
        createIncreaseHabit({
          id: 'habit-progress',
          name: 'Push-ups',
          emoji: '💪',
          startValue: 10,
          unit: 'répétitions',
          createdAt,
          progression: {
            mode: 'absolute',
            value: 1,
            period: 'weekly',
          },
        }),
      ],
      // Ajouter une entrée récente pour éviter le message d'absence
      entries: [
        createEntry({
          habitId: 'habit-progress',
          date: addDays(today, -1),
          targetDose: 13,
          actualValue: 13,
        }),
      ],
    })
    await setupLocalStorage(page, testData)

    const todayPage = new TodayPage(page)
    await todayPage.gotoAndWaitForHabit('Push-ups')

    // Vérifier que le message contient la valeur de la veille et la progression cumulée
    const habitCard = todayPage.getHabitCard('Push-ups')
    const progressionText = habitCard.locator('.habit-card__progression')
    await expect(progressionText).toBeVisible()
    // Le message doit contenir "Hier" et un pourcentage
    await expect(progressionText).toContainText('Hier')
    await expect(progressionText).toContainText('%')
  })

  test('message avec progression cumulée pour habitude decrease', async ({ page }) => {
    const today = getToday()
    const createdAt = addDays(today, -14)

    const testData = createAppData({
      habits: [
        createDecreaseHabit({
          id: 'habit-decrease',
          name: 'Cigarettes',
          emoji: '🚭',
          startValue: 10,
          unit: 'cigarettes',
          targetValue: 0,
          createdAt,
          progression: {
            mode: 'absolute',
            value: 1,
            period: 'weekly',
          },
        }),
      ],
      entries: [
        createEntry({
          habitId: 'habit-decrease',
          date: addDays(today, -1),
          targetDose: 8,
          actualValue: 8,
        }),
      ],
    })
    await setupLocalStorage(page, testData)

    const todayPage = new TodayPage(page)
    await todayPage.gotoAndWaitForHabit('Cigarettes')

    const habitCard = todayPage.getHabitCard('Cigarettes')
    const progressionText = habitCard.locator('.habit-card__progression')
    await expect(progressionText).toBeVisible()
    // Le message decrease doit contenir "Hier" et un "-"
    await expect(progressionText).toContainText('Hier')
    await expect(progressionText).toContainText('%')
  })

  test('pas de message de progression pour habitude maintain', async ({ page }) => {
    const today = getToday()

    const testData = createAppData({
      habits: [
        createMaintainHabit({
          id: 'habit-maintain',
          name: 'Eau',
          emoji: '💧',
          startValue: 8,
          unit: 'verres',
          createdAt: addDays(today, -7),
        }),
      ],
    })
    await setupLocalStorage(page, testData)

    const todayPage = new TodayPage(page)
    await todayPage.gotoAndWaitForHabit('Eau')

    // Aucun message de progression pour maintain
    const habitCard = todayPage.getHabitCard('Eau')
    await expect(habitCard.locator('.habit-card__progression')).not.toBeVisible()
  })

  test('dose cible affichée correctement pour habitude avec progression', async ({ page }) => {
    const today = getToday()
    // Habitude créée il y a exactement 2 semaines, +1/semaine
    // startValue=10, 2 semaines = +2 => targetDose=12
    const createdAt = addDays(today, -14)

    const testData = createAppData({
      habits: [
        createIncreaseHabit({
          id: 'habit-dose',
          name: 'Pompes',
          emoji: '💪',
          startValue: 10,
          unit: 'fois',
          createdAt,
          progression: {
            mode: 'absolute',
            value: 1,
            period: 'weekly',
          },
        }),
      ],
      entries: [
        createEntry({
          habitId: 'habit-dose',
          date: addDays(today, -1),
          targetDose: 12,
          actualValue: 12,
        }),
      ],
    })
    await setupLocalStorage(page, testData)

    const todayPage = new TodayPage(page)
    await todayPage.gotoAndWaitForHabit('Pompes')

    // La dose cible affichée doit être 12 (10 + 2 semaines * 1)
    const habitCard = todayPage.getHabitCard('Pompes')
    await expect(habitCard.locator('.habit-card__dose-value')).toContainText('12')
  })
})
