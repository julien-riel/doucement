import { useState } from 'react'
import Button from '../ui/Button'
import './CheckInButtons.css'

export type CheckInType = 'partial' | 'complete' | 'extra'

export interface CheckInButtonsProps {
  /** Dose cible du jour */
  targetDose: number
  /** Unité de mesure */
  unit: string
  /** Valeur actuelle (si déjà enregistrée) */
  currentValue?: number
  /** Callback quand une valeur est enregistrée */
  onCheckIn: (value: number) => void
  /** Désactiver les boutons */
  disabled?: boolean
}

/**
 * Boutons de check-in pour une habitude
 * Trois options: Un peu, Fait, Extra
 *
 * - Un peu: demande une valeur personnalisée
 * - Fait: enregistre la dose cible
 * - Extra: demande une valeur supérieure
 */
function CheckInButtons({
  targetDose,
  unit,
  currentValue,
  onCheckIn,
  disabled = false,
}: CheckInButtonsProps) {
  const [activeInput, setActiveInput] = useState<CheckInType | null>(null)
  const [inputValue, setInputValue] = useState('')

  const handlePartialClick = () => {
    setActiveInput('partial')
    setInputValue('')
  }

  const handleCompleteClick = () => {
    onCheckIn(targetDose)
    setActiveInput(null)
  }

  const handleExtraClick = () => {
    setActiveInput('extra')
    setInputValue(String(targetDose + 1))
  }

  const handleInputSubmit = () => {
    const value = parseFloat(inputValue)
    if (!isNaN(value) && value >= 0) {
      onCheckIn(value)
      setActiveInput(null)
      setInputValue('')
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputSubmit()
    } else if (e.key === 'Escape') {
      setActiveInput(null)
      setInputValue('')
    }
  }

  const hasValue = currentValue !== undefined && currentValue > 0

  // Si un input est actif, afficher le champ de saisie
  if (activeInput) {
    return (
      <div className="checkin-buttons checkin-buttons--input">
        <div className="checkin-buttons__input-row">
          <input
            type="number"
            className="checkin-buttons__input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={activeInput === 'partial' ? '0' : String(targetDose + 1)}
            min={0}
            autoFocus
            aria-label={`Entrer le nombre de ${unit}`}
          />
          <span className="checkin-buttons__unit">{unit}</span>
        </div>
        <div className="checkin-buttons__actions">
          <Button
            variant="ghost"
            onClick={() => {
              setActiveInput(null)
              setInputValue('')
            }}
            size="small"
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleInputSubmit}
            size="small"
            disabled={!inputValue || parseFloat(inputValue) < 0}
          >
            Valider
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="checkin-buttons">
      <Button
        variant={hasValue && currentValue < targetDose ? 'secondary' : 'ghost'}
        onClick={handlePartialClick}
        disabled={disabled}
        size="small"
      >
        Un peu
      </Button>
      <Button
        variant={hasValue && currentValue >= targetDose ? 'success' : 'primary'}
        onClick={handleCompleteClick}
        disabled={disabled}
      >
        {hasValue ? '✓ Fait' : 'Fait'}
      </Button>
      <Button
        variant={hasValue && currentValue > targetDose ? 'success' : 'ghost'}
        onClick={handleExtraClick}
        disabled={disabled}
        size="small"
      >
        + Extra
      </Button>
    </div>
  )
}

export default CheckInButtons
