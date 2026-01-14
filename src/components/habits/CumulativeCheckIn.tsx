import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '../ui/Button'
import './CumulativeCheckIn.css'

export interface CumulativeCheckInProps {
  /** Dose cible du jour */
  targetDose: number
  /** Unité de mesure */
  unit: string
  /** Callback quand une valeur est ajoutée */
  onAdd: (value: number) => void
  /** Désactiver les boutons */
  disabled?: boolean
}

/**
 * Composant CumulativeCheckIn
 *
 * Interface de saisie pour les habitudes en mode cumulative.
 * Affiche un champ numérique et un bouton "Ajouter" pour
 * permettre des saisies répétées qui s'additionnent.
 */
function CumulativeCheckIn({ targetDose, unit, onAdd, disabled = false }: CumulativeCheckInProps) {
  const { t } = useTranslation()
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = () => {
    const value = parseFloat(inputValue)
    if (!isNaN(value) && value > 0) {
      onAdd(value)
      setInputValue('')
      // Focus sur l'input pour faciliter les saisies rapides
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  const isValidInput = inputValue !== '' && parseFloat(inputValue) > 0

  return (
    <div className="cumulative-checkin">
      <div className="cumulative-checkin__row">
        <input
          ref={inputRef}
          type="number"
          className="cumulative-checkin__input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={String(Math.round(targetDose / 2) || 1)}
          min={0}
          step="any"
          disabled={disabled}
          aria-label={t('checkIn.addValue', { unit })}
          role="spinbutton"
        />
        <span className="cumulative-checkin__unit">{unit}</span>
      </div>
      <Button
        variant="primary"
        onClick={handleSubmit}
        disabled={disabled || !isValidInput}
        size="small"
        className="cumulative-checkin__add"
      >
        {t('checkIn.add')}
      </Button>
    </div>
  )
}

export default CumulativeCheckIn
