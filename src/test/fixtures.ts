/**
 * Fixtures centralisées pour les tests
 * Fournit des factory functions réutilisables pour créer des données de test
 */

import type {
  Habit,
  DailyEntry,
  AppData,
  ProgressionConfig,
  NotificationSettings,
  CounterOperation,
  ImplementationIntention,
  PlannedPause,
  RecalibrationRecord,
} from '../types'
import { CURRENT_SCHEMA_VERSION, DEFAULT_NOTIFICATION_SETTINGS } from '../types'

// ============================================================================
// CONSTANTES DE TEST
// ============================================================================

/** Date de test par défaut (samedi) */
export const TEST_TODAY = '2026-01-10'

/** Date de création par défaut pour les habitudes */
export const TEST_CREATED_AT = '2026-01-01'

/** Clé de stockage localStorage */
export const STORAGE_KEY = 'doucement_data'

// ============================================================================
// HABIT FIXTURES
// ============================================================================

/**
 * Crée une habitude de test avec des valeurs par défaut
 * @param overrides - Propriétés à surcharger
 */
export function createHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'test-habit',
    name: 'Test Habit',
    emoji: '💪',
    direction: 'increase',
    startValue: 10,
    unit: 'répétitions',
    progression: null,
    trackingMode: 'detailed',
    createdAt: TEST_CREATED_AT,
    archivedAt: null,
    ...overrides,
  } as Habit
}

/**
 * Crée une habitude "increase" avec progression
 */
export function createIncreaseHabit(overrides: Partial<Habit> = {}): Habit {
  return createHabit({
    id: 'habit-increase',
    name: 'Push-ups',
    emoji: '💪',
    direction: 'increase',
    startValue: 10,
    unit: 'répétitions',
    progression: { mode: 'absolute', value: 2, period: 'weekly' },
    trackingFrequency: 'daily',
    entryMode: 'replace',
    ...overrides,
  })
}

/**
 * Crée une habitude "decrease" avec progression
 */
export function createDecreaseHabit(overrides: Partial<Habit> = {}): Habit {
  return createHabit({
    id: 'habit-decrease',
    name: 'Cigarettes',
    emoji: '🚭',
    direction: 'decrease',
    startValue: 10,
    unit: 'cigarettes',
    progression: { mode: 'absolute', value: 1, period: 'weekly' },
    trackingMode: 'counter',
    ...overrides,
  })
}

/**
 * Crée une habitude "maintain"
 */
export function createMaintainHabit(overrides: Partial<Habit> = {}): Habit {
  return createHabit({
    id: 'habit-maintain',
    name: 'Méditation',
    emoji: '🧘',
    direction: 'maintain',
    startValue: 10,
    unit: 'minutes',
    progression: null,
    ...overrides,
  })
}

/**
 * Crée une habitude avec mode cumulative
 */
export function createCumulativeHabit(overrides: Partial<Habit> = {}): Habit {
  return createHabit({
    id: 'habit-cumulative',
    name: "Verres d'eau",
    emoji: '💧',
    direction: 'increase',
    startValue: 8,
    unit: 'verres',
    progression: null,
    entryMode: 'cumulative',
    ...overrides,
  })
}

/**
 * Crée une habitude avec mode compteur
 */
export function createCounterHabit(overrides: Partial<Habit> = {}): Habit {
  return createHabit({
    id: 'habit-counter',
    name: 'Cigarettes',
    emoji: '🚭',
    direction: 'decrease',
    startValue: 10,
    unit: 'cigarettes',
    progression: { mode: 'absolute', value: 1, period: 'weekly' },
    trackingMode: 'counter',
    ...overrides,
  })
}

/**
 * Crée une habitude hebdomadaire
 */
export function createWeeklyHabit(overrides: Partial<Habit> = {}): Habit {
  return createHabit({
    id: 'habit-weekly',
    name: 'Sport',
    emoji: '🏃',
    direction: 'increase',
    startValue: 3,
    unit: 'séances',
    progression: null,
    trackingFrequency: 'weekly',
    weeklyAggregation: 'count-days',
    ...overrides,
  })
}

/**
 * Crée une habitude avec implementation intention
 */
export function createHabitWithIntention(overrides: Partial<Habit> = {}): Habit {
  return createHabit({
    id: 'habit-with-intention',
    name: 'Lecture',
    emoji: '📚',
    implementationIntention: {
      trigger: 'Après mon café du matin',
      location: 'Dans le salon',
      time: '08:00',
    },
    ...overrides,
  })
}

/**
 * Crée une habitude avec identity statement
 */
export function createHabitWithIdentity(overrides: Partial<Habit> = {}): Habit {
  return createHabit({
    id: 'habit-with-identity',
    name: 'Exercice',
    emoji: '💪',
    identityStatement: 'prend soin de son corps',
    ...overrides,
  })
}

// ============================================================================
// ENTRY FIXTURES
// ============================================================================

/**
 * Crée une entrée de test avec des valeurs par défaut
 */
export function createEntry(overrides: Partial<DailyEntry> = {}): DailyEntry {
  return {
    id: 'test-entry',
    habitId: 'test-habit',
    date: TEST_TODAY,
    targetDose: 10,
    actualValue: 10,
    createdAt: `${TEST_TODAY}T10:00:00Z`,
    updatedAt: `${TEST_TODAY}T10:00:00Z`,
    ...overrides,
  }
}

/**
 * Crée une entrée complétée (100%)
 */
export function createCompletedEntry(overrides: Partial<DailyEntry> = {}): DailyEntry {
  return createEntry({
    id: 'entry-completed',
    targetDose: 10,
    actualValue: 10,
    ...overrides,
  })
}

/**
 * Crée une entrée partielle (50%)
 */
export function createPartialEntry(overrides: Partial<DailyEntry> = {}): DailyEntry {
  return createEntry({
    id: 'entry-partial',
    targetDose: 10,
    actualValue: 5,
    ...overrides,
  })
}

/**
 * Crée une entrée dépassée (120%)
 */
export function createExceededEntry(overrides: Partial<DailyEntry> = {}): DailyEntry {
  return createEntry({
    id: 'entry-exceeded',
    targetDose: 10,
    actualValue: 12,
    ...overrides,
  })
}

/**
 * Crée une entrée avec opérations de compteur
 */
export function createEntryWithOperations(overrides: Partial<DailyEntry> = {}): DailyEntry {
  return createEntry({
    id: 'entry-with-ops',
    actualValue: 3,
    operations: [
      { id: 'op-1', type: 'add', value: 1, timestamp: `${TEST_TODAY}T08:00:00Z` },
      { id: 'op-2', type: 'add', value: 1, timestamp: `${TEST_TODAY}T12:00:00Z` },
      { id: 'op-3', type: 'add', value: 1, timestamp: `${TEST_TODAY}T18:00:00Z` },
    ],
    ...overrides,
  })
}

/**
 * Crée plusieurs entrées pour une période
 * @param habitId - ID de l'habitude
 * @param startDate - Date de début (YYYY-MM-DD)
 * @param days - Nombre de jours
 * @param completionRate - Taux de complétion (0-1)
 */
export function createEntriesForPeriod(
  habitId: string,
  startDate: string,
  days: number,
  completionRate: number = 0.8
): DailyEntry[] {
  const entries: DailyEntry[] = []
  const start = new Date(startDate)

  for (let i = 0; i < days; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]
    const targetDose = 10 + i // Progression simple
    const actualValue = Math.round(targetDose * completionRate)

    entries.push(
      createEntry({
        id: `entry-${habitId}-${dateStr}`,
        habitId,
        date: dateStr,
        targetDose,
        actualValue,
        createdAt: `${dateStr}T10:00:00Z`,
        updatedAt: `${dateStr}T10:00:00Z`,
      })
    )
  }

  return entries
}

// ============================================================================
// APP DATA FIXTURES
// ============================================================================

/**
 * Crée des données d'application valides
 */
export function createAppData(overrides: Partial<AppData> = {}): AppData {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    habits: [],
    entries: [],
    preferences: {
      onboardingCompleted: false,
      lastWeeklyReviewDate: null,
      notifications: DEFAULT_NOTIFICATION_SETTINGS,
      theme: 'system',
    },
    ...overrides,
  }
}

/**
 * Crée des données avec une habitude et une entrée
 */
export function createAppDataWithHabit(
  habitOverrides: Partial<Habit> = {},
  entryOverrides: Partial<DailyEntry> = {}
): AppData {
  const habit = createIncreaseHabit(habitOverrides)
  const entry = createEntry({
    habitId: habit.id,
    ...entryOverrides,
  })

  return createAppData({
    habits: [habit],
    entries: [entry],
    preferences: {
      onboardingCompleted: true,
      lastWeeklyReviewDate: '2026-01-05',
      notifications: DEFAULT_NOTIFICATION_SETTINGS,
      theme: 'system',
    },
  })
}

/**
 * Crée des données avec plusieurs habitudes
 */
export function createAppDataWithMultipleHabits(): AppData {
  return createAppData({
    habits: [
      createIncreaseHabit({ id: 'habit-1' }),
      createDecreaseHabit({ id: 'habit-2' }),
      createMaintainHabit({ id: 'habit-3' }),
    ],
    entries: [
      createEntry({ id: 'entry-1', habitId: 'habit-1' }),
      createEntry({ id: 'entry-2', habitId: 'habit-2' }),
      createEntry({ id: 'entry-3', habitId: 'habit-3' }),
    ],
    preferences: {
      onboardingCompleted: true,
      lastWeeklyReviewDate: '2026-01-05',
      notifications: DEFAULT_NOTIFICATION_SETTINGS,
      theme: 'system',
    },
  })
}

/**
 * Crée des données avec une ancienne version du schéma
 */
export function createLegacyAppData(version: number): Record<string, unknown> {
  return {
    schemaVersion: version,
    habits: [],
    entries: [],
    preferences: {
      onboardingCompleted: false,
      lastWeeklyReviewDate: null,
    },
  }
}

// ============================================================================
// NOTIFICATION FIXTURES
// ============================================================================

/**
 * Crée des paramètres de notifications personnalisés
 */
export function createNotificationSettings(
  overrides: Partial<NotificationSettings> = {}
): NotificationSettings {
  return {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    ...overrides,
  }
}

// ============================================================================
// PROGRESSION CONFIG FIXTURES
// ============================================================================

/**
 * Crée une configuration de progression absolue
 */
export function createAbsoluteProgression(
  value: number = 2,
  period: 'daily' | 'weekly' = 'weekly'
): ProgressionConfig {
  return { mode: 'absolute', value, period }
}

/**
 * Crée une configuration de progression en pourcentage
 */
export function createPercentageProgression(
  value: number = 5,
  period: 'daily' | 'weekly' = 'weekly'
): ProgressionConfig {
  return { mode: 'percentage', value, period }
}

// ============================================================================
// IMPLEMENTATION INTENTION FIXTURES
// ============================================================================

/**
 * Crée une implementation intention complète
 */
export function createImplementationIntention(
  overrides: Partial<ImplementationIntention> = {}
): ImplementationIntention {
  return {
    trigger: 'Après mon café du matin',
    location: 'Dans le salon',
    time: '08:00',
    ...overrides,
  }
}

// ============================================================================
// PLANNED PAUSE FIXTURES
// ============================================================================

/**
 * Crée une pause planifiée
 */
export function createPlannedPause(overrides: Partial<PlannedPause> = {}): PlannedPause {
  return {
    startDate: TEST_TODAY,
    endDate: '2026-01-17',
    reason: 'Vacances',
    ...overrides,
  }
}

// ============================================================================
// RECALIBRATION FIXTURES
// ============================================================================

/**
 * Crée un enregistrement de recalibration
 */
export function createRecalibrationRecord(
  overrides: Partial<RecalibrationRecord> = {}
): RecalibrationRecord {
  return {
    date: TEST_TODAY,
    previousStartValue: 10,
    newStartValue: 8,
    previousStartDate: TEST_CREATED_AT,
    level: 0.75,
    ...overrides,
  }
}

// ============================================================================
// COUNTER OPERATION FIXTURES
// ============================================================================

/**
 * Crée une opération de compteur
 */
export function createCounterOperation(
  overrides: Partial<CounterOperation> = {}
): CounterOperation {
  return {
    id: 'op-test',
    type: 'add',
    value: 1,
    timestamp: `${TEST_TODAY}T10:00:00Z`,
    ...overrides,
  }
}

// ============================================================================
// MOCK FUNCTIONS
// ============================================================================

/**
 * Crée un mock pour loadData qui retourne des données valides
 */
export function createMockLoadData(data: AppData = createAppData()) {
  return () => ({
    success: true,
    data,
  })
}

/**
 * Crée un mock pour saveData qui réussit toujours
 */
export function createMockSaveData() {
  return () => ({ success: true })
}

/**
 * Crée un mock pour loadData qui échoue
 */
export function createMockLoadDataError(
  errorType: 'PARSE_ERROR' | 'VALIDATION_ERROR' | 'STORAGE_UNAVAILABLE' = 'STORAGE_UNAVAILABLE'
) {
  return () => ({
    success: false,
    error: {
      type: errorType,
      message: `Erreur simulée: ${errorType}`,
    },
  })
}
