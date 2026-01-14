/**
 * Tests du service de calcul statistiques
 */

import { describe, it, expect } from 'vitest'
import {
  getChartData,
  getProjection,
  getHabitStats,
  calculateTrend,
  getHeatmapData,
  getGlobalStats,
  linearRegression,
  addDays,
} from './statistics'
import { Habit, DailyEntry } from '../types'

// ============================================================================
// TEST DATA
// ============================================================================

const createHabit = (overrides: Partial<Habit> = {}): Habit => ({
  id: 'habit-1',
  name: 'Push-ups',
  emoji: '💪',
  description: 'Faire des pompes',
  direction: 'increase',
  startValue: 10,
  unit: 'répétitions',
  progression: {
    mode: 'absolute',
    value: 1,
    period: 'weekly',
  },
  createdAt: '2026-01-01',
  archivedAt: null,
  trackingMode: 'detailed',
  ...overrides,
})

const createEntry = (
  date: string,
  actualValue: number,
  targetDose: number,
  habitId: string = 'habit-1'
): DailyEntry => ({
  id: `entry-${date}`,
  habitId,
  date,
  targetDose,
  actualValue,
  createdAt: `${date}T12:00:00.000Z`,
  updatedAt: `${date}T12:00:00.000Z`,
})

// ============================================================================
// UTILITY TESTS
// ============================================================================

describe('linearRegression', () => {
  it('retourne une pente de 0 pour des valeurs constantes', () => {
    const points = [
      { x: 0, y: 10 },
      { x: 1, y: 10 },
      { x: 2, y: 10 },
    ]
    const { slope, intercept } = linearRegression(points)
    expect(slope).toBe(0)
    expect(intercept).toBe(10)
  })

  it('calcule une pente positive pour des valeurs croissantes', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ]
    const { slope, intercept } = linearRegression(points)
    expect(slope).toBeCloseTo(1)
    expect(intercept).toBeCloseTo(0)
  })

  it('calcule une pente négative pour des valeurs décroissantes', () => {
    const points = [
      { x: 0, y: 10 },
      { x: 1, y: 8 },
      { x: 2, y: 6 },
    ]
    const { slope, intercept } = linearRegression(points)
    expect(slope).toBeCloseTo(-2)
    expect(intercept).toBeCloseTo(10)
  })

  it('gère un point unique', () => {
    const points = [{ x: 0, y: 5 }]
    const { slope, intercept } = linearRegression(points)
    expect(slope).toBe(0)
    expect(intercept).toBe(5)
  })

  it('gère un tableau vide', () => {
    const { slope, intercept } = linearRegression([])
    expect(slope).toBe(0)
    expect(intercept).toBe(0)
  })
})

describe('addDays', () => {
  it('ajoute des jours positifs', () => {
    expect(addDays('2026-01-01', 5)).toBe('2026-01-06')
  })

  it('soustrait des jours avec une valeur négative', () => {
    expect(addDays('2026-01-10', -3)).toBe('2026-01-07')
  })

  it('gère le dépassement de mois', () => {
    expect(addDays('2026-01-30', 5)).toBe('2026-02-04')
  })

  it("gère le dépassement d'année", () => {
    expect(addDays('2026-12-30', 5)).toBe('2027-01-04')
  })
})

// ============================================================================
// CHART DATA TESTS
// ============================================================================

describe('getChartData', () => {
  it('génère les données du graphique pour une période', () => {
    const habit = createHabit()
    const entries = [
      createEntry('2026-01-05', 10, 10),
      createEntry('2026-01-06', 12, 10),
      createEntry('2026-01-07', 8, 10),
    ]

    const result = getChartData(habit, entries, 'week', '2026-01-07')

    expect(result.habitId).toBe('habit-1')
    expect(result.habitName).toBe('Push-ups')
    expect(result.habitEmoji).toBe('💪')
    expect(result.unit).toBe('répétitions')
    expect(result.dataPoints.length).toBe(8) // 7 days + today
  })

  it('inclut les jours sans entrées avec valeur 0', () => {
    const habit = createHabit()
    const entries = [createEntry('2026-01-05', 10, 10)]

    const result = getChartData(habit, entries, 'week', '2026-01-07')

    // Should have some days with 0 value
    const zeroDays = result.dataPoints.filter((d) => d.value === 0)
    expect(zeroDays.length).toBeGreaterThan(0)
  })

  it('calcule les pourcentages correctement', () => {
    const habit = createHabit()
    const entries = [
      createEntry('2026-01-07', 5, 10), // 50%
      createEntry('2026-01-08', 10, 10), // 100%
      createEntry('2026-01-09', 15, 10), // 150%
    ]

    const result = getChartData(habit, entries, 'week', '2026-01-09')

    const day7 = result.dataPoints.find((d) => d.date === '2026-01-07')
    const day8 = result.dataPoints.find((d) => d.date === '2026-01-08')
    const day9 = result.dataPoints.find((d) => d.date === '2026-01-09')

    expect(day7?.percentage).toBe(50)
    expect(day8?.percentage).toBe(100)
    expect(day9?.percentage).toBe(150)
  })

  it("inclut finalTarget quand l'habitude a une targetValue", () => {
    const habit = createHabit({ targetValue: 50 })
    const entries: DailyEntry[] = []

    const result = getChartData(habit, entries, 'week', '2026-01-07')

    expect(result.finalTarget).toBe(50)
  })
})

// ============================================================================
// PROJECTION TESTS
// ============================================================================

describe('getProjection', () => {
  it('calcule la projection pour une habitude en augmentation', () => {
    const habit = createHabit({ targetValue: 50 })
    const entries = [
      createEntry('2026-01-01', 10, 10),
      createEntry('2026-01-08', 12, 11),
      createEntry('2026-01-15', 14, 12),
    ]

    const result = getProjection(habit, entries, '2026-01-15')

    expect(result.habitId).toBe('habit-1')
    expect(result.currentValue).toBe(14)
    expect(result.targetValue).toBe(50)
    expect(result.progressPercentage).toBeGreaterThan(0)
    expect(result.currentWeeklyRate).toBeGreaterThan(0)
  })

  it('retourne des dates null quand pas de progression vers la cible', () => {
    const habit = createHabit({ targetValue: 50 })
    // Constant values, no progression
    const entries = [
      createEntry('2026-01-01', 10, 10),
      createEntry('2026-01-08', 10, 11),
      createEntry('2026-01-15', 10, 12),
    ]

    const result = getProjection(habit, entries, '2026-01-15')

    // With no progression, can't estimate completion date
    expect(result.currentWeeklyRate).toBeCloseTo(0, 0)
  })

  it('gère la projection pour une habitude en diminution', () => {
    const habit = createHabit({
      direction: 'decrease',
      startValue: 20,
      targetValue: 5,
    })
    const entries = [
      createEntry('2026-01-01', 20, 20),
      createEntry('2026-01-08', 18, 19),
      createEntry('2026-01-15', 16, 18),
    ]

    const result = getProjection(habit, entries, '2026-01-15')

    expect(result.currentValue).toBe(16)
    expect(result.targetValue).toBe(5)
    expect(result.progressPercentage).toBeGreaterThan(0)
  })

  it('calcule les projections à 30 et 90 jours', () => {
    const habit = createHabit({ targetValue: 50 })
    const entries = [
      createEntry('2026-01-01', 10, 10),
      createEntry('2026-01-08', 12, 11),
      createEntry('2026-01-15', 14, 12),
    ]

    const result = getProjection(habit, entries, '2026-01-15')

    expect(result.projectionIn30Days).toBeGreaterThan(result.currentValue)
    expect(result.projectionIn90Days).toBeGreaterThan(result.projectionIn30Days)
  })
})

// ============================================================================
// HABIT STATS TESTS
// ============================================================================

describe('getHabitStats', () => {
  it('calcule les statistiques de base', () => {
    const habit = createHabit()
    const entries = [
      createEntry('2026-01-05', 10, 10), // 100%
      createEntry('2026-01-06', 8, 10), // 80%
      createEntry('2026-01-07', 12, 10), // 120%
    ]

    const result = getHabitStats(habit, entries, 'week', '2026-01-07')

    expect(result.habitId).toBe('habit-1')
    expect(result.totalEntries).toBe(3)
    expect(result.averageCompletion).toBe(100) // (100 + 80 + 120) / 3 = 100
  })

  it('trouve le meilleur jour', () => {
    const habit = createHabit()
    const entries = [
      createEntry('2026-01-05', 10, 10), // 100%
      createEntry('2026-01-06', 15, 10), // 150% - best
      createEntry('2026-01-07', 8, 10), // 80%
    ]

    const result = getHabitStats(habit, entries, 'week', '2026-01-07')

    expect(result.bestDay?.date).toBe('2026-01-06')
    expect(result.bestDay?.percentage).toBe(150)
  })

  it('calcule les séries', () => {
    const habit = createHabit()
    // 3 consecutive days >= 70%
    const entries = [
      createEntry('2026-01-05', 7, 10), // 70%
      createEntry('2026-01-06', 8, 10), // 80%
      createEntry('2026-01-07', 9, 10), // 90%
    ]

    const result = getHabitStats(habit, entries, 'week', '2026-01-07')

    expect(result.currentStreak).toBe(3)
    expect(result.bestStreak).toBe(3)
  })

  it('interrompt la série sur faible complétion', () => {
    const habit = createHabit()
    const entries = [
      createEntry('2026-01-05', 10, 10), // 100%
      createEntry('2026-01-06', 3, 10), // 30% - breaks streak
      createEntry('2026-01-07', 10, 10), // 100%
    ]

    const result = getHabitStats(habit, entries, 'week', '2026-01-07')

    expect(result.currentStreak).toBe(1)
    expect(result.bestStreak).toBe(1)
  })

  it('retourne des zéros pour aucune entrée', () => {
    const habit = createHabit()
    const entries: DailyEntry[] = []

    const result = getHabitStats(habit, entries, 'week', '2026-01-07')

    expect(result.totalEntries).toBe(0)
    expect(result.averageCompletion).toBe(0)
    expect(result.bestDay).toBeNull()
    expect(result.currentStreak).toBe(0)
    expect(result.bestStreak).toBe(0)
    expect(result.weeklyTrend).toBe(0)
  })
})

// ============================================================================
// TREND TESTS
// ============================================================================

describe('calculateTrend', () => {
  it('retourne une tendance positive pour des valeurs croissantes', () => {
    const entries = [
      createEntry('2026-01-01', 10, 10),
      createEntry('2026-01-02', 12, 10),
      createEntry('2026-01-03', 14, 10),
      createEntry('2026-01-04', 16, 10),
    ]

    const trend = calculateTrend(entries)

    expect(trend).toBeGreaterThan(0)
  })

  it('retourne une tendance négative pour des valeurs décroissantes', () => {
    const entries = [
      createEntry('2026-01-01', 20, 10),
      createEntry('2026-01-02', 18, 10),
      createEntry('2026-01-03', 16, 10),
      createEntry('2026-01-04', 14, 10),
    ]

    const trend = calculateTrend(entries)

    expect(trend).toBeLessThan(0)
  })

  it('retourne 0 pour des valeurs stables', () => {
    const entries = [
      createEntry('2026-01-01', 10, 10),
      createEntry('2026-01-02', 10, 10),
      createEntry('2026-01-03', 10, 10),
    ]

    const trend = calculateTrend(entries)

    expect(trend).toBe(0)
  })

  it('est borné entre -1 et 1', () => {
    // Extreme increase
    const entriesUp = [createEntry('2026-01-01', 1, 10), createEntry('2026-01-02', 100, 10)]
    const trendUp = calculateTrend(entriesUp)
    expect(trendUp).toBeLessThanOrEqual(1)

    // Extreme decrease
    const entriesDown = [createEntry('2026-01-01', 100, 10), createEntry('2026-01-02', 1, 10)]
    const trendDown = calculateTrend(entriesDown)
    expect(trendDown).toBeGreaterThanOrEqual(-1)
  })

  it('retourne 0 pour moins de 2 entrées', () => {
    const entries = [createEntry('2026-01-01', 10, 10)]
    expect(calculateTrend(entries)).toBe(0)
    expect(calculateTrend([])).toBe(0)
  })
})

// ============================================================================
// HEATMAP TESTS
// ============================================================================

describe('getHeatmapData', () => {
  it('génère les cellules pour la période', () => {
    const habit = createHabit()
    const entries = [createEntry('2026-01-05', 10, 10), createEntry('2026-01-06', 8, 10)]

    const result = getHeatmapData(habit, entries, 1, '2026-01-15')

    // ~30 days for 1 month
    expect(result.length).toBeGreaterThan(25)
    expect(result.length).toBeLessThan(35)
  })

  it('inclut les données de pourcentage et intensité', () => {
    // Use a habit without progression to have stable target
    const habit = createHabit({
      direction: 'maintain',
      progression: null,
    })
    const entries = [createEntry('2026-01-10', 10, 10)]

    const result = getHeatmapData(habit, entries, 1, '2026-01-15')

    const entryCell = result.find((c) => c.date === '2026-01-10')
    expect(entryCell?.percentage).toBe(100)
    expect(entryCell?.value).toBe(10)
    expect(entryCell?.target).toBe(10)
  })

  it('affiche 0% pour les jours sans entrées', () => {
    const habit = createHabit()
    const entries: DailyEntry[] = []

    const result = getHeatmapData(habit, entries, 1, '2026-01-15')

    expect(result.every((c) => c.percentage === 0 && c.value === 0)).toBe(true)
  })
})

// ============================================================================
// GLOBAL STATS TESTS
// ============================================================================

describe('getGlobalStats', () => {
  it('agrège les stats pour plusieurs habitudes', () => {
    const habits = [
      createHabit({ id: 'habit-1' }),
      createHabit({ id: 'habit-2', name: 'Méditation', emoji: '🧘' }),
    ]
    const entries = [
      createEntry('2026-01-07', 10, 10, 'habit-1'),
      createEntry('2026-01-07', 8, 10, 'habit-2'),
    ]

    const result = getGlobalStats(habits, entries, 'week', '2026-01-07')

    expect(result.totalHabits).toBe(2)
    expect(result.habitStats.length).toBe(2)
  })

  it('exclut les habitudes archivées', () => {
    const habits = [
      createHabit({ id: 'habit-1' }),
      createHabit({ id: 'habit-2', archivedAt: '2026-01-05' }),
    ]
    const entries = [createEntry('2026-01-07', 10, 10, 'habit-1')]

    const result = getGlobalStats(habits, entries, 'week', '2026-01-07')

    expect(result.totalHabits).toBe(1)
  })

  it('calcule la complétion moyenne pour toutes les habitudes', () => {
    const habits = [createHabit({ id: 'habit-1' }), createHabit({ id: 'habit-2' })]
    const entries = [
      createEntry('2026-01-07', 10, 10, 'habit-1'), // 100%
      createEntry('2026-01-07', 5, 10, 'habit-2'), // 50%
    ]

    const result = getGlobalStats(habits, entries, 'week', '2026-01-07')

    // Average of 100% and 50%
    expect(result.averageCompletion).toBe(75)
  })

  it('compte les jours actifs uniques', () => {
    const habits = [createHabit()]
    const entries = [
      createEntry('2026-01-05', 10, 10),
      createEntry('2026-01-06', 10, 10),
      createEntry('2026-01-07', 10, 10),
    ]

    const result = getGlobalStats(habits, entries, 'week', '2026-01-07')

    expect(result.totalActiveDays).toBe(3)
  })

  it("gère l'absence d'habitudes", () => {
    const result = getGlobalStats([], [], 'week', '2026-01-07')

    expect(result.totalHabits).toBe(0)
    expect(result.averageCompletion).toBe(0)
    expect(result.totalActiveDays).toBe(0)
    expect(result.habitStats).toEqual([])
  })
})
