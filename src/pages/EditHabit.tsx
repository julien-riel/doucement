/**
 * Écran Modification d'habitude
 * Formulaire de modification des propriétés d'une habitude
 */
import { useState, useCallback, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppData } from '../hooks'
import { Button, Input, Card, EmojiPicker, TimeOfDaySelector } from '../components/ui'
import {
  ProgressionMode,
  ProgressionPeriod,
  UpdateHabitInput,
  Habit,
  TrackingFrequency,
  EntryMode,
  TrackingMode,
  WeeklyAggregation,
  HabitDirection,
  TimeOfDay,
} from '../types'
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

  // Get available habits for anchor selection (exclude current habit)
  const availableAnchorHabits = useMemo(() => {
    return activeHabits.filter((h: Habit) => h.id !== id)
  }, [activeHabits, id])

  // Form state
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('💪')
  const [unit, setUnit] = useState('')
  const [direction, setDirection] = useState<HabitDirection>('increase')
  const [originalDirection, setOriginalDirection] = useState<HabitDirection>('increase')
  const [progressionMode, setProgressionMode] = useState<ProgressionMode>('percentage')
  const [progressionValue, setProgressionValue] = useState(5)
  const [progressionPeriod, setProgressionPeriod] = useState<ProgressionPeriod>('weekly')
  const [targetValue, setTargetValue] = useState<number | null>(null)
  // Implementation Intention fields
  const [trigger, setTrigger] = useState('')
  const [location, setLocation] = useState('')
  const [time, setTime] = useState('')
  // Anchor habit for habit stacking
  const [anchorHabitId, setAnchorHabitId] = useState<string | null>(null)
  // Tracking frequency
  const [trackingFrequency, setTrackingFrequency] = useState<TrackingFrequency>('daily')
  // Entry mode
  const [entryMode, setEntryMode] = useState<EntryMode>('replace')
  // Tracking mode
  const [trackingMode, setTrackingMode] = useState<TrackingMode>('detailed')
  // Identity statement
  const [identityStatement, setIdentityStatement] = useState('')
  // Description
  const [description, setDescription] = useState('')
  // Weekly aggregation
  const [weeklyAggregation, setWeeklyAggregation] = useState<WeeklyAggregation>('sum-units')
  // Moment de la journée
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Initialize form with habit data
  useEffect(() => {
    if (habit) {
      setName(habit.name)
      setEmoji(habit.emoji)
      setUnit(habit.unit)
      setDirection(habit.direction)
      setOriginalDirection(habit.direction)
      if (habit.progression) {
        setProgressionMode(habit.progression.mode)
        setProgressionValue(habit.progression.value)
        setProgressionPeriod(habit.progression.period)
      }
      setTargetValue(habit.targetValue ?? null)
      // Implementation Intention
      setTrigger(habit.implementationIntention?.trigger ?? '')
      setLocation(habit.implementationIntention?.location ?? '')
      setTime(habit.implementationIntention?.time ?? '')
      // Anchor habit
      setAnchorHabitId(habit.anchorHabitId ?? null)
      // Tracking frequency
      setTrackingFrequency(habit.trackingFrequency ?? 'daily')
      // Entry mode
      setEntryMode(habit.entryMode ?? 'replace')
      // Tracking mode
      setTrackingMode(habit.trackingMode ?? 'detailed')
      // Identity statement
      setIdentityStatement(habit.identityStatement ?? '')
      // Description
      setDescription(habit.description ?? '')
      // Weekly aggregation
      setWeeklyAggregation(habit.weeklyAggregation ?? 'sum-units')
      // Moment de la journée
      setTimeOfDay(habit.timeOfDay ?? null)
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
    const directionChanged = direction !== habit.direction
    const targetChanged = targetValue !== (habit.targetValue ?? null)

    let progressionChanged = false
    if (habit.progression && direction !== 'maintain') {
      progressionChanged =
        progressionMode !== habit.progression.mode ||
        progressionValue !== habit.progression.value ||
        progressionPeriod !== habit.progression.period
    }

    // Implementation Intention changes
    const triggerChanged = trigger.trim() !== (habit.implementationIntention?.trigger ?? '')
    const locationChanged = location.trim() !== (habit.implementationIntention?.location ?? '')
    const timeChanged = time !== (habit.implementationIntention?.time ?? '')

    // Anchor habit change
    const anchorChanged = anchorHabitId !== (habit.anchorHabitId ?? null)

    // Tracking frequency change
    const trackingFrequencyChanged = trackingFrequency !== (habit.trackingFrequency ?? 'daily')

    // Entry mode change
    const entryModeChanged = entryMode !== (habit.entryMode ?? 'replace')

    // Tracking mode change
    const trackingModeChanged = trackingMode !== (habit.trackingMode ?? 'detailed')

    // Identity statement change
    const identityStatementChanged = identityStatement.trim() !== (habit.identityStatement ?? '')

    // Description change
    const descriptionChanged = description.trim() !== (habit.description ?? '')

    // Weekly aggregation change
    const weeklyAggregationChanged = weeklyAggregation !== (habit.weeklyAggregation ?? 'sum-units')

    // Time of day change
    const timeOfDayChanged = timeOfDay !== (habit.timeOfDay ?? null)

    return (
      nameChanged ||
      emojiChanged ||
      unitChanged ||
      directionChanged ||
      targetChanged ||
      progressionChanged ||
      triggerChanged ||
      locationChanged ||
      timeChanged ||
      anchorChanged ||
      trackingFrequencyChanged ||
      entryModeChanged ||
      trackingModeChanged ||
      identityStatementChanged ||
      descriptionChanged ||
      weeklyAggregationChanged ||
      timeOfDayChanged
    )
  }, [
    habit,
    name,
    emoji,
    unit,
    direction,
    targetValue,
    progressionMode,
    progressionValue,
    progressionPeriod,
    trigger,
    location,
    time,
    anchorHabitId,
    trackingFrequency,
    entryMode,
    trackingMode,
    identityStatement,
    description,
    weeklyAggregation,
    timeOfDay,
  ])

  const handleSave = useCallback(() => {
    if (!id || !habit || !isFormValid) return

    setIsSaving(true)

    const updates: UpdateHabitInput = {
      name: name.trim(),
      emoji,
      unit: unit.trim(),
      direction,
      targetValue: targetValue ?? undefined,
    }

    // Only update progression if not maintain
    if (direction !== 'maintain') {
      updates.progression = {
        mode: progressionMode,
        value: progressionValue,
        period: progressionPeriod,
      }
    } else {
      // Si on passe en mode maintenir, on supprime la progression
      updates.progression = null
    }

    // Build Implementation Intention
    const trimmedTrigger = trigger.trim()
    const trimmedLocation = location.trim()
    if (trimmedTrigger || trimmedLocation || time) {
      updates.implementationIntention = {
        ...(trimmedTrigger && { trigger: trimmedTrigger }),
        ...(trimmedLocation && { location: trimmedLocation }),
        ...(time && { time }),
      }
    } else {
      // Clear implementation intention if all fields are empty
      updates.implementationIntention = undefined
    }

    // Anchor habit (only for non-decrease habits)
    if (direction !== 'decrease') {
      updates.anchorHabitId = anchorHabitId ?? undefined
    } else {
      // Clear anchor for decrease habits
      updates.anchorHabitId = undefined
    }

    // Tracking frequency
    updates.trackingFrequency = trackingFrequency

    // Entry mode
    updates.entryMode = entryMode

    // Tracking mode
    updates.trackingMode = trackingMode

    // Identity statement
    const trimmedIdentity = identityStatement.trim()
    updates.identityStatement = trimmedIdentity || undefined

    // Description
    const trimmedDescription = description.trim()
    updates.description = trimmedDescription || undefined

    // Weekly aggregation (only for weekly habits)
    if (trackingFrequency === 'weekly') {
      updates.weeklyAggregation = weeklyAggregation
    } else {
      updates.weeklyAggregation = undefined
    }

    // Moment de la journée
    updates.timeOfDay = timeOfDay ?? undefined

    const success = updateHabit(id, updates)

    if (success) {
      setShowSuccess(true)
      setTimeout(() => {
        navigate(`/habits/${id}`)
      }, 1000)
    } else {
      setIsSaving(false)
    }
  }, [
    id,
    habit,
    isFormValid,
    name,
    emoji,
    unit,
    direction,
    targetValue,
    progressionMode,
    progressionValue,
    progressionPeriod,
    trigger,
    location,
    time,
    anchorHabitId,
    trackingFrequency,
    entryMode,
    trackingMode,
    identityStatement,
    description,
    weeklyAggregation,
    timeOfDay,
    updateHabit,
    navigate,
  ])

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
        <EmojiPicker label="Emoji" value={emoji} onChange={setEmoji} />

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

        {/* Description (optionnel) */}
        <div className="edit-habit__description-section">
          <Input
            label="Description (optionnel)"
            placeholder="Décris cette habitude en quelques mots..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            hint="Une note personnelle pour te rappeler pourquoi cette habitude compte."
          />
        </div>

        {/* Moment de la journée */}
        <TimeOfDaySelector value={timeOfDay} onChange={setTimeOfDay} />

        {/* Type d'habitude (direction) - modifiable */}
        <div className="edit-habit__direction-section">
          <p className="edit-habit__field-label">Type d'habitude</p>
          <div className="edit-habit__direction-options">
            <button
              type="button"
              className={`edit-habit__direction-option ${direction === 'increase' ? 'edit-habit__direction-option--selected' : ''}`}
              onClick={() => setDirection('increase')}
              aria-pressed={direction === 'increase'}
            >
              <span className="edit-habit__direction-icon">📈</span>
              <span className="edit-habit__direction-label">Augmenter</span>
            </button>
            <button
              type="button"
              className={`edit-habit__direction-option ${direction === 'decrease' ? 'edit-habit__direction-option--selected' : ''}`}
              onClick={() => setDirection('decrease')}
              aria-pressed={direction === 'decrease'}
            >
              <span className="edit-habit__direction-icon">📉</span>
              <span className="edit-habit__direction-label">Réduire</span>
            </button>
            <button
              type="button"
              className={`edit-habit__direction-option ${direction === 'maintain' ? 'edit-habit__direction-option--selected' : ''}`}
              onClick={() => setDirection('maintain')}
              aria-pressed={direction === 'maintain'}
            >
              <span className="edit-habit__direction-icon">⚖️</span>
              <span className="edit-habit__direction-label">Maintenir</span>
            </button>
          </div>
          {/* Message si changement de type */}
          {direction !== originalDirection && (
            <div className="edit-habit__direction-warning">
              <p className="edit-habit__direction-warning-text">
                {direction === 'maintain'
                  ? 'En passant en mode "Maintenir", la progression sera désactivée. La dose restera fixe.'
                  : `Tu passes de "${originalDirection === 'increase' ? 'Augmenter' : originalDirection === 'decrease' ? 'Réduire' : 'Maintenir'}" à "${direction === 'increase' ? 'Augmenter' : 'Réduire'}". La progression sera adaptée.`}
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
              className={`edit-habit__frequency-option ${trackingFrequency === 'daily' ? 'edit-habit__frequency-option--selected' : ''}`}
              onClick={() => setTrackingFrequency('daily')}
              aria-pressed={trackingFrequency === 'daily'}
            >
              <span className="edit-habit__frequency-label">Quotidien</span>
              <span className="edit-habit__frequency-desc">Dose par jour</span>
            </button>
            <button
              type="button"
              className={`edit-habit__frequency-option ${trackingFrequency === 'weekly' ? 'edit-habit__frequency-option--selected' : ''}`}
              onClick={() => setTrackingFrequency('weekly')}
              aria-pressed={trackingFrequency === 'weekly'}
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
              className={`edit-habit__tracking-mode-option ${trackingMode === 'simple' ? 'edit-habit__tracking-mode-option--selected' : ''}`}
              onClick={() => setTrackingMode('simple')}
              aria-pressed={trackingMode === 'simple'}
            >
              <span className="edit-habit__tracking-mode-label">{TRACKING_MODE.simpleLabel}</span>
              <span className="edit-habit__tracking-mode-desc">
                {TRACKING_MODE.simpleDescription}
              </span>
            </button>
            <button
              type="button"
              className={`edit-habit__tracking-mode-option ${trackingMode === 'detailed' ? 'edit-habit__tracking-mode-option--selected' : ''}`}
              onClick={() => setTrackingMode('detailed')}
              aria-pressed={trackingMode === 'detailed'}
            >
              <span className="edit-habit__tracking-mode-label">{TRACKING_MODE.detailedLabel}</span>
              <span className="edit-habit__tracking-mode-desc">
                {TRACKING_MODE.detailedDescription}
              </span>
            </button>
            <button
              type="button"
              className={`edit-habit__tracking-mode-option ${trackingMode === 'counter' ? 'edit-habit__tracking-mode-option--selected' : ''}`}
              onClick={() => setTrackingMode('counter')}
              aria-pressed={trackingMode === 'counter'}
            >
              <span className="edit-habit__tracking-mode-label">{TRACKING_MODE.counterLabel}</span>
              <span className="edit-habit__tracking-mode-desc">
                {TRACKING_MODE.counterDescription}
              </span>
            </button>
          </div>
          {trackingMode === 'counter' && (
            <p className="edit-habit__tracking-mode-counter-hint">{TRACKING_MODE.counterHint}</p>
          )}
        </div>

        {/* Mode de saisie - seulement pour detailed (counter utilise toujours +1/-1) */}
        {trackingMode === 'detailed' && (
          <div className="edit-habit__entry-mode-section">
            <p className="edit-habit__field-label">{ENTRY_MODE.sectionTitle}</p>
            <p className="edit-habit__field-hint">{ENTRY_MODE.sectionHint}</p>
            <div className="edit-habit__entry-mode-options">
              <button
                type="button"
                className={`edit-habit__entry-mode-option ${entryMode === 'replace' ? 'edit-habit__entry-mode-option--selected' : ''}`}
                onClick={() => setEntryMode('replace')}
                aria-pressed={entryMode === 'replace'}
              >
                <span className="edit-habit__entry-mode-label">{ENTRY_MODE.replaceLabel}</span>
                <span className="edit-habit__entry-mode-desc">{ENTRY_MODE.replaceDescription}</span>
              </button>
              <button
                type="button"
                className={`edit-habit__entry-mode-option ${entryMode === 'cumulative' ? 'edit-habit__entry-mode-option--selected' : ''}`}
                onClick={() => setEntryMode('cumulative')}
                aria-pressed={entryMode === 'cumulative'}
              >
                <span className="edit-habit__entry-mode-label">{ENTRY_MODE.cumulativeLabel}</span>
                <span className="edit-habit__entry-mode-desc">
                  {ENTRY_MODE.cumulativeDescription}
                </span>
              </button>
            </div>
            {entryMode === 'cumulative' && (
              <p className="edit-habit__entry-mode-cumulative-hint">{ENTRY_MODE.cumulativeHint}</p>
            )}
          </div>
        )}

        {/* Mode d'agrégation hebdomadaire - seulement pour les habitudes weekly */}
        {trackingFrequency === 'weekly' && (
          <div className="edit-habit__weekly-aggregation-section">
            <p className="edit-habit__field-label">{WEEKLY_AGGREGATION.sectionTitle}</p>
            <p className="edit-habit__field-hint">{WEEKLY_AGGREGATION.sectionHint}</p>
            <div className="edit-habit__weekly-aggregation-options">
              <button
                type="button"
                className={`edit-habit__weekly-aggregation-option ${weeklyAggregation === 'count-days' ? 'edit-habit__weekly-aggregation-option--selected' : ''}`}
                onClick={() => setWeeklyAggregation('count-days')}
                aria-pressed={weeklyAggregation === 'count-days'}
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
                className={`edit-habit__weekly-aggregation-option ${weeklyAggregation === 'sum-units' ? 'edit-habit__weekly-aggregation-option--selected' : ''}`}
                onClick={() => setWeeklyAggregation('sum-units')}
                aria-pressed={weeklyAggregation === 'sum-units'}
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
        {direction !== 'maintain' && (
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
        {direction !== 'maintain' && (
          <Input
            type="number"
            label="Objectif final (optionnel)"
            placeholder="Laisser vide pour continuer indéfiniment"
            min={direction === 'increase' ? habit.startValue + 1 : 0}
            max={direction === 'decrease' ? habit.startValue - 1 : undefined}
            value={targetValue ?? ''}
            onChange={(e) => setTargetValue(e.target.value ? Number(e.target.value) : null)}
            hint={
              direction === 'increase'
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
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            hint="Quel événement déclenche cette habitude ?"
          />

          <Input
            label="Lieu"
            placeholder="Ex: Dans le salon"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            hint="Où pratiques-tu cette habitude ?"
          />

          <Input
            type="time"
            label="Heure prévue"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            hint="À quelle heure (optionnel)"
          />
        </div>

        {/* Habit Stacking - Lien avec une autre habitude (sauf pour decrease) */}
        {direction !== 'decrease' && availableAnchorHabits.length > 0 && (
          <div className="edit-habit__stacking-section">
            <p className="edit-habit__field-label">Enchaînement d'habitudes (optionnel)</p>
            <p className="edit-habit__field-hint">
              Lier cette habitude à une autre pour créer une routine.
            </p>

            <div className="input-wrapper">
              <label className="input-label">Après quelle habitude ?</label>
              <select
                className="edit-habit__select"
                value={anchorHabitId ?? ''}
                onChange={(e) => setAnchorHabitId(e.target.value || null)}
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
            value={identityStatement}
            onChange={(e) => setIdentityStatement(e.target.value)}
            hint={IDENTITY_STATEMENT.inputHelp}
          />

          {/* Suggestions d'exemples */}
          <div className="edit-habit__identity-suggestions">
            {IDENTITY_STATEMENT.exampleStatements.map((example) => (
              <button
                key={example}
                type="button"
                className={`edit-habit__identity-suggestion ${
                  identityStatement === example ? 'edit-habit__identity-suggestion--selected' : ''
                }`}
                onClick={() => setIdentityStatement(example)}
              >
                {example}
              </button>
            ))}
          </div>

          {/* Aperçu de l'identité */}
          {identityStatement && (
            <div className="edit-habit__identity-preview">
              <p className="edit-habit__identity-preview-label">Ton identité :</p>
              <p className="edit-habit__identity-preview-text">
                « Je deviens quelqu'un qui {identityStatement} »
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
