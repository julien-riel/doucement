/**
 * Shared types for habit forms (create and edit)
 * Used by useHabitForm hook, CreateHabit wizard, and EditHabit page
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
  SliderConfig,
} from './index'

/**
 * Form state for habit creation/edition
 * Contains all fields needed to create or modify a habit
 */
export interface HabitFormState {
  direction: HabitDirection | null
  name: string
  emoji: string
  unit: string
  description: string
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
  sliderConfig: SliderConfig | null
}

/**
 * Initial form state for creating a new habit
 */
export const INITIAL_FORM_STATE: HabitFormState = {
  direction: null,
  name: '',
  emoji: '💪',
  unit: '',
  description: '',
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
  sliderConfig: null,
}

/**
 * Icons for habit direction types
 */
export const HABIT_TYPE_ICONS: Record<HabitDirection, string> = {
  increase: '📈',
  decrease: '📉',
  maintain: '⚖️',
}
