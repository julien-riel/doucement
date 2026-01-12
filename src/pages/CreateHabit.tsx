import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../hooks'
import { Button, Input } from '../components/ui'
import {
  StepIntentions,
  HabitAnchorSelector,
  SuggestedHabitCard,
  IdentityPrompt,
  FirstCheckInPrompt,
} from '../components/habits'
import {
  randomMessage,
  HABIT_CREATED,
  IMPLEMENTATION_INTENTION,
  IDENTITY_STATEMENT,
  ENTRY_MODE,
  TRACKING_MODE,
  WEEKLY_AGGREGATION,
} from '../constants/messages'
import { calculateTargetDose } from '../services/progression'
import {
  SuggestedHabit,
  getTopPriorityHabits,
  HABIT_CATEGORIES,
  HabitCategory,
} from '../constants/suggestedHabits'
import {
  Habit,
  HabitDirection,
  ProgressionMode,
  ProgressionPeriod,
  CreateHabitInput,
  ImplementationIntention,
  TrackingFrequency,
  TrackingMode,
  EntryMode,
  WeeklyAggregation,
} from '../types'
import { getCurrentDate } from '../utils'
import './CreateHabit.css'

/**
 * Étapes du wizard
 */
type WizardStep =
  | 'choose'
  | 'type'
  | 'details'
  | 'intentions'
  | 'identity'
  | 'confirm'
  | 'first-checkin'

/**
 * Options de type d'habitude
 */
const HABIT_TYPES: {
  direction: HabitDirection
  icon: string
  title: string
  description: string
}[] = [
  {
    direction: 'increase',
    icon: '📈',
    title: 'Augmenter',
    description: 'Plus de push-ups, plus de lecture, plus de méditation...',
  },
  {
    direction: 'decrease',
    icon: '📉',
    title: 'Réduire',
    description: "Moins de cigarettes, moins de sucre, moins d'écrans...",
  },
  {
    direction: 'maintain',
    icon: '⚖️',
    title: 'Maintenir',
    description: 'Garder une dose stable chaque jour',
  },
]

/**
 * Emojis suggérés pour les habitudes
 */
const SUGGESTED_EMOJIS = [
  '💪',
  '🏃',
  '🧘',
  '📚',
  '✍️',
  '💧',
  '🥗',
  '😴',
  '🚭',
  '🍷',
  '📱',
  '🎯',
  '🌅',
  '🧠',
  '❤️',
  '🎨',
]

/**
 * État du formulaire de création
 */
interface HabitFormState {
  direction: HabitDirection | null
  name: string
  emoji: string
  unit: string
  startValue: number
  progressionMode: ProgressionMode
  progressionValue: number
  progressionPeriod: ProgressionPeriod
  targetValue: number | null
  implementationIntention: ImplementationIntention
  anchorHabitId: string | undefined
  trackingFrequency: TrackingFrequency
  trackingMode: TrackingMode
  identityStatement: string
  entryMode: EntryMode
  weeklyAggregation: WeeklyAggregation
}

const INITIAL_FORM_STATE: HabitFormState = {
  direction: null,
  name: '',
  emoji: '💪',
  unit: '',
  startValue: 1,
  progressionMode: 'percentage',
  progressionValue: 5,
  progressionPeriod: 'weekly',
  targetValue: null,
  implementationIntention: {},
  anchorHabitId: undefined,
  trackingFrequency: 'daily',
  trackingMode: 'detailed',
  identityStatement: '',
  entryMode: 'replace',
  weeklyAggregation: 'sum-units',
}

/**
 * Écran Création d'habitude
 * Wizard en 6 étapes : Choix, Type, Détails, Intentions, Identité, Confirmation
 */
function CreateHabit() {
  const [step, setStep] = useState<WizardStep>('choose')
  const [form, setForm] = useState<HabitFormState>(INITIAL_FORM_STATE)
  const [activeCategory, setActiveCategory] = useState<HabitCategory | 'all'>('all')
  const [createdHabit, setCreatedHabit] = useState<Habit | null>(null)
  const navigate = useNavigate()
  const { addHabit, addEntry, activeHabits } = useAppData()

  const suggestedHabits = useMemo(() => getTopPriorityHabits(true), [])
  const categories = useMemo(() => {
    return Object.keys(HABIT_CATEGORIES) as HabitCategory[]
  }, [])

  const filteredSuggestions = useMemo(() => {
    if (activeCategory === 'all') {
      return suggestedHabits.slice(0, 6)
    }
    return suggestedHabits.filter((h) => h.category === activeCategory)
  }, [suggestedHabits, activeCategory])

  const stepIndex = useMemo(() => {
    const steps: WizardStep[] = ['choose', 'type', 'details', 'intentions', 'identity', 'confirm']
    return steps.indexOf(step)
  }, [step])

  /**
   * Met à jour un champ du formulaire
   */
  const updateForm = useCallback(
    <K extends keyof HabitFormState>(key: K, value: HabitFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  /**
   * Sélectionne une habitude suggérée et pré-remplit le formulaire
   */
  const selectSuggestion = useCallback((habit: SuggestedHabit) => {
    setForm({
      direction: habit.direction,
      name: habit.name,
      emoji: habit.emoji,
      unit: habit.unit,
      startValue: habit.startValue,
      progressionMode: habit.progression?.mode ?? 'percentage',
      progressionValue: habit.progression?.value ?? 5,
      progressionPeriod: habit.progression?.period ?? 'weekly',
      targetValue: null,
      implementationIntention: {},
      anchorHabitId: undefined,
      trackingFrequency: habit.trackingFrequency ?? 'daily',
      trackingMode: habit.trackingMode ?? 'detailed',
      identityStatement: '',
      entryMode: 'replace',
      weeklyAggregation: 'sum-units',
    })
    setStep('intentions')
  }, [])

  /**
   * Sélectionne un type d'habitude
   */
  const selectType = useCallback(
    (direction: HabitDirection) => {
      updateForm('direction', direction)
    },
    [updateForm]
  )

  /**
   * Vérifie si l'étape actuelle est valide
   */
  const isStepValid = useMemo(() => {
    switch (step) {
      case 'choose':
        return true
      case 'type':
        return form.direction !== null
      case 'details':
        return form.name.trim().length > 0 && form.unit.trim().length > 0 && form.startValue > 0
      case 'intentions':
        return true
      case 'identity':
        return true
      case 'confirm':
        return true
      default:
        return false
    }
  }, [step, form])

  /**
   * Passe à l'étape suivante
   */
  const handleNext = useCallback(() => {
    if (!isStepValid) return

    if (step === 'choose') {
      setStep('type')
    } else if (step === 'type') {
      setStep('details')
    } else if (step === 'details') {
      setStep('intentions')
    } else if (step === 'intentions') {
      setStep('identity')
    } else if (step === 'identity') {
      setStep('confirm')
    } else if (step === 'confirm') {
      const hasIntention =
        form.implementationIntention.trigger ||
        form.implementationIntention.location ||
        form.implementationIntention.time

      const habitInput: CreateHabitInput = {
        name: form.name.trim(),
        emoji: form.emoji,
        direction: form.direction!,
        startValue: form.startValue,
        unit: form.unit.trim(),
        progression:
          form.direction === 'maintain'
            ? null
            : {
                mode: form.progressionMode,
                value: form.progressionValue,
                period: form.progressionPeriod,
              },
        targetValue: form.targetValue ?? undefined,
        implementationIntention: hasIntention ? form.implementationIntention : undefined,
        anchorHabitId: form.anchorHabitId,
        trackingFrequency: form.trackingFrequency,
        trackingMode: form.trackingMode,
        identityStatement: form.identityStatement.trim() || undefined,
        entryMode: form.entryMode,
        weeklyAggregation: form.trackingFrequency === 'weekly' ? form.weeklyAggregation : undefined,
      }

      const newHabit = addHabit(habitInput)
      if (newHabit) {
        setCreatedHabit(newHabit)
        setStep('first-checkin')
      }
    }
  }, [step, isStepValid, form, addHabit])

  /**
   * Gère la réponse au premier check-in
   * Si value est non-null, crée une entrée pour aujourd'hui
   */
  const handleFirstCheckInResponse = useCallback(
    (actualValue: number | null) => {
      if (actualValue !== null && createdHabit) {
        const today = getCurrentDate()
        const targetDose = calculateTargetDose(createdHabit, today)
        addEntry({
          habitId: createdHabit.id,
          date: today,
          targetDose,
          actualValue,
        })
      }
      navigate('/')
    },
    [createdHabit, addEntry, navigate]
  )

  /**
   * Retourne à l'étape précédente
   */
  const handleBack = useCallback(() => {
    if (step === 'type') {
      setStep('choose')
    } else if (step === 'details') {
      setStep('type')
    } else if (step === 'intentions') {
      setStep('details')
    } else if (step === 'identity') {
      setStep('intentions')
    } else if (step === 'confirm') {
      setStep('identity')
    } else {
      navigate(-1)
    }
  }, [step, navigate])

  /**
   * Génère le texte de résumé de progression
   */
  const progressionSummary = useMemo(() => {
    if (form.direction === 'maintain') {
      return `${form.startValue} ${form.unit} par jour`
    }

    const sign = form.direction === 'increase' ? '+' : '-'
    const valueStr =
      form.progressionMode === 'percentage'
        ? `${form.progressionValue}%`
        : `${form.progressionValue} ${form.unit}`
    const periodStr = form.progressionPeriod === 'daily' ? 'jour' : 'semaine'

    return `${sign}${valueStr} par ${periodStr}`
  }, [form])

  /**
   * Rendu de l'étape Choix (suggestions vs personnalisé)
   */
  const renderStepChoose = () => (
    <div className="create-habit__content step-choose">
      <div className="step-choose__section">
        <h3 className="step-choose__section-title">Habitudes à fort impact</h3>
        <p className="step-choose__section-desc">
          Basées sur la science, ces habitudes ont les plus grands bénéfices prouvés.
        </p>

        {/* Category filters */}
        <div className="step-choose__filters">
          <button
            type="button"
            className={`step-choose__filter ${activeCategory === 'all' ? 'step-choose__filter--active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            Top 6
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`step-choose__filter ${activeCategory === cat ? 'step-choose__filter--active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {HABIT_CATEGORIES[cat].emoji}
            </button>
          ))}
        </div>

        <div className="step-choose__suggestions">
          {filteredSuggestions.map((habit) => (
            <SuggestedHabitCard key={habit.id} habit={habit} onSelect={selectSuggestion} />
          ))}
        </div>
      </div>

      <div className="step-choose__divider">
        <span>ou</span>
      </div>

      <button type="button" className="step-choose__custom-btn" onClick={() => setStep('type')}>
        <span className="step-choose__custom-icon">✨</span>
        <div className="step-choose__custom-text">
          <span className="step-choose__custom-title">Créer une habitude personnalisée</span>
          <span className="step-choose__custom-desc">Définis ton propre objectif</span>
        </div>
        <span className="step-choose__custom-arrow">→</span>
      </button>
    </div>
  )

  /**
   * Rendu de l'étape Type
   */
  const renderStepType = () => (
    <div className="create-habit__content step-type">
      <div className="step-type__options">
        {HABIT_TYPES.map(({ direction, icon, title, description }) => (
          <button
            key={direction}
            type="button"
            className={`step-type__option ${form.direction === direction ? 'step-type__option--selected' : ''}`}
            onClick={() => selectType(direction)}
            aria-pressed={form.direction === direction}
          >
            <span className="step-type__option-icon" aria-hidden="true">
              {icon}
            </span>
            <div className="step-type__option-content">
              <p className="step-type__option-title">{title}</p>
              <p className="step-type__option-description">{description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )

  /**
   * Rendu de l'étape Détails
   */
  const renderStepDetails = () => (
    <div className="create-habit__content step-details">
      <div className="step-details__form">
        {/* Emoji */}
        <div className="step-details__emoji-field">
          <span className="step-details__emoji-label">Emoji</span>
          <div className="step-details__emoji-grid" role="radiogroup">
            {SUGGESTED_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={`step-details__emoji-btn ${form.emoji === emoji ? 'step-details__emoji-btn--selected' : ''}`}
                onClick={() => updateForm('emoji', emoji)}
                aria-pressed={form.emoji === emoji}
                aria-label={`Emoji ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Nom */}
        <Input
          label="Nom de l'habitude"
          placeholder="Ex: Push-ups, Méditation, Lecture..."
          value={form.name}
          onChange={(e) => updateForm('name', e.target.value)}
        />

        {/* Valeur de départ et unité */}
        <div className="step-details__row">
          <Input
            type="number"
            label="Dose de départ"
            placeholder="10"
            min={1}
            value={form.startValue || ''}
            onChange={(e) => updateForm('startValue', Number(e.target.value))}
          />
          <Input
            label="Unité"
            placeholder="répétitions, minutes..."
            value={form.unit}
            onChange={(e) => updateForm('unit', e.target.value)}
          />
        </div>

        {/* Progression (sauf pour maintain) */}
        {form.direction !== 'maintain' && (
          <div className="step-details__progression-section">
            <p className="step-details__progression-title">Progression</p>

            {/* Mode de progression */}
            <div className="step-details__progression-options">
              <button
                type="button"
                className={`step-details__progression-option ${form.progressionMode === 'percentage' ? 'step-details__progression-option--selected' : ''}`}
                onClick={() => updateForm('progressionMode', 'percentage')}
              >
                En %
              </button>
              <button
                type="button"
                className={`step-details__progression-option ${form.progressionMode === 'absolute' ? 'step-details__progression-option--selected' : ''}`}
                onClick={() => updateForm('progressionMode', 'absolute')}
              >
                En unités
              </button>
            </div>

            {/* Valeur et période de progression */}
            <div className="step-details__row">
              <Input
                type="number"
                label={form.progressionMode === 'percentage' ? 'Pourcentage' : 'Unités'}
                placeholder={form.progressionMode === 'percentage' ? '5' : '1'}
                min={1}
                value={form.progressionValue || ''}
                onChange={(e) => updateForm('progressionValue', Number(e.target.value))}
                hint={form.progressionMode === 'percentage' ? 'Ex: 5%' : undefined}
              />
              <div className="input-wrapper">
                <label className="input-label">Par</label>
                <div className="step-details__progression-options">
                  <button
                    type="button"
                    className={`step-details__progression-option ${form.progressionPeriod === 'weekly' ? 'step-details__progression-option--selected' : ''}`}
                    onClick={() => updateForm('progressionPeriod', 'weekly')}
                  >
                    Semaine
                  </button>
                  <button
                    type="button"
                    className={`step-details__progression-option ${form.progressionPeriod === 'daily' ? 'step-details__progression-option--selected' : ''}`}
                    onClick={() => updateForm('progressionPeriod', 'daily')}
                  >
                    Jour
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mode de suivi (tracking mode) */}
        <div className="step-details__tracking-mode-section">
          <p className="step-details__tracking-mode-title">{TRACKING_MODE.sectionTitle}</p>
          <p className="step-details__tracking-mode-hint">{TRACKING_MODE.sectionHint}</p>
          <div className="step-details__tracking-mode-options">
            <button
              type="button"
              className={`step-details__tracking-mode-option ${form.trackingMode === 'simple' ? 'step-details__tracking-mode-option--selected' : ''}`}
              onClick={() => updateForm('trackingMode', 'simple')}
              aria-pressed={form.trackingMode === 'simple'}
            >
              <span className="step-details__tracking-mode-label">{TRACKING_MODE.simpleLabel}</span>
              <span className="step-details__tracking-mode-desc">
                {TRACKING_MODE.simpleDescription}
              </span>
            </button>
            <button
              type="button"
              className={`step-details__tracking-mode-option ${form.trackingMode === 'detailed' ? 'step-details__tracking-mode-option--selected' : ''}`}
              onClick={() => updateForm('trackingMode', 'detailed')}
              aria-pressed={form.trackingMode === 'detailed'}
            >
              <span className="step-details__tracking-mode-label">
                {TRACKING_MODE.detailedLabel}
              </span>
              <span className="step-details__tracking-mode-desc">
                {TRACKING_MODE.detailedDescription}
              </span>
            </button>
            <button
              type="button"
              className={`step-details__tracking-mode-option ${form.trackingMode === 'counter' ? 'step-details__tracking-mode-option--selected' : ''}`}
              onClick={() => updateForm('trackingMode', 'counter')}
              aria-pressed={form.trackingMode === 'counter'}
            >
              <span className="step-details__tracking-mode-label">
                {TRACKING_MODE.counterLabel}
              </span>
              <span className="step-details__tracking-mode-desc">
                {TRACKING_MODE.counterDescription}
              </span>
            </button>
          </div>
          {form.trackingMode === 'counter' && (
            <p className="step-details__tracking-mode-counter-hint">{TRACKING_MODE.counterHint}</p>
          )}
        </div>

        {/* Mode de saisie - seulement pour detailed (counter utilise toujours +1/-1) */}
        {form.trackingMode === 'detailed' && (
          <div className="step-details__entry-mode-section">
            <p className="step-details__entry-mode-title">{ENTRY_MODE.sectionTitle}</p>
            <p className="step-details__entry-mode-hint">{ENTRY_MODE.sectionHint}</p>
            <div className="step-details__entry-mode-options">
              <button
                type="button"
                className={`step-details__entry-mode-option ${form.entryMode === 'replace' ? 'step-details__entry-mode-option--selected' : ''}`}
                onClick={() => updateForm('entryMode', 'replace')}
                aria-pressed={form.entryMode === 'replace'}
              >
                <span className="step-details__entry-mode-label">{ENTRY_MODE.replaceLabel}</span>
                <span className="step-details__entry-mode-desc">
                  {ENTRY_MODE.replaceDescription}
                </span>
              </button>
              <button
                type="button"
                className={`step-details__entry-mode-option ${form.entryMode === 'cumulative' ? 'step-details__entry-mode-option--selected' : ''}`}
                onClick={() => updateForm('entryMode', 'cumulative')}
                aria-pressed={form.entryMode === 'cumulative'}
              >
                <span className="step-details__entry-mode-label">{ENTRY_MODE.cumulativeLabel}</span>
                <span className="step-details__entry-mode-desc">
                  {ENTRY_MODE.cumulativeDescription}
                </span>
              </button>
            </div>
            {form.entryMode === 'cumulative' && (
              <p className="step-details__entry-mode-cumulative-hint">
                {ENTRY_MODE.cumulativeHint}
              </p>
            )}
          </div>
        )}

        {/* Mode d'agrégation hebdomadaire - seulement pour les habitudes weekly */}
        {form.trackingFrequency === 'weekly' && (
          <div className="step-details__weekly-aggregation-section">
            <p className="step-details__weekly-aggregation-title">
              {WEEKLY_AGGREGATION.sectionTitle}
            </p>
            <p className="step-details__weekly-aggregation-hint">
              {WEEKLY_AGGREGATION.sectionHint}
            </p>
            <div className="step-details__weekly-aggregation-options">
              <button
                type="button"
                className={`step-details__weekly-aggregation-option ${form.weeklyAggregation === 'count-days' ? 'step-details__weekly-aggregation-option--selected' : ''}`}
                onClick={() => updateForm('weeklyAggregation', 'count-days')}
                aria-pressed={form.weeklyAggregation === 'count-days'}
              >
                <span className="step-details__weekly-aggregation-label">
                  {WEEKLY_AGGREGATION.countDaysLabel}
                </span>
                <span className="step-details__weekly-aggregation-desc">
                  {WEEKLY_AGGREGATION.countDaysDescription}
                </span>
              </button>
              <button
                type="button"
                className={`step-details__weekly-aggregation-option ${form.weeklyAggregation === 'sum-units' ? 'step-details__weekly-aggregation-option--selected' : ''}`}
                onClick={() => updateForm('weeklyAggregation', 'sum-units')}
                aria-pressed={form.weeklyAggregation === 'sum-units'}
              >
                <span className="step-details__weekly-aggregation-label">
                  {WEEKLY_AGGREGATION.sumUnitsLabel}
                </span>
                <span className="step-details__weekly-aggregation-desc">
                  {WEEKLY_AGGREGATION.sumUnitsDescription}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  /**
   * Met à jour l'implementation intention
   */
  const handleIntentionChange = useCallback(
    (intention: ImplementationIntention) => {
      updateForm('implementationIntention', intention)
    },
    [updateForm]
  )

  /**
   * Met à jour l'habitude d'ancrage
   */
  const handleAnchorChange = useCallback(
    (anchorId: string | undefined) => {
      updateForm('anchorHabitId', anchorId)
    },
    [updateForm]
  )

  /**
   * Met à jour la déclaration d'identité
   */
  const handleIdentityChange = useCallback(
    (statement: string) => {
      updateForm('identityStatement', statement)
    },
    [updateForm]
  )

  /**
   * Rendu de l'étape Intentions (optionnelle)
   * Note: Le habit stacking n'est pas proposé pour les habitudes decrease
   * car l'objectif est de les faire MOINS, pas de les planifier.
   */
  const renderStepIntentions = () => (
    <div className="create-habit__content step-intentions-combined">
      <StepIntentions
        intention={form.implementationIntention}
        onIntentionChange={handleIntentionChange}
      />

      {/* Habit Stacking - uniquement pour increase et maintain */}
      {form.direction !== 'decrease' && (
        <>
          {/* Séparateur */}
          <div className="step-intentions-combined__separator">
            <span className="step-intentions-combined__separator-text">ou</span>
          </div>

          <HabitAnchorSelector
            habits={activeHabits}
            selectedAnchorId={form.anchorHabitId}
            onAnchorChange={handleAnchorChange}
          />
        </>
      )}
    </div>
  )

  /**
   * Rendu de l'étape Identité (optionnelle)
   */
  const renderStepIdentity = () => (
    <div className="create-habit__content step-identity">
      <IdentityPrompt
        identityStatement={form.identityStatement}
        onIdentityChange={handleIdentityChange}
      />
    </div>
  )

  /**
   * Rendu de l'étape Confirmation
   */
  const renderStepConfirm = () => (
    <div className="create-habit__content step-confirm">
      <div className="step-confirm__summary">
        <div className="step-confirm__header">
          <span className="step-confirm__emoji">{form.emoji}</span>
          <h3 className="step-confirm__name">{form.name}</h3>
        </div>

        <div className="step-confirm__details">
          <div className="step-confirm__detail">
            <span className="step-confirm__detail-label">Type</span>
            <span className="step-confirm__detail-value">
              {form.direction === 'increase' && 'Augmenter'}
              {form.direction === 'decrease' && 'Réduire'}
              {form.direction === 'maintain' && 'Maintenir'}
            </span>
          </div>
          <div className="step-confirm__detail">
            <span className="step-confirm__detail-label">Dose de départ</span>
            <span className="step-confirm__detail-value">
              {form.startValue} {form.unit}
            </span>
          </div>
          <div className="step-confirm__detail">
            <span className="step-confirm__detail-label">Progression</span>
            <span className="step-confirm__detail-value">{progressionSummary}</span>
          </div>
          {(form.implementationIntention.trigger || form.implementationIntention.location) && (
            <div className="step-confirm__detail">
              <span className="step-confirm__detail-label">Plan</span>
              <span className="step-confirm__detail-value step-confirm__detail-value--small">
                {form.implementationIntention.trigger && (
                  <>{form.implementationIntention.trigger}</>
                )}
                {form.implementationIntention.location && (
                  <> → {form.implementationIntention.location}</>
                )}
                {form.implementationIntention.time && <> ({form.implementationIntention.time})</>}
              </span>
            </div>
          )}
          {form.anchorHabitId && (
            <div className="step-confirm__detail">
              <span className="step-confirm__detail-label">Enchaîné après</span>
              <span className="step-confirm__detail-value step-confirm__detail-value--small">
                {(() => {
                  const anchorHabit = activeHabits.find((h) => h.id === form.anchorHabitId)
                  return anchorHabit
                    ? `${anchorHabit.emoji} ${anchorHabit.name}`
                    : 'Habitude non trouvée'
                })()}
              </span>
            </div>
          )}
          {form.identityStatement && (
            <div className="step-confirm__detail">
              <span className="step-confirm__detail-label">Identité</span>
              <span className="step-confirm__detail-value step-confirm__detail-value--small step-confirm__detail-value--identity">
                Je deviens quelqu'un qui {form.identityStatement}
              </span>
            </div>
          )}
          {form.entryMode === 'cumulative' && (
            <div className="step-confirm__detail">
              <span className="step-confirm__detail-label">Mode de saisie</span>
              <span className="step-confirm__detail-value">{ENTRY_MODE.cumulativeLabel}</span>
            </div>
          )}
        </div>
      </div>

      <div className="step-confirm__message">
        <p className="step-confirm__message-text">{randomMessage(HABIT_CREATED)}</p>
      </div>
    </div>
  )

  /**
   * Rendu de l'étape Premier Check-in
   */
  const renderStepFirstCheckIn = () => {
    if (!createdHabit) return null
    return (
      <div className="create-habit__content step-first-checkin">
        <FirstCheckInPrompt habit={createdHabit} onResponse={handleFirstCheckInResponse} />
      </div>
    )
  }

  /**
   * Rendu du contenu de l'étape courante
   */
  const renderStepContent = () => {
    switch (step) {
      case 'choose':
        return renderStepChoose()
      case 'type':
        return renderStepType()
      case 'details':
        return renderStepDetails()
      case 'intentions':
        return renderStepIntentions()
      case 'identity':
        return renderStepIdentity()
      case 'confirm':
        return renderStepConfirm()
      case 'first-checkin':
        return renderStepFirstCheckIn()
      default:
        return null
    }
  }

  /**
   * Texte du bouton principal selon l'étape
   */
  const nextButtonText = useMemo(() => {
    switch (step) {
      case 'choose':
        return 'Personnaliser'
      case 'type':
        return 'Continuer'
      case 'details':
        return 'Continuer'
      case 'intentions':
        return 'Continuer'
      case 'identity':
        return 'Aperçu'
      case 'confirm':
        return "Créer l'habitude"
      default:
        return 'Continuer'
    }
  }, [step])

  /**
   * Sous-titre selon l'étape
   */
  const getSubtitle = () => {
    switch (step) {
      case 'choose':
        return 'Choisis une habitude à fort impact ou crée la tienne'
      case 'type':
        return "Quel type d'habitude souhaitez-vous créer ?"
      case 'details':
        return 'Décrivez votre habitude'
      case 'intentions':
        return IMPLEMENTATION_INTENTION.stepTitle
      case 'identity':
        return IDENTITY_STATEMENT.stepTitle
      case 'confirm':
        return 'Vérifiez et confirmez'
      default:
        return ''
    }
  }

  // L'étape first-checkin a un affichage simplifié (pas de header ni footer)
  if (step === 'first-checkin') {
    return (
      <div className="page page-create-habit page-create-habit--first-checkin">
        {renderStepFirstCheckIn()}
      </div>
    )
  }

  return (
    <div className="page page-create-habit">
      <header className="create-habit__header">
        <h1 className="create-habit__title">Nouvelle habitude</h1>
        <p className="create-habit__subtitle">{getSubtitle()}</p>
      </header>

      {/* Indicateur de progression (caché pour l'étape choose) */}
      {step !== 'choose' && (
        <div className="create-habit__progress" aria-label="Progression du wizard">
          {[1, 2, 3, 4, 5].map((i) => {
            const adjustedIndex = stepIndex - 1
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                <div
                  className={`create-habit__step-indicator ${
                    i - 1 < adjustedIndex
                      ? 'create-habit__step-indicator--completed'
                      : i - 1 === adjustedIndex
                        ? 'create-habit__step-indicator--active'
                        : 'create-habit__step-indicator--pending'
                  }`}
                  aria-current={i - 1 === adjustedIndex ? 'step' : undefined}
                >
                  {i - 1 < adjustedIndex ? '✓' : i}
                </div>
                {i < 5 && (
                  <div
                    className={`create-habit__step-line ${i - 1 < adjustedIndex ? 'create-habit__step-line--completed' : ''}`}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Contenu de l'étape */}
      {renderStepContent()}

      {/* Footer avec boutons (caché pour l'étape choose car navigation intégrée) */}
      {step !== 'choose' && (
        <footer className="create-habit__footer">
          <div className="create-habit__buttons">
            <Button variant="ghost" onClick={handleBack}>
              {step === 'type' ? 'Retour' : 'Retour'}
            </Button>
            <Button
              variant={step === 'confirm' ? 'success' : 'primary'}
              onClick={handleNext}
              disabled={!isStepValid}
            >
              {nextButtonText}
            </Button>
          </div>
        </footer>
      )}
    </div>
  )
}

export default CreateHabit
