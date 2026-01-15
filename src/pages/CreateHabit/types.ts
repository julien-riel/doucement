/**
 * Types for CreateHabit wizard
 */

import type { HabitCategory } from '../../constants/suggestedHabits'
import type { HabitFormState } from '../../types/habitForm'

// Re-export shared types for backwards compatibility
export type { HabitFormState } from '../../types/habitForm'
export { INITIAL_FORM_STATE, HABIT_TYPE_ICONS } from '../../types/habitForm'

/**
 * Wizard step identifiers
 */
export type WizardStep =
  | 'choose'
  | 'type'
  | 'details'
  | 'intentions'
  | 'identity'
  | 'confirm'
  | 'first-checkin'

/**
 * Context value type for CreateHabit wizard
 */
export interface CreateHabitContextValue {
  /** Current form state */
  form: HabitFormState
  /** Update a form field */
  updateForm: <K extends keyof HabitFormState>(key: K, value: HabitFormState[K]) => void
  /** Current wizard step */
  step: WizardStep
  /** Set the current step */
  setStep: (step: WizardStep) => void
  /** Currently selected category (for emoji suggestions) */
  selectedCategory: HabitCategory | null
  /** Set the selected category */
  setSelectedCategory: (category: HabitCategory | null) => void
  /** Check if current step is valid */
  isStepValid: boolean
  /** Go to the next step */
  handleNext: () => void
  /** Go to the previous step */
  handleBack: () => void
  /** Current step index (for progress indicator) */
  stepIndex: number
  /** Progression summary text */
  progressionSummary: string
}
