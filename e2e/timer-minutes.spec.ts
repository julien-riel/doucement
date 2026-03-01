import { test, expect } from './base-test'
import {
  setupLocalStorage,
  createAppData,
  createTimerHabit,
  createStopwatchHabit,
  resetCounters,
} from './fixtures'

/**
 * Tests E2E pour les habitudes timer/stopwatch avec unité en minutes
 * Vérifie que la conversion minutes → secondes fonctionne correctement
 */

function createTimerMinutesData() {
  resetCounters()

  const habit = createTimerHabit({
    id: 'habit-meditation-timer',
    name: 'Méditation Timer',
    emoji: '🧘',
    startValue: 10,
    unit: 'minutes',
    direction: 'maintain',
    progression: null,
    createdAt: '2025-12-01',
    entryMode: 'replace',
    notifyOnTarget: true,
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

function createStopwatchMinutesData() {
  resetCounters()

  const habit = createStopwatchHabit({
    id: 'habit-meditation-sw',
    name: 'Méditation Chrono',
    emoji: '⏱️',
    startValue: 10,
    unit: 'minutes',
    direction: 'maintain',
    progression: null,
    createdAt: '2025-12-01',
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

test.describe('Timer en minutes - Affichage correct', () => {
  test('affiche le décompte en minutes (10:00) et non en secondes (00:10)', async ({
    page,
  }) => {
    const testData = createTimerMinutesData()
    await setupLocalStorage(page, testData)

    await page.goto('/')
    await page.waitForSelector('h3:has-text("Méditation Timer")')

    // Vérifier que le timer affiche 10:00 (10 minutes) et non 00:10
    await expect(page.locator('.timer-checkin__time')).toHaveText('10:00')

    // Vérifier que la cible affiche "10 min"
    await expect(page.getByText('Durée cible : 10 min')).toBeVisible()

    // Vérifier que le header de la carte affiche "10 minutes"
    await expect(page.getByText('10')).toBeVisible()
    await expect(page.getByText('minutes')).toBeVisible()
  })

  test('le timer démarre et décompte correctement en minutes', async ({ page }) => {
    const testData = createTimerMinutesData()
    await setupLocalStorage(page, testData)

    await page.goto('/')
    await page.waitForSelector('h3:has-text("Méditation Timer")')

    // Démarrer le timer
    await page.getByRole('button', { name: /Démarrer la minuterie/ }).click()

    // Attendre 1 seconde
    await page.waitForTimeout(1100)

    // Le timer devrait afficher ~09:59 (pas 00:09)
    const timeText = await page.locator('.timer-checkin__time').textContent()
    expect(timeText).toMatch(/09:5[89]/)
  })
})

test.describe('Stopwatch en minutes - Affichage correct', () => {
  test('affiche l\'objectif en minutes et non en secondes', async ({ page }) => {
    const testData = createStopwatchMinutesData()
    await setupLocalStorage(page, testData)

    await page.goto('/')
    await page.waitForSelector('h3:has-text("Méditation Chrono")')

    // Vérifier que l'objectif affiche "10 min"
    await expect(page.getByText('Objectif : 10 min')).toBeVisible()

    // Le header de la carte doit afficher "10 minutes"
    await expect(page.getByText('10')).toBeVisible()
    await expect(page.getByText('minutes')).toBeVisible()
  })
})

test.describe('Timer en secondes - Non-régression', () => {
  test('un timer en secondes fonctionne toujours normalement', async ({ page }) => {
    resetCounters()

    const habit = createTimerHabit({
      id: 'habit-plank-sec',
      name: 'Gainage Sec',
      emoji: '💪',
      startValue: 120,
      unit: 'secondes',
      direction: 'maintain',
      progression: null,
      createdAt: '2025-12-01',
      entryMode: 'replace',
    })

    const testData = createAppData({
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

    await setupLocalStorage(page, testData)
    await page.goto('/')
    await page.waitForSelector('h3:has-text("Gainage Sec")')

    // Le timer doit afficher 02:00 (120 secondes = 2 minutes)
    await expect(page.locator('.timer-checkin__time')).toHaveText('02:00')

    // La cible doit afficher "120 sec"
    await expect(page.getByText('Durée cible : 120 sec')).toBeVisible()
  })
})
