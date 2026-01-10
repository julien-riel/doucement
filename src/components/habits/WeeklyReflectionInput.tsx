import { useState } from 'react'
import { WEEKLY_REFLECTION } from '../../constants/messages'
import { Button, Card } from '../ui'
import './WeeklyReflectionInput.css'

export interface WeeklyReflectionInputProps {
  /** Callback quand la réflexion est sauvegardée */
  onSave: (text: string) => void
  /** Callback pour passer cette étape */
  onSkip: () => void
  /** Texte existant (si déjà enregistré) */
  initialValue?: string
}

/**
 * Composant d'entrée pour la réflexion hebdomadaire
 * Question: "Qu'est-ce qui a bien fonctionné cette semaine ?"
 */
function WeeklyReflectionInput({ onSave, onSkip, initialValue = '' }: WeeklyReflectionInputProps) {
  const [text, setText] = useState(initialValue)
  const [isSaved, setIsSaved] = useState(!!initialValue)

  const handleSave = () => {
    if (text.trim()) {
      onSave(text.trim())
      setIsSaved(true)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleSave()
    }
  }

  if (isSaved) {
    return (
      <Card variant="default" className="weekly-reflection weekly-reflection--saved">
        <div className="weekly-reflection__saved-indicator">
          <span className="weekly-reflection__saved-icon" aria-hidden="true">
            ✓
          </span>
          <span className="weekly-reflection__saved-text">{WEEKLY_REFLECTION.savedMessage}</span>
        </div>
        <p className="weekly-reflection__saved-content">{text}</p>
      </Card>
    )
  }

  return (
    <Card variant="highlight" className="weekly-reflection">
      <h3 className="weekly-reflection__title">{WEEKLY_REFLECTION.questionTitle}</h3>
      <p className="weekly-reflection__question">{WEEKLY_REFLECTION.mainQuestion}</p>

      <textarea
        className="weekly-reflection__textarea"
        placeholder={WEEKLY_REFLECTION.placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={3}
        aria-label={WEEKLY_REFLECTION.mainQuestion}
      />

      <div className="weekly-reflection__actions">
        <Button variant="ghost" onClick={onSkip} size="small">
          {WEEKLY_REFLECTION.skipButton}
        </Button>
        <Button variant="primary" onClick={handleSave} size="small" disabled={!text.trim()}>
          {WEEKLY_REFLECTION.saveButton}
        </Button>
      </div>
    </Card>
  )
}

export default WeeklyReflectionInput
