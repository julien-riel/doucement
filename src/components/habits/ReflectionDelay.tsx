import { useState, useEffect, useCallback } from 'react'
import { INTENTIONAL_FRICTION } from '../../constants/messages'
import Button from '../ui/Button'
import './ReflectionDelay.css'

export interface ReflectionDelayProps {
  /** Durée du délai en secondes (par défaut 5) */
  delaySeconds?: number
  /** Callback quand le délai est terminé et l'utilisateur veut continuer */
  onContinue: () => void
  /** Callback pour annuler */
  onCancel: () => void
}

/**
 * Composant de friction intentionnelle
 * Affiche un délai de réflexion de quelques secondes avant de permettre le check-in
 * Utilisé pour les habitudes à réduire (direction: 'decrease')
 */
function ReflectionDelay({
  delaySeconds = 5,
  onContinue,
  onCancel,
}: ReflectionDelayProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(delaySeconds)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (secondsRemaining <= 0) {
      setIsComplete(true)
      return
    }

    const timer = setTimeout(() => {
      setSecondsRemaining((s) => s - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [secondsRemaining])

  const handleContinue = useCallback(() => {
    if (isComplete) {
      onContinue()
    }
  }, [isComplete, onContinue])

  // Calculate progress percentage for the visual indicator
  const progressPercent = ((delaySeconds - secondsRemaining) / delaySeconds) * 100

  return (
    <div className="reflection-delay">
      <div className="reflection-delay__content">
        <h3 className="reflection-delay__title">
          {INTENTIONAL_FRICTION.delayTitle}
        </h3>
        <p className="reflection-delay__message">
          {INTENTIONAL_FRICTION.delayMessage}
        </p>

        {/* Visual timer */}
        <div className="reflection-delay__timer">
          <div
            className="reflection-delay__timer-progress"
            style={{ width: `${progressPercent}%` }}
            aria-hidden="true"
          />
          <span className="reflection-delay__timer-text" aria-live="polite">
            {isComplete ? '...' : `${secondsRemaining}s`}
          </span>
        </div>
      </div>

      <div className="reflection-delay__actions">
        <Button
          variant="ghost"
          onClick={onCancel}
          size="small"
        >
          Annuler
        </Button>
        <Button
          variant={isComplete ? 'primary' : 'secondary'}
          onClick={handleContinue}
          disabled={!isComplete}
        >
          {INTENTIONAL_FRICTION.continueAnyway}
        </Button>
      </div>
    </div>
  )
}

export default ReflectionDelay
