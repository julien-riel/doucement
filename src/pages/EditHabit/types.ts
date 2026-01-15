/**
 * Types for EditHabit page
 * Re-exports shared types and defines EditHabit-specific types
 */

import type { Habit } from '../../types'
import type { HabitFormState } from '../../types/habitForm'

// Re-export shared types for convenience
export type { HabitFormState } from '../../types/habitForm'
export { INITIAL_FORM_STATE, HABIT_TYPE_ICONS } from '../../types/habitForm'

/**
 * Context value type for EditHabit page
 */
export interface EditHabitContextValue {
  /** The habit being edited */
  habit: Habit
  /** Current form state */
  form: HabitFormState
  /** Update a form field */
  updateField: <K extends keyof HabitFormState>(key: K, value: HabitFormState[K]) => void
  /** Whether the form is valid for submission */
  isValid: boolean
  /** Whether form has changes from initial state */
  hasChanges: boolean
  /** Validation errors by field name */
  errors: Record<string, string>
  /** Original direction (for change detection) */
  originalDirection: Habit['direction']
  /** Available habits for anchor selection (excludes current habit) */
  availableAnchorHabits: Habit[]
  /** Save handler */
  handleSave: () => void
  /** Cancel handler */
  handleCancel: () => void
  /** Whether save is in progress */
  isSaving: boolean
}
