/**
 * Tests unitaires pour les utilitaires de détection d'absence
 * Phase 10 - Mode Rattrapage Intelligent
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  ABSENCE_THRESHOLD_DAYS,
  EXTENDED_ABSENCE_THRESHOLD_DAYS,
  detectGlobalAbsence,
  detectHabitAbsence,
  detectAllHabitsAbsence,
  getNeglectedHabits,
  isReturningAfterAbsence,
  isDateInPause,
  isHabitPaused,
  isPauseExpired,
  getActiveNonPausedHabits,
  getPausedHabits,
  detectExtendedAbsence,
  getHabitsWithExtendedAbsence,
  needsRecalibration,
  calculateRecalibrationDose,
} from './absence'
import type { Habit, DailyEntry, PlannedPause } from '../types'

// ============================================================================
// TEST FIXTURES
// ============================================================================

// Date de test: 15 janvier 2025
// Définie dans beforeEach avec new Date(2025, 0, 15, 12, 0, 0)

/**
 * Crée une habitude de test
 */
function createHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit-1',
    name: 'Test Habit',
    emoji: '💪',
    direction: 'increase',
    startValue: 10,
    unit: 'répétitions',
    progression: {
      mode: 'percentage',
      value: 5,
      period: 'weekly',
    },
    createdAt: '2025-01-01',
    archivedAt: null,
    ...overrides,
  }
}

/**
 * Crée une entrée de test
 */
function createEntry(overrides: Partial<DailyEntry> = {}): DailyEntry {
  return {
    id: `entry-${Math.random()}`,
    habitId: 'habit-1',
    date: '2025-01-10',
    targetDose: 10,
    actualValue: 10,
    createdAt: '2025-01-10T10:00:00Z',
    updatedAt: '2025-01-10T10:00:00Z',
    ...overrides,
  }
}

/**
 * Mock de la fonction calculateTargetDose
 */
const mockCalculateTargetDose = vi.fn((habit: Habit, _date: string) => {
  // Simule une progression de 5% par semaine depuis le 1er janvier
  // Pour une date à 2 semaines, la dose serait ~11 (10 * 1.05 * 1.05)
  return habit.startValue * 1.1 // Simplification pour les tests
})

// ============================================================================
// MOCK DATE
// ============================================================================

beforeEach(() => {
  // Mock Date pour avoir une date de test fixe
  // On utilise midi heure locale pour éviter les problèmes de timezone
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2025, 0, 15, 12, 0, 0)) // 15 janvier 2025 à midi
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

// ============================================================================
// CONSTANTS TESTS
// ============================================================================

describe('Constants', () => {
  it('ABSENCE_THRESHOLD_DAYS should be 2', () => {
    expect(ABSENCE_THRESHOLD_DAYS).toBe(2)
  })

  it('EXTENDED_ABSENCE_THRESHOLD_DAYS should be 7', () => {
    expect(EXTENDED_ABSENCE_THRESHOLD_DAYS).toBe(7)
  })
})

// ============================================================================
// GLOBAL ABSENCE DETECTION TESTS
// ============================================================================

describe('detectGlobalAbsence', () => {
  it('returns no absence when entries is empty', () => {
    const result = detectGlobalAbsence([])
    expect(result.isAbsent).toBe(false)
    expect(result.daysSinceLastEntry).toBe(0)
    expect(result.lastEntryDate).toBeNull()
  })

  it('returns no absence when last entry is recent', () => {
    const entries = [createEntry({ date: '2025-01-14' })] // Yesterday
    const result = detectGlobalAbsence(entries)
    expect(result.isAbsent).toBe(false)
    expect(result.daysSinceLastEntry).toBe(1)
    expect(result.lastEntryDate).toBe('2025-01-14')
  })

  it('detects absence when last entry is 2+ days ago', () => {
    const entries = [createEntry({ date: '2025-01-12' })] // 3 days ago
    const result = detectGlobalAbsence(entries)
    expect(result.isAbsent).toBe(true)
    expect(result.daysSinceLastEntry).toBe(3)
    expect(result.lastEntryDate).toBe('2025-01-12')
  })

  it('finds the most recent entry among multiple', () => {
    const entries = [
      createEntry({ date: '2025-01-10' }),
      createEntry({ date: '2025-01-13' }), // Most recent
      createEntry({ date: '2025-01-08' }),
    ]
    const result = detectGlobalAbsence(entries)
    expect(result.lastEntryDate).toBe('2025-01-13')
    expect(result.daysSinceLastEntry).toBe(2)
  })
})

// ============================================================================
// HABIT-SPECIFIC ABSENCE DETECTION TESTS
// ============================================================================

describe('detectHabitAbsence', () => {
  it('detects absence for habit with no entries since creation', () => {
    const habit = createHabit({ createdAt: '2025-01-10' }) // 5 days ago
    const entries: DailyEntry[] = []
    const result = detectHabitAbsence(habit, entries)

    expect(result.isAbsent).toBe(true)
    expect(result.daysSinceLastEntry).toBe(5)
    expect(result.lastEntryDate).toBeNull()
    expect(result.habit).toBe(habit)
  })

  it('returns no absence for habit with recent entry', () => {
    const habit = createHabit()
    const entries = [createEntry({ habitId: habit.id, date: '2025-01-14' })]
    const result = detectHabitAbsence(habit, entries)

    expect(result.isAbsent).toBe(false)
    expect(result.daysSinceLastEntry).toBe(1)
  })

  it('only considers entries for the specific habit', () => {
    const habit = createHabit({ id: 'habit-1' })
    const entries = [
      createEntry({ habitId: 'habit-2', date: '2025-01-14' }), // Different habit
      createEntry({ habitId: 'habit-1', date: '2025-01-10' }), // This habit, 5 days ago
    ]
    const result = detectHabitAbsence(habit, entries)

    expect(result.isAbsent).toBe(true)
    expect(result.daysSinceLastEntry).toBe(5)
    expect(result.lastEntryDate).toBe('2025-01-10')
  })
})

describe('detectAllHabitsAbsence', () => {
  it('detects absence for all active habits', () => {
    const habits = [
      createHabit({ id: 'habit-1' }),
      createHabit({ id: 'habit-2' }),
      createHabit({ id: 'habit-3', archivedAt: '2025-01-10' }), // Archived
    ]
    const entries = [
      createEntry({ habitId: 'habit-1', date: '2025-01-10' }), // 5 days ago
      createEntry({ habitId: 'habit-2', date: '2025-01-14' }), // 1 day ago
    ]

    const results = detectAllHabitsAbsence(habits, entries)

    expect(results).toHaveLength(2) // Excludes archived
    expect(results.find((r) => r.habit.id === 'habit-1')?.isAbsent).toBe(true)
    expect(results.find((r) => r.habit.id === 'habit-2')?.isAbsent).toBe(false)
  })
})

describe('getNeglectedHabits', () => {
  it('returns only neglected habits', () => {
    const habits = [createHabit({ id: 'habit-1' }), createHabit({ id: 'habit-2' })]
    const entries = [
      createEntry({ habitId: 'habit-1', date: '2025-01-10' }), // Neglected
      createEntry({ habitId: 'habit-2', date: '2025-01-14' }), // Active
    ]

    const neglected = getNeglectedHabits(habits, entries)

    expect(neglected).toHaveLength(1)
    expect(neglected[0].habit.id).toBe('habit-1')
  })
})

describe('isReturningAfterAbsence', () => {
  it('returns true when user has been absent globally', () => {
    const habits = [createHabit()]
    const entries = [createEntry({ date: '2025-01-10' })] // 5 days ago

    expect(isReturningAfterAbsence(habits, entries)).toBe(true)
  })

  it('returns false when user is active', () => {
    const habits = [createHabit()]
    const entries = [createEntry({ date: '2025-01-14' })] // Yesterday

    expect(isReturningAfterAbsence(habits, entries)).toBe(false)
  })
})

// ============================================================================
// PLANNED PAUSE TESTS
// ============================================================================

describe('isDateInPause', () => {
  const pause: PlannedPause = {
    startDate: '2025-01-10',
    endDate: '2025-01-20',
  }

  it('returns true for date within pause', () => {
    expect(isDateInPause(pause, '2025-01-15')).toBe(true)
  })

  it('returns true for start date', () => {
    expect(isDateInPause(pause, '2025-01-10')).toBe(true)
  })

  it('returns true for end date', () => {
    expect(isDateInPause(pause, '2025-01-20')).toBe(true)
  })

  it('returns false for date before pause', () => {
    expect(isDateInPause(pause, '2025-01-09')).toBe(false)
  })

  it('returns false for date after pause', () => {
    expect(isDateInPause(pause, '2025-01-21')).toBe(false)
  })
})

describe('isHabitPaused', () => {
  it('returns false when habit has no pause', () => {
    const habit = createHabit()
    expect(isHabitPaused(habit)).toBe(false)
  })

  it('returns true when habit is currently paused', () => {
    const habit = createHabit({
      plannedPause: { startDate: '2025-01-10', endDate: '2025-01-20' },
    })
    expect(isHabitPaused(habit)).toBe(true) // TEST_TODAY = 2025-01-15
  })

  it('returns false when pause has ended', () => {
    const habit = createHabit({
      plannedPause: { startDate: '2025-01-01', endDate: '2025-01-10' },
    })
    expect(isHabitPaused(habit)).toBe(false)
  })

  it('respects custom date parameter', () => {
    const habit = createHabit({
      plannedPause: { startDate: '2025-01-10', endDate: '2025-01-20' },
    })
    expect(isHabitPaused(habit, '2025-01-05')).toBe(false)
    expect(isHabitPaused(habit, '2025-01-15')).toBe(true)
  })
})

describe('isPauseExpired', () => {
  it('returns false when habit has no pause', () => {
    expect(isPauseExpired(createHabit())).toBe(false)
  })

  it('returns false when pause is still active', () => {
    const habit = createHabit({
      plannedPause: { startDate: '2025-01-10', endDate: '2025-01-20' },
    })
    expect(isPauseExpired(habit)).toBe(false)
  })

  it('returns true when pause has ended', () => {
    const habit = createHabit({
      plannedPause: { startDate: '2025-01-01', endDate: '2025-01-10' },
    })
    expect(isPauseExpired(habit)).toBe(true)
  })
})

describe('getActiveNonPausedHabits', () => {
  it('filters out archived and paused habits', () => {
    const habits = [
      createHabit({ id: 'active' }),
      createHabit({ id: 'archived', archivedAt: '2025-01-10' }),
      createHabit({
        id: 'paused',
        plannedPause: { startDate: '2025-01-10', endDate: '2025-01-20' },
      }),
    ]

    const result = getActiveNonPausedHabits(habits)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('active')
  })
})

describe('getPausedHabits', () => {
  it('returns only paused habits', () => {
    const habits = [
      createHabit({ id: 'active' }),
      createHabit({
        id: 'paused',
        plannedPause: { startDate: '2025-01-10', endDate: '2025-01-20' },
      }),
    ]

    const result = getPausedHabits(habits)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('paused')
  })
})

// ============================================================================
// EXTENDED ABSENCE DETECTION TESTS (Phase 10)
// ============================================================================

describe('detectExtendedAbsence', () => {
  it('detects extended absence (7+ days)', () => {
    const habit = createHabit()
    const entries = [
      createEntry({ habitId: habit.id, date: '2025-01-05', actualValue: 12 }), // 10 days ago
    ]

    const result = detectExtendedAbsence(habit, entries, mockCalculateTargetDose)

    expect(result.isExtendedAbsence).toBe(true)
    expect(result.daysSinceLastEntry).toBe(10)
    expect(result.lastActualValue).toBe(12)
    expect(result.currentTargetDose).toBe(11) // Mocked value
  })

  it('does not flag short absence as extended', () => {
    const habit = createHabit()
    const entries = [
      createEntry({ habitId: habit.id, date: '2025-01-10' }), // 5 days ago
    ]

    const result = detectExtendedAbsence(habit, entries, mockCalculateTargetDose)

    expect(result.isExtendedAbsence).toBe(false)
    expect(result.isAbsent).toBe(true) // Still absent (2+ days)
  })

  it('handles habit with no entries', () => {
    const habit = createHabit({ createdAt: '2025-01-01' }) // 14 days ago
    const entries: DailyEntry[] = []

    const result = detectExtendedAbsence(habit, entries, mockCalculateTargetDose)

    expect(result.isExtendedAbsence).toBe(true)
    expect(result.lastActualValue).toBeNull()
  })
})

describe('getHabitsWithExtendedAbsence', () => {
  it('returns habits with extended absence', () => {
    const habits = [
      createHabit({ id: 'habit-1' }),
      createHabit({ id: 'habit-2' }),
      createHabit({ id: 'habit-3', archivedAt: '2025-01-10' }), // Archived
      createHabit({
        id: 'habit-4',
        plannedPause: { startDate: '2025-01-10', endDate: '2025-01-20' },
      }), // Paused
    ]
    const entries = [
      createEntry({ habitId: 'habit-1', date: '2025-01-05' }), // Extended absence
      createEntry({ habitId: 'habit-2', date: '2025-01-14' }), // Recent
    ]

    const result = getHabitsWithExtendedAbsence(habits, entries, mockCalculateTargetDose)

    expect(result).toHaveLength(1)
    expect(result[0].habit.id).toBe('habit-1')
  })
})

describe('needsRecalibration', () => {
  it('returns true for progressive habit with extended absence', () => {
    const habit = createHabit({
      progression: { mode: 'percentage', value: 5, period: 'weekly' },
    })
    const entries = [createEntry({ habitId: habit.id, date: '2025-01-05' })]

    expect(needsRecalibration(habit, entries, mockCalculateTargetDose)).toBe(true)
  })

  it('returns false for maintain habits', () => {
    const habit = createHabit({
      direction: 'maintain',
      progression: null,
    })
    const entries = [createEntry({ habitId: habit.id, date: '2025-01-05' })]

    expect(needsRecalibration(habit, entries, mockCalculateTargetDose)).toBe(false)
  })

  it('returns false for habits without progression', () => {
    const habit = createHabit({ progression: null })
    const entries = [createEntry({ habitId: habit.id, date: '2025-01-05' })]

    expect(needsRecalibration(habit, entries, mockCalculateTargetDose)).toBe(false)
  })

  it('returns false when absence is not extended', () => {
    const habit = createHabit()
    const entries = [createEntry({ habitId: habit.id, date: '2025-01-14' })]

    expect(needsRecalibration(habit, entries, mockCalculateTargetDose)).toBe(false)
  })
})

// ============================================================================
// RECALIBRATION DOSE CALCULATION TESTS
// ============================================================================

describe('calculateRecalibrationDose', () => {
  describe('for increase habits', () => {
    const increaseHabit = createHabit({ direction: 'increase', startValue: 10 })

    it('calculates 50% of last actual value', () => {
      const result = calculateRecalibrationDose(20, 25, 0.5, increaseHabit)
      expect(result).toBe(10) // 20 * 0.5
    })

    it('calculates 75% of last actual value', () => {
      const result = calculateRecalibrationDose(20, 25, 0.75, increaseHabit)
      expect(result).toBe(15) // 20 * 0.75
    })

    it('calculates 100% (full) of last actual value', () => {
      const result = calculateRecalibrationDose(20, 25, 1, increaseHabit)
      expect(result).toBe(20)
    })

    it('uses target dose when last actual value is null', () => {
      const result = calculateRecalibrationDose(null, 25, 0.5, increaseHabit)
      expect(result).toBe(13) // Math.round(25 * 0.5) = 12.5 → 13
    })

    it('never returns less than 1 for increase habits', () => {
      const result = calculateRecalibrationDose(1, 1, 0.5, increaseHabit)
      expect(result).toBe(1) // Min 1
    })
  })

  describe('for decrease habits', () => {
    const decreaseHabit = createHabit({
      direction: 'decrease',
      startValue: 20,
    })

    it('returns current target dose at 100%', () => {
      const result = calculateRecalibrationDose(5, 5, 1, decreaseHabit)
      expect(result).toBe(5)
    })

    it('calculates intermediate value at 50%', () => {
      // startValue = 20, currentTarget = 5
      // progress = 20 - 5 = 15
      // newProgress at 50% = 15 * 0.5 = 7.5
      // newTarget = 20 - 7.5 = 12.5 → 13
      const result = calculateRecalibrationDose(5, 5, 0.5, decreaseHabit)
      expect(result).toBe(13)
    })

    it('calculates intermediate value at 75%', () => {
      // newProgress at 75% = 15 * 0.75 = 11.25
      // newTarget = 20 - 11.25 = 8.75 → 9
      const result = calculateRecalibrationDose(5, 5, 0.75, decreaseHabit)
      expect(result).toBe(9)
    })
  })
})
