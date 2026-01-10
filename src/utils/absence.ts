/**
 * Utilitaires de détection d'absence
 * Permet de détecter quand un utilisateur n'a pas fait de check-in depuis un certain temps
 */

import type { DailyEntry, Habit, PlannedPause } from '../types'

/**
 * Nombre de jours minimum pour considérer une absence
 */
export const ABSENCE_THRESHOLD_DAYS = 2

/**
 * Résultat de la détection d'absence
 */
export interface AbsenceInfo {
  /** Nombre de jours depuis le dernier check-in */
  daysSinceLastEntry: number
  /** Indique si l'utilisateur est considéré comme absent */
  isAbsent: boolean
  /** Date du dernier check-in (YYYY-MM-DD) ou null si jamais */
  lastEntryDate: string | null
}

/**
 * Information d'absence par habitude
 */
export interface HabitAbsenceInfo extends AbsenceInfo {
  /** L'habitude concernée */
  habit: Habit
}

/**
 * Calcule le nombre de jours entre deux dates (format YYYY-MM-DD)
 */
function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Retourne la date actuelle au format YYYY-MM-DD
 */
function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Détecte l'absence globale de l'utilisateur
 * Basé sur toutes les entrées, indépendamment de l'habitude
 *
 * @param entries - Toutes les entrées quotidiennes
 * @returns Information sur l'absence globale
 */
export function detectGlobalAbsence(entries: DailyEntry[]): AbsenceInfo {
  if (entries.length === 0) {
    return {
      daysSinceLastEntry: 0,
      isAbsent: false,
      lastEntryDate: null,
    }
  }

  // Trouve la date de la dernière entrée
  const sortedEntries = [...entries].sort((a, b) =>
    b.date.localeCompare(a.date)
  )
  const lastEntryDate = sortedEntries[0].date
  const today = getCurrentDate()
  const daysSince = daysBetween(lastEntryDate, today)

  return {
    daysSinceLastEntry: daysSince,
    isAbsent: daysSince >= ABSENCE_THRESHOLD_DAYS,
    lastEntryDate,
  }
}

/**
 * Détecte l'absence pour une habitude spécifique
 *
 * @param habit - L'habitude à vérifier
 * @param entries - Toutes les entrées quotidiennes
 * @returns Information sur l'absence pour cette habitude
 */
export function detectHabitAbsence(
  habit: Habit,
  entries: DailyEntry[]
): HabitAbsenceInfo {
  // Filtre les entrées pour cette habitude
  const habitEntries = entries.filter((e) => e.habitId === habit.id)

  if (habitEntries.length === 0) {
    // Pas d'entrées pour cette habitude, vérifie depuis la création
    const today = getCurrentDate()
    const daysSinceCreation = daysBetween(habit.createdAt, today)

    return {
      habit,
      daysSinceLastEntry: daysSinceCreation,
      isAbsent: daysSinceCreation >= ABSENCE_THRESHOLD_DAYS,
      lastEntryDate: null,
    }
  }

  // Trouve la date de la dernière entrée pour cette habitude
  const sortedEntries = [...habitEntries].sort((a, b) =>
    b.date.localeCompare(a.date)
  )
  const lastEntryDate = sortedEntries[0].date
  const today = getCurrentDate()
  const daysSince = daysBetween(lastEntryDate, today)

  return {
    habit,
    daysSinceLastEntry: daysSince,
    isAbsent: daysSince >= ABSENCE_THRESHOLD_DAYS,
    lastEntryDate,
  }
}

/**
 * Détecte l'absence pour toutes les habitudes actives
 *
 * @param habits - Liste des habitudes actives
 * @param entries - Toutes les entrées quotidiennes
 * @returns Liste des habitudes avec leur information d'absence
 */
export function detectAllHabitsAbsence(
  habits: Habit[],
  entries: DailyEntry[]
): HabitAbsenceInfo[] {
  return habits
    .filter((habit) => habit.archivedAt === null)
    .map((habit) => detectHabitAbsence(habit, entries))
}

/**
 * Retourne les habitudes pour lesquelles l'utilisateur est absent
 *
 * @param habits - Liste des habitudes actives
 * @param entries - Toutes les entrées quotidiennes
 * @returns Liste des habitudes négligées avec leur info d'absence
 */
export function getNeglectedHabits(
  habits: Habit[],
  entries: DailyEntry[]
): HabitAbsenceInfo[] {
  return detectAllHabitsAbsence(habits, entries).filter((info) => info.isAbsent)
}

/**
 * Vérifie si l'utilisateur revient après une absence
 * C'est-à-dire s'il y a au moins une habitude négligée
 *
 * @param habits - Liste des habitudes actives
 * @param entries - Toutes les entrées quotidiennes
 * @returns true si l'utilisateur revient après une absence
 */
export function isReturningAfterAbsence(
  _habits: Habit[],
  entries: DailyEntry[]
): boolean {
  const globalAbsence = detectGlobalAbsence(entries)
  return globalAbsence.isAbsent
}

// ============================================================================
// PLANNED PAUSE UTILITIES
// ============================================================================

/**
 * Vérifie si une date est dans la période de pause
 *
 * @param pause - La pause planifiée
 * @param date - La date à vérifier (YYYY-MM-DD)
 * @returns true si la date est dans la période de pause
 */
export function isDateInPause(pause: PlannedPause, date: string): boolean {
  return date >= pause.startDate && date <= pause.endDate
}

/**
 * Vérifie si une habitude est actuellement en pause
 *
 * @param habit - L'habitude à vérifier
 * @param date - La date à vérifier (par défaut aujourd'hui)
 * @returns true si l'habitude est en pause pour la date donnée
 */
export function isHabitPaused(habit: Habit, date?: string): boolean {
  if (!habit.plannedPause) {
    return false
  }
  const checkDate = date ?? getCurrentDate()
  return isDateInPause(habit.plannedPause, checkDate)
}

/**
 * Vérifie si la pause d'une habitude est expirée
 *
 * @param habit - L'habitude à vérifier
 * @returns true si la pause existe et est expirée
 */
export function isPauseExpired(habit: Habit): boolean {
  if (!habit.plannedPause) {
    return false
  }
  const today = getCurrentDate()
  return today > habit.plannedPause.endDate
}

/**
 * Filtre les habitudes actives (non archivées et non en pause)
 *
 * @param habits - Liste des habitudes
 * @param date - La date à vérifier (par défaut aujourd'hui)
 * @returns Liste des habitudes actives et non en pause
 */
export function getActiveNonPausedHabits(habits: Habit[], date?: string): Habit[] {
  return habits.filter(
    (habit) => habit.archivedAt === null && !isHabitPaused(habit, date)
  )
}

/**
 * Retourne les habitudes en pause
 *
 * @param habits - Liste des habitudes
 * @param date - La date à vérifier (par défaut aujourd'hui)
 * @returns Liste des habitudes actuellement en pause
 */
export function getPausedHabits(habits: Habit[], date?: string): Habit[] {
  return habits.filter(
    (habit) => habit.archivedAt === null && isHabitPaused(habit, date)
  )
}
