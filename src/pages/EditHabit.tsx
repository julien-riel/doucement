/**
 * Écran Modification d'habitude
 * Formulaire de modification des propriétés d'une habitude
 */
import { useState, useCallback, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppData } from '../hooks'
import { Button, Input, Card } from '../components/ui'
import {
  ProgressionMode,
  ProgressionPeriod,
  UpdateHabitInput,
} from '../types'
import './EditHabit.css'

/**
 * Emojis suggérés pour les habitudes
 */
const SUGGESTED_EMOJIS = [
  '💪', '🏃', '🧘', '📚', '✍️', '💧', '🥗', '😴',
  '🚭', '🍷', '📱', '🎯', '🌅', '🧠', '❤️', '🎨',
]

/**
 * Écran Modification d'habitude
 */
function EditHabit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getHabitById, updateHabit, isLoading } = useAppData()

  const habit = id ? getHabitById(id) : undefined

  // Form state
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('💪')
  const [unit, setUnit] = useState('')
  const [progressionMode, setProgressionMode] = useState<ProgressionMode>('percentage')
  const [progressionValue, setProgressionValue] = useState(5)
  const [progressionPeriod, setProgressionPeriod] = useState<ProgressionPeriod>('weekly')
  const [targetValue, setTargetValue] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Initialize form with habit data
  useEffect(() => {
    if (habit) {
      setName(habit.name)
      setEmoji(habit.emoji)
      setUnit(habit.unit)
      if (habit.progression) {
        setProgressionMode(habit.progression.mode)
        setProgressionValue(habit.progression.value)
        setProgressionPeriod(habit.progression.period)
      }
      setTargetValue(habit.targetValue ?? null)
    }
  }, [habit])

  const isFormValid = useMemo(() => {
    return name.trim().length > 0 && unit.trim().length > 0
  }, [name, unit])

  const hasChanges = useMemo(() => {
    if (!habit) return false

    const nameChanged = name.trim() !== habit.name
    const emojiChanged = emoji !== habit.emoji
    const unitChanged = unit.trim() !== habit.unit
    const targetChanged = targetValue !== (habit.targetValue ?? null)

    let progressionChanged = false
    if (habit.progression && habit.direction !== 'maintain') {
      progressionChanged =
        progressionMode !== habit.progression.mode ||
        progressionValue !== habit.progression.value ||
        progressionPeriod !== habit.progression.period
    }

    return nameChanged || emojiChanged || unitChanged || targetChanged || progressionChanged
  }, [habit, name, emoji, unit, targetValue, progressionMode, progressionValue, progressionPeriod])

  const handleSave = useCallback(() => {
    if (!id || !habit || !isFormValid) return

    setIsSaving(true)

    const updates: UpdateHabitInput = {
      name: name.trim(),
      emoji,
      unit: unit.trim(),
      targetValue: targetValue ?? undefined,
    }

    // Only update progression if not maintain
    if (habit.direction !== 'maintain') {
      updates.progression = {
        mode: progressionMode,
        value: progressionValue,
        period: progressionPeriod,
      }
    }

    const success = updateHabit(id, updates)

    if (success) {
      setShowSuccess(true)
      setTimeout(() => {
        navigate(`/habits/${id}`)
      }, 1000)
    } else {
      setIsSaving(false)
    }
  }, [id, habit, isFormValid, name, emoji, unit, targetValue, progressionMode, progressionValue, progressionPeriod, updateHabit, navigate])

  const handleCancel = useCallback(() => {
    navigate(`/habits/${id}`)
  }, [id, navigate])

  if (isLoading) {
    return (
      <div className="page page-edit-habit page-edit-habit--loading">
        <p>Chargement...</p>
      </div>
    )
  }

  if (!habit) {
    return (
      <div className="page page-edit-habit page-edit-habit--not-found">
        <p>Cette habitude n'existe pas.</p>
        <Button variant="primary" onClick={() => navigate('/habits')}>
          Retour à la liste
        </Button>
      </div>
    )
  }

  if (showSuccess) {
    return (
      <div className="page page-edit-habit page-edit-habit--success">
        <div className="edit-habit__success-message">
          <span className="edit-habit__success-icon">✓</span>
          <p>Modification enregistrée.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page page-edit-habit">
      <header className="edit-habit__header">
        <button
          type="button"
          className="edit-habit__back"
          onClick={handleCancel}
          aria-label="Annuler et retourner"
        >
          ← Annuler
        </button>
        <h1 className="edit-habit__title">Modifier l'habitude</h1>
      </header>

      <div className="edit-habit__form">
        {/* Emoji */}
        <div className="edit-habit__field">
          <span className="edit-habit__field-label">Emoji</span>
          <div className="edit-habit__emoji-grid" role="radiogroup">
            {SUGGESTED_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                className={`edit-habit__emoji-btn ${emoji === e ? 'edit-habit__emoji-btn--selected' : ''}`}
                onClick={() => setEmoji(e)}
                aria-pressed={emoji === e}
                aria-label={`Emoji ${e}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Nom */}
        <Input
          label="Nom de l'habitude"
          placeholder="Ex: Push-ups, Méditation, Lecture..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* Unité */}
        <Input
          label="Unité"
          placeholder="répétitions, minutes..."
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
        />

        {/* Info card - non modifiable */}
        <Card variant="default" className="edit-habit__info-card">
          <div className="edit-habit__info-row">
            <span className="edit-habit__info-label">Type</span>
            <span className="edit-habit__info-value edit-habit__info-value--readonly">
              {habit.direction === 'increase' && 'Augmenter'}
              {habit.direction === 'decrease' && 'Réduire'}
              {habit.direction === 'maintain' && 'Maintenir'}
            </span>
          </div>
          <div className="edit-habit__info-row">
            <span className="edit-habit__info-label">Valeur de départ</span>
            <span className="edit-habit__info-value edit-habit__info-value--readonly">
              {habit.startValue} {habit.unit}
            </span>
          </div>
          <p className="edit-habit__info-note">
            Ces valeurs ne peuvent pas être modifiées pour préserver ton historique.
          </p>
        </Card>

        {/* Progression (sauf pour maintain) */}
        {habit.direction !== 'maintain' && (
          <div className="edit-habit__progression-section">
            <p className="edit-habit__field-label">Progression</p>

            {/* Mode de progression */}
            <div className="edit-habit__progression-options">
              <button
                type="button"
                className={`edit-habit__progression-option ${progressionMode === 'percentage' ? 'edit-habit__progression-option--selected' : ''}`}
                onClick={() => setProgressionMode('percentage')}
              >
                En %
              </button>
              <button
                type="button"
                className={`edit-habit__progression-option ${progressionMode === 'absolute' ? 'edit-habit__progression-option--selected' : ''}`}
                onClick={() => setProgressionMode('absolute')}
              >
                En unités
              </button>
            </div>

            {/* Valeur et période de progression */}
            <div className="edit-habit__row">
              <Input
                type="number"
                label={progressionMode === 'percentage' ? 'Pourcentage' : 'Unités'}
                placeholder={progressionMode === 'percentage' ? '5' : '1'}
                min={1}
                value={progressionValue || ''}
                onChange={(e) => setProgressionValue(Number(e.target.value))}
                hint={progressionMode === 'percentage' ? 'Ex: 5%' : undefined}
              />
              <div className="input-wrapper">
                <label className="input-label">Par</label>
                <div className="edit-habit__progression-options">
                  <button
                    type="button"
                    className={`edit-habit__progression-option ${progressionPeriod === 'weekly' ? 'edit-habit__progression-option--selected' : ''}`}
                    onClick={() => setProgressionPeriod('weekly')}
                  >
                    Semaine
                  </button>
                  <button
                    type="button"
                    className={`edit-habit__progression-option ${progressionPeriod === 'daily' ? 'edit-habit__progression-option--selected' : ''}`}
                    onClick={() => setProgressionPeriod('daily')}
                  >
                    Jour
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Objectif final (optionnel) */}
        {habit.direction !== 'maintain' && (
          <Input
            type="number"
            label="Objectif final (optionnel)"
            placeholder="Laisser vide pour continuer indéfiniment"
            min={habit.direction === 'increase' ? habit.startValue + 1 : 0}
            max={habit.direction === 'decrease' ? habit.startValue - 1 : undefined}
            value={targetValue ?? ''}
            onChange={(e) => setTargetValue(e.target.value ? Number(e.target.value) : null)}
            hint={
              habit.direction === 'increase'
                ? 'La dose augmentera jusqu\'à atteindre cet objectif'
                : 'La dose diminuera jusqu\'à atteindre cet objectif'
            }
          />
        )}
      </div>

      {/* Footer avec boutons */}
      <footer className="edit-habit__footer">
        <div className="edit-habit__buttons">
          <Button variant="ghost" onClick={handleCancel}>
            Annuler
          </Button>
          <Button
            variant="success"
            onClick={handleSave}
            disabled={!isFormValid || !hasChanges || isSaving}
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </footer>
    </div>
  )
}

export default EditHabit
