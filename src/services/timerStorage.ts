/**
 * Service de stockage pour les états des chronomètres
 * Permet de persister et restaurer les chronos en cours entre sessions
 */

import { TimerState } from '../types'

/** Clé localStorage pour les états des chronomètres */
export const TIMER_STATES_KEY = 'doucement_timer_states'

/**
 * Charge tous les états de chronomètres depuis localStorage
 * @returns Tableau des états de chronomètres, vide si aucun
 */
export function loadTimerStates(): TimerState[] {
  try {
    const stored = localStorage.getItem(TIMER_STATES_KEY)
    if (!stored) {
      return []
    }

    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) {
      return []
    }

    // Valider et filtrer les états valides
    return parsed.filter(isValidTimerState)
  } catch {
    return []
  }
}

/**
 * Sauvegarde un état de chronomètre
 * Met à jour ou ajoute l'état selon habitId et date
 * @param state État du chronomètre à sauvegarder
 */
export function saveTimerState(state: TimerState): void {
  try {
    const states = loadTimerStates()

    // Chercher un état existant pour cette habitude et date
    const existingIndex = states.findIndex(
      (s) => s.habitId === state.habitId && s.date === state.date
    )

    if (existingIndex >= 0) {
      // Mettre à jour l'état existant
      states[existingIndex] = state
    } else {
      // Ajouter un nouvel état
      states.push(state)
    }

    localStorage.setItem(TIMER_STATES_KEY, JSON.stringify(states))
  } catch (error) {
    console.error("Erreur lors de la sauvegarde de l'état du chronomètre:", error)
  }
}

/**
 * Récupère l'état d'un chronomètre spécifique
 * @param habitId ID de l'habitude
 * @param date Date au format YYYY-MM-DD
 * @returns État du chronomètre ou undefined si non trouvé
 */
export function getTimerState(habitId: string, date: string): TimerState | undefined {
  const states = loadTimerStates()
  return states.find((s) => s.habitId === habitId && s.date === date)
}

/**
 * Supprime l'état d'un chronomètre
 * Appelé quand l'utilisateur valide ou reset le chronomètre
 * @param habitId ID de l'habitude
 * @param date Date au format YYYY-MM-DD
 */
export function removeTimerState(habitId: string, date: string): void {
  try {
    const states = loadTimerStates()
    const filtered = states.filter((s) => !(s.habitId === habitId && s.date === date))
    localStorage.setItem(TIMER_STATES_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error("Erreur lors de la suppression de l'état du chronomètre:", error)
  }
}

/**
 * Supprime tous les états de chronomètres pour une date donnée
 * Utile pour le nettoyage en fin de journée
 * @param date Date au format YYYY-MM-DD
 */
export function removeTimerStatesForDate(date: string): void {
  try {
    const states = loadTimerStates()
    const filtered = states.filter((s) => s.date !== date)
    localStorage.setItem(TIMER_STATES_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Erreur lors de la suppression des états de chronomètres:', error)
  }
}

/**
 * Supprime tous les états de chronomètres pour une habitude donnée
 * Utile quand une habitude est supprimée ou archivée
 * @param habitId ID de l'habitude
 */
export function removeTimerStatesForHabit(habitId: string): void {
  try {
    const states = loadTimerStates()
    const filtered = states.filter((s) => s.habitId !== habitId)
    localStorage.setItem(TIMER_STATES_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Erreur lors de la suppression des états de chronomètres:', error)
  }
}

/**
 * Efface tous les états de chronomètres
 * Utilisation: reset de l'application ou tests
 */
export function clearAllTimerStates(): void {
  try {
    localStorage.removeItem(TIMER_STATES_KEY)
  } catch (error) {
    console.error('Erreur lors de la suppression de tous les états:', error)
  }
}

/**
 * Valide qu'un objet est un TimerState valide
 */
function isValidTimerState(obj: unknown): obj is TimerState {
  if (typeof obj !== 'object' || obj === null) {
    return false
  }

  const state = obj as Record<string, unknown>

  return (
    typeof state.habitId === 'string' &&
    typeof state.date === 'string' &&
    typeof state.startedAt === 'string' &&
    typeof state.accumulatedSeconds === 'number' &&
    typeof state.isRunning === 'boolean'
  )
}
