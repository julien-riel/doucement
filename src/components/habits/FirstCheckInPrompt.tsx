/**
 * FirstCheckInPrompt Component
 * Modal proposant le premier check-in immédiat après création d'habitude
 */

import { useState } from 'react'
import { Habit } from '../../types'
import { FIRST_CHECKIN } from '../../constants/messages'
import { Button, Input } from '../ui'
import './FirstCheckInPrompt.css'

interface FirstCheckInPromptProps {
  /** L'habitude nouvellement créée */
  habit: Habit
  /** Callback appelé avec la valeur du premier check-in (ou null si l'utilisateur refuse) */
  onResponse: (value: number | null) => void
}

/**
 * Modal affichée après la création d'une habitude
 * Propose à l'utilisateur d'enregistrer sa première dose immédiatement
 */
function FirstCheckInPrompt({ habit, onResponse }: FirstCheckInPromptProps) {
  const [showValueInput, setShowValueInput] = useState(false)
  const [value, setValue] = useState<number>(habit.startValue)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleYes = () => {
    setShowValueInput(true)
  }

  const handleNo = () => {
    onResponse(null)
  }

  const handleSubmit = () => {
    setShowSuccess(true)
    setTimeout(() => {
      onResponse(value)
    }, 1500)
  }

  // Écran de succès
  if (showSuccess) {
    return (
      <div className="first-checkin-prompt first-checkin-prompt--success">
        <div className="first-checkin-prompt__success-content">
          <span className="first-checkin-prompt__success-emoji">{FIRST_CHECKIN.successEmoji}</span>
          <h2 className="first-checkin-prompt__success-title">{FIRST_CHECKIN.successTitle}</h2>
          <p className="first-checkin-prompt__success-message">{FIRST_CHECKIN.successMessage}</p>
        </div>
      </div>
    )
  }

  // Écran de saisie de valeur
  if (showValueInput) {
    return (
      <div className="first-checkin-prompt">
        <div className="first-checkin-prompt__header">
          <span className="first-checkin-prompt__emoji">{habit.emoji}</span>
          <h2 className="first-checkin-prompt__title">{habit.name}</h2>
        </div>

        <div className="first-checkin-prompt__content">
          <p className="first-checkin-prompt__subtitle">Combien avez-vous fait aujourd'hui ?</p>

          <div className="first-checkin-prompt__input-group">
            <Input
              type="number"
              value={value || ''}
              onChange={(e) => setValue(Number(e.target.value))}
              min={0}
              placeholder={String(habit.startValue)}
            />
            <span className="first-checkin-prompt__unit">{habit.unit}</span>
          </div>

          <div className="first-checkin-prompt__quick-buttons">
            <button
              type="button"
              className="first-checkin-prompt__quick-btn"
              onClick={() => setValue(Math.round(habit.startValue * 0.5))}
            >
              Un peu ({Math.round(habit.startValue * 0.5)})
            </button>
            <button
              type="button"
              className="first-checkin-prompt__quick-btn first-checkin-prompt__quick-btn--active"
              onClick={() => setValue(habit.startValue)}
            >
              Dose complète ({habit.startValue})
            </button>
          </div>
        </div>

        <div className="first-checkin-prompt__actions">
          <Button variant="ghost" onClick={() => setShowValueInput(false)}>
            Retour
          </Button>
          <Button variant="success" onClick={handleSubmit} disabled={value <= 0}>
            Enregistrer
          </Button>
        </div>
      </div>
    )
  }

  // Écran initial de question
  return (
    <div className="first-checkin-prompt">
      <div className="first-checkin-prompt__header">
        <span className="first-checkin-prompt__emoji">{habit.emoji}</span>
        <h2 className="first-checkin-prompt__title">{FIRST_CHECKIN.title}</h2>
      </div>

      <div className="first-checkin-prompt__content">
        <p className="first-checkin-prompt__subtitle">{FIRST_CHECKIN.subtitle}</p>
      </div>

      <div className="first-checkin-prompt__actions first-checkin-prompt__actions--stacked">
        <Button variant="success" onClick={handleYes}>
          {FIRST_CHECKIN.yesButton}
        </Button>
        <Button variant="ghost" onClick={handleNo}>
          {FIRST_CHECKIN.noButton}
        </Button>
      </div>
    </div>
  )
}

export default FirstCheckInPrompt
