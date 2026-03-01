/**
 * Hook useTimer - Gestion de la minuterie (compte à rebours)
 *
 * Wrapper autour de useChronometer qui ajoute remainingSeconds et isTargetReached.
 * Le temps enregistré est le temps total écoulé, pas le temps restant.
 */

import { useChronometer, type UseChronometerOptions } from './useChronometer'

export interface UseTimerOptions extends UseChronometerOptions {
  /** Durée cible en secondes (point de départ du compte à rebours) */
  targetSeconds: number
}

export interface UseTimerReturn {
  /** Temps écoulé en secondes */
  elapsedSeconds: number
  /** Temps restant en secondes (négatif si dépassement) */
  remainingSeconds: number
  /** Le timer est-il en cours */
  isRunning: boolean
  /** Le timer a-t-il été démarré au moins une fois */
  hasStarted: boolean
  /** La cible a-t-elle été atteinte */
  isTargetReached: boolean
  /** Démarrer ou reprendre le timer */
  start: () => void
  /** Mettre en pause le timer */
  pause: () => void
  /** Arrêter et valider le temps */
  stop: () => void
  /** Réinitialiser le timer */
  reset: () => void
}

/**
 * Hook pour gérer une minuterie avec persistance
 *
 * @example
 * const { remainingSeconds, isRunning, start, pause, stop } = useTimer({
 *   habitId: 'habit-1',
 *   date: '2026-01-15',
 *   targetSeconds: 120, // 2 minutes
 *   onStop: (seconds) => handleCheckIn(seconds)
 * });
 */
export function useTimer({
  targetSeconds,
  ...chronometerOptions
}: UseTimerOptions): UseTimerReturn {
  const { elapsedSeconds, isRunning, hasStarted, start, pause, stop, reset } =
    useChronometer(chronometerOptions)

  return {
    elapsedSeconds,
    remainingSeconds: targetSeconds - elapsedSeconds,
    isRunning,
    hasStarted,
    isTargetReached: elapsedSeconds >= targetSeconds,
    start,
    pause,
    stop,
    reset,
  }
}

export default useTimer
