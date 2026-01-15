/**
 * TimerCheckIn - Widget minuterie pour les habitudes
 *
 * Compte à rebours avec possibilité de dépassement (temps négatif).
 * Le temps enregistré est le temps total écoulé, pas le temps restant.
 */

import { useCallback, useEffect, useRef } from 'react'
import { useTimer } from '../../hooks/useTimer'
import Button from '../ui/Button'
import './TimerCheckIn.css'

export interface TimerCheckInProps {
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
 * Pour les valeurs négatives, affiche avec un signe moins (-00:15)
 */
function formatTime(totalSeconds: number): string {
  const isNegative = totalSeconds < 0
  const absSeconds = Math.abs(totalSeconds)

  const hours = Math.floor(absSeconds / 3600)
  const minutes = Math.floor((absSeconds % 3600) / 60)
  const seconds = absSeconds % 60

  const sign = isNegative ? '-' : ''

  if (hours > 0) {
    return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${sign}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
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
 * Composant de check-in minuterie (compte à rebours)
 *
 * @example
 * <TimerCheckIn
 *   habitId="habit-1"
 *   date="2026-01-15"
 *   targetDose={120} // 2 minutes en secondes
 *   unit="minutes"
 *   onCheckIn={(seconds) => handleCheckIn(seconds)}
 * />
 */
function TimerCheckIn({
  habitId,
  date,
  targetDose,
  unit,
  currentValue = 0,
  onCheckIn,
  notifyOnTarget = false,
  disabled = false,
}: TimerCheckInProps) {
  const hasNotifiedRef = useRef(false)

  const handleStop = useCallback(
    (totalSeconds: number) => {
      // On enregistre le temps total écoulé, pas le temps restant
      onCheckIn(totalSeconds)
    },
    [onCheckIn]
  )

  const {
    elapsedSeconds,
    remainingSeconds,
    isRunning,
    hasStarted,
    isTargetReached,
    start,
    pause,
    stop,
    reset,
  } = useTimer({
    habitId,
    date,
    targetSeconds: targetDose,
    initialValue: currentValue,
    onStop: handleStop,
  })

  // Notification quand la cible est atteinte
  useEffect(() => {
    if (notifyOnTarget && isTargetReached && !hasNotifiedRef.current) {
      hasNotifiedRef.current = true

      // Vibration si supportée
      if (navigator.vibrate) {
        navigator.vibrate(200)
      }

      // Son discret optionnel via Web Audio API
      try {
        const audioContext = new (
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        )()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        // Son doux et court (ding)
        oscillator.frequency.value = 880 // Note A5
        oscillator.type = 'sine'
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
      } catch {
        // Audio API not available, fail silently
      }
    }
  }, [isTargetReached, notifyOnTarget])

  // Reset la notification quand la date change
  useEffect(() => {
    hasNotifiedRef.current = false
  }, [date])

  const progress = Math.min((elapsedSeconds / targetDose) * 100, 100)
  const isOvertime = remainingSeconds < 0

  return (
    <div className="timer-checkin">
      {/* Affichage du temps restant */}
      <div
        className={`timer-checkin__display ${isRunning ? 'timer-checkin__display--running' : ''} ${isTargetReached ? 'timer-checkin__display--reached' : ''} ${isOvertime ? 'timer-checkin__display--overtime' : ''}`}
      >
        <span
          className={`timer-checkin__time ${isOvertime ? 'timer-checkin__time--overtime' : ''}`}
          aria-label={isOvertime ? 'Temps de dépassement' : 'Temps restant'}
        >
          {formatTime(remainingSeconds)}
        </span>
        <span className="timer-checkin__target">
          Durée cible : {formatTarget(targetDose, unit)}
        </span>
        {isOvertime && (
          <span className="timer-checkin__overtime-label" role="status" aria-live="polite">
            Dépassement de {formatTime(-remainingSeconds)}
          </span>
        )}
      </div>

      {/* Barre de progression */}
      <div
        className="timer-checkin__progress"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`timer-checkin__progress-bar ${isTargetReached ? 'timer-checkin__progress-bar--reached' : ''}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Boutons de contrôle */}
      <div className="timer-checkin__controls">
        {!isRunning ? (
          <Button
            variant="primary"
            onClick={start}
            disabled={disabled}
            aria-label={hasStarted ? 'Reprendre la minuterie' : 'Démarrer la minuterie'}
            className="timer-checkin__btn timer-checkin__btn--play"
          >
            {hasStarted ? '▶ Reprendre' : '▶ Démarrer'}
          </Button>
        ) : (
          <Button
            variant="secondary"
            onClick={pause}
            disabled={disabled}
            aria-label="Mettre en pause"
            className="timer-checkin__btn timer-checkin__btn--pause"
          >
            ⏸ Pause
          </Button>
        )}

        <div className="timer-checkin__secondary">
          {hasStarted && (
            <>
              <Button
                variant={isTargetReached ? 'success' : 'primary'}
                onClick={stop}
                disabled={disabled}
                aria-label="Arrêter et enregistrer"
                className="timer-checkin__btn timer-checkin__btn--stop"
              >
                ⏹ {isTargetReached ? 'Valider ✓' : 'Valider'}
              </Button>
              <Button
                variant="ghost"
                size="small"
                onClick={reset}
                disabled={disabled}
                aria-label="Réinitialiser la minuterie"
                className="timer-checkin__btn timer-checkin__btn--reset"
              >
                Réinitialiser
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Message d'encouragement */}
      {isTargetReached && !isOvertime && (
        <div className="timer-checkin__message" role="status" aria-live="polite">
          🎉 Objectif atteint !
        </div>
      )}
      {isOvertime && (
        <div
          className="timer-checkin__message timer-checkin__message--overtime"
          role="status"
          aria-live="polite"
        >
          🔥 Tu dépasses l'objectif !
        </div>
      )}
    </div>
  )
}

export default TimerCheckIn
