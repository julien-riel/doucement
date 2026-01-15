/**
 * Écran Modification d'habitude
 * Formulaire de modification des propriétés d'une habitude
 */
import { useState, useCallback, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppData, useHabitForm } from '../hooks'
import { Button, Input, Card, EmojiPicker, TimeOfDaySelector } from '../components/ui'
import { UpdateHabitInput, Habit, HabitDirection } from '../types'
import {
  ENTRY_MODE,
  IDENTITY_STATEMENT,
  TRACKING_MODE,
  WEEKLY_AGGREGATION,
} from '../constants/messages'
import './EditHabit.css'

/**
 * Écran Modification d'habitude
 */
function EditHabit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getHabitById, updateHabit, isLoading, activeHabits } = useAppData()

  const habit = id ? getHabitById(id) : undefined

  // Use the shared form hook
  const { form, updateField, isValid, hasChanges } = useHabitForm({
    mode: 'edit',
    initialHabit: habit,
  })

  // Local state for saving and success feedback
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Track original direction for warning message
  const [originalDirection, setOriginalDirection] = useState<HabitDirection>('increase')

  // Initialize original direction when habit loads
  useEffect(() => {
    if (habit) {
      setOriginalDirection(habit.direction)
    }
  }, [habit])

  // Get available habits for anchor selection (exclude current habit)
  const availableAnchorHabits = useMemo(() => {
    return activeHabits.filter((h: Habit) => h.id !== id)
  }, [activeHabits, id])

  const handleSave = useCallback(() => {
    if (!id || !habit || !isValid) return

    setIsSaving(true)

    const updates: UpdateHabitInput = {
      name: form.name.trim(),
      emoji: form.emoji,
      unit: form.unit.trim(),
      direction: form.direction ?? habit.direction,
      targetValue: form.targetValue ?? undefined,
    }

    // Only update progression if not maintain
    if (form.direction !== 'maintain') {
      updates.progression = {
        mode: form.progressionMode,
        value: form.progressionValue,
        period: form.progressionPeriod,
      }
    } else {
      // Si on passe en mode maintenir, on supprime la progression
      updates.progression = null
    }

    // Build Implementation Intention
    const trimmedTrigger = (form.implementationIntention.trigger ?? '').trim()
    const trimmedLocation = (form.implementationIntention.location ?? '').trim()
    const intentionTime = form.implementationIntention.time ?? ''
    if (trimmedTrigger || trimmedLocation || intentionTime) {
      updates.implementationIntention = {
        ...(trimmedTrigger && { trigger: trimmedTrigger }),
        ...(trimmedLocation && { location: trimmedLocation }),
        ...(intentionTime && { time: intentionTime }),
      }
    } else {
      // Clear implementation intention if all fields are empty
      updates.implementationIntention = undefined
    }

    // Anchor habit (only for non-decrease habits)
    if (form.direction !== 'decrease') {
      updates.anchorHabitId = form.anchorHabitId ?? undefined
    } else {
      // Clear anchor for decrease habits
      updates.anchorHabitId = undefined
    }

    // Tracking frequency
    updates.trackingFrequency = form.trackingFrequency

    // Entry mode
    updates.entryMode = form.entryMode

    // Tracking mode
    updates.trackingMode = form.trackingMode

    // Identity statement
    const trimmedIdentity = form.identityStatement.trim()
    updates.identityStatement = trimmedIdentity || undefined

    // Description
    const trimmedDescription = form.description.trim()
    updates.description = trimmedDescription || undefined

    // Weekly aggregation (only for weekly habits)
    if (form.trackingFrequency === 'weekly') {
      updates.weeklyAggregation = form.weeklyAggregation
    } else {
      updates.weeklyAggregation = undefined
    }

    // Moment de la journée
    updates.timeOfDay = form.timeOfDay ?? undefined

    const success = updateHabit(id, updates)

    if (success) {
      setShowSuccess(true)
      setTimeout(() => {
        navigate(`/habits/${id}`)
      }, 1000)
    } else {
      setIsSaving(false)
    }
  }, [id, habit, isValid, form, updateHabit, navigate])

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
        <EmojiPicker
          label="Emoji"
          value={form.emoji}
          onChange={(value) => updateField('emoji', value)}
        />

        {/* Nom */}
        <Input
          label="Nom de l'habitude"
          placeholder="Ex: Push-ups, Méditation, Lecture..."
          value={form.name}
          onChange={(e) => updateField('name', e.target.value)}
        />

        {/* Unité */}
        <Input
          label="Unité"
          placeholder="répétitions, minutes..."
          value={form.unit}
          onChange={(e) => updateField('unit', e.target.value)}
        />

        {/* Description (optionnel) */}
        <div className="edit-habit__description-section">
          <Input
            label="Description (optionnel)"
            placeholder="Décris cette habitude en quelques mots..."
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            hint="Une note personnelle pour te rappeler pourquoi cette habitude compte."
          />
        </div>

        {/* Moment de la journée */}
        <TimeOfDaySelector
          value={form.timeOfDay}
          onChange={(value) => updateField('timeOfDay', value)}
        />

        {/* Type d'habitude (direction) - modifiable */}
        <div className="edit-habit__direction-section">
          <p className="edit-habit__field-label">Type d'habitude</p>
          <div className="edit-habit__direction-options">
            <button
              type="button"
              className={`edit-habit__direction-option ${form.direction === 'increase' ? 'edit-habit__direction-option--selected' : ''}`}
              onClick={() => updateField('direction', 'increase')}
              aria-pressed={form.direction === 'increase'}
            >
              <span className="edit-habit__direction-icon">📈</span>
              <span className="edit-habit__direction-label">Augmenter</span>
            </button>
            <button
              type="button"
              className={`edit-habit__direction-option ${form.direction === 'decrease' ? 'edit-habit__direction-option--selected' : ''}`}
              onClick={() => updateField('direction', 'decrease')}
              aria-pressed={form.direction === 'decrease'}
            >
              <span className="edit-habit__direction-icon">📉</span>
              <span className="edit-habit__direction-label">Réduire</span>
            </button>
            <button
              type="button"
              className={`edit-habit__direction-option ${form.direction === 'maintain' ? 'edit-habit__direction-option--selected' : ''}`}
              onClick={() => updateField('direction', 'maintain')}
              aria-pressed={form.direction === 'maintain'}
            >
              <span className="edit-habit__direction-icon">⚖️</span>
              <span className="edit-habit__direction-label">Maintenir</span>
            </button>
          </div>
          {/* Message si changement de type */}
          {form.direction !== originalDirection && (
            <div className="edit-habit__direction-warning">
              <p className="edit-habit__direction-warning-text">
                {form.direction === 'maintain'
                  ? 'En passant en mode "Maintenir", la progression sera désactivée. La dose restera fixe.'
                  : `Tu passes de "${originalDirection === 'increase' ? 'Augmenter' : originalDirection === 'decrease' ? 'Réduire' : 'Maintenir'}" à "${form.direction === 'increase' ? 'Augmenter' : 'Réduire'}". La progression sera adaptée.`}
              </p>
            </div>
          )}
        </div>

        {/* Info card - valeur de départ non modifiable */}
        <Card variant="default" className="edit-habit__info-card">
          <div className="edit-habit__info-row">
            <span className="edit-habit__info-label">Valeur de départ</span>
            <span className="edit-habit__info-value edit-habit__info-value--readonly">
              {habit.startValue} {habit.unit}
            </span>
          </div>
          <p className="edit-habit__info-note">
            Cette valeur ne peut pas être modifiée pour préserver ton historique.
          </p>
        </Card>

        {/* Fréquence de suivi */}
        <div className="edit-habit__frequency-section">
          <p className="edit-habit__field-label">Fréquence de suivi</p>
          <div className="edit-habit__frequency-options">
            <button
              type="button"
              className={`edit-habit__frequency-option ${form.trackingFrequency === 'daily' ? 'edit-habit__frequency-option--selected' : ''}`}
              onClick={() => updateField('trackingFrequency', 'daily')}
              aria-pressed={form.trackingFrequency === 'daily'}
            >
              <span className="edit-habit__frequency-label">Quotidien</span>
              <span className="edit-habit__frequency-desc">Dose par jour</span>
            </button>
            <button
              type="button"
              className={`edit-habit__frequency-option ${form.trackingFrequency === 'weekly' ? 'edit-habit__frequency-option--selected' : ''}`}
              onClick={() => updateField('trackingFrequency', 'weekly')}
              aria-pressed={form.trackingFrequency === 'weekly'}
            >
              <span className="edit-habit__frequency-label">Hebdomadaire</span>
              <span className="edit-habit__frequency-desc">X fois par semaine</span>
            </button>
          </div>
        </div>

        {/* Mode de suivi */}
        <div className="edit-habit__tracking-mode-section">
          <p className="edit-habit__field-label">{TRACKING_MODE.sectionTitle}</p>
          <p className="edit-habit__field-hint">{TRACKING_MODE.sectionHint}</p>
          <div className="edit-habit__tracking-mode-options">
            <button
              type="button"
              className={`edit-habit__tracking-mode-option ${form.trackingMode === 'simple' ? 'edit-habit__tracking-mode-option--selected' : ''}`}
              onClick={() => updateField('trackingMode', 'simple')}
              aria-pressed={form.trackingMode === 'simple'}
            >
              <span className="edit-habit__tracking-mode-label">{TRACKING_MODE.simpleLabel}</span>
              <span className="edit-habit__tracking-mode-desc">
                {TRACKING_MODE.simpleDescription}
              </span>
            </button>
            <button
              type="button"
              className={`edit-habit__tracking-mode-option ${form.trackingMode === 'detailed' ? 'edit-habit__tracking-mode-option--selected' : ''}`}
              onClick={() => updateField('trackingMode', 'detailed')}
              aria-pressed={form.trackingMode === 'detailed'}
            >
              <span className="edit-habit__tracking-mode-label">{TRACKING_MODE.detailedLabel}</span>
              <span className="edit-habit__tracking-mode-desc">
                {TRACKING_MODE.detailedDescription}
              </span>
            </button>
            <button
              type="button"
              className={`edit-habit__tracking-mode-option ${form.trackingMode === 'counter' ? 'edit-habit__tracking-mode-option--selected' : ''}`}
              onClick={() => updateField('trackingMode', 'counter')}
              aria-pressed={form.trackingMode === 'counter'}
            >
              <span className="edit-habit__tracking-mode-label">{TRACKING_MODE.counterLabel}</span>
              <span className="edit-habit__tracking-mode-desc">
                {TRACKING_MODE.counterDescription}
              </span>
            </button>
          </div>
          {form.trackingMode === 'counter' && (
            <p className="edit-habit__tracking-mode-counter-hint">{TRACKING_MODE.counterHint}</p>
          )}
        </div>

        {/* Mode de saisie - seulement pour detailed (counter utilise toujours +1/-1) */}
        {form.trackingMode === 'detailed' && (
          <div className="edit-habit__entry-mode-section">
            <p className="edit-habit__field-label">{ENTRY_MODE.sectionTitle}</p>
            <p className="edit-habit__field-hint">{ENTRY_MODE.sectionHint}</p>
            <div className="edit-habit__entry-mode-options">
              <button
                type="button"
                className={`edit-habit__entry-mode-option ${form.entryMode === 'replace' ? 'edit-habit__entry-mode-option--selected' : ''}`}
                onClick={() => updateField('entryMode', 'replace')}
                aria-pressed={form.entryMode === 'replace'}
              >
                <span className="edit-habit__entry-mode-label">{ENTRY_MODE.replaceLabel}</span>
                <span className="edit-habit__entry-mode-desc">{ENTRY_MODE.replaceDescription}</span>
              </button>
              <button
                type="button"
                className={`edit-habit__entry-mode-option ${form.entryMode === 'cumulative' ? 'edit-habit__entry-mode-option--selected' : ''}`}
                onClick={() => updateField('entryMode', 'cumulative')}
                aria-pressed={form.entryMode === 'cumulative'}
              >
                <span className="edit-habit__entry-mode-label">{ENTRY_MODE.cumulativeLabel}</span>
                <span className="edit-habit__entry-mode-desc">
                  {ENTRY_MODE.cumulativeDescription}
                </span>
              </button>
            </div>
            {form.entryMode === 'cumulative' && (
              <p className="edit-habit__entry-mode-cumulative-hint">{ENTRY_MODE.cumulativeHint}</p>
            )}
          </div>
        )}

        {/* Mode d'agrégation hebdomadaire - seulement pour les habitudes weekly */}
        {form.trackingFrequency === 'weekly' && (
          <div className="edit-habit__weekly-aggregation-section">
            <p className="edit-habit__field-label">{WEEKLY_AGGREGATION.sectionTitle}</p>
            <p className="edit-habit__field-hint">{WEEKLY_AGGREGATION.sectionHint}</p>
            <div className="edit-habit__weekly-aggregation-options">
              <button
                type="button"
                className={`edit-habit__weekly-aggregation-option ${form.weeklyAggregation === 'count-days' ? 'edit-habit__weekly-aggregation-option--selected' : ''}`}
                onClick={() => updateField('weeklyAggregation', 'count-days')}
                aria-pressed={form.weeklyAggregation === 'count-days'}
              >
                <span className="edit-habit__weekly-aggregation-label">
                  {WEEKLY_AGGREGATION.countDaysLabel}
                </span>
                <span className="edit-habit__weekly-aggregation-desc">
                  {WEEKLY_AGGREGATION.countDaysDescription}
                </span>
              </button>
              <button
                type="button"
                className={`edit-habit__weekly-aggregation-option ${form.weeklyAggregation === 'sum-units' ? 'edit-habit__weekly-aggregation-option--selected' : ''}`}
                onClick={() => updateField('weeklyAggregation', 'sum-units')}
                aria-pressed={form.weeklyAggregation === 'sum-units'}
              >
                <span className="edit-habit__weekly-aggregation-label">
                  {WEEKLY_AGGREGATION.sumUnitsLabel}
                </span>
                <span className="edit-habit__weekly-aggregation-desc">
                  {WEEKLY_AGGREGATION.sumUnitsDescription}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Progression (sauf pour maintain) */}
        {form.direction !== 'maintain' && (
          <div className="edit-habit__progression-section">
            <p className="edit-habit__field-label">Progression</p>

            {/* Mode de progression */}
            <div className="edit-habit__progression-options">
              <button
                type="button"
                className={`edit-habit__progression-option ${form.progressionMode === 'percentage' ? 'edit-habit__progression-option--selected' : ''}`}
                onClick={() => updateField('progressionMode', 'percentage')}
              >
                En %
              </button>
              <button
                type="button"
                className={`edit-habit__progression-option ${form.progressionMode === 'absolute' ? 'edit-habit__progression-option--selected' : ''}`}
                onClick={() => updateField('progressionMode', 'absolute')}
              >
                En unités
              </button>
            </div>

            {/* Valeur et période de progression */}
            <div className="edit-habit__row">
              <Input
                type="number"
                label={form.progressionMode === 'percentage' ? 'Pourcentage' : 'Unités'}
                placeholder={form.progressionMode === 'percentage' ? '5' : '1'}
                min={1}
                value={form.progressionValue || ''}
                onChange={(e) => updateField('progressionValue', Number(e.target.value))}
                hint={form.progressionMode === 'percentage' ? 'Ex: 5%' : undefined}
              />
              <div className="input-wrapper">
                <label className="input-label">Par</label>
                <div className="edit-habit__progression-options">
                  <button
                    type="button"
                    className={`edit-habit__progression-option ${form.progressionPeriod === 'weekly' ? 'edit-habit__progression-option--selected' : ''}`}
                    onClick={() => updateField('progressionPeriod', 'weekly')}
                  >
                    Semaine
                  </button>
                  <button
                    type="button"
                    className={`edit-habit__progression-option ${form.progressionPeriod === 'daily' ? 'edit-habit__progression-option--selected' : ''}`}
                    onClick={() => updateField('progressionPeriod', 'daily')}
                  >
                    Jour
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Objectif final (optionnel) */}
        {form.direction !== 'maintain' && (
          <Input
            type="number"
            label="Objectif final (optionnel)"
            placeholder="Laisser vide pour continuer indéfiniment"
            min={form.direction === 'increase' ? habit.startValue + 1 : 0}
            max={form.direction === 'decrease' ? habit.startValue - 1 : undefined}
            value={form.targetValue ?? ''}
            onChange={(e) =>
              updateField('targetValue', e.target.value ? Number(e.target.value) : null)
            }
            hint={
              form.direction === 'increase'
                ? "La dose augmentera jusqu'à atteindre cet objectif"
                : "La dose diminuera jusqu'à atteindre cet objectif"
            }
          />
        )}

        {/* Implementation Intention - Quand et Où */}
        <div className="edit-habit__intention-section">
          <p className="edit-habit__field-label">Intention de mise en œuvre (optionnel)</p>
          <p className="edit-habit__field-hint">
            Définir quand et où tu pratiques cette habitude augmente tes chances de réussite.
          </p>

          <Input
            label="Déclencheur"
            placeholder="Ex: Après mon café du matin"
            value={form.implementationIntention.trigger ?? ''}
            onChange={(e) =>
              updateField('implementationIntention', {
                ...form.implementationIntention,
                trigger: e.target.value,
              })
            }
            hint="Quel événement déclenche cette habitude ?"
          />

          <Input
            label="Lieu"
            placeholder="Ex: Dans le salon"
            value={form.implementationIntention.location ?? ''}
            onChange={(e) =>
              updateField('implementationIntention', {
                ...form.implementationIntention,
                location: e.target.value,
              })
            }
            hint="Où pratiques-tu cette habitude ?"
          />

          <Input
            type="time"
            label="Heure prévue"
            value={form.implementationIntention.time ?? ''}
            onChange={(e) =>
              updateField('implementationIntention', {
                ...form.implementationIntention,
                time: e.target.value,
              })
            }
            hint="À quelle heure (optionnel)"
          />
        </div>

        {/* Habit Stacking - Lien avec une autre habitude (sauf pour decrease) */}
        {form.direction !== 'decrease' && availableAnchorHabits.length > 0 && (
          <div className="edit-habit__stacking-section">
            <p className="edit-habit__field-label">Enchaînement d'habitudes (optionnel)</p>
            <p className="edit-habit__field-hint">
              Lier cette habitude à une autre pour créer une routine.
            </p>

            <div className="input-wrapper">
              <label className="input-label">Après quelle habitude ?</label>
              <select
                className="edit-habit__select"
                value={form.anchorHabitId ?? ''}
                onChange={(e) => updateField('anchorHabitId', e.target.value || undefined)}
              >
                <option value="">Aucune (habitude indépendante)</option>
                {availableAnchorHabits.map((h: Habit) => (
                  <option key={h.id} value={h.id}>
                    {h.emoji} {h.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Déclaration d'identité */}
        <div className="edit-habit__identity-section">
          <p className="edit-habit__field-label">{IDENTITY_STATEMENT.stepTitle}</p>
          <p className="edit-habit__field-hint">{IDENTITY_STATEMENT.stepSubtitle}</p>

          <Input
            label={IDENTITY_STATEMENT.inputLabel}
            placeholder={IDENTITY_STATEMENT.inputPlaceholder}
            value={form.identityStatement}
            onChange={(e) => updateField('identityStatement', e.target.value)}
            hint={IDENTITY_STATEMENT.inputHelp}
          />

          {/* Suggestions d'exemples */}
          <div className="edit-habit__identity-suggestions">
            {IDENTITY_STATEMENT.exampleStatements.map((example) => (
              <button
                key={example}
                type="button"
                className={`edit-habit__identity-suggestion ${
                  form.identityStatement === example
                    ? 'edit-habit__identity-suggestion--selected'
                    : ''
                }`}
                onClick={() => updateField('identityStatement', example)}
              >
                {example}
              </button>
            ))}
          </div>

          {/* Aperçu de l'identité */}
          {form.identityStatement && (
            <div className="edit-habit__identity-preview">
              <p className="edit-habit__identity-preview-label">Ton identité :</p>
              <p className="edit-habit__identity-preview-text">
                « Je deviens quelqu'un qui {form.identityStatement} »
              </p>
            </div>
          )}
        </div>
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
            disabled={!isValid || !hasChanges || isSaving}
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </footer>
    </div>
  )
}

export default EditHabit
