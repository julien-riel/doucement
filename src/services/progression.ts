/**
 * Service de calcul de progression
 * Calcule les doses cibles, pourcentages de complétion et statistiques
 */

import { Habit, DailyEntry, CompletionStatus } from '../types'

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calcule le nombre de jours entre deux dates
 * @param startDate Date de début (YYYY-MM-DD)
 * @param endDate Date de fin (YYYY-MM-DD)
 * @returns Nombre de jours (entier positif ou négatif)
 */
export function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = end.getTime() - start.getTime()
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Calcule le nombre de semaines complètes entre deux dates
 * @param startDate Date de début (YYYY-MM-DD)
 * @param endDate Date de fin (YYYY-MM-DD)
 * @returns Nombre de semaines (peut être fractionnaire)
 */
export function weeksBetween(startDate: string, endDate: string): number {
  return daysBetween(startDate, endDate) / 7
}

// ============================================================================
// ROUNDING RULES (3.4)
// ============================================================================

/**
 * Applique les règles d'arrondi selon la direction de progression
 *
 * Règles:
 * - Augmentation (increase): arrondi au plafond (ceil) pour encourager
 * - Réduction (decrease): arrondi au plancher (floor) pour être bienveillant
 * - Maintien (maintain): arrondi classique (round)
 *
 * @param value Valeur à arrondir
 * @param direction Direction de la progression
 * @returns Valeur arrondie selon la direction
 */
export function applyRounding(value: number, direction: Habit['direction']): number {
  switch (direction) {
    case 'increase':
      return Math.ceil(value)
    case 'decrease':
      return Math.floor(value)
    case 'maintain':
    default:
      return Math.round(value)
  }
}

// ============================================================================
// TARGET DOSE CALCULATION (3.1, 3.2, 3.3)
// ============================================================================

/**
 * Calcule la dose cible absolue pour une date donnée (3.2)
 * Mode: +/- X unités par jour ou semaine
 *
 * @param habit Habitude
 * @param date Date cible (YYYY-MM-DD)
 * @returns Dose cible (non arrondie)
 */
function calculateAbsoluteProgression(habit: Habit, date: string): number {
  if (!habit.progression || habit.progression.mode !== 'absolute') {
    return habit.startValue
  }

  const { value, period } = habit.progression
  const days = daysBetween(habit.createdAt, date)

  if (days <= 0) {
    return habit.startValue
  }

  let progressionAmount: number
  if (period === 'daily') {
    progressionAmount = value * days
  } else {
    // weekly: progression par semaine complète
    const weeks = Math.floor(days / 7)
    progressionAmount = value * weeks
  }

  // Direction détermine le signe
  if (habit.direction === 'decrease') {
    return habit.startValue - Math.abs(progressionAmount)
  }
  return habit.startValue + Math.abs(progressionAmount)
}

/**
 * Calcule la dose cible en pourcentage pour une date donnée (3.3)
 * Mode: +/- X% par semaine avec effet composé
 *
 * @param habit Habitude
 * @param date Date cible (YYYY-MM-DD)
 * @returns Dose cible (non arrondie)
 */
function calculatePercentageProgression(habit: Habit, date: string): number {
  if (!habit.progression || habit.progression.mode !== 'percentage') {
    return habit.startValue
  }

  const { value, period } = habit.progression
  const days = daysBetween(habit.createdAt, date)

  if (days <= 0) {
    return habit.startValue
  }

  // Calcul du nombre de périodes écoulées
  let periods: number
  if (period === 'daily') {
    periods = days
  } else {
    // weekly: effet composé par semaine
    periods = Math.floor(days / 7)
  }

  // Pourcentage normalisé (ex: 3% = 0.03)
  const percentageRate = Math.abs(value) / 100

  // Effet composé: newValue = startValue * (1 + rate)^periods
  // Pour decrease: newValue = startValue * (1 - rate)^periods
  let multiplier: number
  if (habit.direction === 'decrease') {
    multiplier = Math.pow(1 - percentageRate, periods)
  } else {
    multiplier = Math.pow(1 + percentageRate, periods)
  }

  return habit.startValue * multiplier
}

/**
 * Applique les limites min/max à une dose (3.5)
 *
 * @param dose Dose calculée
 * @param habit Habitude
 * @returns Dose bornée
 */
function applyLimits(dose: number, habit: Habit): number {
  let result = dose

  // Si targetValue défini, c'est la limite selon la direction
  if (habit.targetValue !== undefined) {
    if (habit.direction === 'increase') {
      // Pour augmentation, ne pas dépasser targetValue
      result = Math.min(result, habit.targetValue)
    } else if (habit.direction === 'decrease') {
      // Pour réduction, ne pas descendre sous targetValue
      result = Math.max(result, habit.targetValue)
    }
  }

  // Minimum absolu selon direction
  if (habit.direction === 'decrease') {
    // Pour réduction: minimum 0 (on ne peut pas faire moins que rien)
    result = Math.max(result, 0)
  } else {
    // Pour augmentation/maintien: minimum 1 (au moins essayer)
    result = Math.max(result, 1)
  }

  return result
}

/**
 * Calcule la dose cible pour une habitude à une date donnée (3.1)
 *
 * Cette fonction:
 * 1. Calcule la progression selon le mode (absolu ou pourcentage)
 * 2. Applique les règles d'arrondi selon la direction
 * 3. Applique les limites min/max
 *
 * @param habit Habitude
 * @param date Date cible (YYYY-MM-DD)
 * @returns Dose cible entière
 */
export function calculateTargetDose(habit: Habit, date: string): number {
  // Cas simple: pas de progression (maintain)
  if (!habit.progression || habit.direction === 'maintain') {
    return habit.startValue
  }

  // Calcul selon le mode
  let rawDose: number
  if (habit.progression.mode === 'absolute') {
    rawDose = calculateAbsoluteProgression(habit, date)
  } else {
    rawDose = calculatePercentageProgression(habit, date)
  }

  // Application des règles d'arrondi
  const roundedDose = applyRounding(rawDose, habit.direction)

  // Application des limites
  return applyLimits(roundedDose, habit)
}

// ============================================================================
// COMPLETION CALCULATION (3.6, 3.7)
// ============================================================================

/**
 * Calcule le pourcentage de complétion d'une entrée (3.6)
 *
 * Pour les habitudes d'augmentation/maintien:
 *   actualValue / targetDose * 100
 *   Ex: cible 10, fait 8 → 80%
 *
 * Pour les habitudes de réduction:
 *   La logique est inversée car faire MOINS est MIEUX
 *   targetDose / actualValue * 100 (si actualValue > 0)
 *   Ex: cible 4 cigarettes, fait 3 → 133% (mieux que prévu)
 *   Ex: cible 4 cigarettes, fait 5 → 80% (un peu plus que voulu)
 *
 * @param entry Entrée quotidienne
 * @param direction Direction de l'habitude (optionnel pour rétrocompatibilité)
 * @returns Pourcentage (0-100+, peut dépasser 100 si dépassement)
 */
export function calculateCompletionPercentage(
  entry: DailyEntry,
  direction?: Habit['direction']
): number {
  if (entry.targetDose <= 0) {
    // Cible à 0: pour réduction c'est l'objectif ultime atteint
    if (direction === 'decrease') {
      return entry.actualValue === 0 ? 100 : 0
    }
    // Pour augmentation: si effort fait = 100%, sinon 0%
    return entry.actualValue > 0 ? 100 : 0
  }

  // Pour les habitudes de réduction: moins = mieux
  if (direction === 'decrease') {
    if (entry.actualValue === 0) {
      // Fait 0 quand la cible était > 0: parfait !
      return 100
    }
    // targetDose / actualValue: moins on fait, plus le % est élevé
    return (entry.targetDose / entry.actualValue) * 100
  }

  // Pour augmentation/maintien: formule classique
  return (entry.actualValue / entry.targetDose) * 100
}

/**
 * Détermine le statut de complétion d'une entrée (3.7)
 *
 * Seuils:
 * - exceeded: > 100%
 * - completed: 70-100% (effort partiel = succès selon PRD)
 * - partial: 1-69%
 * - pending: 0%
 *
 * @param entry Entrée quotidienne
 * @param direction Direction de l'habitude (optionnel pour rétrocompatibilité)
 * @returns Statut de complétion
 */
export function getCompletionStatus(
  entry: DailyEntry,
  direction?: Habit['direction']
): CompletionStatus {
  const percentage = calculateCompletionPercentage(entry, direction)

  if (percentage > 100) {
    return 'exceeded'
  }
  if (percentage >= 70) {
    return 'completed'
  }
  if (percentage > 0) {
    return 'partial'
  }
  return 'pending'
}

/**
 * Calcule le pourcentage de complétion pour un habit et une date
 * Utile quand on a accès aux données brutes
 *
 * @param actualValue Valeur réalisée
 * @param targetDose Dose cible
 * @param direction Direction de l'habitude (optionnel pour rétrocompatibilité)
 * @returns Pourcentage de complétion
 */
export function calculateCompletionPercentageFromValues(
  actualValue: number,
  targetDose: number,
  direction?: Habit['direction']
): number {
  if (targetDose <= 0) {
    if (direction === 'decrease') {
      return actualValue === 0 ? 100 : 0
    }
    return actualValue > 0 ? 100 : 0
  }

  // Pour les habitudes de réduction: moins = mieux
  if (direction === 'decrease') {
    if (actualValue === 0) {
      return 100
    }
    return (targetDose / actualValue) * 100
  }

  return (actualValue / targetDose) * 100
}

// ============================================================================
// STATISTICS (3.8)
// ============================================================================

/**
 * Statistiques d'une habitude sur une période
 */
export interface HabitStats {
  /** Nombre de jours avec au moins une entrée */
  activeDays: number
  /** Nombre total de jours dans la période */
  totalDays: number
  /** Pourcentage moyen de complétion */
  averageCompletion: number
  /** Nombre de jours complétés (>= 70%) */
  completedDays: number
  /** Nombre de jours dépassés (> 100%) */
  exceededDays: number
  /** Progression depuis le début (différence entre dernière et première dose cible) */
  totalProgression: number
}

/**
 * Calcule les statistiques d'une habitude sur une période (3.8)
 *
 * @param habit Habitude
 * @param entries Entrées de l'habitude sur la période
 * @param startDate Début de la période (YYYY-MM-DD)
 * @param endDate Fin de la période (YYYY-MM-DD)
 * @returns Statistiques calculées
 */
export function calculateHabitStats(
  habit: Habit,
  entries: DailyEntry[],
  startDate: string,
  endDate: string
): HabitStats {
  const totalDays = daysBetween(startDate, endDate) + 1 // Inclusif
  const habitEntries = entries.filter((e) => e.habitId === habit.id)

  // Jours actifs
  const activeDays = habitEntries.length

  // Calcul des statistiques de complétion
  let totalCompletionPercentage = 0
  let completedDays = 0
  let exceededDays = 0

  for (const entry of habitEntries) {
    const percentage = calculateCompletionPercentage(entry, habit.direction)
    totalCompletionPercentage += percentage

    if (percentage > 100) {
      exceededDays++
      completedDays++ // Exceeded compte aussi comme complété
    } else if (percentage >= 70) {
      completedDays++
    }
  }

  // Moyenne (sur les jours actifs uniquement)
  const averageCompletion = activeDays > 0 ? totalCompletionPercentage / activeDays : 0

  // Progression totale
  const startDose = calculateTargetDose(habit, startDate)
  const endDose = calculateTargetDose(habit, endDate)
  const totalProgression = endDose - startDose

  return {
    activeDays,
    totalDays,
    averageCompletion: Math.round(averageCompletion * 10) / 10, // 1 décimale
    completedDays,
    exceededDays,
    totalProgression,
  }
}

/**
 * Calcule le pourcentage de complétion global pour une date
 * (toutes les habitudes du jour)
 *
 * @param entries Entrées du jour
 * @param habits Toutes les habitudes actives
 * @param date Date concernée
 * @returns Pourcentage global (0-100)
 */
export function calculateDailyCompletionPercentage(
  entries: DailyEntry[],
  habits: Habit[],
  date: string
): number {
  // Filtrer les habitudes actives à cette date
  const activeHabitsForDate = habits.filter((h) => h.archivedAt === null && h.createdAt <= date)

  if (activeHabitsForDate.length === 0) {
    return 0
  }

  let totalPercentage = 0

  for (const habit of activeHabitsForDate) {
    const entry = entries.find((e) => e.habitId === habit.id && e.date === date)
    if (entry) {
      // Plafonner à 100% pour le calcul global
      totalPercentage += Math.min(calculateCompletionPercentage(entry, habit.direction), 100)
    }
    // Les habitudes sans entrée comptent comme 0%
  }

  return Math.round((totalPercentage / activeHabitsForDate.length) * 10) / 10
}
