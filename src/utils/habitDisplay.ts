/**
 * Utilities for habit display - Implementation Intentions & Habit Stacking
 * Phase 6: Science-based improvements
 */

import { Habit, DailyEntry, CounterOperation } from '../types'
import { INTENTION_DISPLAY, IDENTITY_STATEMENT } from '../constants/messages'

/**
 * Nombre de jours avant de suggérer la transition du mode simple vers détaillé
 */
const TRANSITION_THRESHOLD_DAYS = 30

/**
 * Construit le texte de l'implementation intention
 * Format: "Après [déclencheur] à [lieu] vers [heure]"
 */
export function buildIntentionText(habit: Habit): string | null {
  const intention = habit.implementationIntention
  if (!intention) return null

  const parts: string[] = []

  if (intention.trigger) {
    parts.push(intention.trigger)
  }

  if (intention.location) {
    parts.push(`${INTENTION_DISPLAY.locationPrefix} ${intention.location}`)
  }

  if (intention.time) {
    parts.push(`${INTENTION_DISPLAY.timePrefix} ${intention.time}`)
  }

  return parts.length > 0 ? parts.join(' ') : null
}

/**
 * Construit la phrase d'identité complète
 * Format: "Je deviens quelqu'un qui [statement]"
 *
 * @param habit - L'habitude
 * @returns La phrase d'identité complète ou null si non définie
 */
export function buildIdentityText(habit: Habit): string | null {
  if (!habit.identityStatement || habit.identityStatement.trim() === '') {
    return null
  }
  return `${IDENTITY_STATEMENT.inputLabel} ${habit.identityStatement}`
}

/**
 * Vérifie si une habitude a une phrase d'identité
 */
export function hasIdentityStatement(habit: Habit): boolean {
  return Boolean(habit.identityStatement && habit.identityStatement.trim() !== '')
}

/**
 * Filtre les habitudes qui ont une phrase d'identité
 */
export function getHabitsWithIdentity(habits: Habit[]): Habit[] {
  return habits.filter(hasIdentityStatement)
}

/**
 * Info de progression hebdomadaire pour les habitudes weekly
 */
export interface WeeklyProgressInfo {
  completedDays: number
  weeklyTarget: number
}

/**
 * Type pour un élément d'habitude avec ses données calculées
 */
export interface HabitDataItem {
  habit: Habit
  targetDose: number
  currentValue: number | undefined
  status: 'pending' | 'partial' | 'completed' | 'exceeded'
  anchorHabitName: string | undefined
  weeklyProgress?: WeeklyProgressInfo
  /** Historique des opérations pour les habitudes compteur */
  operations?: CounterOperation[]
}

/**
 * Organise les habitudes en chaînes (habit stacking)
 * Un groupe = [habitude de base, habitudes qui s'y ancrent...]
 *
 * @param habitData - Liste des habitudes avec leurs données
 * @param allHabits - Toutes les habitudes (pour vérifier si l'ancre existe)
 * @returns Array de chaînes d'habitudes
 */
export function buildHabitChains(
  habitData: HabitDataItem[],
  allHabits: Habit[]
): HabitDataItem[][] {
  const processed = new Set<string>()
  const chains: HabitDataItem[][] = []

  // Trouver les habitudes racines (sans ancre ou dont l'ancre n'est pas dans la liste)
  const rootHabits = habitData.filter(
    (hd) => !hd.habit.anchorHabitId || !allHabits.some((h) => h.id === hd.habit.anchorHabitId)
  )

  // Construire les chaînes récursivement
  const buildChain = (root: HabitDataItem): HabitDataItem[] => {
    const chain: HabitDataItem[] = [root]
    processed.add(root.habit.id)

    // Trouver toutes les habitudes qui s'ancrent à celle-ci
    const children = habitData.filter(
      (hd) => hd.habit.anchorHabitId === root.habit.id && !processed.has(hd.habit.id)
    )

    for (const child of children) {
      chain.push(...buildChain(child))
    }

    return chain
  }

  // Construire toutes les chaînes
  for (const root of rootHabits) {
    if (!processed.has(root.habit.id)) {
      chains.push(buildChain(root))
    }
  }

  // Ajouter les habitudes orphelines (non traitées)
  for (const hd of habitData) {
    if (!processed.has(hd.habit.id)) {
      chains.push([hd])
    }
  }

  return chains
}

/**
 * Calcule le nombre de jours depuis la création d'une habitude
 * @param habit - L'habitude à vérifier
 * @param currentDate - Date actuelle au format YYYY-MM-DD
 * @returns Nombre de jours depuis la création
 */
export function getDaysSinceCreation(habit: Habit, currentDate: string): number {
  const createdDate = new Date(habit.createdAt)
  const today = new Date(currentDate)
  const diffTime = today.getTime() - createdDate.getTime()
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Vérifie si une habitude est éligible à la transition simple → détaillé
 * Conditions :
 * - L'habitude est en mode 'simple'
 * - L'habitude a au moins 30 jours
 * - L'utilisateur n'a pas encore été notifié (pas de flag transitionDismissed)
 *
 * @param habit - L'habitude à vérifier
 * @param currentDate - Date actuelle au format YYYY-MM-DD
 * @returns true si la transition devrait être suggérée
 */
export function isEligibleForTransition(habit: Habit, currentDate: string): boolean {
  // Vérifier que l'habitude est en mode simple
  if (habit.trackingMode !== 'simple') {
    return false
  }

  // Vérifier que l'habitude a au moins 30 jours
  const daysSinceCreation = getDaysSinceCreation(habit, currentDate)
  return daysSinceCreation >= TRANSITION_THRESHOLD_DAYS
}

/**
 * Trouve les habitudes éligibles à la transition simple → détaillé
 *
 * @param habits - Liste des habitudes actives
 * @param entries - Liste des entrées pour vérifier l'utilisation
 * @param currentDate - Date actuelle au format YYYY-MM-DD
 * @returns Liste des habitudes éligibles à la transition
 */
export function getHabitsEligibleForTransition(
  habits: Habit[],
  entries: DailyEntry[],
  currentDate: string
): Habit[] {
  return habits.filter((habit) => {
    // Vérifier l'éligibilité de base
    if (!isEligibleForTransition(habit, currentDate)) {
      return false
    }

    // Vérifier que l'habitude a au moins quelques entrées (utilisée activement)
    const habitEntries = entries.filter((e) => e.habitId === habit.id)
    return habitEntries.length >= 5
  })
}
