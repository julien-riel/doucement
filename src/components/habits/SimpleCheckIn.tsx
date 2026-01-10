import { SIMPLE_TRACKING } from '../../constants/messages'
import Button from '../ui/Button'
import './SimpleCheckIn.css'

export interface SimpleCheckInProps {
  /** Dose cible du jour */
  targetDose: number
  /** Valeur actuelle (si déjà enregistrée) */
  currentValue?: number
  /** Callback quand une valeur est enregistrée */
  onCheckIn: (value: number) => void
  /** Désactiver les boutons */
  disabled?: boolean
}

/**
 * Composant de check-in simplifié (mode binaire)
 * Deux options: "Fait" ou "Pas aujourd'hui"
 * Recommandé pour les débuts d'habitude (30 premiers jours)
 */
function SimpleCheckIn({
  targetDose,
  currentValue,
  onCheckIn,
  disabled = false,
}: SimpleCheckInProps) {
  const hasCheckedIn = currentValue !== undefined && currentValue > 0
  const isDone = hasCheckedIn && currentValue >= targetDose
  const isNotToday = hasCheckedIn && currentValue === 0

  const handleDone = () => {
    onCheckIn(targetDose)
  }

  const handleNotToday = () => {
    onCheckIn(0)
  }

  return (
    <div className="simple-checkin">
      <Button
        variant={isDone ? 'success' : 'primary'}
        onClick={handleDone}
        disabled={disabled}
        className="simple-checkin__button simple-checkin__button--done"
      >
        {isDone ? '✓ ' : ''}
        {SIMPLE_TRACKING.doneButton}
      </Button>
      <Button
        variant={isNotToday ? 'secondary' : 'ghost'}
        onClick={handleNotToday}
        disabled={disabled}
        size="small"
        className="simple-checkin__button simple-checkin__button--skip"
      >
        {SIMPLE_TRACKING.notTodayButton}
      </Button>
    </div>
  )
}

export default SimpleCheckIn
