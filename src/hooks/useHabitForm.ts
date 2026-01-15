/**
 * useHabitForm - Hook for managing habit form state
 * Used by both CreateHabit wizard and EditHabit page
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import type { Habit } from '../types'
import { HabitFormState, INITIAL_FORM_STATE } from '../types/habitForm'

/**
 * Options for useHabitForm hook
 */
export interface UseHabitFormOptions {
  /** Initial habit for edit mode (optional) */
  initialHabit?: Habit
  /** Mode: 'create' for new habit, 'edit' for modifying existing */
  mode: 'create' | 'edit'
}

/**
 * Return value from useHabitForm hook
 */
export interface UseHabitFormReturn {
  /** Current form state */
  form: HabitFormState
  /** Update a single form field */
  updateField: <K extends keyof HabitFormState>(key: K, value: HabitFormState[K]) => void
  /** Reset form to initial state */
  resetForm: () => void
  /** Whether the form is valid for submission */
  isValid: boolean
  /** Whether form has changes from initial state (for edit mode) */
  hasChanges: boolean
  /** Validation errors by field name */
  errors: Record<string, string>
}

/**
 * Convert a Habit to HabitFormState for editing
 */
function habitToFormState(habit: Habit): HabitFormState {
  return {
    direction: habit.direction,
    name: habit.name,
    emoji: habit.emoji,
    unit: habit.unit,
    description: habit.description ?? '',
    startValue: habit.startValue,
    progressionMode: habit.progression?.mode ?? 'percentage',
    progressionValue: habit.progression?.value ?? 5,
    progressionPeriod: habit.progression?.period ?? 'weekly',
    targetValue: habit.targetValue ?? null,
    implementationIntention: habit.implementationIntention ?? {},
    anchorHabitId: habit.anchorHabitId,
    trackingFrequency: habit.trackingFrequency ?? 'daily',
    trackingMode: habit.trackingMode ?? 'detailed',
    identityStatement: habit.identityStatement ?? '',
    entryMode: habit.entryMode ?? 'replace',
    weeklyAggregation: habit.weeklyAggregation ?? 'sum-units',
    timeOfDay: habit.timeOfDay ?? null,
  }
}

/**
 * Hook for managing habit form state and validation
 *
 * @example
 * // Create mode
 * const { form, updateField, isValid } = useHabitForm({ mode: 'create' })
 *
 * @example
 * // Edit mode
 * const { form, updateField, hasChanges } = useHabitForm({
 *   mode: 'edit',
 *   initialHabit: existingHabit
 * })
 */
export function useHabitForm(options: UseHabitFormOptions): UseHabitFormReturn {
  const { initialHabit, mode } = options

  // Compute initial form state based on mode
  const initialState = useMemo<HabitFormState>(() => {
    if (mode === 'edit' && initialHabit) {
      return habitToFormState(initialHabit)
    }
    return INITIAL_FORM_STATE
  }, [mode, initialHabit])

  // Form state
  const [form, setForm] = useState<HabitFormState>(initialState)

  // Sync form state when initialHabit changes (e.g., when habit loads asynchronously)
  useEffect(() => {
    if (mode === 'edit' && initialHabit) {
      setForm(habitToFormState(initialHabit))
    }
  }, [mode, initialHabit])

  // Update a single field
  const updateField = useCallback(
    <K extends keyof HabitFormState>(key: K, value: HabitFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setForm(initialState)
  }, [initialState])

  // Validation errors
  const errors = useMemo<Record<string, string>>(() => {
    const errs: Record<string, string> = {}

    if (!form.name.trim()) {
      errs.name = 'Le nom est requis'
    }

    if (!form.unit.trim()) {
      errs.unit = "L'unité est requise"
    }

    if (form.startValue < 0) {
      errs.startValue = 'La valeur de départ doit être positive'
    }

    if (form.direction !== 'maintain' && form.progressionValue <= 0) {
      errs.progressionValue = 'La progression doit être positive'
    }

    return errs
  }, [form])

  // Is form valid for submission
  const isValid = useMemo(() => {
    return (
      Object.keys(errors).length === 0 && form.name.trim().length > 0 && form.unit.trim().length > 0
    )
  }, [errors, form.name, form.unit])

  // Has form changed from initial state (for edit mode)
  const hasChanges = useMemo(() => {
    if (mode === 'create') {
      return true // Always consider as changed in create mode
    }

    if (!initialHabit) {
      return false
    }

    const initial = initialState

    // Check each field for changes
    const nameChanged = form.name.trim() !== initial.name
    const emojiChanged = form.emoji !== initial.emoji
    const unitChanged = form.unit.trim() !== initial.unit
    const descriptionChanged = form.description.trim() !== initial.description.trim()
    const directionChanged = form.direction !== initial.direction
    const targetChanged = form.targetValue !== initial.targetValue

    // Progression changes (only if not maintain)
    let progressionChanged = false
    if (form.direction !== 'maintain') {
      progressionChanged =
        form.progressionMode !== initial.progressionMode ||
        form.progressionValue !== initial.progressionValue ||
        form.progressionPeriod !== initial.progressionPeriod
    }

    // Implementation Intention changes
    const triggerChanged =
      (form.implementationIntention.trigger ?? '').trim() !==
      (initial.implementationIntention.trigger ?? '').trim()
    const locationChanged =
      (form.implementationIntention.location ?? '').trim() !==
      (initial.implementationIntention.location ?? '').trim()
    const timeChanged =
      (form.implementationIntention.time ?? '') !== (initial.implementationIntention.time ?? '')

    // Other field changes
    const anchorChanged = form.anchorHabitId !== initial.anchorHabitId
    const trackingFrequencyChanged = form.trackingFrequency !== initial.trackingFrequency
    const entryModeChanged = form.entryMode !== initial.entryMode
    const trackingModeChanged = form.trackingMode !== initial.trackingMode
    const identityStatementChanged =
      form.identityStatement.trim() !== initial.identityStatement.trim()
    const weeklyAggregationChanged = form.weeklyAggregation !== initial.weeklyAggregation
    const timeOfDayChanged = form.timeOfDay !== initial.timeOfDay

    return (
      nameChanged ||
      emojiChanged ||
      unitChanged ||
      descriptionChanged ||
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
      weeklyAggregationChanged ||
      timeOfDayChanged
    )
  }, [mode, initialHabit, initialState, form])

  return {
    form,
    updateField,
    resetForm,
    isValid,
    hasChanges,
    errors,
  }
}
