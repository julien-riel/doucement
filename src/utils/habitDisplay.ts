/**
 * Utilities for habit display - Implementation Intentions & Habit Stacking
 * Phase 6: Science-based improvements
 */

import { Habit } from '../types'
import { INTENTION_DISPLAY } from '../constants/messages'

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
