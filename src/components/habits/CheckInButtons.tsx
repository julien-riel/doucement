import { useState } from 'react'
import { HabitDirection } from '../../types'
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
  /** Direction de l'habitude (pour adapter les labels) */
  direction?: HabitDirection
}

/**
 * Labels des boutons selon la direction de l'habitude
 */
function getButtonLabels(direction?: HabitDirection) {
  if (direction === 'decrease') {
    // Pour réduction: "Un peu plus" = pas bien, "Moins" = bien
    return {
      partial: 'Un peu +',      // J'en ai fait un peu plus que la dose
      complete: 'Pile poil',    // J'ai fait exactement la dose
      extra: 'Moins',           // J'ai fait moins que la dose (bien !)
    };
  }
  // Pour augmentation/maintien
  return {
    partial: 'Un peu',          // J'en ai fait un peu
    complete: 'Fait !',         // J'ai fait la dose
    extra: 'Encore +',          // J'en ai fait plus
  };
}

/**
 * Boutons de check-in pour une habitude
 * Trois options adaptées à la direction de l'habitude:
 *
 * Augmentation:
 * - Un peu: demande une valeur personnalisée (moins que la dose)
 * - Fait: enregistre la dose cible
 * - Encore +: demande une valeur supérieure
 *
 * Réduction:
 * - Un peu +: demande une valeur personnalisée (plus que la dose)
 * - Pile poil: enregistre la dose cible
 * - Moins: demande une valeur inférieure (mieux !)
 */
function CheckInButtons({
  targetDose,
  unit,
  currentValue,
  onCheckIn,
  disabled = false,
  direction,
}: CheckInButtonsProps) {
  const [activeInput, setActiveInput] = useState<CheckInType | null>(null)
  const [inputValue, setInputValue] = useState('')
  const labels = getButtonLabels(direction)

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
    // Pour réduction: suggérer moins que la dose (mieux !)
    // Pour augmentation: suggérer plus que la dose
    const suggestedValue = direction === 'decrease'
      ? Math.max(0, targetDose - 1)
      : targetDose + 1
    setInputValue(String(suggestedValue))
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

  // Détermine si c'est un "bon" résultat pour les indicateurs visuels
  const isGoodResult = direction === 'decrease'
    ? hasValue && currentValue <= targetDose  // Pour réduction: moins ou égal = bien
    : hasValue && currentValue >= targetDose  // Pour augmentation: plus ou égal = bien

  const isExtraGood = direction === 'decrease'
    ? hasValue && currentValue < targetDose   // Pour réduction: moins que la cible = super
    : hasValue && currentValue > targetDose   // Pour augmentation: plus que la cible = super

  return (
    <div className="checkin-buttons">
      <Button
        variant={hasValue && !isGoodResult ? 'secondary' : 'ghost'}
        onClick={handlePartialClick}
        disabled={disabled}
        size="small"
      >
        {labels.partial}
      </Button>
      <Button
        variant={isGoodResult ? 'success' : 'primary'}
        onClick={handleCompleteClick}
        disabled={disabled}
      >
        {hasValue ? `✓ ${labels.complete}` : labels.complete}
      </Button>
      <Button
        variant={isExtraGood ? 'success' : 'ghost'}
        onClick={handleExtraClick}
        disabled={disabled}
        size="small"
      >
        {labels.extra}
      </Button>
    </div>
  )
}

export default CheckInButtons
