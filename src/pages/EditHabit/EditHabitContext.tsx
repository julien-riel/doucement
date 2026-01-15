/**
 * Context for EditHabit page state management
 * Provides form state and handlers to all child components
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData, useHabitForm } from '../../hooks'
import type { Habit, UpdateHabitInput } from '../../types'
import type { EditHabitContextValue } from './types'

/**
 * Context for the EditHabit page
 */
const EditHabitContext = createContext<EditHabitContextValue | null>(null)

/**
 * Props for the EditHabitProvider
 */
interface EditHabitProviderProps {
  children: ReactNode
  habit: Habit
}

/**
 * Provider component for EditHabit page state
 */
export function EditHabitProvider({ children, habit }: EditHabitProviderProps) {
  const navigate = useNavigate()
  const { updateHabit, activeHabits } = useAppData()

  // Use the shared form hook
  const { form, updateField, isValid, hasChanges, errors } = useHabitForm({
    mode: 'edit',
    initialHabit: habit,
  })

  // Local state for saving and success feedback
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Track original direction for warning message
  const [originalDirection, setOriginalDirection] = useState(habit.direction)

  // Initialize original direction when habit loads
  useEffect(() => {
    setOriginalDirection(habit.direction)
  }, [habit])

  // Get available habits for anchor selection (exclude current habit)
  const availableAnchorHabits = useMemo(() => {
    return activeHabits.filter((h: Habit) => h.id !== habit.id)
  }, [activeHabits, habit.id])

  const handleSave = useCallback(() => {
    if (!isValid) return

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

    const success = updateHabit(habit.id, updates)

    if (success) {
      setShowSuccess(true)
      setTimeout(() => {
        navigate(`/habits/${habit.id}`)
      }, 1000)
    } else {
      setIsSaving(false)
    }
  }, [habit, isValid, form, updateHabit, navigate])

  const handleCancel = useCallback(() => {
    navigate(`/habits/${habit.id}`)
  }, [habit.id, navigate])

  // If showing success, return a minimal context (form will show success state)
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

  const value: EditHabitContextValue = {
    habit,
    form,
    updateField,
    isValid,
    hasChanges,
    errors,
    originalDirection,
    availableAnchorHabits,
    handleSave,
    handleCancel,
    isSaving,
  }

  return <EditHabitContext.Provider value={value}>{children}</EditHabitContext.Provider>
}

/**
 * Hook to access EditHabit context
 * @throws Error if used outside of EditHabitProvider
 */
export function useEditHabitContext(): EditHabitContextValue {
  const context = useContext(EditHabitContext)
  if (!context) {
    throw new Error('useEditHabitContext must be used within an EditHabitProvider')
  }
  return context
}

export { EditHabitContext }
