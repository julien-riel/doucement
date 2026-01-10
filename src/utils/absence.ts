/**
 * Utilitaires de détection d'absence
 * Permet de détecter quand un utilisateur n'a pas fait de check-in depuis un certain temps
 */

import type { DailyEntry, Habit } from '../types'

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
  habits: Habit[],
  entries: DailyEntry[]
): boolean {
  const globalAbsence = detectGlobalAbsence(entries)
  return globalAbsence.isAbsent
}
