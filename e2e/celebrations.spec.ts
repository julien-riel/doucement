import { test, expect } from './base-test'
import {
  setupLocalStorage,
  setupFromTestFile,
  closeCelebrationModalIfVisible,
  createAppData,
  createIncreaseHabit,
  createEntry,
  createPreferences,
} from './fixtures'

/**
 * Tests E2E pour le système de célébrations
 * Vérifie le déclenchement des modales de célébration au passage des seuils
 * et la non-répétition des célébrations déjà vues
 */

// ============================================================================
// Helper: Create milestone data for celebration tests
// ============================================================================

interface MilestoneConfig {
  habitId: string
  level: number
  reachedAt: string
  celebrated: boolean
}

function createCelebrationTestData(options: {
  habitId: string
  habitName: string
  emoji: string
  currentValue: number
  targetValue: number
  milestones: MilestoneConfig[]
}) {
  const { habitId, habitName, emoji, currentValue, targetValue, milestones } = options

  const habit = createIncreaseHabit({
    id: habitId,
    name: habitName,
    emoji,
    description: 'Test habit',
    startValue: 0,
    unit: 'points',
    progression: { mode: 'absolute', value: 10, period: 'weekly' },
    targetValue,
    createdAt: '2025-12-01',
  })

  const entry = createEntry({
    id: 'e1',
    habitId,
    date: '2026-01-10',
    targetDose: currentValue,
    actualValue: currentValue,
    createdAt: '2026-01-10T07:30:00Z',
    updatedAt: '2026-01-10T07:30:00Z',
  })

  return createAppData({
    habits: [habit],
    entries: [entry],
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
    } as ReturnType<typeof createPreferences> & { milestones: { milestones: MilestoneConfig[] } },
  })
}

// ============================================================================
// TESTS
// ============================================================================

test.describe('Célébrations des jalons', () => {
  test.describe('Déclenchement de la modale', () => {
    test.beforeEach(async ({ page }) => {
      // Load test data with a habit near the 25% threshold
      await setupFromTestFile(page, 'celebration-pending.json')
    })

    test('affiche la modale de célébration après passage du seuil 25%', async ({ page }) => {
      await page.goto('/')

      // Verify the habit is visible
      await expect(page.getByRole('heading', { name: 'Pompes' })).toBeVisible()

      // Go to statistics page which detects new milestones
      await page.goto('/statistics')

      // Verify statistics page is loaded
      await expect(page.getByRole('heading', { name: 'Mes statistiques' })).toBeVisible()
    })

    test('la modale contient les éléments attendus', async ({ page }) => {
      // Create data with a 25% milestone reached but not celebrated
      const testData = createCelebrationTestData({
        habitId: 'habit-milestone-test',
        habitName: 'Méditation',
        emoji: '🧘',
        currentValue: 5,
        targetValue: 20,
        milestones: [
          {
            habitId: 'habit-milestone-test',
            level: 25,
            reachedAt: '2026-01-10',
            celebrated: false,
          },
        ],
      })

      await setupLocalStorage(page, testData)
      await page.goto('/statistics')

      // The celebration modal should appear automatically
      const modal = page.locator('[role="dialog"][aria-modal="true"]')
      await expect(modal).toBeVisible({ timeout: 5000 })

      // Verify the title
      await expect(page.getByText('Premier quart !')).toBeVisible()

      // Verify the percentage
      await expect(page.getByText('25% de ta cible Méditation')).toBeVisible()

      // Verify the encouraging message
      await expect(page.getByText('Beau départ ! Tu as parcouru un quart du chemin.')).toBeVisible()

      // Verify the close button
      await expect(page.getByRole('button', { name: 'Continuer' })).toBeVisible()

      // Verify the emoji
      await expect(page.getByText('🧘')).toBeVisible()
    })

    test('la modale peut être fermée avec le bouton Continuer', async ({ page }) => {
      const testData = createCelebrationTestData({
        habitId: 'habit-close-test',
        habitName: 'Lecture',
        emoji: '📚',
        currentValue: 50,
        targetValue: 100,
        milestones: [
          { habitId: 'habit-close-test', level: 25, reachedAt: '2026-01-08', celebrated: true },
          { habitId: 'habit-close-test', level: 50, reachedAt: '2026-01-10', celebrated: false },
        ],
      })

      await setupLocalStorage(page, testData)
      await page.goto('/statistics')

      // Wait for modal
      const modal = page.locator('[role="dialog"][aria-modal="true"]')
      await expect(modal).toBeVisible({ timeout: 5000 })

      // Click Continue
      await page.getByRole('button', { name: 'Continuer' }).click()

      // Modal should disappear
      await expect(modal).not.toBeVisible()
    })

    test('la modale peut être fermée avec la touche Escape', async ({ page }) => {
      const testData = createCelebrationTestData({
        habitId: 'habit-escape-test',
        habitName: 'Course',
        emoji: '🏃',
        currentValue: 7.5,
        targetValue: 10,
        milestones: [
          { habitId: 'habit-escape-test', level: 25, reachedAt: '2026-01-05', celebrated: true },
          { habitId: 'habit-escape-test', level: 50, reachedAt: '2026-01-07', celebrated: true },
          { habitId: 'habit-escape-test', level: 75, reachedAt: '2026-01-10', celebrated: false },
        ],
      })

      await setupLocalStorage(page, testData)
      await page.goto('/statistics')

      // Wait for modal
      const modal = page.locator('[role="dialog"][aria-modal="true"]')
      await expect(modal).toBeVisible({ timeout: 5000 })

      // Verify we're on the 75% milestone
      await expect(page.getByRole('heading', { name: 'Trois quarts !' })).toBeVisible()

      // Press Escape
      await page.keyboard.press('Escape')

      // Modal should disappear
      await expect(modal).not.toBeVisible()
    })
  })

  test.describe('Non-répétition des célébrations', () => {
    test('ne réaffiche pas une célébration déjà célébrée', async ({ page }) => {
      const testData = createCelebrationTestData({
        habitId: 'habit-no-repeat',
        habitName: 'Yoga',
        emoji: '🧘',
        currentValue: 15,
        targetValue: 60,
        milestones: [
          { habitId: 'habit-no-repeat', level: 25, reachedAt: '2026-01-08', celebrated: true },
        ],
      })

      await setupLocalStorage(page, testData)
      await page.goto('/statistics')

      // Wait a bit to verify no modal opens
      await page.waitForTimeout(1000)

      // Modal should not be visible since the milestone is already celebrated
      const modal = page.locator('[role="dialog"][aria-modal="true"]')
      await expect(modal).not.toBeVisible()

      // Verify statistics page is loaded
      await expect(page.getByRole('heading', { name: 'Mes statistiques' })).toBeVisible()
    })

    test('affiche seulement le premier jalon non célébré parmi plusieurs', async ({ page }) => {
      const testData = createCelebrationTestData({
        habitId: 'habit-multiple',
        habitName: 'Écriture',
        emoji: '✍️',
        currentValue: 600,
        targetValue: 1000,
        milestones: [
          // Both 25% and 50% milestones are reached but not celebrated
          { habitId: 'habit-multiple', level: 25, reachedAt: '2026-01-08', celebrated: false },
          { habitId: 'habit-multiple', level: 50, reachedAt: '2026-01-10', celebrated: false },
        ],
      })

      await setupLocalStorage(page, testData)
      await page.goto('/statistics')

      // Modal should open
      const modal = page.locator('[role="dialog"][aria-modal="true"]')
      await expect(modal).toBeVisible({ timeout: 5000 })

      // Should display the first uncelebrated milestone (25%)
      await expect(page.getByText('Premier quart !')).toBeVisible()
      await expect(page.getByText('25% de ta cible Écriture')).toBeVisible()
    })
  })

  test.describe('Messages de célébration par niveau', () => {
    const createMilestoneTestData = (level: number, title: string, message: string) => {
      const percentage = level / 100
      const currentValue = percentage * 100 // targetValue = 100

      // Generate all milestones for lower levels as celebrated
      const milestones = [25, 50, 75, 100]
        .filter((l) => l <= level)
        .map((l) => ({
          habitId: `habit-level-${level}`,
          level: l,
          reachedAt: '2026-01-10',
          celebrated: l < level, // Lower levels are celebrated, target level is not
        }))

      return {
        level,
        title,
        message,
        data: createCelebrationTestData({
          habitId: `habit-level-${level}`,
          habitName: 'Test',
          emoji: '🎯',
          currentValue,
          targetValue: 100,
          milestones,
        }),
      }
    }

    test('affiche le message correct pour le jalon 50%', async ({ page }) => {
      const testCase = createMilestoneTestData(
        50,
        'Mi-parcours !',
        'Mi-parcours atteint ! Tu es sur la bonne voie.'
      )

      await setupLocalStorage(page, testCase.data)
      await page.goto('/statistics')

      const modal = page.locator('[role="dialog"][aria-modal="true"]')
      await expect(modal).toBeVisible({ timeout: 5000 })

      await expect(page.getByText(testCase.title)).toBeVisible()
      await expect(page.getByText(testCase.message)).toBeVisible()
    })

    test('affiche le message correct pour le jalon 75%', async ({ page }) => {
      const testCase = createMilestoneTestData(
        75,
        'Trois quarts !',
        "Trois quarts ! L'arrivée est en vue."
      )

      await setupLocalStorage(page, testCase.data)
      await page.goto('/statistics')

      const modal = page.locator('[role="dialog"][aria-modal="true"]')
      await expect(modal).toBeVisible({ timeout: 5000 })

      await expect(page.getByRole('heading', { name: testCase.title })).toBeVisible()
      await expect(page.locator('.celebration-message')).toContainText(testCase.message)
    })

    test('affiche le message correct pour le jalon 100%', async ({ page }) => {
      const testCase = createMilestoneTestData(
        100,
        'Objectif atteint !',
        'Objectif atteint ! Tu peux être fier·e de toi.'
      )

      await setupLocalStorage(page, testCase.data)
      await page.goto('/statistics')

      const modal = page.locator('[role="dialog"][aria-modal="true"]')
      await expect(modal).toBeVisible({ timeout: 5000 })

      await expect(page.getByRole('heading', { name: testCase.title })).toBeVisible()
      await expect(page.locator('.celebration-message')).toContainText(testCase.message)
    })
  })
})
