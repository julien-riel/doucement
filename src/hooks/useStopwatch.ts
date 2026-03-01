/**
 * Hook useStopwatch - Gestion du chronomètre (temps écoulé)
 *
 * Wrapper léger autour de useChronometer pour mesurer le temps écoulé.
 * L'état est sauvegardé automatiquement pour reprendre après fermeture de l'app.
 */

import {
  useChronometer,
  type UseChronometerOptions,
  type UseChronometerReturn,
} from './useChronometer'

export type UseStopwatchOptions = UseChronometerOptions
export type UseStopwatchReturn = UseChronometerReturn

/**
 * Hook pour gérer un chronomètre avec persistance
 *
 * @example
 * const { elapsedSeconds, isRunning, start, pause, stop, reset } = useStopwatch({
 *   habitId: 'habit-1',
 *   date: '2026-01-15',
 *   onStop: (seconds) => handleCheckIn(seconds)
 * });
 */
export function useStopwatch(options: UseStopwatchOptions): UseStopwatchReturn {
  return useChronometer(options)
}

export default useStopwatch
