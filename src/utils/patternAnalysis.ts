/**
 * Utilitaires d'analyse des patterns d'habitudes
 * Identifie les meilleurs jours et moments de la semaine
 */

import type { DailyEntry, Habit } from '../types'

/**
 * Noms des jours de la semaine en français
 */
const DAY_NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'] as const

/**
 * Périodes de la journée
 */
export type TimeOfDay = 'morning' | 'afternoon' | 'evening'

/**
 * Statistiques par jour de la semaine
 */
export interface DayStats {
  /** Nom du jour */
  dayName: string
  /** Indice du jour (0 = dimanche, 1 = lundi, etc.) */
  dayIndex: number
  /** Nombre total d'entrées ce jour */
  totalEntries: number
  /** Nombre d'entrées complétées (>= 70%) ce jour */
  completedEntries: number
  /** Pourcentage de complétion moyen */
  averageCompletion: number
}

/**
 * Statistiques par période de la journée
 */
export interface TimeStats {
  /** Période (matin, après-midi, soir) */
  period: TimeOfDay
  /** Label en français */
  label: string
  /** Nombre d'entrées pendant cette période */
  totalEntries: number
  /** Pourcentage des entrées faites pendant cette période */
  percentage: number
}

/**
 * Résultat de l'analyse des patterns
 */
export interface PatternAnalysis {
  /** Meilleurs jours de la semaine (triés par performance) */
  bestDays: DayStats[]
  /** Meilleure période de la journée */
  bestTimeOfDay: TimeStats | null
  /** Statistiques par période */
  timeOfDayStats: TimeStats[]
  /** Nombre minimum d'entrées pour une analyse valide */
  hasEnoughData: boolean
}

/**
 * Nombre minimum d'entrées requis pour une analyse valide
 */
const MIN_ENTRIES_FOR_ANALYSIS = 7

/**
 * Détermine la période de la journée d'une entrée
 */
function getTimeOfDay(entry: DailyEntry): TimeOfDay {
  const hour = new Date(entry.createdAt).getHours()
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

/**
 * Calcule le pourcentage de complétion d'une entrée
 */
function calculateCompletion(entry: DailyEntry): number {
  if (entry.targetDose === 0) return 100
  return (entry.actualValue / entry.targetDose) * 100
}

/**
 * Analyse les patterns d'une habitude spécifique
 */
export function analyzeHabitPatterns(habit: Habit, entries: DailyEntry[]): PatternAnalysis {
  const habitEntries = entries.filter((e) => e.habitId === habit.id)

  if (habitEntries.length < MIN_ENTRIES_FOR_ANALYSIS) {
    return {
      bestDays: [],
      bestTimeOfDay: null,
      timeOfDayStats: [],
      hasEnoughData: false,
    }
  }

  // Analyse par jour de la semaine
  const dayStatsMap = new Map<number, { entries: DailyEntry[]; completions: number[] }>()
  for (let i = 0; i < 7; i++) {
    dayStatsMap.set(i, { entries: [], completions: [] })
  }

  habitEntries.forEach((entry) => {
    const date = new Date(entry.date)
    const dayIndex = date.getDay()
    const data = dayStatsMap.get(dayIndex)!
    data.entries.push(entry)
    data.completions.push(calculateCompletion(entry))
  })

  const dayStats: DayStats[] = Array.from(dayStatsMap.entries())
    .map(([dayIndex, data]) => ({
      dayName: DAY_NAMES[dayIndex],
      dayIndex,
      totalEntries: data.entries.length,
      completedEntries: data.completions.filter((c) => c >= 70).length,
      averageCompletion:
        data.completions.length > 0
          ? data.completions.reduce((a, b) => a + b, 0) / data.completions.length
          : 0,
    }))
    .filter((s) => s.totalEntries > 0)
    .sort((a, b) => b.averageCompletion - a.averageCompletion)

  // Analyse par période de la journée
  const timeStatsMap = new Map<TimeOfDay, number>([
    ['morning', 0],
    ['afternoon', 0],
    ['evening', 0],
  ])

  habitEntries.forEach((entry) => {
    const period = getTimeOfDay(entry)
    timeStatsMap.set(period, timeStatsMap.get(period)! + 1)
  })

  const totalForTimeAnalysis = habitEntries.length
  const timeOfDayStats: TimeStats[] = (
    [
      {
        period: 'morning' as const,
        label: 'matin',
        totalEntries: timeStatsMap.get('morning')!,
        percentage: (timeStatsMap.get('morning')! / totalForTimeAnalysis) * 100,
      },
      {
        period: 'afternoon' as const,
        label: 'après-midi',
        totalEntries: timeStatsMap.get('afternoon')!,
        percentage: (timeStatsMap.get('afternoon')! / totalForTimeAnalysis) * 100,
      },
      {
        period: 'evening' as const,
        label: 'soir',
        totalEntries: timeStatsMap.get('evening')!,
        percentage: (timeStatsMap.get('evening')! / totalForTimeAnalysis) * 100,
      },
    ] as TimeStats[]
  ).sort((a, b) => b.totalEntries - a.totalEntries)

  const bestTimeOfDay = timeOfDayStats[0].totalEntries > 0 ? timeOfDayStats[0] : null

  return {
    bestDays: dayStats.slice(0, 3), // Top 3 jours
    bestTimeOfDay,
    timeOfDayStats,
    hasEnoughData: true,
  }
}

/**
 * Analyse les patterns globaux de toutes les habitudes
 */
export function analyzeGlobalPatterns(_habits: Habit[], entries: DailyEntry[]): PatternAnalysis {
  if (entries.length < MIN_ENTRIES_FOR_ANALYSIS) {
    return {
      bestDays: [],
      bestTimeOfDay: null,
      timeOfDayStats: [],
      hasEnoughData: false,
    }
  }

  // Analyse par jour de la semaine
  const dayStatsMap = new Map<number, { entries: DailyEntry[]; completions: number[] }>()
  for (let i = 0; i < 7; i++) {
    dayStatsMap.set(i, { entries: [], completions: [] })
  }

  entries.forEach((entry) => {
    const date = new Date(entry.date)
    const dayIndex = date.getDay()
    const data = dayStatsMap.get(dayIndex)!
    data.entries.push(entry)
    data.completions.push(calculateCompletion(entry))
  })

  const dayStats: DayStats[] = Array.from(dayStatsMap.entries())
    .map(([dayIndex, data]) => ({
      dayName: DAY_NAMES[dayIndex],
      dayIndex,
      totalEntries: data.entries.length,
      completedEntries: data.completions.filter((c) => c >= 70).length,
      averageCompletion:
        data.completions.length > 0
          ? data.completions.reduce((a, b) => a + b, 0) / data.completions.length
          : 0,
    }))
    .filter((s) => s.totalEntries > 0)
    .sort((a, b) => b.averageCompletion - a.averageCompletion)

  // Analyse par période de la journée
  const timeStatsMap = new Map<TimeOfDay, number>([
    ['morning', 0],
    ['afternoon', 0],
    ['evening', 0],
  ])

  entries.forEach((entry) => {
    const period = getTimeOfDay(entry)
    timeStatsMap.set(period, timeStatsMap.get(period)! + 1)
  })

  const totalForTimeAnalysis = entries.length
  const timeOfDayStats: TimeStats[] = (
    [
      {
        period: 'morning' as const,
        label: 'matin',
        totalEntries: timeStatsMap.get('morning')!,
        percentage: (timeStatsMap.get('morning')! / totalForTimeAnalysis) * 100,
      },
      {
        period: 'afternoon' as const,
        label: 'après-midi',
        totalEntries: timeStatsMap.get('afternoon')!,
        percentage: (timeStatsMap.get('afternoon')! / totalForTimeAnalysis) * 100,
      },
      {
        period: 'evening' as const,
        label: 'soir',
        totalEntries: timeStatsMap.get('evening')!,
        percentage: (timeStatsMap.get('evening')! / totalForTimeAnalysis) * 100,
      },
    ] as TimeStats[]
  ).sort((a, b) => b.totalEntries - a.totalEntries)

  const bestTimeOfDay = timeOfDayStats[0].totalEntries > 0 ? timeOfDayStats[0] : null

  return {
    bestDays: dayStats.slice(0, 3), // Top 3 jours
    bestTimeOfDay,
    timeOfDayStats,
    hasEnoughData: true,
  }
}
