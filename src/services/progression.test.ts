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
  it('retourne 0 pour la même date', () => {
    expect(daysBetween('2025-01-01', '2025-01-01')).toBe(0)
  })

  it('retourne un nombre positif pour une date future', () => {
    expect(daysBetween('2025-01-01', '2025-01-08')).toBe(7)
  })

  it('retourne un nombre négatif pour une date passée', () => {
    expect(daysBetween('2025-01-08', '2025-01-01')).toBe(-7)
  })

  it('gère les limites de mois', () => {
    expect(daysBetween('2025-01-31', '2025-02-01')).toBe(1)
  })

  it("gère les limites d'année", () => {
    expect(daysBetween('2024-12-31', '2025-01-01')).toBe(1)
  })
})

describe('weeksBetween', () => {
  it('retourne 0 pour la même date', () => {
    expect(weeksBetween('2025-01-01', '2025-01-01')).toBe(0)
  })

  it('retourne 1 pour exactement une semaine', () => {
    expect(weeksBetween('2025-01-01', '2025-01-08')).toBe(1)
  })

  it('retourne des semaines fractionnaires', () => {
    expect(weeksBetween('2025-01-01', '2025-01-04')).toBeCloseTo(3 / 7)
  })
})

// ============================================================================
// WEEKLY TRACKING TESTS
// ============================================================================

describe('getCurrentWeekDates', () => {
  it('retourne un tableau de 7 dates', () => {
    const dates = getCurrentWeekDates('2026-01-10')
    expect(dates).toHaveLength(7)
  })

  it('retourne lundi à dimanche pour une date en milieu de semaine', () => {
    // 2026-01-10 is a Saturday
    const dates = getCurrentWeekDates('2026-01-10')
    expect(dates[0]).toBe('2026-01-05') // Monday
    expect(dates[6]).toBe('2026-01-11') // Sunday
  })

  it('retourne la bonne semaine pour un lundi', () => {
    // 2026-01-05 is a Monday
    const dates = getCurrentWeekDates('2026-01-05')
    expect(dates[0]).toBe('2026-01-05') // Monday
    expect(dates[6]).toBe('2026-01-11') // Sunday
  })

  it('retourne la bonne semaine pour un dimanche', () => {
    // 2026-01-11 is a Sunday
    const dates = getCurrentWeekDates('2026-01-11')
    expect(dates[0]).toBe('2026-01-05') // Monday
    expect(dates[6]).toBe('2026-01-11') // Sunday
  })

  it('gère les limites de mois', () => {
    // 2026-02-02 is a Monday
    const dates = getCurrentWeekDates('2026-02-01') // Sunday
    expect(dates[0]).toBe('2026-01-26') // Monday of previous week
    expect(dates[6]).toBe('2026-02-01') // Sunday
  })
})

describe('isWeeklyHabit', () => {
  it('retourne true pour une habitude hebdomadaire', () => {
    const habit = createHabit({ trackingFrequency: 'weekly' })
    expect(isWeeklyHabit(habit)).toBe(true)
  })

  it('retourne false pour une habitude quotidienne', () => {
    const habit = createHabit({ trackingFrequency: 'daily' })
    expect(isWeeklyHabit(habit)).toBe(false)
  })

  it('retourne false pour habitude sans trackingFrequency (défaut quotidien)', () => {
    const habit = createHabit()
    expect(isWeeklyHabit(habit)).toBe(false)
  })
})

describe('calculateWeeklyProgress', () => {
  it("retourne 0 jours complétés quand pas d'entrées", () => {
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

  it('retourne les bonnes dates de semaine', () => {
    const habit = createHabit({
      id: 'weekly-habit',
      trackingFrequency: 'weekly',
      startValue: 3,
    })
    const result = calculateWeeklyProgress(habit, [], '2026-01-10')
    expect(result.weekDates).toHaveLength(7)
    expect(result.weekDates[0]).toBe('2026-01-05')
  })

  describe('weeklyAggregation modes', () => {
    describe('count-days mode', () => {
      it('counts days with actualValue > 0 for increase habits', () => {
        const habit = createHabit({
          id: 'weekly-habit',
          trackingFrequency: 'weekly',
          weeklyAggregation: 'count-days',
          direction: 'increase',
          startValue: 3,
        })
        const entries: DailyEntry[] = [
          createEntry({
            habitId: 'weekly-habit',
            date: '2026-01-05',
            actualValue: 5,
            targetDose: 10,
          }),
          createEntry({
            habitId: 'weekly-habit',
            date: '2026-01-06',
            actualValue: 0,
            targetDose: 10,
          }),
          createEntry({
            habitId: 'weekly-habit',
            date: '2026-01-07',
            actualValue: 8,
            targetDose: 10,
          }),
        ]
        const result = calculateWeeklyProgress(habit, entries, '2026-01-10')
        expect(result.completedDays).toBe(2) // Only days with actualValue > 0
        expect(result.aggregationMode).toBe('count-days')
      })

      it('counts days where actualValue <= targetDose for decrease habits', () => {
        const habit = createHabit({
          id: 'weekly-habit',
          trackingFrequency: 'weekly',
          weeklyAggregation: 'count-days',
          direction: 'decrease',
          startValue: 5,
        })
        const entries: DailyEntry[] = [
          createEntry({
            habitId: 'weekly-habit',
            date: '2026-01-05',
            actualValue: 3,
            targetDose: 5,
          }), // Success (3 <= 5)
          createEntry({
            habitId: 'weekly-habit',
            date: '2026-01-06',
            actualValue: 7,
            targetDose: 5,
          }), // Fail (7 > 5)
          createEntry({
            habitId: 'weekly-habit',
            date: '2026-01-07',
            actualValue: 0,
            targetDose: 5,
          }), // Success (0 <= 5)
          createEntry({
            habitId: 'weekly-habit',
            date: '2026-01-08',
            actualValue: 5,
            targetDose: 5,
          }), // Success (5 <= 5)
        ]
        const result = calculateWeeklyProgress(habit, entries, '2026-01-10')
        expect(result.completedDays).toBe(3) // 3 days meeting the target
        expect(result.aggregationMode).toBe('count-days')
      })

      it("retourne 0 quand pas d'entrées en mode count-days", () => {
        const habit = createHabit({
          id: 'weekly-habit',
          trackingFrequency: 'weekly',
          weeklyAggregation: 'count-days',
          startValue: 3,
        })
        const result = calculateWeeklyProgress(habit, [], '2026-01-10')
        expect(result.completedDays).toBe(0)
        expect(result.aggregationMode).toBe('count-days')
      })
    })

    describe('sum-units mode', () => {
      it('sums all actualValues across the week', () => {
        const habit = createHabit({
          id: 'weekly-habit',
          trackingFrequency: 'weekly',
          weeklyAggregation: 'sum-units',
          startValue: 10,
        })
        const entries: DailyEntry[] = [
          createEntry({ habitId: 'weekly-habit', date: '2026-01-05', actualValue: 3 }),
          createEntry({ habitId: 'weekly-habit', date: '2026-01-06', actualValue: 2 }),
          createEntry({ habitId: 'weekly-habit', date: '2026-01-07', actualValue: 4 }),
        ]
        const result = calculateWeeklyProgress(habit, entries, '2026-01-10')
        expect(result.completedDays).toBe(9) // Total: 3 + 2 + 4 = 9
        expect(result.totalUnits).toBe(9)
        expect(result.aggregationMode).toBe('sum-units')
      })

      it("retourne 0 quand pas d'entrées en mode sum-units", () => {
        const habit = createHabit({
          id: 'weekly-habit',
          trackingFrequency: 'weekly',
          weeklyAggregation: 'sum-units',
          startValue: 10,
        })
        const result = calculateWeeklyProgress(habit, [], '2026-01-10')
        expect(result.completedDays).toBe(0)
        expect(result.totalUnits).toBe(0)
        expect(result.aggregationMode).toBe('sum-units')
      })

      it('gère les habitudes decrease avec sum-units (consommation totale)', () => {
        const habit = createHabit({
          id: 'weekly-habit',
          trackingFrequency: 'weekly',
          weeklyAggregation: 'sum-units',
          direction: 'decrease',
          startValue: 7, // Target: max 7 glasses/week
        })
        const entries: DailyEntry[] = [
          createEntry({ habitId: 'weekly-habit', date: '2026-01-05', actualValue: 2 }),
          createEntry({ habitId: 'weekly-habit', date: '2026-01-06', actualValue: 1 }),
          createEntry({ habitId: 'weekly-habit', date: '2026-01-07', actualValue: 3 }),
        ]
        const result = calculateWeeklyProgress(habit, entries, '2026-01-10')
        expect(result.completedDays).toBe(6) // Total: 2 + 1 + 3 = 6 (under target of 7)
        expect(result.totalUnits).toBe(6)
      })
    })

    describe('default aggregation mode', () => {
      it('defaults to sum-units when weeklyAggregation is not set', () => {
        const habit = createHabit({
          id: 'weekly-habit',
          trackingFrequency: 'weekly',
          startValue: 10,
          // weeklyAggregation not set
        })
        const entries: DailyEntry[] = [
          createEntry({ habitId: 'weekly-habit', date: '2026-01-05', actualValue: 5 }),
          createEntry({ habitId: 'weekly-habit', date: '2026-01-06', actualValue: 3 }),
        ]
        const result = calculateWeeklyProgress(habit, entries, '2026-01-10')
        expect(result.aggregationMode).toBe('sum-units')
        expect(result.completedDays).toBe(8) // 5 + 3 = 8
      })
    })
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
    it('retourne startValue quand pas de progression définie', () => {
      const habit = createHabit({ startValue: 15, progression: null })
      expect(calculateTargetDose(habit, '2025-01-15')).toBe(15)
    })

    it('retourne startValue pour direction maintain même avec config progression', () => {
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
    it('gère une date avant la date de création', () => {
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
    it('retourne 100 pour une complétion exacte', () => {
      const entry = createEntry({ targetDose: 10, actualValue: 10 })
      expect(calculateCompletionPercentage(entry)).toBe(100)
      expect(calculateCompletionPercentage(entry, 'increase')).toBe(100)
    })

    it('retourne 50 pour une demi-complétion', () => {
      const entry = createEntry({ targetDose: 10, actualValue: 5 })
      expect(calculateCompletionPercentage(entry)).toBe(50)
    })

    it('retourne 0 pour aucun progrès', () => {
      const entry = createEntry({ targetDose: 10, actualValue: 0 })
      expect(calculateCompletionPercentage(entry)).toBe(0)
    })

    it('retourne > 100 pour cible dépassée', () => {
      const entry = createEntry({ targetDose: 10, actualValue: 15 })
      expect(calculateCompletionPercentage(entry)).toBe(150)
    })

    it('gère une dose cible zéro avec effort', () => {
      const entry = createEntry({ targetDose: 0, actualValue: 5 })
      expect(calculateCompletionPercentage(entry)).toBe(100)
    })

    it('gère une dose cible zéro sans effort', () => {
      const entry = createEntry({ targetDose: 0, actualValue: 0 })
      expect(calculateCompletionPercentage(entry)).toBe(0)
    })
  })

  describe('decrease habits (inverted logic)', () => {
    it('retourne 100 pour une complétion exacte', () => {
      // Cible 4 cigarettes, fait 4 = 100%
      const entry = createEntry({ targetDose: 4, actualValue: 4 })
      expect(calculateCompletionPercentage(entry, 'decrease')).toBe(100)
    })

    it('retourne > 100 quand fait moins que la cible (mieux!)', () => {
      // Cible 4 cigarettes, fait 3 = 133% (mieux que prévu)
      const entry = createEntry({ targetDose: 4, actualValue: 3 })
      expect(calculateCompletionPercentage(entry, 'decrease')).toBeCloseTo(133.33, 1)
    })

    it('retourne < 100 quand fait plus que la cible', () => {
      // Cible 4 cigarettes, fait 5 = 80% (un peu plus que voulu)
      const entry = createEntry({ targetDose: 4, actualValue: 5 })
      expect(calculateCompletionPercentage(entry, 'decrease')).toBe(80)
    })

    it('retourne 100 quand actualValue est 0 (parfait pour réduction!)', () => {
      // Cible 4 cigarettes, fait 0 = parfait !
      const entry = createEntry({ targetDose: 4, actualValue: 0 })
      expect(calculateCompletionPercentage(entry, 'decrease')).toBe(100)
    })

    it('gère dose cible zéro (objectif atteint)', () => {
      // Cible 0, fait 0 = objectif atteint
      const entry = createEntry({ targetDose: 0, actualValue: 0 })
      expect(calculateCompletionPercentage(entry, 'decrease')).toBe(100)
    })

    it('gère dose cible zéro avec consommation', () => {
      // Cible 0, mais fait 2 = on n'a pas atteint l'objectif
      const entry = createEntry({ targetDose: 0, actualValue: 2 })
      expect(calculateCompletionPercentage(entry, 'decrease')).toBe(0)
    })
  })
})

describe('calculateCompletionPercentageFromValues', () => {
  it('calcule correctement depuis les valeurs brutes', () => {
    expect(calculateCompletionPercentageFromValues(7, 10)).toBe(70)
    expect(calculateCompletionPercentageFromValues(12, 10)).toBe(120)
  })
})

// ============================================================================
// COMPLETION STATUS TESTS (3.7)
// ============================================================================

describe('getCompletionStatus', () => {
  describe('increase/maintain habits', () => {
    it('retourne "pending" pour 0%', () => {
      const entry = createEntry({ targetDose: 10, actualValue: 0 })
      expect(getCompletionStatus(entry)).toBe('pending')
    })

    it('retourne "partial" pour 1-69%', () => {
      const entry = createEntry({ targetDose: 10, actualValue: 1 })
      expect(getCompletionStatus(entry)).toBe('partial')

      entry.actualValue = 6
      expect(getCompletionStatus(entry)).toBe('partial')
    })

    it('retourne "completed" pour 70-100%', () => {
      const entry = createEntry({ targetDose: 10, actualValue: 7 })
      expect(getCompletionStatus(entry)).toBe('completed')

      entry.actualValue = 10
      expect(getCompletionStatus(entry)).toBe('completed')
    })

    it('retourne "exceeded" pour > 100%', () => {
      const entry = createEntry({ targetDose: 10, actualValue: 11 })
      expect(getCompletionStatus(entry)).toBe('exceeded')
    })
  })

  describe('decrease habits (inverted logic)', () => {
    it('retourne "completed" pour cible exacte', () => {
      const entry = createEntry({ targetDose: 4, actualValue: 4 })
      expect(getCompletionStatus(entry, 'decrease')).toBe('completed')
    })

    it('retourne "exceeded" quand fait moins que la cible (mieux!)', () => {
      // Cible 4, fait 3 = 133% = exceeded
      const entry = createEntry({ targetDose: 4, actualValue: 3 })
      expect(getCompletionStatus(entry, 'decrease')).toBe('exceeded')
    })

    it('retourne "completed" quand fait légèrement plus que la cible (70-100%)', () => {
      // Cible 4, fait 5 = 80% = completed
      const entry = createEntry({ targetDose: 4, actualValue: 5 })
      expect(getCompletionStatus(entry, 'decrease')).toBe('completed')
    })

    it('retourne "partial" quand fait beaucoup plus que la cible (<70%)', () => {
      // Cible 4, fait 10 = 40% = partial
      const entry = createEntry({ targetDose: 4, actualValue: 10 })
      expect(getCompletionStatus(entry, 'decrease')).toBe('partial')
    })

    it('retourne "completed" quand actualValue est 0', () => {
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
  it('calcule les statistiques correctes pour la période active', () => {
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

  it('gère les entrées vides', () => {
    const habit = createHabit()
    const stats = calculateHabitStats(habit, [], '2025-01-01', '2025-01-07')

    expect(stats.activeDays).toBe(0)
    expect(stats.averageCompletion).toBe(0)
    expect(stats.completedDays).toBe(0)
  })

  it('calcule la progression correctement', () => {
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
  it('calcule le pourcentage global pour toutes les habitudes', () => {
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

  it("retourne 0 quand pas d'habitudes actives", () => {
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
  it('calcule les métriques pour une habitude en augmentation', () => {
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

  it('calcule les métriques pour une habitude en diminution', () => {
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

  it('retourne 0 changement au jour 0', () => {
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

  it('gère les habitudes maintain (pas de changement)', () => {
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

  it('retourne null quand pas de jalon significatif', () => {
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

  it('retourne null pour les habitudes maintain', () => {
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
