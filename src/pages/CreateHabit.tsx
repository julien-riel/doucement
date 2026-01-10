import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../hooks'
import { Button, Input } from '../components/ui'
import { StepIntentions, HabitAnchorSelector } from '../components/habits'
import {
  randomMessage,
  HABIT_CREATED,
  IMPLEMENTATION_INTENTION,
} from '../constants/messages'
import {
  HabitDirection,
  ProgressionMode,
  ProgressionPeriod,
  CreateHabitInput,
  ImplementationIntention,
} from '../types'
import './CreateHabit.css'

/**
 * Étapes du wizard
 */
type WizardStep = 'type' | 'details' | 'intentions' | 'confirm'

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
  '💪', '🏃', '🧘', '📚', '✍️', '💧', '🥗', '😴',
  '🚭', '🍷', '📱', '🎯', '🌅', '🧠', '❤️', '🎨',
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
}

/**
 * Écran Création d'habitude
 * Wizard en 4 étapes : Type, Détails, Intentions, Confirmation
 */
function CreateHabit() {
  const [step, setStep] = useState<WizardStep>('type')
  const [form, setForm] = useState<HabitFormState>(INITIAL_FORM_STATE)
  const navigate = useNavigate()
  const { addHabit, activeHabits } = useAppData()

  const stepIndex = useMemo(() => {
    const steps: WizardStep[] = ['type', 'details', 'intentions', 'confirm']
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
      case 'type':
        return form.direction !== null
      case 'details':
        return (
          form.name.trim().length > 0 &&
          form.unit.trim().length > 0 &&
          form.startValue > 0
        )
      case 'intentions':
        // Étape optionnelle, toujours valide
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

    if (step === 'type') {
      setStep('details')
    } else if (step === 'details') {
      setStep('intentions')
    } else if (step === 'intentions') {
      setStep('confirm')
    } else if (step === 'confirm') {
      // Créer l'habitude
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
        implementationIntention: hasIntention
          ? form.implementationIntention
          : undefined,
        anchorHabitId: form.anchorHabitId,
      }

      const newHabit = addHabit(habitInput)
      if (newHabit) {
        navigate('/')
      }
    }
  }, [step, isStepValid, form, addHabit, navigate])

  /**
   * Retourne à l'étape précédente
   */
  const handleBack = useCallback(() => {
    if (step === 'details') {
      setStep('type')
    } else if (step === 'intentions') {
      setStep('details')
    } else if (step === 'confirm') {
      setStep('intentions')
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
                label={
                  form.progressionMode === 'percentage'
                    ? 'Pourcentage'
                    : 'Unités'
                }
                placeholder={form.progressionMode === 'percentage' ? '5' : '1'}
                min={1}
                value={form.progressionValue || ''}
                onChange={(e) =>
                  updateForm('progressionValue', Number(e.target.value))
                }
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
   * Rendu de l'étape Intentions (optionnelle)
   */
  const renderStepIntentions = () => (
    <div className="create-habit__content step-intentions-combined">
      <StepIntentions
        intention={form.implementationIntention}
        onIntentionChange={handleIntentionChange}
      />

      {/* Séparateur */}
      <div className="step-intentions-combined__separator">
        <span className="step-intentions-combined__separator-text">ou</span>
      </div>

      {/* Habit Stacking */}
      <HabitAnchorSelector
        habits={activeHabits}
        selectedAnchorId={form.anchorHabitId}
        onAnchorChange={handleAnchorChange}
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
            <span className="step-confirm__detail-value">
              {progressionSummary}
            </span>
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
                {form.implementationIntention.time && (
                  <> ({form.implementationIntention.time})</>
                )}
              </span>
            </div>
          )}
          {form.anchorHabitId && (
            <div className="step-confirm__detail">
              <span className="step-confirm__detail-label">Enchaîné après</span>
              <span className="step-confirm__detail-value step-confirm__detail-value--small">
                {(() => {
                  const anchorHabit = activeHabits.find(h => h.id === form.anchorHabitId)
                  return anchorHabit
                    ? `${anchorHabit.emoji} ${anchorHabit.name}`
                    : 'Habitude non trouvée'
                })()}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="step-confirm__message">
        <p className="step-confirm__message-text">
          {randomMessage(HABIT_CREATED)}
        </p>
      </div>
    </div>
  )

  /**
   * Rendu du contenu de l'étape courante
   */
  const renderStepContent = () => {
    switch (step) {
      case 'type':
        return renderStepType()
      case 'details':
        return renderStepDetails()
      case 'intentions':
        return renderStepIntentions()
      case 'confirm':
        return renderStepConfirm()
      default:
        return null
    }
  }

  /**
   * Texte du bouton principal selon l'étape
   */
  const nextButtonText = useMemo(() => {
    switch (step) {
      case 'type':
        return 'Continuer'
      case 'details':
        return 'Continuer'
      case 'intentions':
        return 'Aperçu'
      case 'confirm':
        return "Créer l'habitude"
      default:
        return 'Continuer'
    }
  }, [step])

  return (
    <div className="page page-create-habit">
      <header className="create-habit__header">
        <h1 className="create-habit__title">Nouvelle habitude</h1>
        <p className="create-habit__subtitle">
          {step === 'type' && "Quel type d'habitude souhaitez-vous créer ?"}
          {step === 'details' && 'Décrivez votre habitude'}
          {step === 'intentions' && IMPLEMENTATION_INTENTION.stepTitle}
          {step === 'confirm' && 'Vérifiez et confirmez'}
        </p>
      </header>

      {/* Indicateur de progression */}
      <div className="create-habit__progress" aria-label="Progression du wizard">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div
              className={`create-habit__step-indicator ${
                i < stepIndex
                  ? 'create-habit__step-indicator--completed'
                  : i === stepIndex
                    ? 'create-habit__step-indicator--active'
                    : 'create-habit__step-indicator--pending'
              }`}
              aria-current={i === stepIndex ? 'step' : undefined}
            >
              {i < stepIndex ? '✓' : i + 1}
            </div>
            {i < 3 && (
              <div
                className={`create-habit__step-line ${i < stepIndex ? 'create-habit__step-line--completed' : ''}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Contenu de l'étape */}
      {renderStepContent()}

      {/* Footer avec boutons */}
      <footer className="create-habit__footer">
        <div className="create-habit__buttons">
          <Button variant="ghost" onClick={handleBack}>
            {step === 'type' ? 'Annuler' : 'Retour'}
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
    </div>
  )
}

export default CreateHabit
