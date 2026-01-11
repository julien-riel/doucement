/**
 * Tests unitaires pour le premier check-in (Day One)
 * Phase 12 - Premier Check-in Immédiat
 *
 * Ces tests vérifient la logique métier du premier check-in:
 * - Le calcul de la dose cible le jour de création
 * - La possibilité d'enregistrer une entrée le jour même
 * - Les messages de première victoire
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { calculateTargetDose } from '../../services/progression'
import { FIRST_CHECKIN } from '../../constants/messages'
import type { Habit } from '../../types'

// ============================================================================
// TEST FIXTURES
// ============================================================================

/**
 * Date de test fixe pour la cohérence des tests
 */
const TEST_TODAY = '2026-01-11'

/**
 * Crée une habitude de test
 */
function createHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit-1',
    name: 'Push-ups',
    emoji: '💪',
    direction: 'increase',
    startValue: 10,
    unit: 'répétitions',
    progression: {
      mode: 'percentage',
      value: 5,
      period: 'weekly',
    },
    createdAt: TEST_TODAY, // Created today
    archivedAt: null,
    ...overrides,
  }
}

// ============================================================================
// MOCK DATE
// ============================================================================

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(TEST_TODAY))
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

// ============================================================================
// TARGET DOSE ON DAY ONE TESTS
// ============================================================================

describe('calculateTargetDose on Day One (12.3)', () => {
  it('returns startValue when habit is created today', () => {
    const habit = createHabit({ createdAt: TEST_TODAY })
    const targetDose = calculateTargetDose(habit, TEST_TODAY)
    expect(targetDose).toBe(habit.startValue)
  })

  it('returns startValue for percentage mode on day 0', () => {
    const habit = createHabit({
      createdAt: TEST_TODAY,
      startValue: 15,
      progression: { mode: 'percentage', value: 10, period: 'weekly' },
    })
    const targetDose = calculateTargetDose(habit, TEST_TODAY)
    expect(targetDose).toBe(15)
  })

  it('returns startValue for absolute mode on day 0', () => {
    const habit = createHabit({
      createdAt: TEST_TODAY,
      startValue: 20,
      progression: { mode: 'absolute', value: 2, period: 'daily' },
    })
    const targetDose = calculateTargetDose(habit, TEST_TODAY)
    expect(targetDose).toBe(20)
  })

  it('returns startValue for decrease habits on day 0', () => {
    const habit = createHabit({
      createdAt: TEST_TODAY,
      direction: 'decrease',
      startValue: 10,
      progression: { mode: 'percentage', value: 5, period: 'weekly' },
    })
    const targetDose = calculateTargetDose(habit, TEST_TODAY)
    expect(targetDose).toBe(10)
  })

  it('returns startValue for maintain habits', () => {
    const habit = createHabit({
      createdAt: TEST_TODAY,
      direction: 'maintain',
      startValue: 8,
      progression: null,
    })
    const targetDose = calculateTargetDose(habit, TEST_TODAY)
    expect(targetDose).toBe(8)
  })

  it('increases dose on day 1 for daily absolute progression', () => {
    const habit = createHabit({
      createdAt: '2026-01-10', // Created yesterday
      startValue: 10,
      progression: { mode: 'absolute', value: 2, period: 'daily' },
    })
    const targetDose = calculateTargetDose(habit, TEST_TODAY)
    // Day 1: 10 + 2 = 12
    expect(targetDose).toBe(12)
  })

  it('keeps same dose during first week for weekly progression', () => {
    const habit = createHabit({
      createdAt: '2026-01-10', // Created yesterday
      startValue: 10,
      progression: { mode: 'percentage', value: 5, period: 'weekly' },
    })
    const targetDose = calculateTargetDose(habit, TEST_TODAY)
    // Less than 7 days, so no progression yet
    expect(targetDose).toBe(10)
  })

  it('allows first check-in on creation day', () => {
    // This verifies that a habit created today can have an entry for today
    const habit = createHabit({ createdAt: TEST_TODAY })
    const targetDose = calculateTargetDose(habit, TEST_TODAY)

    // The entry would look like this:
    const mockEntry = {
      habitId: habit.id,
      date: TEST_TODAY,
      targetDose: targetDose,
      actualValue: 8, // User did 8 push-ups
    }

    // Verify we can calculate completion percentage
    expect(targetDose).toBeGreaterThan(0)
    expect((mockEntry.actualValue / targetDose) * 100).toBe(80) // 8/10 = 80%
  })
})

// ============================================================================
// FIRST VICTORY MESSAGES TESTS (12.4, 12.5)
// ============================================================================

describe('First Check-in Messages (12.4, 12.5)', () => {
  it('has title message defined', () => {
    expect(FIRST_CHECKIN.title).toBe('Première victoire ?')
  })

  it('has subtitle question defined', () => {
    expect(FIRST_CHECKIN.subtitle).toBe("Avez-vous déjà fait quelque chose aujourd'hui ?")
  })

  it('has Yes button text defined', () => {
    expect(FIRST_CHECKIN.yesButton).toBe("Oui, je l'enregistre")
  })

  it('has No button text defined', () => {
    expect(FIRST_CHECKIN.noButton).toBe('Non, je commence demain')
  })

  it('has success title defined', () => {
    expect(FIRST_CHECKIN.successTitle).toBe('Première dose enregistrée')
  })

  it('has success message defined', () => {
    expect(FIRST_CHECKIN.successMessage).toBe('Le voyage commence maintenant.')
  })

  it('has success emoji defined', () => {
    expect(FIRST_CHECKIN.successEmoji).toBe('✨')
  })

  it('uses encouraging vocabulary without negative words', () => {
    // Verify none of the banned words are used
    const bannedWords = ['échec', 'raté', 'manqué', 'retard', 'insuffisant', 'streak']
    const allMessages = [
      FIRST_CHECKIN.title,
      FIRST_CHECKIN.subtitle,
      FIRST_CHECKIN.yesButton,
      FIRST_CHECKIN.noButton,
      FIRST_CHECKIN.successTitle,
      FIRST_CHECKIN.successMessage,
    ]

    for (const message of allMessages) {
      const lowerMessage = message.toLowerCase()
      for (const word of bannedWords) {
        expect(lowerMessage).not.toContain(word)
      }
    }
  })
})

// ============================================================================
// FIRST CHECK-IN INTEGRATION TESTS
// ============================================================================

describe('First Check-in Integration', () => {
  it('entry for day 0 uses startValue as targetDose', () => {
    const habit = createHabit({
      createdAt: TEST_TODAY,
      startValue: 12,
    })

    const targetDose = calculateTargetDose(habit, TEST_TODAY)

    // On creation day, targetDose should equal startValue
    expect(targetDose).toBe(12)
  })

  it('first check-in can record partial completion', () => {
    const habit = createHabit({
      createdAt: TEST_TODAY,
      startValue: 10,
    })

    // User did 6 push-ups on day 1
    const targetDose = calculateTargetDose(habit, TEST_TODAY)
    const actualValue = 6

    // Completion percentage: 6/10 = 60%
    const completionPercent = (actualValue / targetDose) * 100
    expect(completionPercent).toBe(60)
  })

  it('first check-in can record over-achievement', () => {
    const habit = createHabit({
      createdAt: TEST_TODAY,
      startValue: 10,
    })

    // User did 15 push-ups on day 1
    const targetDose = calculateTargetDose(habit, TEST_TODAY)
    const actualValue = 15

    // Completion percentage: 15/10 = 150%
    const completionPercent = (actualValue / targetDose) * 100
    expect(completionPercent).toBe(150)
  })

  it('quick buttons calculate correct values', () => {
    const habit = createHabit({ startValue: 10 })

    // "Un peu" button value (50%)
    const partialValue = Math.round(habit.startValue * 0.5)
    expect(partialValue).toBe(5)

    // "Dose complète" button value (100%)
    const fullValue = habit.startValue
    expect(fullValue).toBe(10)
  })

  it('handles habits with decimal quick values', () => {
    const habit = createHabit({ startValue: 7 })

    // "Un peu" button value (50% of 7 = 3.5 -> 4)
    const partialValue = Math.round(habit.startValue * 0.5)
    expect(partialValue).toBe(4) // Rounded to 4
  })

  it('handles weekly habits on creation day', () => {
    const habit = createHabit({
      createdAt: TEST_TODAY,
      startValue: 3, // 3 times per week
      trackingFrequency: 'weekly',
    })

    const targetDose = calculateTargetDose(habit, TEST_TODAY)
    expect(targetDose).toBe(3)
  })

  it('handles simple tracking mode habits', () => {
    const habit = createHabit({
      createdAt: TEST_TODAY,
      startValue: 1, // Binary: done or not done
      trackingMode: 'simple',
    })

    const targetDose = calculateTargetDose(habit, TEST_TODAY)
    expect(targetDose).toBe(1)
  })
})

// ============================================================================
// EDGE CASES
// ============================================================================

describe('First Check-in Edge Cases', () => {
  it('handles startValue of 1', () => {
    const habit = createHabit({
      createdAt: TEST_TODAY,
      startValue: 1,
    })

    const targetDose = calculateTargetDose(habit, TEST_TODAY)
    expect(targetDose).toBe(1)

    // Quick buttons
    const partialValue = Math.round(habit.startValue * 0.5)
    expect(partialValue).toBe(1) // Can't go below 1 when rounded
  })

  it('handles large startValue', () => {
    const habit = createHabit({
      createdAt: TEST_TODAY,
      startValue: 100,
    })

    const targetDose = calculateTargetDose(habit, TEST_TODAY)
    expect(targetDose).toBe(100)

    // Quick buttons
    const partialValue = Math.round(habit.startValue * 0.5)
    expect(partialValue).toBe(50)
  })

  it('handles decrease habits on creation day', () => {
    // User wants to reduce from 10 cigarettes
    const habit = createHabit({
      createdAt: TEST_TODAY,
      direction: 'decrease',
      startValue: 10,
      progression: { mode: 'percentage', value: 5, period: 'weekly' },
    })

    const targetDose = calculateTargetDose(habit, TEST_TODAY)
    expect(targetDose).toBe(10) // First day: max allowed is startValue
  })

  it('handles habit with targetValue set', () => {
    const habit = createHabit({
      createdAt: TEST_TODAY,
      startValue: 10,
      targetValue: 50, // Goal to reach
    })

    const targetDose = calculateTargetDose(habit, TEST_TODAY)
    expect(targetDose).toBe(10) // Day 0: still at startValue
  })

  it('handles null progression (maintain)', () => {
    const habit = createHabit({
      createdAt: TEST_TODAY,
      direction: 'maintain',
      startValue: 5,
      progression: null,
    })

    const targetDose = calculateTargetDose(habit, TEST_TODAY)
    expect(targetDose).toBe(5)
  })
})
