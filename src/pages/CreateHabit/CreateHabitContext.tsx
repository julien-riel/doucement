/**
 * Context for CreateHabit wizard state management
 */

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppData } from '../../hooks'
import type { Habit, CreateHabitInput } from '../../types'
import type { HabitCategory } from '../../constants/suggestedHabits'
import { WizardStep, HabitFormState, INITIAL_FORM_STATE, CreateHabitContextValue } from './types'

/**
 * Context for the CreateHabit wizard
 */
const CreateHabitContext = createContext<CreateHabitContextValue | null>(null)

/**
 * Props for the CreateHabitProvider
 */
interface CreateHabitProviderProps {
  children: ReactNode
  onHabitCreated?: (habit: Habit) => void
}

/**
 * Provider component for CreateHabit wizard state
 */
export function CreateHabitProvider({ children, onHabitCreated }: CreateHabitProviderProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { addHabit } = useAppData()

  const [step, setStep] = useState<WizardStep>('choose')
  const [form, setForm] = useState<HabitFormState>(INITIAL_FORM_STATE)
  const [selectedCategory, setSelectedCategory] = useState<HabitCategory | null>(null)
  /**
   * Update a form field
   */
  const updateForm = useCallback(
    <K extends keyof HabitFormState>(key: K, value: HabitFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  /**
   * Get current step index (for progress indicator)
   */
  const stepIndex = useMemo(() => {
    const steps: WizardStep[] = ['choose', 'type', 'details', 'intentions', 'identity', 'confirm']
    return steps.indexOf(step)
  }, [step])

  /**
   * Check if current step is valid
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
   * Progression summary text
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
   * Handle next step
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
        sliderConfig: form.trackingMode === 'slider' ? (form.sliderConfig ?? undefined) : undefined,
      }

      const newHabit = addHabit(habitInput)
      if (newHabit) {
        onHabitCreated?.(newHabit)
        setStep('first-checkin')
      }
    }
  }, [step, isStepValid, form, addHabit, onHabitCreated])

  /**
   * Handle previous step
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

  const value: CreateHabitContextValue = {
    form,
    updateForm,
    step,
    setStep,
    selectedCategory,
    setSelectedCategory,
    isStepValid,
    handleNext,
    handleBack,
    stepIndex,
    progressionSummary,
  }

  return <CreateHabitContext.Provider value={value}>{children}</CreateHabitContext.Provider>
}

/**
 * Hook to access CreateHabit context
 * @throws Error if used outside of CreateHabitProvider
 */
export function useCreateHabitContext(): CreateHabitContextValue {
  const context = useContext(CreateHabitContext)
  if (!context) {
    throw new Error('useCreateHabitContext must be used within a CreateHabitProvider')
  }
  return context
}

export { CreateHabitContext }
