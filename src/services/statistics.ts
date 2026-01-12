/**
 * Service de calcul statistiques
 * Calcule les métriques pour les graphiques, tendances, projections et statistiques agrégées
 */

import { Habit, DailyEntry } from '../types'
import {
  StatsPeriod,
  DataPoint,
  ChartData,
  ProjectionData,
  HabitStats,
  getHeatmapIntensity,
  HeatmapCell,
} from '../types/statistics'
import { daysBetween, calculateTargetDose, calculateCompletionPercentage } from './progression'

// ============================================================================
// DATE UTILITIES
// ============================================================================

/**
 * Retourne la date actuelle au format YYYY-MM-DD
 */
function getTodayDate(): string {
  const today = new Date()
  return formatDate(today)
}

/**
 * Formate une date en YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Parse une date au format YYYY-MM-DD
 */
function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Ajoute des jours à une date
 */
function addDays(dateStr: string, days: number): string {
  const date = parseDate(dateStr)
  date.setDate(date.getDate() + days)
  return formatDate(date)
}

/**
 * Retourne la date de début pour une période donnée
 */
function getPeriodStartDate(period: StatsPeriod, referenceDate?: string): string {
  const today = referenceDate ? parseDate(referenceDate) : new Date()

  switch (period) {
    case 'week':
      return formatDate(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000))
    case 'month':
      return formatDate(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000))
    case 'quarter':
      return formatDate(new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000))
    case 'year':
      return formatDate(new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000))
    case 'all':
    default:
      return '2000-01-01' // Date suffisamment ancienne
  }
}

// ============================================================================
// LINEAR REGRESSION
// ============================================================================

/**
 * Calcule la régression linéaire sur un ensemble de points
 * Retourne la pente (slope) et l'ordonnée à l'origine (intercept)
 *
 * @param points Points de données avec x (index) et y (valeur)
 * @returns { slope, intercept }
 */
function linearRegression(points: Array<{ x: number; y: number }>): {
  slope: number
  intercept: number
} {
  const n = points.length
  if (n === 0) {
    return { slope: 0, intercept: 0 }
  }
  if (n === 1) {
    return { slope: 0, intercept: points[0].y }
  }

  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumXX = 0

  for (const point of points) {
    sumX += point.x
    sumY += point.y
    sumXY += point.x * point.y
    sumXX += point.x * point.x
  }

  const denominator = n * sumXX - sumX * sumX
  if (denominator === 0) {
    return { slope: 0, intercept: sumY / n }
  }

  const slope = (n * sumXY - sumX * sumY) / denominator
  const intercept = (sumY - slope * sumX) / n

  return { slope, intercept }
}

// ============================================================================
// CHART DATA
// ============================================================================

/**
 * Génère les données pour un graphique de progression
 *
 * @param habit Habitude
 * @param entries Toutes les entrées
 * @param period Période à afficher
 * @param referenceDate Date de référence (défaut: aujourd'hui)
 * @returns Données formatées pour le graphique
 */
export function getChartData(
  habit: Habit,
  entries: DailyEntry[],
  period: StatsPeriod,
  referenceDate?: string
): ChartData {
  const endDate = referenceDate || getTodayDate()
  const startDate = period === 'all' ? habit.createdAt : getPeriodStartDate(period, endDate)

  // Filtrer les entrées pour cette habitude dans la période
  const habitEntries = entries.filter(
    (e) => e.habitId === habit.id && e.date >= startDate && e.date <= endDate
  )

  // Créer un map pour accès rapide
  const entriesByDate = new Map<string, DailyEntry>()
  for (const entry of habitEntries) {
    entriesByDate.set(entry.date, entry)
  }

  // Générer les points de données pour chaque jour
  const dataPoints: DataPoint[] = []
  const days = daysBetween(startDate, endDate)

  for (let i = 0; i <= days; i++) {
    const date = addDays(startDate, i)
    const entry = entriesByDate.get(date)
    const target = calculateTargetDose(habit, date)

    if (entry) {
      const percentage = calculateCompletionPercentage(entry, habit.direction)
      dataPoints.push({
        date,
        value: entry.actualValue,
        target,
        percentage: Math.round(percentage * 10) / 10,
      })
    } else {
      // Pas d'entrée pour ce jour - inclure quand même pour le graphique
      dataPoints.push({
        date,
        value: 0,
        target,
        percentage: 0,
      })
    }
  }

  return {
    habitId: habit.id,
    habitName: habit.name,
    habitEmoji: habit.emoji,
    unit: habit.unit,
    dataPoints,
    finalTarget: habit.targetValue,
  }
}

// ============================================================================
// PROJECTIONS
// ============================================================================

/**
 * Calcule les projections futures pour une habitude
 *
 * @param habit Habitude
 * @param entries Toutes les entrées
 * @param referenceDate Date de référence (défaut: aujourd'hui)
 * @returns Données de projection
 */
export function getProjection(
  habit: Habit,
  entries: DailyEntry[],
  referenceDate?: string
): ProjectionData {
  const today = referenceDate || getTodayDate()

  // Récupérer les 28 derniers jours d'entrées
  const startDate = addDays(today, -28)
  const recentEntries = entries
    .filter((e) => e.habitId === habit.id && e.date >= startDate && e.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date))

  // Valeur actuelle (dernière entrée ou dose cible)
  const lastEntry = recentEntries[recentEntries.length - 1]
  const currentValue = lastEntry ? lastEntry.actualValue : calculateTargetDose(habit, today)

  // Valeur cible finale
  const targetValue = habit.targetValue || currentValue

  // Calculer le pourcentage d'avancement
  let progressPercentage = 0
  if (habit.direction === 'increase') {
    if (targetValue > habit.startValue) {
      progressPercentage =
        ((currentValue - habit.startValue) / (targetValue - habit.startValue)) * 100
    } else {
      progressPercentage = currentValue >= targetValue ? 100 : 0
    }
  } else if (habit.direction === 'decrease') {
    if (habit.startValue > targetValue) {
      progressPercentage =
        ((habit.startValue - currentValue) / (habit.startValue - targetValue)) * 100
    } else {
      progressPercentage = currentValue <= targetValue ? 100 : 0
    }
  }
  progressPercentage = Math.max(0, Math.min(100, progressPercentage))

  // Calculer le taux de progression hebdomadaire via régression linéaire
  const regressionPoints = recentEntries.map((e, i) => ({
    x: i,
    y: e.actualValue,
  }))
  const { slope } = linearRegression(regressionPoints)
  const currentWeeklyRate = slope * 7 // Pente par jour * 7

  // Calculer la date estimée d'atteinte de la cible
  let estimatedCompletionDate: string | null = null
  let daysRemaining: number | null = null

  if (habit.targetValue !== undefined && currentWeeklyRate !== 0) {
    const remaining = habit.targetValue - currentValue

    // Vérifier la cohérence direction/progression
    const progressingCorrectly =
      (habit.direction === 'increase' && currentWeeklyRate > 0 && remaining > 0) ||
      (habit.direction === 'decrease' && currentWeeklyRate < 0 && remaining < 0)

    if (progressingCorrectly) {
      const weeksRemaining = Math.abs(remaining / currentWeeklyRate)
      daysRemaining = Math.ceil(weeksRemaining * 7)
      estimatedCompletionDate = addDays(today, daysRemaining)
    }
  }

  // Projections futures
  const dailyRate = currentWeeklyRate / 7
  const projectionIn30Days = Math.max(0, currentValue + dailyRate * 30)
  const projectionIn90Days = Math.max(0, currentValue + dailyRate * 90)

  return {
    habitId: habit.id,
    currentValue,
    targetValue,
    progressPercentage: Math.round(progressPercentage * 10) / 10,
    currentWeeklyRate: Math.round(currentWeeklyRate * 100) / 100,
    estimatedCompletionDate,
    daysRemaining,
    projectionIn30Days: Math.round(projectionIn30Days * 10) / 10,
    projectionIn90Days: Math.round(projectionIn90Days * 10) / 10,
  }
}

// ============================================================================
// HABIT STATS
// ============================================================================

/**
 * Calcule les statistiques agrégées pour une habitude
 *
 * @param habit Habitude
 * @param entries Toutes les entrées
 * @param period Période d'analyse
 * @param referenceDate Date de référence (défaut: aujourd'hui)
 * @returns Statistiques agrégées
 */
export function getHabitStats(
  habit: Habit,
  entries: DailyEntry[],
  period: StatsPeriod,
  referenceDate?: string
): HabitStats {
  const endDate = referenceDate || getTodayDate()
  const startDate = period === 'all' ? habit.createdAt : getPeriodStartDate(period, endDate)

  // Filtrer les entrées
  const habitEntries = entries
    .filter((e) => e.habitId === habit.id && e.date >= startDate && e.date <= endDate)
    .sort((a, b) => a.date.localeCompare(b.date))

  const totalEntries = habitEntries.length

  if (totalEntries === 0) {
    return {
      habitId: habit.id,
      totalEntries: 0,
      averageCompletion: 0,
      bestDay: null,
      currentStreak: 0,
      bestStreak: 0,
      weeklyTrend: 0,
    }
  }

  // Calculer les pourcentages de complétion
  let totalPercentage = 0
  let bestDay: { date: string; percentage: number } | null = null

  for (const entry of habitEntries) {
    const percentage = calculateCompletionPercentage(entry, habit.direction)
    totalPercentage += percentage

    if (!bestDay || percentage > bestDay.percentage) {
      bestDay = { date: entry.date, percentage: Math.round(percentage * 10) / 10 }
    }
  }

  const averageCompletion = Math.round((totalPercentage / totalEntries) * 10) / 10

  // Calculer les streaks (séries de jours >= 70%)
  const { currentStreak, bestStreak } = calculateStreaks(habitEntries, habit)

  // Calculer la tendance sur 7 jours
  const weeklyTrend = calculateTrend(habitEntries.slice(-7))

  return {
    habitId: habit.id,
    totalEntries,
    averageCompletion,
    bestDay,
    currentStreak,
    bestStreak,
    weeklyTrend,
  }
}

/**
 * Calcule les streaks (séries consécutives >= 70%)
 */
function calculateStreaks(
  entries: DailyEntry[],
  habit: Habit
): { currentStreak: number; bestStreak: number } {
  if (entries.length === 0) {
    return { currentStreak: 0, bestStreak: 0 }
  }

  let currentStreak = 0
  let bestStreak = 0
  let tempStreak = 0
  let previousDate: string | null = null

  for (const entry of entries) {
    const percentage = calculateCompletionPercentage(entry, habit.direction)
    const isSuccess = percentage >= 70

    // Vérifier si c'est un jour consécutif
    const isConsecutive = previousDate === null || daysBetween(previousDate, entry.date) === 1

    if (isSuccess && isConsecutive) {
      tempStreak++
    } else if (isSuccess) {
      // Nouveau streak (jour non consécutif)
      tempStreak = 1
    } else {
      // Fin du streak
      bestStreak = Math.max(bestStreak, tempStreak)
      tempStreak = 0
    }

    previousDate = entry.date
  }

  // Finaliser
  bestStreak = Math.max(bestStreak, tempStreak)
  currentStreak = tempStreak

  return { currentStreak, bestStreak }
}

/**
 * Calcule la tendance sur un ensemble de points
 * Retourne une valeur entre -1 (déclin fort) et +1 (progression forte)
 *
 * @param entries Entrées récentes (triées par date)
 * @returns Tendance normalisée (-1 à 1)
 */
export function calculateTrend(entries: DailyEntry[]): number {
  if (entries.length < 2) {
    return 0
  }

  // Régression linéaire sur les pourcentages
  const points = entries.map((e, i) => ({
    x: i,
    y: e.actualValue,
  }))

  const { slope } = linearRegression(points)

  // Normaliser la pente en fonction de la moyenne des valeurs
  const avgValue = points.reduce((sum, p) => sum + p.y, 0) / points.length

  if (avgValue === 0) {
    return slope > 0 ? 1 : slope < 0 ? -1 : 0
  }

  // Normaliser: une pente de 10% de la moyenne = tendance de 1
  const normalizedSlope = slope / (avgValue * 0.1)

  // Borner entre -1 et 1
  return Math.max(-1, Math.min(1, normalizedSlope))
}

// ============================================================================
// HEATMAP DATA
// ============================================================================

/**
 * Génère les données pour un calendrier heatmap
 *
 * @param habit Habitude
 * @param entries Toutes les entrées
 * @param monthsToShow Nombre de mois à afficher (défaut: 3)
 * @param referenceDate Date de référence (défaut: aujourd'hui)
 * @returns Liste de cellules pour le heatmap
 */
export function getHeatmapData(
  habit: Habit,
  entries: DailyEntry[],
  monthsToShow: number = 3,
  referenceDate?: string
): HeatmapCell[] {
  const endDate = referenceDate || getTodayDate()
  const startDate = addDays(endDate, -monthsToShow * 30)

  // Filtrer les entrées
  const habitEntries = entries.filter(
    (e) => e.habitId === habit.id && e.date >= startDate && e.date <= endDate
  )

  // Créer un map pour accès rapide
  const entriesByDate = new Map<string, DailyEntry>()
  for (const entry of habitEntries) {
    entriesByDate.set(entry.date, entry)
  }

  // Générer les cellules
  const cells: HeatmapCell[] = []
  const days = daysBetween(startDate, endDate)

  for (let i = 0; i <= days; i++) {
    const date = addDays(startDate, i)
    const entry = entriesByDate.get(date)
    const target = calculateTargetDose(habit, date)

    if (entry) {
      const percentage = calculateCompletionPercentage(entry, habit.direction)
      cells.push({
        date,
        percentage: Math.round(percentage * 10) / 10,
        value: entry.actualValue,
        target,
      })
    } else {
      cells.push({
        date,
        percentage: 0,
        value: 0,
        target,
      })
    }
  }

  return cells
}

// ============================================================================
// AGGREGATED STATS
// ============================================================================

/**
 * Calcule des statistiques globales pour toutes les habitudes
 *
 * @param habits Liste des habitudes
 * @param entries Toutes les entrées
 * @param period Période d'analyse
 * @param referenceDate Date de référence
 * @returns Statistiques globales
 */
export function getGlobalStats(
  habits: Habit[],
  entries: DailyEntry[],
  period: StatsPeriod,
  referenceDate?: string
): {
  totalHabits: number
  averageCompletion: number
  totalActiveDays: number
  habitStats: HabitStats[]
} {
  const activeHabits = habits.filter((h) => !h.archivedAt)
  const habitStats = activeHabits.map((h) => getHabitStats(h, entries, period, referenceDate))

  const totalHabits = activeHabits.length

  if (totalHabits === 0) {
    return {
      totalHabits: 0,
      averageCompletion: 0,
      totalActiveDays: 0,
      habitStats: [],
    }
  }

  const averageCompletion =
    habitStats.reduce((sum, s) => sum + s.averageCompletion, 0) / totalHabits

  // Compter les jours uniques avec au moins une entrée
  const endDate = referenceDate || getTodayDate()
  const startDate =
    period === 'all'
      ? habits.reduce((min, h) => (h.createdAt < min ? h.createdAt : min), endDate)
      : getPeriodStartDate(period, endDate)

  const uniqueDays = new Set(
    entries.filter((e) => e.date >= startDate && e.date <= endDate).map((e) => e.date)
  )

  return {
    totalHabits,
    averageCompletion: Math.round(averageCompletion * 10) / 10,
    totalActiveDays: uniqueDays.size,
    habitStats,
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export { getPeriodStartDate, formatDate, parseDate, addDays, linearRegression, getHeatmapIntensity }
