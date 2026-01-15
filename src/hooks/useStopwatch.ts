/**
 * Hook useStopwatch - Gestion du chronomètre
 *
 * Gère la logique d'un chronomètre avec persistance localStorage.
 * Permet de démarrer, mettre en pause, arrêter et réinitialiser.
 * L'état est sauvegardé automatiquement pour reprendre après fermeture de l'app.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { TimerState } from '../types'
import { getTimerState, saveTimerState, removeTimerState } from '../services/timerStorage'

/** Intervalle de mise à jour du temps affiché (ms) */
const UPDATE_INTERVAL = 100

export interface UseStopwatchOptions {
  /** ID de l'habitude */
  habitId: string
  /** Date concernée (YYYY-MM-DD) */
  date: string
  /** Valeur déjà enregistrée aujourd'hui (en secondes) */
  initialValue?: number
  /** Callback quand le chrono est arrêté (temps total en secondes) */
  onStop?: (totalSeconds: number) => void
}

export interface UseStopwatchReturn {
  /** Temps écoulé en secondes */
  elapsedSeconds: number
  /** Le chronomètre est-il en cours */
  isRunning: boolean
  /** Le chronomètre a-t-il été démarré au moins une fois */
  hasStarted: boolean
  /** Démarrer ou reprendre le chronomètre */
  start: () => void
  /** Mettre en pause le chronomètre */
  pause: () => void
  /** Arrêter et valider le temps */
  stop: () => void
  /** Réinitialiser le chronomètre */
  reset: () => void
}

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
export function useStopwatch({
  habitId,
  date,
  initialValue = 0,
  onStop,
}: UseStopwatchOptions): UseStopwatchReturn {
  // État local
  const [elapsedSeconds, setElapsedSeconds] = useState(initialValue)
  const [isRunning, setIsRunning] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  // Refs pour les valeurs qui changent fréquemment
  const startTimeRef = useRef<number | null>(null)
  const accumulatedRef = useRef(initialValue)
  const animationFrameRef = useRef<number | null>(null)

  /**
   * Calcule le temps total écoulé
   */
  const calculateElapsed = useCallback((): number => {
    if (startTimeRef.current === null) {
      return accumulatedRef.current
    }
    const now = Date.now()
    const runningTime = Math.floor((now - startTimeRef.current) / 1000)
    return accumulatedRef.current + runningTime
  }, [])

  /**
   * Boucle de mise à jour du temps affiché
   */
  const updateLoop = useCallback(() => {
    setElapsedSeconds(calculateElapsed())
    animationFrameRef.current = window.setTimeout(() => {
      if (startTimeRef.current !== null) {
        updateLoop()
      }
    }, UPDATE_INTERVAL)
  }, [calculateElapsed])

  /**
   * Sauvegarde l'état dans localStorage
   */
  const saveState = useCallback(
    (running: boolean) => {
      const state: TimerState = {
        habitId,
        date,
        startedAt: startTimeRef.current
          ? new Date(startTimeRef.current).toISOString()
          : new Date().toISOString(),
        accumulatedSeconds: accumulatedRef.current,
        isRunning: running,
      }
      saveTimerState(state)
    },
    [habitId, date]
  )

  /**
   * Restaure l'état depuis localStorage au montage
   */
  useEffect(() => {
    const savedState = getTimerState(habitId, date)

    if (savedState) {
      accumulatedRef.current = savedState.accumulatedSeconds
      setHasStarted(true)

      if (savedState.isRunning) {
        // Le chrono était en cours, calculer le temps écoulé depuis
        const startedAt = new Date(savedState.startedAt).getTime()
        const elapsedSinceStart = Math.floor((Date.now() - startedAt) / 1000)
        accumulatedRef.current = savedState.accumulatedSeconds + elapsedSinceStart

        // Redémarrer le chrono
        startTimeRef.current = Date.now()
        setIsRunning(true)
        setElapsedSeconds(accumulatedRef.current)
      } else {
        setElapsedSeconds(savedState.accumulatedSeconds)
      }
    } else if (initialValue > 0) {
      // Pas d'état sauvegardé mais une valeur initiale
      accumulatedRef.current = initialValue
      setElapsedSeconds(initialValue)
      setHasStarted(true)
    }
  }, [habitId, date, initialValue])

  /**
   * Gère la boucle de mise à jour quand isRunning change
   */
  useEffect(() => {
    if (isRunning) {
      updateLoop()
    }

    return () => {
      if (animationFrameRef.current !== null) {
        window.clearTimeout(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [isRunning, updateLoop])

  /**
   * Sauvegarde avant de quitter la page
   */
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasStarted) {
        // Mettre à jour accumulatedSeconds avec le temps courant
        if (startTimeRef.current !== null) {
          const runningTime = Math.floor((Date.now() - startTimeRef.current) / 1000)
          accumulatedRef.current += runningTime
        }
        saveState(isRunning)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasStarted, isRunning, saveState])

  /**
   * Démarrer le chronomètre
   */
  const start = useCallback(() => {
    if (isRunning) return

    startTimeRef.current = Date.now()
    setIsRunning(true)
    setHasStarted(true)
    saveState(true)
  }, [isRunning, saveState])

  /**
   * Mettre en pause le chronomètre
   */
  const pause = useCallback(() => {
    if (!isRunning) return

    // Calculer et sauvegarder le temps accumulé
    if (startTimeRef.current !== null) {
      const runningTime = Math.floor((Date.now() - startTimeRef.current) / 1000)
      accumulatedRef.current += runningTime
    }

    startTimeRef.current = null
    setIsRunning(false)
    setElapsedSeconds(accumulatedRef.current)
    saveState(false)
  }, [isRunning, saveState])

  /**
   * Arrêter et valider le temps
   */
  const stop = useCallback(() => {
    // Calculer le temps final
    let finalSeconds = accumulatedRef.current
    if (startTimeRef.current !== null) {
      const runningTime = Math.floor((Date.now() - startTimeRef.current) / 1000)
      finalSeconds += runningTime
    }

    // Réinitialiser l'état
    startTimeRef.current = null
    setIsRunning(false)
    setElapsedSeconds(finalSeconds)

    // Supprimer l'état persisté
    removeTimerState(habitId, date)

    // Notifier le parent
    if (onStop) {
      onStop(finalSeconds)
    }
  }, [habitId, date, onStop])

  /**
   * Réinitialiser le chronomètre
   */
  const reset = useCallback(() => {
    startTimeRef.current = null
    accumulatedRef.current = 0
    setElapsedSeconds(0)
    setIsRunning(false)
    setHasStarted(false)
    removeTimerState(habitId, date)
  }, [habitId, date])

  return {
    elapsedSeconds,
    isRunning,
    hasStarted,
    start,
    pause,
    stop,
    reset,
  }
}

export default useStopwatch
