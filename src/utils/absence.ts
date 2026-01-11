/**
 * Utilitaires de détection d'absence
 * Permet de détecter quand un utilisateur n'a pas fait de check-in depuis un certain temps
 */

import type { DailyEntry, Habit, PlannedPause } from '../types'

/**
 * Nombre de jours minimum pour considérer une absence (message de bienvenue)
 */
export const ABSENCE_THRESHOLD_DAYS = 2

/**
 * Nombre de jours pour une absence prolongée (proposition de recalibration)
 */
export const EXTENDED_ABSENCE_THRESHOLD_DAYS = 7

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
 * Informations sur une absence prolongée pour une habitude
 * Utilisé pour proposer la recalibration
 */
export interface ExtendedAbsenceInfo extends HabitAbsenceInfo {
  /** Indique si l'absence est prolongée (7+ jours) */
  isExtendedAbsence: boolean
  /** Dose cible calculée pour aujourd'hui (peut être devenue irréaliste) */
  currentTargetDose: number
  /** Dernière dose réellement accomplie avant l'absence */
  lastActualValue: number | null
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
  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date))
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
export function detectHabitAbsence(habit: Habit, entries: DailyEntry[]): HabitAbsenceInfo {
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
  const sortedEntries = [...habitEntries].sort((a, b) => b.date.localeCompare(a.date))
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
export function detectAllHabitsAbsence(habits: Habit[], entries: DailyEntry[]): HabitAbsenceInfo[] {
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
export function getNeglectedHabits(habits: Habit[], entries: DailyEntry[]): HabitAbsenceInfo[] {
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
export function isReturningAfterAbsence(_habits: Habit[], entries: DailyEntry[]): boolean {
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
  return habits.filter((habit) => habit.archivedAt === null && !isHabitPaused(habit, date))
}

/**
 * Retourne les habitudes en pause
 *
 * @param habits - Liste des habitudes
 * @param date - La date à vérifier (par défaut aujourd'hui)
 * @returns Liste des habitudes actuellement en pause
 */
export function getPausedHabits(habits: Habit[], date?: string): Habit[] {
  return habits.filter((habit) => habit.archivedAt === null && isHabitPaused(habit, date))
}

// ============================================================================
// EXTENDED ABSENCE DETECTION (Phase 10 - Mode Rattrapage)
// ============================================================================

/**
 * Import de la fonction de calcul de dose (évite la dépendance circulaire)
 * On utilise une injection de dépendance pour éviter les imports circulaires
 */
type CalculateTargetDoseFn = (habit: Habit, date: string) => number

/**
 * Détecte une absence prolongée pour une habitude spécifique
 * Une absence prolongée est définie comme 7+ jours sans check-in
 *
 * @param habit - L'habitude à vérifier
 * @param entries - Toutes les entrées quotidiennes
 * @param calculateTargetDose - Fonction pour calculer la dose cible
 * @returns Information sur l'absence prolongée
 */
export function detectExtendedAbsence(
  habit: Habit,
  entries: DailyEntry[],
  calculateTargetDose: CalculateTargetDoseFn
): ExtendedAbsenceInfo {
  // Obtenir les infos d'absence de base
  const basicAbsence = detectHabitAbsence(habit, entries)
  const today = getCurrentDate()

  // Filtrer les entrées pour cette habitude
  const habitEntries = entries.filter((e) => e.habitId === habit.id)

  // Trouver la dernière entrée et sa valeur
  let lastActualValue: number | null = null
  if (habitEntries.length > 0) {
    const sortedEntries = [...habitEntries].sort((a, b) => b.date.localeCompare(a.date))
    lastActualValue = sortedEntries[0].actualValue
  }

  // Calculer la dose cible actuelle
  const currentTargetDose = calculateTargetDose(habit, today)

  return {
    ...basicAbsence,
    isExtendedAbsence: basicAbsence.daysSinceLastEntry >= EXTENDED_ABSENCE_THRESHOLD_DAYS,
    currentTargetDose,
    lastActualValue,
  }
}

/**
 * Retourne les habitudes avec absence prolongée (7+ jours)
 * Utile pour proposer la recalibration
 *
 * @param habits - Liste des habitudes actives
 * @param entries - Toutes les entrées quotidiennes
 * @param calculateTargetDose - Fonction pour calculer la dose cible
 * @returns Liste des habitudes avec absence prolongée
 */
export function getHabitsWithExtendedAbsence(
  habits: Habit[],
  entries: DailyEntry[],
  calculateTargetDose: CalculateTargetDoseFn
): ExtendedAbsenceInfo[] {
  return habits
    .filter((habit) => habit.archivedAt === null && !isHabitPaused(habit))
    .map((habit) => detectExtendedAbsence(habit, entries, calculateTargetDose))
    .filter((info) => info.isExtendedAbsence)
}

/**
 * Vérifie si une habitude nécessite une recalibration
 * (absence prolongée ET habitude progressive)
 *
 * @param habit - L'habitude à vérifier
 * @param entries - Toutes les entrées quotidiennes
 * @param calculateTargetDose - Fonction pour calculer la dose cible
 * @returns true si l'habitude nécessite une recalibration
 */
export function needsRecalibration(
  habit: Habit,
  entries: DailyEntry[],
  calculateTargetDose: CalculateTargetDoseFn
): boolean {
  // Seules les habitudes progressives peuvent être recalibrées
  if (!habit.progression || habit.direction === 'maintain') {
    return false
  }

  const absenceInfo = detectExtendedAbsence(habit, entries, calculateTargetDose)
  return absenceInfo.isExtendedAbsence
}

/**
 * Options de niveau de reprise pour la recalibration
 */
export type RecalibrationLevel = 0.5 | 0.75 | 1

/**
 * Calcule la nouvelle dose de départ pour une recalibration
 *
 * @param lastActualValue - Dernière valeur accomplie
 * @param currentTargetDose - Dose cible actuelle
 * @param level - Niveau de reprise (0.5 = 50%, 0.75 = 75%, 1 = 100%)
 * @param habit - L'habitude concernée
 * @returns Nouvelle valeur de départ suggérée
 */
export function calculateRecalibrationDose(
  lastActualValue: number | null,
  currentTargetDose: number,
  level: RecalibrationLevel,
  habit: Habit
): number {
  // Utilise soit la dernière valeur accomplie, soit la dose cible
  const baseValue = lastActualValue ?? currentTargetDose

  // Pour les habitudes d'augmentation: on réduit la dose
  // Pour les habitudes de réduction: on augmente la cible (plus facile)
  if (habit.direction === 'increase') {
    // Ex: si dernière dose était 20 et on veut reprendre à 50%, nouvelle dose = 10
    const newDose = Math.round(baseValue * level)
    // Minimum 1 pour les habitudes d'augmentation
    return Math.max(1, newDose)
  } else {
    // Pour réduction: si on était à cible 5 et on veut reprendre à 50%,
    // la nouvelle cible est plus haute (plus facile): 5 / 0.5 = 10
    // Mais ça n'a pas de sens ici. Pour réduction, on garde la cible actuelle
    // ou on revient à la dernière valeur accomplie
    if (level === 1) {
      return currentTargetDose
    }
    // Pour 50% ou 75%, on revient à une cible intermédiaire entre
    // la valeur de départ et la cible actuelle
    const startValue = habit.startValue
    const progress = startValue - currentTargetDose
    const newProgress = progress * level
    return Math.round(startValue - newProgress)
  }
}
