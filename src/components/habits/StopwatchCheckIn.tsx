/**
 * StopwatchCheckIn - Widget chronomètre pour les habitudes
 *
 * Permet de mesurer le temps passé sur une activité avec
 * boutons Play/Pause/Stop/Reset et persistance de l'état.
 */

import { useCallback, useEffect, useRef } from 'react'
import { useStopwatch } from '../../hooks/useStopwatch'
import Button from '../ui/Button'
import './StopwatchCheckIn.css'

export interface StopwatchCheckInProps {
  /** ID de l'habitude */
  habitId: string
  /** Date concernée (YYYY-MM-DD) */
  date: string
  /** Dose cible du jour (en secondes) */
  targetDose: number
  /** Unité de temps */
  unit: 'seconds' | 'minutes'
  /** Valeur déjà enregistrée aujourd'hui (en secondes) */
  currentValue?: number
  /** Callback quand l'utilisateur valide */
  onCheckIn: (value: number) => void
  /** Notifier quand la cible est atteinte */
  notifyOnTarget?: boolean
  /** Désactivé */
  disabled?: boolean
}

/**
 * Formate un nombre de secondes en format MM:SS ou HH:MM:SS
 */
function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Formate la cible en texte lisible
 */
function formatTarget(targetSeconds: number, unit: 'seconds' | 'minutes'): string {
  if (unit === 'minutes') {
    const minutes = Math.round(targetSeconds / 60)
    return `${minutes} min`
  }
  return `${targetSeconds} sec`
}

/**
 * Composant de check-in chronomètre
 *
 * @example
 * <StopwatchCheckIn
 *   habitId="habit-1"
 *   date="2026-01-15"
 *   targetDose={600} // 10 minutes en secondes
 *   unit="minutes"
 *   onCheckIn={(seconds) => handleCheckIn(seconds)}
 * />
 */
function StopwatchCheckIn({
  habitId,
  date,
  targetDose,
  unit,
  currentValue = 0,
  onCheckIn,
  notifyOnTarget = false,
  disabled = false,
}: StopwatchCheckInProps) {
  const hasNotifiedRef = useRef(false)

  const handleStop = useCallback(
    (totalSeconds: number) => {
      // Convertir en unité appropriée si nécessaire
      // Pour le moment, on stocke toujours en secondes et on laisse le parent gérer
      onCheckIn(totalSeconds)
    },
    [onCheckIn]
  )

  const { elapsedSeconds, isRunning, hasStarted, start, pause, stop, reset } = useStopwatch({
    habitId,
    date,
    initialValue: currentValue,
    onStop: handleStop,
  })

  // Notification quand la cible est atteinte
  useEffect(() => {
    if (notifyOnTarget && elapsedSeconds >= targetDose && !hasNotifiedRef.current) {
      hasNotifiedRef.current = true

      // Vibration si supportée
      if (navigator.vibrate) {
        navigator.vibrate(200)
      }
    }
  }, [elapsedSeconds, targetDose, notifyOnTarget])

  // Reset la notification quand la date change
  useEffect(() => {
    hasNotifiedRef.current = false
  }, [date])

  const progress = Math.min((elapsedSeconds / targetDose) * 100, 100)
  const isTargetReached = elapsedSeconds >= targetDose
  const isExceeded = elapsedSeconds > targetDose * 1.2

  return (
    <div className="stopwatch-checkin">
      {/* Affichage du temps */}
      <div
        className={`stopwatch-checkin__display ${isRunning ? 'stopwatch-checkin__display--running' : ''} ${isTargetReached ? 'stopwatch-checkin__display--reached' : ''}`}
      >
        <span className="stopwatch-checkin__time" aria-label="Temps écoulé">
          {formatTime(elapsedSeconds)}
        </span>
        <span className="stopwatch-checkin__target">
          Objectif : {formatTarget(targetDose, unit)}
        </span>
      </div>

      {/* Barre de progression */}
      <div
        className="stopwatch-checkin__progress"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`stopwatch-checkin__progress-bar ${isTargetReached ? 'stopwatch-checkin__progress-bar--reached' : ''} ${isExceeded ? 'stopwatch-checkin__progress-bar--exceeded' : ''}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Boutons de contrôle */}
      <div className="stopwatch-checkin__controls">
        {!isRunning ? (
          <Button
            variant="primary"
            onClick={start}
            disabled={disabled}
            aria-label={hasStarted ? 'Reprendre le chronomètre' : 'Démarrer le chronomètre'}
            className="stopwatch-checkin__btn stopwatch-checkin__btn--play"
          >
            {hasStarted ? '▶ Reprendre' : '▶ Démarrer'}
          </Button>
        ) : (
          <Button
            variant="secondary"
            onClick={pause}
            disabled={disabled}
            aria-label="Mettre en pause"
            className="stopwatch-checkin__btn stopwatch-checkin__btn--pause"
          >
            ⏸ Pause
          </Button>
        )}

        <div className="stopwatch-checkin__secondary">
          {hasStarted && (
            <>
              <Button
                variant={isTargetReached ? 'success' : 'primary'}
                onClick={stop}
                disabled={disabled}
                aria-label="Arrêter et enregistrer"
                className="stopwatch-checkin__btn stopwatch-checkin__btn--stop"
              >
                ⏹ {isTargetReached ? 'Valider ✓' : 'Valider'}
              </Button>
              <Button
                variant="ghost"
                size="small"
                onClick={reset}
                disabled={disabled}
                aria-label="Réinitialiser le chronomètre"
                className="stopwatch-checkin__btn stopwatch-checkin__btn--reset"
              >
                Réinitialiser
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Message d'encouragement */}
      {isTargetReached && (
        <div className="stopwatch-checkin__message" role="status" aria-live="polite">
          🎉 Objectif atteint !
        </div>
      )}
    </div>
  )
}

export default StopwatchCheckIn
