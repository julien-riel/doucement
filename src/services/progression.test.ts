/**
 * Tests unitaires du service de progression
 * Couvre tous les cas de figure: modes absolu/pourcentage, arrondis, limites, statistiques
 */

import { describe, it, expect } from 'vitest'
import {
  daysBetween,
  weeksBetween,
  getCurrentWeekDates,
  isWeeklyHabit,
  calculateWeeklyProgress,
  applyRounding,
  calculateTargetDose,
  calculateCompletionPercentage,
  getCompletionStatus,
  calculateCompletionPercentageFromValues,
  calculateHabitStats,
  calculateDailyCompletionPercentage,
  calculateCompoundEffectMetrics,
  detectMilestone,
} from './progression'
import { Habit, DailyEntry } from '../types'

// ============================================================================
// TEST FIXTURES
// ============================================================================

/**
 * Crée une habitude de test avec des valeurs par défaut
 */
function createHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'test-habit',
    name: 'Test Habit',
    emoji: '💪',
    direction: 'increase',
    startValue: 10,
    unit: 'répétitions',
    progression: null,
    createdAt: '2025-01-01',
    archivedAt: null,
    ...overrides,
  }
}

/**
 * Crée une entrée de test avec des valeurs par défaut
 */
function createEntry(overrides: Partial<DailyEntry> = {}): DailyEntry {
  return {
    id: 'test-entry',
    habitId: 'test-habit',
    date: '2025-01-15',
    targetDose: 10,
    actualValue: 10,
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
    ...overrides,
  }
}

// ============================================================================
// UTILITY FUNCTIONS TESTS
// ============================================================================

describe('daysBetween', () => {
  it('returns 0 for same date', () => {
    expect(daysBetween('2025-01-01', '2025-01-01')).toBe(0)
  })

  it('returns positive number for future date', () => {
    expect(daysBetween('2025-01-01', '2025-01-08')).toBe(7)
  })

  it('returns negative number for past date', () => {
    expect(daysBetween('2025-01-08', '2025-01-01')).toBe(-7)
  })

  it('handles month boundaries', () => {
    expect(daysBetween('2025-01-31', '2025-02-01')).toBe(1)
  })

  it('handles year boundaries', () => {
    expect(daysBetween('2024-12-31', '2025-01-01')).toBe(1)
  })
})

describe('weeksBetween', () => {
  it('returns 0 for same date', () => {
    expect(weeksBetween('2025-01-01', '2025-01-01')).toBe(0)
  })

  it('returns 1 for exactly one week', () => {
    expect(weeksBetween('2025-01-01', '2025-01-08')).toBe(1)
  })

  it('returns fractional weeks', () => {
    expect(weeksBetween('2025-01-01', '2025-01-04')).toBeCloseTo(3 / 7)
  })
})

// ============================================================================
// WEEKLY TRACKING TESTS
// ============================================================================

describe('getCurrentWeekDates', () => {
  it('returns array of 7 dates', () => {
    const dates = getCurrentWeekDates('2026-01-10')
    expect(dates).toHaveLength(7)
  })

  it('returns Monday to Sunday for a mid-week date', () => {
    // 2026-01-10 is a Saturday
    const dates = getCurrentWeekDates('2026-01-10')
    expect(dates[0]).toBe('2026-01-05') // Monday
    expect(dates[6]).toBe('2026-01-11') // Sunday
  })

  it('returns correct week for a Monday', () => {
    // 2026-01-05 is a Monday
    const dates = getCurrentWeekDates('2026-01-05')
    expect(dates[0]).toBe('2026-01-05') // Monday
    expect(dates[6]).toBe('2026-01-11') // Sunday
  })

  it('returns correct week for a Sunday', () => {
    // 2026-01-11 is a Sunday
    const dates = getCurrentWeekDates('2026-01-11')
    expect(dates[0]).toBe('2026-01-05') // Monday
    expect(dates[6]).toBe('2026-01-11') // Sunday
  })

  it('handles month boundaries', () => {
    // 2026-02-02 is a Monday
    const dates = getCurrentWeekDates('2026-02-01') // Sunday
    expect(dates[0]).toBe('2026-01-26') // Monday of previous week
    expect(dates[6]).toBe('2026-02-01') // Sunday
  })
})

describe('isWeeklyHabit', () => {
  it('returns true for weekly habit', () => {
    const habit = createHabit({ trackingFrequency: 'weekly' })
    expect(isWeeklyHabit(habit)).toBe(true)
  })

  it('returns false for daily habit', () => {
    const habit = createHabit({ trackingFrequency: 'daily' })
    expect(isWeeklyHabit(habit)).toBe(false)
  })

  it('returns false for habit without trackingFrequency (default to daily)', () => {
    const habit = createHabit()
    expect(isWeeklyHabit(habit)).toBe(false)
  })
})

describe('calculateWeeklyProgress', () => {
  it('returns 0 completed days when no entries', () => {
    const habit = createHabit({
      id: 'weekly-habit',
      trackingFrequency: 'weekly',
      startValue: 3,
    })
    const result = calculateWeeklyProgress(habit, [], '2026-01-10')
    expect(result.completedDays).toBe(0)
    expect(result.weeklyTarget).toBe(3)
  })

  it('counts days with actualValue > 0', () => {
    const habit = createHabit({
      id: 'weekly-habit',
      trackingFrequency: 'weekly',
      startValue: 3,
    })
    const entries: DailyEntry[] = [
      createEntry({ habitId: 'weekly-habit', date: '2026-01-05', actualValue: 1 }),
      createEntry({ habitId: 'weekly-habit', date: '2026-01-07', actualValue: 1 }),
    ]
    const result = calculateWeeklyProgress(habit, entries, '2026-01-10')
    expect(result.completedDays).toBe(2)
  })

  it('ignores entries with actualValue 0', () => {
    const habit = createHabit({
      id: 'weekly-habit',
      trackingFrequency: 'weekly',
      startValue: 3,
    })
    const entries: DailyEntry[] = [
      createEntry({ habitId: 'weekly-habit', date: '2026-01-05', actualValue: 1 }),
      createEntry({ habitId: 'weekly-habit', date: '2026-01-06', actualValue: 0 }),
    ]
    const result = calculateWeeklyProgress(habit, entries, '2026-01-10')
    expect(result.completedDays).toBe(1)
  })

  it('only counts entries for the current week', () => {
    const habit = createHabit({
      id: 'weekly-habit',
      trackingFrequency: 'weekly',
      startValue: 3,
    })
    const entries: DailyEntry[] = [
      // Previous week
      createEntry({ habitId: 'weekly-habit', date: '2026-01-01', actualValue: 1 }),
      // Current week (Jan 5-11)
      createEntry({ habitId: 'weekly-habit', date: '2026-01-05', actualValue: 1 }),
      createEntry({ habitId: 'weekly-habit', date: '2026-01-10', actualValue: 1 }),
    ]
    const result = calculateWeeklyProgress(habit, entries, '2026-01-10')
    expect(result.completedDays).toBe(2)
  })

  it('returns correct weekDates', () => {
    const habit = createHabit({
      id: 'weekly-habit',
      trackingFrequency: 'weekly',
      startValue: 3,
    })
    const result = calculateWeeklyProgress(habit, [], '2026-01-10')
    expect(result.weekDates).toHaveLength(7)
    expect(result.weekDates[0]).toBe('2026-01-05')
  })
})

// ============================================================================
// ROUNDING RULES TESTS (3.4)
// ============================================================================

describe('applyRounding', () => {
  describe('increase direction', () => {
    it('rounds up (ceil) for non-integer values', () => {
      expect(applyRounding(10.1, 'increase')).toBe(11)
      expect(applyRounding(10.9, 'increase')).toBe(11)
    })

    it('keeps integer values unchanged', () => {
      expect(applyRounding(10, 'increase')).toBe(10)
    })
  })

  describe('decrease direction', () => {
    it('rounds down (floor) for non-integer values', () => {
      expect(applyRounding(10.1, 'decrease')).toBe(10)
      expect(applyRounding(10.9, 'decrease')).toBe(10)
    })

    it('keeps integer values unchanged', () => {
      expect(applyRounding(10, 'decrease')).toBe(10)
    })
  })

  describe('maintain direction', () => {
    it('uses standard rounding', () => {
      expect(applyRounding(10.4, 'maintain')).toBe(10)
      expect(applyRounding(10.5, 'maintain')).toBe(11)
      expect(applyRounding(10.6, 'maintain')).toBe(11)
    })
  })
})

// ============================================================================
// TARGET DOSE CALCULATION TESTS (3.1, 3.2, 3.3)
// ============================================================================

describe('calculateTargetDose', () => {
  describe('maintain mode (no progression)', () => {
    it('returns startValue when no progression is set', () => {
      const habit = createHabit({ startValue: 15, progression: null })
      expect(calculateTargetDose(habit, '2025-01-15')).toBe(15)
    })

    it('returns startValue for maintain direction even with progression config', () => {
      const habit = createHabit({
        direction: 'maintain',
        startValue: 20,
        progression: { mode: 'absolute', value: 5, period: 'daily' },
      })
      expect(calculateTargetDose(habit, '2025-01-15')).toBe(20)
    })
  })

  describe('absolute mode - daily (3.2)', () => {
    it('increases by value per day', () => {
      const habit = createHabit({
        direction: 'increase',
        startValue: 10,
        createdAt: '2025-01-01',
        progression: { mode: 'absolute', value: 2, period: 'daily' },
      })

      // Day 0 (creation day)
      expect(calculateTargetDose(habit, '2025-01-01')).toBe(10)
      // Day 1
      expect(calculateTargetDose(habit, '2025-01-02')).toBe(12)
      // Day 7
      expect(calculateTargetDose(habit, '2025-01-08')).toBe(24)
    })

    it('decreases by value per day', () => {
      const habit = createHabit({
        direction: 'decrease',
        startValue: 20,
        createdAt: '2025-01-01',
        progression: { mode: 'absolute', value: 1, period: 'daily' },
      })

      // Day 0
      expect(calculateTargetDose(habit, '2025-01-01')).toBe(20)
      // Day 5
      expect(calculateTargetDose(habit, '2025-01-06')).toBe(15)
    })
  })

  describe('absolute mode - weekly (3.2)', () => {
    it('increases by value per week', () => {
      const habit = createHabit({
        direction: 'increase',
        startValue: 10,
        createdAt: '2025-01-01',
        progression: { mode: 'absolute', value: 5, period: 'weekly' },
      })

      // Week 0 (days 0-6)
      expect(calculateTargetDose(habit, '2025-01-01')).toBe(10)
      expect(calculateTargetDose(habit, '2025-01-07')).toBe(10)
      // Week 1 (days 7-13)
      expect(calculateTargetDose(habit, '2025-01-08')).toBe(15)
      expect(calculateTargetDose(habit, '2025-01-14')).toBe(15)
      // Week 2
      expect(calculateTargetDose(habit, '2025-01-15')).toBe(20)
    })
  })

  describe('percentage mode - weekly (3.3)', () => {
    it('increases by percentage with compound effect', () => {
      const habit = createHabit({
        direction: 'increase',
        startValue: 100,
        createdAt: '2025-01-01',
        progression: { mode: 'percentage', value: 10, period: 'weekly' },
      })

      // Week 0
      expect(calculateTargetDose(habit, '2025-01-01')).toBe(100)
      // Week 1: 100 * 1.1 = 110.0...01 (float), ceil = 111
      // Note: floating point precision causes 100 * 1.1 to be slightly > 110
      expect(calculateTargetDose(habit, '2025-01-08')).toBe(111)
      // Week 2: 100 * 1.1^2 = 121.0...01 (float), ceil = 122
      expect(calculateTargetDose(habit, '2025-01-15')).toBe(122)
      // Week 3: 100 * 1.1^3 = 133.1, ceil = 134
      expect(calculateTargetDose(habit, '2025-01-22')).toBe(134)
    })

    it('decreases by percentage with compound effect', () => {
      const habit = createHabit({
        direction: 'decrease',
        startValue: 100,
        createdAt: '2025-01-01',
        progression: { mode: 'percentage', value: 10, period: 'weekly' },
      })

      // Week 0
      expect(calculateTargetDose(habit, '2025-01-01')).toBe(100)
      // Week 1: 100 * 0.9 = 90
      expect(calculateTargetDose(habit, '2025-01-08')).toBe(90)
      // Week 2: 100 * 0.9^2 = 81
      expect(calculateTargetDose(habit, '2025-01-15')).toBe(81)
    })
  })

  describe('rounding rules applied (3.4)', () => {
    it('rounds up for increase with non-integer result', () => {
      const habit = createHabit({
        direction: 'increase',
        startValue: 10,
        createdAt: '2025-01-01',
        progression: { mode: 'percentage', value: 5, period: 'weekly' },
      })

      // Week 1: 10 * 1.05 = 10.5 -> ceil = 11
      expect(calculateTargetDose(habit, '2025-01-08')).toBe(11)
    })

    it('rounds down for decrease with non-integer result', () => {
      const habit = createHabit({
        direction: 'decrease',
        startValue: 10,
        createdAt: '2025-01-01',
        progression: { mode: 'percentage', value: 5, period: 'weekly' },
      })

      // Week 1: 10 * 0.95 = 9.5 -> floor = 9
      expect(calculateTargetDose(habit, '2025-01-08')).toBe(9)
    })
  })

  describe('limits applied (3.5)', () => {
    it('does not exceed targetValue for increase', () => {
      const habit = createHabit({
        direction: 'increase',
        startValue: 10,
        targetValue: 15,
        createdAt: '2025-01-01',
        progression: { mode: 'absolute', value: 10, period: 'daily' },
      })

      // Day 1: 10 + 10 = 20, but capped at 15
      expect(calculateTargetDose(habit, '2025-01-02')).toBe(15)
    })

    it('does not go below targetValue for decrease', () => {
      const habit = createHabit({
        direction: 'decrease',
        startValue: 10,
        targetValue: 5,
        createdAt: '2025-01-01',
        progression: { mode: 'absolute', value: 10, period: 'daily' },
      })

      // Day 1: 10 - 10 = 0, but floored at 5
      expect(calculateTargetDose(habit, '2025-01-02')).toBe(5)
    })

    it('does not go below 0 for decrease', () => {
      const habit = createHabit({
        direction: 'decrease',
        startValue: 5,
        createdAt: '2025-01-01',
        progression: { mode: 'absolute', value: 10, period: 'daily' },
      })

      // Day 1: 5 - 10 = -5 -> 0
      expect(calculateTargetDose(habit, '2025-01-02')).toBe(0)
    })

    it('does not go below 1 for increase', () => {
      const habit = createHabit({
        direction: 'increase',
        startValue: 1,
        createdAt: '2025-01-01',
        progression: null,
      })

      expect(calculateTargetDose(habit, '2025-01-15')).toBe(1)
    })
  })

  describe('edge cases', () => {
    it('handles date before creation date', () => {
      const habit = createHabit({
        startValue: 10,
        createdAt: '2025-01-15',
        progression: { mode: 'absolute', value: 1, period: 'daily' },
      })

      expect(calculateTargetDose(habit, '2025-01-01')).toBe(10)
    })
  })
})

// ============================================================================
// COMPLETION PERCENTAGE TESTS (3.6)
// ============================================================================

describe('calculateCompletionPercentage', () => {
  describe('increase/maintain habits', () => {
    it('returns 100 for exact completion', () => {
      const entry = createEntry({ targetDose: 10, actualValue: 10 })
      expect(calculateCompletionPercentage(entry)).toBe(100)
      expect(calculateCompletionPercentage(entry, 'increase')).toBe(100)
    })

    it('returns 50 for half completion', () => {
      const entry = createEntry({ targetDose: 10, actualValue: 5 })
      expect(calculateCompletionPercentage(entry)).toBe(50)
    })

    it('returns 0 for no progress', () => {
      const entry = createEntry({ targetDose: 10, actualValue: 0 })
      expect(calculateCompletionPercentage(entry)).toBe(0)
    })

    it('returns > 100 for exceeded target', () => {
      const entry = createEntry({ targetDose: 10, actualValue: 15 })
      expect(calculateCompletionPercentage(entry)).toBe(150)
    })

    it('handles zero target dose with effort', () => {
      const entry = createEntry({ targetDose: 0, actualValue: 5 })
      expect(calculateCompletionPercentage(entry)).toBe(100)
    })

    it('handles zero target dose with no effort', () => {
      const entry = createEntry({ targetDose: 0, actualValue: 0 })
      expect(calculateCompletionPercentage(entry)).toBe(0)
    })
  })

  describe('decrease habits (inverted logic)', () => {
    it('returns 100 for exact completion', () => {
      // Cible 4 cigarettes, fait 4 = 100%
      const entry = createEntry({ targetDose: 4, actualValue: 4 })
      expect(calculateCompletionPercentage(entry, 'decrease')).toBe(100)
    })

    it('returns > 100 when doing less than target (better!)', () => {
      // Cible 4 cigarettes, fait 3 = 133% (mieux que prévu)
      const entry = createEntry({ targetDose: 4, actualValue: 3 })
      expect(calculateCompletionPercentage(entry, 'decrease')).toBeCloseTo(133.33, 1)
    })

    it('returns < 100 when doing more than target', () => {
      // Cible 4 cigarettes, fait 5 = 80% (un peu plus que voulu)
      const entry = createEntry({ targetDose: 4, actualValue: 5 })
      expect(calculateCompletionPercentage(entry, 'decrease')).toBe(80)
    })

    it('returns 100 when actualValue is 0 (perfect for reduction!)', () => {
      // Cible 4 cigarettes, fait 0 = parfait !
      const entry = createEntry({ targetDose: 4, actualValue: 0 })
      expect(calculateCompletionPercentage(entry, 'decrease')).toBe(100)
    })

    it('handles zero target dose (goal achieved)', () => {
      // Cible 0, fait 0 = objectif atteint
      const entry = createEntry({ targetDose: 0, actualValue: 0 })
      expect(calculateCompletionPercentage(entry, 'decrease')).toBe(100)
    })

    it('handles zero target dose with some consumption', () => {
      // Cible 0, mais fait 2 = on n'a pas atteint l'objectif
      const entry = createEntry({ targetDose: 0, actualValue: 2 })
      expect(calculateCompletionPercentage(entry, 'decrease')).toBe(0)
    })
  })
})

describe('calculateCompletionPercentageFromValues', () => {
  it('calculates correctly from raw values', () => {
    expect(calculateCompletionPercentageFromValues(7, 10)).toBe(70)
    expect(calculateCompletionPercentageFromValues(12, 10)).toBe(120)
  })
})

// ============================================================================
// COMPLETION STATUS TESTS (3.7)
// ============================================================================

describe('getCompletionStatus', () => {
  describe('increase/maintain habits', () => {
    it('returns "pending" for 0%', () => {
      const entry = createEntry({ targetDose: 10, actualValue: 0 })
      expect(getCompletionStatus(entry)).toBe('pending')
    })

    it('returns "partial" for 1-69%', () => {
      const entry = createEntry({ targetDose: 10, actualValue: 1 })
      expect(getCompletionStatus(entry)).toBe('partial')

      entry.actualValue = 6
      expect(getCompletionStatus(entry)).toBe('partial')
    })

    it('returns "completed" for 70-100%', () => {
      const entry = createEntry({ targetDose: 10, actualValue: 7 })
      expect(getCompletionStatus(entry)).toBe('completed')

      entry.actualValue = 10
      expect(getCompletionStatus(entry)).toBe('completed')
    })

    it('returns "exceeded" for > 100%', () => {
      const entry = createEntry({ targetDose: 10, actualValue: 11 })
      expect(getCompletionStatus(entry)).toBe('exceeded')
    })
  })

  describe('decrease habits (inverted logic)', () => {
    it('returns "completed" for exact target', () => {
      const entry = createEntry({ targetDose: 4, actualValue: 4 })
      expect(getCompletionStatus(entry, 'decrease')).toBe('completed')
    })

    it('returns "exceeded" when doing less than target (better!)', () => {
      // Cible 4, fait 3 = 133% = exceeded
      const entry = createEntry({ targetDose: 4, actualValue: 3 })
      expect(getCompletionStatus(entry, 'decrease')).toBe('exceeded')
    })

    it('returns "completed" when doing slightly more than target (70-100%)', () => {
      // Cible 4, fait 5 = 80% = completed
      const entry = createEntry({ targetDose: 4, actualValue: 5 })
      expect(getCompletionStatus(entry, 'decrease')).toBe('completed')
    })

    it('returns "partial" when doing much more than target (<70%)', () => {
      // Cible 4, fait 10 = 40% = partial
      const entry = createEntry({ targetDose: 4, actualValue: 10 })
      expect(getCompletionStatus(entry, 'decrease')).toBe('partial')
    })

    it('returns "completed" when actualValue is 0', () => {
      // Cible 4, fait 0 = parfait = 100% = completed
      const entry = createEntry({ targetDose: 4, actualValue: 0 })
      expect(getCompletionStatus(entry, 'decrease')).toBe('completed')
    })
  })
})

// ============================================================================
// HABIT STATISTICS TESTS (3.8)
// ============================================================================

describe('calculateHabitStats', () => {
  it('calculates correct statistics for active period', () => {
    const habit = createHabit({ id: 'habit-1', startValue: 10 })
    const entries: DailyEntry[] = [
      createEntry({ habitId: 'habit-1', date: '2025-01-01', targetDose: 10, actualValue: 10 }), // 100%
      createEntry({ habitId: 'habit-1', date: '2025-01-02', targetDose: 10, actualValue: 8 }), // 80%
      createEntry({ habitId: 'habit-1', date: '2025-01-03', targetDose: 10, actualValue: 5 }), // 50%
      createEntry({ habitId: 'habit-1', date: '2025-01-05', targetDose: 10, actualValue: 12 }), // 120%
    ]

    const stats = calculateHabitStats(habit, entries, '2025-01-01', '2025-01-07')

    expect(stats.totalDays).toBe(7)
    expect(stats.activeDays).toBe(4)
    expect(stats.completedDays).toBe(3) // 100%, 80%, 120%
    expect(stats.exceededDays).toBe(1) // 120%
    expect(stats.averageCompletion).toBeCloseTo(87.5, 0) // (100+80+50+120)/4
  })

  it('handles empty entries', () => {
    const habit = createHabit()
    const stats = calculateHabitStats(habit, [], '2025-01-01', '2025-01-07')

    expect(stats.activeDays).toBe(0)
    expect(stats.averageCompletion).toBe(0)
    expect(stats.completedDays).toBe(0)
  })

  it('calculates progression correctly', () => {
    const habit = createHabit({
      startValue: 10,
      createdAt: '2025-01-01',
      progression: { mode: 'absolute', value: 5, period: 'weekly' },
    })

    const stats = calculateHabitStats(habit, [], '2025-01-01', '2025-01-15')

    // From day 0 to day 14: 2 full weeks = +10
    expect(stats.totalProgression).toBe(10)
  })
})

describe('calculateDailyCompletionPercentage', () => {
  it('calculates global percentage for all habits', () => {
    const habits: Habit[] = [
      createHabit({ id: 'habit-1', createdAt: '2025-01-01' }),
      createHabit({ id: 'habit-2', createdAt: '2025-01-01' }),
    ]
    const entries: DailyEntry[] = [
      createEntry({ habitId: 'habit-1', date: '2025-01-15', targetDose: 10, actualValue: 10 }), // 100%
      createEntry({ habitId: 'habit-2', date: '2025-01-15', targetDose: 10, actualValue: 5 }), // 50%
    ]

    const percentage = calculateDailyCompletionPercentage(entries, habits, '2025-01-15')
    expect(percentage).toBe(75) // (100 + 50) / 2
  })

  it('caps individual habits at 100% for global calculation', () => {
    const habits: Habit[] = [
      createHabit({ id: 'habit-1', createdAt: '2025-01-01' }),
      createHabit({ id: 'habit-2', createdAt: '2025-01-01' }),
    ]
    const entries: DailyEntry[] = [
      createEntry({ habitId: 'habit-1', date: '2025-01-15', targetDose: 10, actualValue: 15 }), // 150% -> 100%
      createEntry({ habitId: 'habit-2', date: '2025-01-15', targetDose: 10, actualValue: 5 }), // 50%
    ]

    const percentage = calculateDailyCompletionPercentage(entries, habits, '2025-01-15')
    expect(percentage).toBe(75) // (100 + 50) / 2, not (150 + 50) / 2
  })

  it('counts missing entries as 0%', () => {
    const habits: Habit[] = [
      createHabit({ id: 'habit-1', createdAt: '2025-01-01' }),
      createHabit({ id: 'habit-2', createdAt: '2025-01-01' }),
    ]
    const entries: DailyEntry[] = [
      createEntry({ habitId: 'habit-1', date: '2025-01-15', targetDose: 10, actualValue: 10 }), // 100%
      // habit-2 has no entry -> 0%
    ]

    const percentage = calculateDailyCompletionPercentage(entries, habits, '2025-01-15')
    expect(percentage).toBe(50) // (100 + 0) / 2
  })

  it('excludes archived habits', () => {
    const habits: Habit[] = [
      createHabit({ id: 'habit-1', createdAt: '2025-01-01', archivedAt: null }),
      createHabit({ id: 'habit-2', createdAt: '2025-01-01', archivedAt: '2025-01-10' }),
    ]
    const entries: DailyEntry[] = [
      createEntry({ habitId: 'habit-1', date: '2025-01-15', targetDose: 10, actualValue: 10 }), // 100%
    ]

    const percentage = calculateDailyCompletionPercentage(entries, habits, '2025-01-15')
    expect(percentage).toBe(100) // Only habit-1 counts
  })

  it('excludes habits created after the date', () => {
    const habits: Habit[] = [
      createHabit({ id: 'habit-1', createdAt: '2025-01-01' }),
      createHabit({ id: 'habit-2', createdAt: '2025-01-20' }), // Created after target date
    ]
    const entries: DailyEntry[] = [
      createEntry({ habitId: 'habit-1', date: '2025-01-15', targetDose: 10, actualValue: 10 }),
    ]

    const percentage = calculateDailyCompletionPercentage(entries, habits, '2025-01-15')
    expect(percentage).toBe(100) // Only habit-1 counts
  })

  it('returns 0 when no active habits', () => {
    const habits: Habit[] = []
    const entries: DailyEntry[] = []

    const percentage = calculateDailyCompletionPercentage(entries, habits, '2025-01-15')
    expect(percentage).toBe(0)
  })
})

// ============================================================================
// COMPOUND EFFECT METRICS TESTS (11.2)
// ============================================================================

describe('calculateCompoundEffectMetrics', () => {
  it('calculates metrics for an increase habit', () => {
    const habit = createHabit({
      direction: 'increase',
      startValue: 10,
      createdAt: '2025-01-01',
      progression: { mode: 'percentage', value: 10, period: 'weekly' },
    })

    // After 2 weeks: 10 * 1.1^2 = 12.1 → 13 (ceil)
    const metrics = calculateCompoundEffectMetrics(habit, '2025-01-15')

    expect(metrics.startDose).toBe(10)
    expect(metrics.currentDose).toBe(13)
    expect(metrics.absoluteChange).toBe(3)
    expect(metrics.percentageChange).toBe(30)
    expect(metrics.daysElapsed).toBe(14)
  })

  it('calculates metrics for a decrease habit', () => {
    const habit = createHabit({
      direction: 'decrease',
      startValue: 20,
      createdAt: '2025-01-01',
      progression: { mode: 'absolute', value: 1, period: 'weekly' },
    })

    // After 3 weeks: 20 - 3 = 17
    const metrics = calculateCompoundEffectMetrics(habit, '2025-01-22')

    expect(metrics.startDose).toBe(20)
    expect(metrics.currentDose).toBe(17)
    expect(metrics.absoluteChange).toBe(-3)
    expect(metrics.percentageChange).toBe(-15)
    expect(metrics.daysElapsed).toBe(21)
  })

  it('returns 0 change on day 0', () => {
    const habit = createHabit({
      direction: 'increase',
      startValue: 10,
      createdAt: '2025-01-15',
      progression: { mode: 'percentage', value: 5, period: 'weekly' },
    })

    const metrics = calculateCompoundEffectMetrics(habit, '2025-01-15')

    expect(metrics.startDose).toBe(10)
    expect(metrics.currentDose).toBe(10)
    expect(metrics.absoluteChange).toBe(0)
    expect(metrics.percentageChange).toBe(0)
    expect(metrics.daysElapsed).toBe(0)
  })

  it('handles maintain habits (no change)', () => {
    const habit = createHabit({
      direction: 'maintain',
      startValue: 15,
      createdAt: '2025-01-01',
      progression: null,
    })

    const metrics = calculateCompoundEffectMetrics(habit, '2025-01-22')

    expect(metrics.startDose).toBe(15)
    expect(metrics.currentDose).toBe(15)
    expect(metrics.absoluteChange).toBe(0)
    expect(metrics.percentageChange).toBe(0)
  })
})

describe('detectMilestone', () => {
  it('detects double milestone for increase habits', () => {
    const habit = createHabit({
      direction: 'increase',
      startValue: 10,
      createdAt: '2025-01-01',
      progression: { mode: 'percentage', value: 10, period: 'weekly' },
    })

    // After 8 weeks: 10 * 1.1^8 ≈ 21.4 → 22 (more than double)
    const milestone = detectMilestone(habit, '2025-02-26')

    expect(milestone).toBe('double')
  })

  it('detects half milestone for decrease habits', () => {
    const habit = createHabit({
      direction: 'decrease',
      startValue: 20,
      createdAt: '2025-01-01',
      progression: { mode: 'absolute', value: 2, period: 'weekly' },
    })

    // After 5 weeks: 20 - 10 = 10 (half of original)
    const milestone = detectMilestone(habit, '2025-02-05')

    expect(milestone).toBe('half')
  })

  it('detects fifty_percent milestone', () => {
    const habit = createHabit({
      direction: 'increase',
      startValue: 10,
      createdAt: '2025-01-01',
      progression: { mode: 'percentage', value: 10, period: 'weekly' },
    })

    // After 5 weeks: 10 * 1.1^5 ≈ 16.1 → 17 (+70%)
    const milestone = detectMilestone(habit, '2025-02-05')

    expect(milestone).toBe('fifty_percent')
  })

  it('returns null when no significant milestone', () => {
    const habit = createHabit({
      direction: 'increase',
      startValue: 10,
      createdAt: '2025-01-01',
      progression: { mode: 'percentage', value: 3, period: 'weekly' },
    })

    // After 2 weeks: 10 * 1.03^2 ≈ 10.6 → 11 (+10%)
    const milestone = detectMilestone(habit, '2025-01-15')

    expect(milestone).toBe(null)
  })

  it('returns null for maintain habits', () => {
    const habit = createHabit({
      direction: 'maintain',
      startValue: 10,
      createdAt: '2025-01-01',
      progression: null,
    })

    const milestone = detectMilestone(habit, '2025-03-01')

    expect(milestone).toBe(null)
  })
})
