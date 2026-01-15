import { useState, useRef, useEffect } from 'react'
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
 * Affiche d'abord un bouton "Ajouter", puis un champ de saisie
 * quand on clique dessus, pour des saisies répétées qui s'additionnent.
 */
function CumulativeCheckIn({ targetDose, unit, onAdd, disabled = false }: CumulativeCheckInProps) {
  const { t } = useTranslation()
  const [isInputVisible, setIsInputVisible] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus sur l'input quand il devient visible
  useEffect(() => {
    if (isInputVisible && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isInputVisible])

  const handleSubmit = () => {
    const value = parseFloat(inputValue)
    if (!isNaN(value) && value > 0) {
      onAdd(value)
      setInputValue('')
      setIsInputVisible(false)
    }
  }

  const handleCancel = () => {
    setInputValue('')
    setIsInputVisible(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const isValidInput = inputValue !== '' && parseFloat(inputValue) > 0

  // État initial : afficher le bouton "Ajouter"
  if (!isInputVisible) {
    return (
      <div className="cumulative-checkin">
        <Button
          variant="primary"
          onClick={() => setIsInputVisible(true)}
          disabled={disabled}
        >
          {t('checkIn.add')}
        </Button>
      </div>
    )
  }

  // État actif : afficher le champ de saisie
  return (
    <div className="cumulative-checkin cumulative-checkin--input">
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
      <div className="cumulative-checkin__actions">
        <Button variant="ghost" onClick={handleCancel} size="small">
          {t('common.cancel')}
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={disabled || !isValidInput}
          size="small"
        >
          {t('common.validate')}
        </Button>
      </div>
    </div>
  )
}

export default CumulativeCheckIn
