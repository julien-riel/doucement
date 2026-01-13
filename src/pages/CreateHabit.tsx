import { useState, useCallback, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppData } from '../hooks'
import { Button, Input, EmojiPicker, HabitCarousel, TimeOfDaySelector } from '../components/ui'
import {
  StepIntentions,
  HabitAnchorSelector,
  SuggestedHabitCard,
  IdentityPrompt,
  FirstCheckInPrompt,
} from '../components/habits'
import { randomMessage } from '../constants/messages'
import { calculateTargetDose } from '../services/progression'
import {
  SuggestedHabit,
  getTopPriorityHabits,
  HABIT_CATEGORIES,
  HabitCategory,
  CATEGORY_EMOJIS,
} from '../constants/suggestedHabits'
import {
  Habit,
  HabitDirection,
  HabitDifficulty,
  ProgressionMode,
  ProgressionPeriod,
  CreateHabitInput,
  ImplementationIntention,
  TrackingFrequency,
  TrackingMode,
  EntryMode,
  WeeklyAggregation,
  TimeOfDay,
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
 * Options de type d'habitude (icônes seulement, labels via i18n)
 */
const HABIT_TYPE_ICONS: Record<HabitDirection, string> = {
  increase: '📈',
  decrease: '📉',
  maintain: '⚖️',
}

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
  timeOfDay: TimeOfDay | null
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
  timeOfDay: null,
}

/**
 * Écran Création d'habitude
 * Wizard en 6 étapes : Choix, Type, Détails, Intentions, Identité, Confirmation
 */
function CreateHabit() {
  const { t } = useTranslation()
  const [step, setStep] = useState<WizardStep>('choose')
  const [form, setForm] = useState<HabitFormState>(INITIAL_FORM_STATE)
  const [activeCategory, setActiveCategory] = useState<HabitCategory | 'all'>('all')
  const [activeDifficulty, setActiveDifficulty] = useState<HabitDifficulty | 'all'>('all')
  const [activeTimeOfDay, setActiveTimeOfDay] = useState<TimeOfDay | 'all'>('all')
  const [selectedCategory, setSelectedCategory] = useState<HabitCategory | null>(null)
  const [createdHabit, setCreatedHabit] = useState<Habit | null>(null)
  const navigate = useNavigate()
  const { addHabit, addEntry, activeHabits } = useAppData()

  const suggestedHabits = useMemo(() => getTopPriorityHabits(true), [])
  const categories = useMemo(() => {
    return Object.keys(HABIT_CATEGORIES) as HabitCategory[]
  }, [])

  const filteredSuggestions = useMemo(() => {
    let filtered = suggestedHabits

    // Filter by category
    if (activeCategory === 'all') {
      filtered = filtered.slice(0, 6)
    } else {
      filtered = filtered.filter((h) => h.category === activeCategory)
    }

    // Filter by difficulty
    if (activeDifficulty !== 'all') {
      filtered = filtered.filter((h) => h.difficulty === activeDifficulty)
    }

    // Filter by time of day
    if (activeTimeOfDay !== 'all') {
      filtered = filtered.filter((h) => h.timeOfDay === activeTimeOfDay)
    }

    return filtered
  }, [suggestedHabits, activeCategory, activeDifficulty, activeTimeOfDay])

  const stepIndex = useMemo(() => {
    const steps: WizardStep[] = ['choose', 'type', 'details', 'intentions', 'identity', 'confirm']
    return steps.indexOf(step)
  }, [step])

  // Scroll au top à chaque changement d'étape
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
      timeOfDay: habit.timeOfDay ?? null,
    })
    setSelectedCategory(habit.category)
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
        timeOfDay: form.timeOfDay ?? undefined,
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
      return `${form.startValue} ${form.unit} ${t('createHabit.form.per')} ${t('createHabit.form.day').toLowerCase()}`
    }

    const sign = form.direction === 'increase' ? '+' : '-'
    const valueStr =
      form.progressionMode === 'percentage'
        ? `${form.progressionValue}%`
        : `${form.progressionValue} ${form.unit}`
    const periodStr =
      form.progressionPeriod === 'daily'
        ? t('createHabit.form.day').toLowerCase()
        : t('createHabit.form.week').toLowerCase()

    return `${sign}${valueStr} ${t('createHabit.form.per')} ${periodStr}`
  }, [form, t])

  /**
   * Rendu de l'étape Choix (suggestions vs personnalisé)
   */
  const renderStepChoose = () => (
    <div className="create-habit__content step-choose">
      <div className="step-choose__section">
        <h3 className="step-choose__section-title">{t('createHabit.highImpact.title')}</h3>
        <p className="step-choose__section-desc">{t('createHabit.highImpact.description')}</p>

        {/* Category filters */}
        <div className="step-choose__filters">
          <button
            type="button"
            className={`step-choose__filter ${activeCategory === 'all' ? 'step-choose__filter--active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            {t('createHabit.top6')}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`step-choose__filter ${activeCategory === cat ? 'step-choose__filter--active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              <span className="step-choose__filter-emoji">{HABIT_CATEGORIES[cat].emoji}</span>
              <span className="step-choose__filter-name">{HABIT_CATEGORIES[cat].name}</span>
            </button>
          ))}
        </div>

        {/* Difficulty filters */}
        <div className="step-choose__filters step-choose__filters--secondary">
          <button
            type="button"
            className={`step-choose__filter ${activeDifficulty === 'all' ? 'step-choose__filter--active' : ''}`}
            onClick={() => setActiveDifficulty('all')}
          >
            {t('habits.difficulty.all')}
          </button>
          <button
            type="button"
            className={`step-choose__filter ${activeDifficulty === 'easy' ? 'step-choose__filter--active' : ''}`}
            onClick={() => setActiveDifficulty('easy')}
          >
            {t('habits.difficulty.easy')}
          </button>
          <button
            type="button"
            className={`step-choose__filter ${activeDifficulty === 'moderate' ? 'step-choose__filter--active' : ''}`}
            onClick={() => setActiveDifficulty('moderate')}
          >
            {t('habits.difficulty.moderate')}
          </button>
          <button
            type="button"
            className={`step-choose__filter ${activeDifficulty === 'challenging' ? 'step-choose__filter--active' : ''}`}
            onClick={() => setActiveDifficulty('challenging')}
          >
            {t('habits.difficulty.challenging')}
          </button>
        </div>

        {/* Time of day filters */}
        <div className="step-choose__filters step-choose__filters--secondary">
          <button
            type="button"
            className={`step-choose__filter ${activeTimeOfDay === 'all' ? 'step-choose__filter--active' : ''}`}
            onClick={() => setActiveTimeOfDay('all')}
          >
            {t('habits.timeOfDay.all')}
          </button>
          <button
            type="button"
            className={`step-choose__filter ${activeTimeOfDay === 'morning' ? 'step-choose__filter--active' : ''}`}
            onClick={() => setActiveTimeOfDay('morning')}
          >
            <span className="step-choose__filter-emoji">{t('habits.timeOfDayEmojis.morning')}</span>
            <span className="step-choose__filter-name">{t('habits.timeOfDay.morning')}</span>
          </button>
          <button
            type="button"
            className={`step-choose__filter ${activeTimeOfDay === 'afternoon' ? 'step-choose__filter--active' : ''}`}
            onClick={() => setActiveTimeOfDay('afternoon')}
          >
            <span className="step-choose__filter-emoji">
              {t('habits.timeOfDayEmojis.afternoon')}
            </span>
            <span className="step-choose__filter-name">{t('habits.timeOfDay.afternoon')}</span>
          </button>
          <button
            type="button"
            className={`step-choose__filter ${activeTimeOfDay === 'evening' ? 'step-choose__filter--active' : ''}`}
            onClick={() => setActiveTimeOfDay('evening')}
          >
            <span className="step-choose__filter-emoji">{t('habits.timeOfDayEmojis.evening')}</span>
            <span className="step-choose__filter-name">{t('habits.timeOfDay.evening')}</span>
          </button>
          <button
            type="button"
            className={`step-choose__filter ${activeTimeOfDay === 'night' ? 'step-choose__filter--active' : ''}`}
            onClick={() => setActiveTimeOfDay('night')}
          >
            <span className="step-choose__filter-emoji">{t('habits.timeOfDayEmojis.night')}</span>
            <span className="step-choose__filter-name">{t('habits.timeOfDay.night')}</span>
          </button>
        </div>

        {/* Result count */}
        <p className="step-choose__result-count">
          {t('habits.resultCount', { count: filteredSuggestions.length })}
        </p>

        {/* Carrousel d'habitudes suggérées */}
        <div className="step-choose__carousel-container">
          <HabitCarousel
            key={`${activeCategory}-${activeDifficulty}-${activeTimeOfDay}`}
            itemsPerViewDesktop={2}
            itemsPerViewMobile={1}
            ariaLabel={t('createHabit.highImpact.title')}
          >
            {filteredSuggestions.map((habit) => (
              <SuggestedHabitCard key={habit.id} habit={habit} onSelect={selectSuggestion} />
            ))}
          </HabitCarousel>
        </div>
      </div>

      <div className="step-choose__divider">
        <span>{t('common.or')}</span>
      </div>

      <button
        type="button"
        className="step-choose__custom-btn"
        onClick={() => {
          // Si une catégorie est sélectionnée (autre que 'all'), la mémoriser pour les suggestions d'emojis
          if (activeCategory !== 'all') {
            setSelectedCategory(activeCategory)
          }
          setStep('type')
        }}
      >
        <span className="step-choose__custom-icon">✨</span>
        <div className="step-choose__custom-text">
          <span className="step-choose__custom-title">{t('createHabit.createCustom.title')}</span>
          <span className="step-choose__custom-desc">
            {t('createHabit.createCustom.description')}
          </span>
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
        {(['increase', 'decrease', 'maintain'] as HabitDirection[]).map((direction) => (
          <button
            key={direction}
            type="button"
            className={`step-type__option ${form.direction === direction ? 'step-type__option--selected' : ''}`}
            onClick={() => selectType(direction)}
            aria-pressed={form.direction === direction}
          >
            <span className="step-type__option-icon" aria-hidden="true">
              {HABIT_TYPE_ICONS[direction]}
            </span>
            <div className="step-type__option-content">
              <p className="step-type__option-title">{t(`habits.type.${direction}`)}</p>
              <p className="step-type__option-description">
                {t(`habits.typeDescriptions.${direction}`)}
              </p>
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
        <EmojiPicker
          label={t('createHabit.form.emoji')}
          value={form.emoji}
          onChange={(emoji) => updateForm('emoji', emoji)}
          suggestedEmojis={
            selectedCategory
              ? CATEGORY_EMOJIS[selectedCategory]
              : activeCategory !== 'all'
                ? CATEGORY_EMOJIS[activeCategory]
                : ['💪', '🏃', '📚', '🧘', '💧', '😴', '🎯', '✨']
          }
        />

        {/* Nom */}
        <Input
          label={t('createHabit.form.name')}
          placeholder={t('createHabit.form.namePlaceholder')}
          value={form.name}
          onChange={(e) => updateForm('name', e.target.value)}
        />

        {/* Valeur de départ et unité */}
        <div className="step-details__row">
          <Input
            type="number"
            label={t('createHabit.form.startDose')}
            placeholder="10"
            min={1}
            value={form.startValue || ''}
            onChange={(e) => updateForm('startValue', Number(e.target.value))}
          />
          <Input
            label={t('createHabit.form.unit')}
            placeholder={t('createHabit.form.unitPlaceholder')}
            value={form.unit}
            onChange={(e) => updateForm('unit', e.target.value)}
          />
        </div>

        {/* Progression (sauf pour maintain) */}
        {form.direction !== 'maintain' && (
          <div className="step-details__progression-section">
            <p className="step-details__progression-title">{t('createHabit.form.progression')}</p>

            {/* Mode de progression */}
            <div className="step-details__progression-options">
              <button
                type="button"
                className={`step-details__progression-option ${form.progressionMode === 'percentage' ? 'step-details__progression-option--selected' : ''}`}
                onClick={() => updateForm('progressionMode', 'percentage')}
              >
                {t('createHabit.form.inPercent')}
              </button>
              <button
                type="button"
                className={`step-details__progression-option ${form.progressionMode === 'absolute' ? 'step-details__progression-option--selected' : ''}`}
                onClick={() => updateForm('progressionMode', 'absolute')}
              >
                {t('createHabit.form.inUnits')}
              </button>
            </div>

            {/* Valeur et période de progression */}
            <div className="step-details__row">
              <Input
                type="number"
                label={
                  form.progressionMode === 'percentage'
                    ? t('createHabit.form.percentage')
                    : t('createHabit.form.units')
                }
                placeholder={form.progressionMode === 'percentage' ? '5' : '1'}
                min={1}
                value={form.progressionValue || ''}
                onChange={(e) => updateForm('progressionValue', Number(e.target.value))}
                hint={form.progressionMode === 'percentage' ? 'Ex: 5%' : undefined}
              />
              <div className="input-wrapper">
                <label className="input-label">{t('createHabit.form.per')}</label>
                <div className="step-details__progression-options">
                  <button
                    type="button"
                    className={`step-details__progression-option ${form.progressionPeriod === 'weekly' ? 'step-details__progression-option--selected' : ''}`}
                    onClick={() => updateForm('progressionPeriod', 'weekly')}
                  >
                    {t('createHabit.form.week')}
                  </button>
                  <button
                    type="button"
                    className={`step-details__progression-option ${form.progressionPeriod === 'daily' ? 'step-details__progression-option--selected' : ''}`}
                    onClick={() => updateForm('progressionPeriod', 'daily')}
                  >
                    {t('createHabit.form.day')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mode de suivi (tracking mode) */}
        <div className="step-details__tracking-mode-section">
          <p className="step-details__tracking-mode-title">{t('createHabit.trackingMode.title')}</p>
          <p className="step-details__tracking-mode-hint">{t('createHabit.trackingMode.hint')}</p>
          <div className="step-details__tracking-mode-options">
            <button
              type="button"
              className={`step-details__tracking-mode-option ${form.trackingMode === 'simple' ? 'step-details__tracking-mode-option--selected' : ''}`}
              onClick={() => updateForm('trackingMode', 'simple')}
              aria-pressed={form.trackingMode === 'simple'}
            >
              <span className="step-details__tracking-mode-label">
                {t('createHabit.trackingMode.simple')}
              </span>
              <span className="step-details__tracking-mode-desc">
                {t('createHabit.trackingMode.simpleDesc')}
              </span>
            </button>
            <button
              type="button"
              className={`step-details__tracking-mode-option ${form.trackingMode === 'detailed' ? 'step-details__tracking-mode-option--selected' : ''}`}
              onClick={() => updateForm('trackingMode', 'detailed')}
              aria-pressed={form.trackingMode === 'detailed'}
            >
              <span className="step-details__tracking-mode-label">
                {t('createHabit.trackingMode.detailed')}
              </span>
              <span className="step-details__tracking-mode-desc">
                {t('createHabit.trackingMode.detailedDesc')}
              </span>
            </button>
            <button
              type="button"
              className={`step-details__tracking-mode-option ${form.trackingMode === 'counter' ? 'step-details__tracking-mode-option--selected' : ''}`}
              onClick={() => updateForm('trackingMode', 'counter')}
              aria-pressed={form.trackingMode === 'counter'}
            >
              <span className="step-details__tracking-mode-label">
                {t('createHabit.trackingMode.counter')}
              </span>
              <span className="step-details__tracking-mode-desc">
                {t('createHabit.trackingMode.counterDesc')}
              </span>
            </button>
          </div>
          {form.trackingMode === 'counter' && (
            <p className="step-details__tracking-mode-counter-hint">
              {t('createHabit.trackingMode.counterHint')}
            </p>
          )}
        </div>

        {/* Mode de saisie - seulement pour detailed (counter utilise toujours +1/-1) */}
        {form.trackingMode === 'detailed' && (
          <div className="step-details__entry-mode-section">
            <p className="step-details__entry-mode-title">{t('createHabit.entryMode.title')}</p>
            <p className="step-details__entry-mode-hint">{t('createHabit.entryMode.hint')}</p>
            <div className="step-details__entry-mode-options">
              <button
                type="button"
                className={`step-details__entry-mode-option ${form.entryMode === 'replace' ? 'step-details__entry-mode-option--selected' : ''}`}
                onClick={() => updateForm('entryMode', 'replace')}
                aria-pressed={form.entryMode === 'replace'}
              >
                <span className="step-details__entry-mode-label">
                  {t('createHabit.entryMode.replace')}
                </span>
                <span className="step-details__entry-mode-desc">
                  {t('createHabit.entryMode.replaceDesc')}
                </span>
              </button>
              <button
                type="button"
                className={`step-details__entry-mode-option ${form.entryMode === 'cumulative' ? 'step-details__entry-mode-option--selected' : ''}`}
                onClick={() => updateForm('entryMode', 'cumulative')}
                aria-pressed={form.entryMode === 'cumulative'}
              >
                <span className="step-details__entry-mode-label">
                  {t('createHabit.entryMode.cumulative')}
                </span>
                <span className="step-details__entry-mode-desc">
                  {t('createHabit.entryMode.cumulativeDesc')}
                </span>
              </button>
            </div>
            {form.entryMode === 'cumulative' && (
              <p className="step-details__entry-mode-cumulative-hint">
                {t('createHabit.entryMode.cumulativeHint')}
              </p>
            )}
          </div>
        )}

        {/* Mode d'agrégation hebdomadaire - seulement pour les habitudes weekly */}
        {form.trackingFrequency === 'weekly' && (
          <div className="step-details__weekly-aggregation-section">
            <p className="step-details__weekly-aggregation-title">
              {t('createHabit.weeklyAggregation.title')}
            </p>
            <p className="step-details__weekly-aggregation-hint">
              {t('createHabit.weeklyAggregation.hint')}
            </p>
            <div className="step-details__weekly-aggregation-options">
              <button
                type="button"
                className={`step-details__weekly-aggregation-option ${form.weeklyAggregation === 'count-days' ? 'step-details__weekly-aggregation-option--selected' : ''}`}
                onClick={() => updateForm('weeklyAggregation', 'count-days')}
                aria-pressed={form.weeklyAggregation === 'count-days'}
              >
                <span className="step-details__weekly-aggregation-label">
                  {t('createHabit.weeklyAggregation.countDays')}
                </span>
                <span className="step-details__weekly-aggregation-desc">
                  {t('createHabit.weeklyAggregation.countDaysDesc')}
                </span>
              </button>
              <button
                type="button"
                className={`step-details__weekly-aggregation-option ${form.weeklyAggregation === 'sum-units' ? 'step-details__weekly-aggregation-option--selected' : ''}`}
                onClick={() => updateForm('weeklyAggregation', 'sum-units')}
                aria-pressed={form.weeklyAggregation === 'sum-units'}
              >
                <span className="step-details__weekly-aggregation-label">
                  {t('createHabit.weeklyAggregation.sumUnits')}
                </span>
                <span className="step-details__weekly-aggregation-desc">
                  {t('createHabit.weeklyAggregation.sumUnitsDesc')}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Moment de la journée */}
        <TimeOfDaySelector
          value={form.timeOfDay}
          onChange={(value) => updateForm('timeOfDay', value)}
        />
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
            <span className="step-intentions-combined__separator-text">{t('common.or')}</span>
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
  const renderStepConfirm = () => {
    const habitCreatedMessages = t('habitCreated', { returnObjects: true }) as string[]
    return (
      <div className="create-habit__content step-confirm">
        <div className="step-confirm__summary">
          <div className="step-confirm__header">
            <span className="step-confirm__emoji">{form.emoji}</span>
            <h3 className="step-confirm__name">{form.name}</h3>
          </div>

          <div className="step-confirm__details">
            <div className="step-confirm__detail">
              <span className="step-confirm__detail-label">{t('createHabit.summary.type')}</span>
              <span className="step-confirm__detail-value">
                {form.direction && t(`habits.type.${form.direction}`)}
              </span>
            </div>
            <div className="step-confirm__detail">
              <span className="step-confirm__detail-label">
                {t('createHabit.summary.startDose')}
              </span>
              <span className="step-confirm__detail-value">
                {form.startValue} {form.unit}
              </span>
            </div>
            <div className="step-confirm__detail">
              <span className="step-confirm__detail-label">
                {t('createHabit.summary.progression')}
              </span>
              <span className="step-confirm__detail-value">{progressionSummary}</span>
            </div>
            {(form.implementationIntention.trigger || form.implementationIntention.location) && (
              <div className="step-confirm__detail">
                <span className="step-confirm__detail-label">{t('createHabit.summary.plan')}</span>
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
                <span className="step-confirm__detail-label">
                  {t('createHabit.summary.linkedAfter')}
                </span>
                <span className="step-confirm__detail-value step-confirm__detail-value--small">
                  {(() => {
                    const anchorHabit = activeHabits.find((h) => h.id === form.anchorHabitId)
                    return anchorHabit
                      ? `${anchorHabit.emoji} ${anchorHabit.name}`
                      : t('habits.notFound')
                  })()}
                </span>
              </div>
            )}
            {form.identityStatement && (
              <div className="step-confirm__detail">
                <span className="step-confirm__detail-label">
                  {t('createHabit.summary.identity')}
                </span>
                <span className="step-confirm__detail-value step-confirm__detail-value--small step-confirm__detail-value--identity">
                  {t('identity.reminder.prefix')} {form.identityStatement}
                </span>
              </div>
            )}
            {form.entryMode === 'cumulative' && (
              <div className="step-confirm__detail">
                <span className="step-confirm__detail-label">
                  {t('createHabit.summary.entryMode')}
                </span>
                <span className="step-confirm__detail-value">
                  {t('createHabit.entryMode.cumulative')}
                </span>
              </div>
            )}
            {form.timeOfDay && (
              <div className="step-confirm__detail">
                <span className="step-confirm__detail-label">
                  {t('createHabit.summary.timeOfDay')}
                </span>
                <span className="step-confirm__detail-value">
                  {t(`habits.timeOfDayEmojis.${form.timeOfDay}`)}{' '}
                  {t(`habits.timeOfDay.${form.timeOfDay}`)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="step-confirm__message">
          <p className="step-confirm__message-text">{randomMessage(habitCreatedMessages)}</p>
        </div>
      </div>
    )
  }

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
        return t('createHabit.buttons.customize')
      case 'type':
        return t('common.continue')
      case 'details':
        return t('common.continue')
      case 'intentions':
        return t('common.continue')
      case 'identity':
        return t('createHabit.buttons.preview')
      case 'confirm':
        return t('createHabit.buttons.create')
      default:
        return t('common.continue')
    }
  }, [step, t])

  /**
   * Sous-titre selon l'étape
   */
  const getSubtitle = () => {
    switch (step) {
      case 'choose':
        return t('createHabit.steps.choose')
      case 'type':
        return t('createHabit.steps.type')
      case 'details':
        return t('createHabit.steps.details')
      case 'intentions':
        return t('createHabit.steps.intentions')
      case 'identity':
        return t('createHabit.steps.identity')
      case 'confirm':
        return t('createHabit.steps.confirm')
      default:
        return ''
    }
  }

  /**
   * Affichage du nom de l'habitude en cours d'édition (étapes 3+)
   */
  const getHabitPreview = () => {
    // Afficher le nom seulement si on a un nom défini et qu'on est à l'étape details, intentions ou identity
    if ((step === 'details' || step === 'intentions' || step === 'identity') && form.name.trim()) {
      return `${form.emoji} ${form.name}`
    }
    return null
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
        <h1 className="create-habit__title">{t('createHabit.title')}</h1>
        <p className="create-habit__subtitle">{getSubtitle()}</p>
        {getHabitPreview() && <p className="create-habit__habit-preview">{getHabitPreview()}</p>}
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
              {t('common.back')}
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
