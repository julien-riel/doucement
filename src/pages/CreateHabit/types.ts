/**
 * Types for CreateHabit wizard
 */

import type {
  HabitDirection,
  ProgressionMode,
  ProgressionPeriod,
  ImplementationIntention,
  TrackingFrequency,
  TrackingMode,
  EntryMode,
  WeeklyAggregation,
  TimeOfDay,
} from '../../types'
import type { HabitCategory } from '../../constants/suggestedHabits'

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
 * Form state for habit creation wizard
 */
export interface HabitFormState {
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

/**
 * Initial form state
 */
export const INITIAL_FORM_STATE: HabitFormState = {
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
 * Icons for habit direction types
 */
export const HABIT_TYPE_ICONS: Record<HabitDirection, string> = {
  increase: '📈',
  decrease: '📉',
  maintain: '⚖️',
}

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
