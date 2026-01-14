/**
 * Factory functions pour créer des données de test E2E
 * Centralise la création de données pour éviter la duplication
 *
 * @example
 * const data = createAppData({
 *   habits: [createHabit({ name: 'Push-ups', direction: 'increase' })]
 * });
 */

import { CURRENT_SCHEMA_VERSION } from '../../src/types';

// Types locaux pour les fixtures (évite d'importer tous les types)
export interface TestHabit {
  id: string;
  name: string;
  emoji: string;
  description?: string;
  direction: 'increase' | 'decrease' | 'maintain';
  startValue: number;
  unit: string;
  progression: {
    mode: 'absolute' | 'percentage';
    value: number;
    period: 'daily' | 'weekly';
  } | null;
  targetValue?: number | null;
  createdAt: string;
  archivedAt: string | null;
  trackingMode?: 'simple' | 'detailed' | 'counter';
  trackingFrequency?: 'daily' | 'weekly';
  weeklyAggregation?: 'count-days' | 'sum-units';
  entryMode?: 'replace' | 'cumulative';
  implementationIntention?: {
    trigger?: string;
    location?: string;
    time?: string;
  };
  anchorHabitId?: string;
  plannedPause?: {
    startDate: string;
    endDate: string;
    reason?: string;
  } | null;
  identityStatement?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
}

export interface TestEntry {
  id: string;
  habitId: string;
  date: string;
  targetDose: number;
  actualValue: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
  operations?: Array<{
    id: string;
    type: 'add' | 'subtract';
    value: number;
    timestamp: string;
  }>;
}

export interface TestPreferences {
  onboardingCompleted: boolean;
  lastWeeklyReviewDate: string | null;
  notifications: {
    enabled: boolean;
    morningReminder: { enabled: boolean; time: string };
    eveningReminder: { enabled: boolean; time: string };
    weeklyReviewReminder: { enabled: boolean; time: string };
  };
  theme?: 'light' | 'dark' | 'system';
  debugMode?: boolean;
  simulatedDate?: string | null;
}

export interface TestAppData {
  schemaVersion: number;
  habits: TestHabit[];
  entries: TestEntry[];
  preferences: TestPreferences;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const DEFAULT_PREFERENCES: TestPreferences = {
  onboardingCompleted: true,
  lastWeeklyReviewDate: null,
  notifications: {
    enabled: false,
    morningReminder: { enabled: true, time: '08:00' },
    eveningReminder: { enabled: false, time: '20:00' },
    weeklyReviewReminder: { enabled: false, time: '10:00' },
  },
  theme: 'system',
};

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

let habitIdCounter = 1;
let entryIdCounter = 1;

/**
 * Reset counters between test files
 */
export function resetCounters(): void {
  habitIdCounter = 1;
  entryIdCounter = 1;
}

/**
 * Generate a unique habit ID
 */
export function generateHabitId(prefix = 'habit'): string {
  return `${prefix}-${habitIdCounter++}`;
}

/**
 * Generate a unique entry ID
 */
export function generateEntryId(prefix = 'entry'): string {
  return `${prefix}-${entryIdCounter++}`;
}

/**
 * Create a habit with sensible defaults
 */
export function createHabit(overrides: Partial<TestHabit> = {}): TestHabit {
  const id = overrides.id || generateHabitId();
  const direction = overrides.direction || 'increase';

  return {
    id,
    name: overrides.name || 'Test Habit',
    emoji: overrides.emoji || '💪',
    direction,
    startValue: overrides.startValue ?? 10,
    unit: overrides.unit || 'fois',
    progression:
      direction === 'maintain'
        ? null
        : overrides.progression ?? {
            mode: 'absolute',
            value: 1,
            period: 'weekly',
          },
    targetValue: overrides.targetValue,
    createdAt: overrides.createdAt || '2026-01-01',
    archivedAt: overrides.archivedAt ?? null,
    trackingMode: overrides.trackingMode || 'detailed',
    trackingFrequency: overrides.trackingFrequency || 'daily',
    ...overrides,
  };
}

/**
 * Create an increase habit (shorthand)
 */
export function createIncreaseHabit(
  overrides: Partial<TestHabit> = {}
): TestHabit {
  return createHabit({
    direction: 'increase',
    emoji: '💪',
    ...overrides,
  });
}

/**
 * Create a decrease habit (shorthand)
 */
export function createDecreaseHabit(
  overrides: Partial<TestHabit> = {}
): TestHabit {
  return createHabit({
    direction: 'decrease',
    emoji: '🚭',
    targetValue: overrides.targetValue ?? 0,
    ...overrides,
  });
}

/**
 * Create a maintain habit (shorthand)
 */
export function createMaintainHabit(
  overrides: Partial<TestHabit> = {}
): TestHabit {
  return createHabit({
    direction: 'maintain',
    emoji: '💧',
    progression: null,
    trackingMode: 'simple',
    ...overrides,
  });
}

/**
 * Create a counter habit (shorthand)
 */
export function createCounterHabit(
  overrides: Partial<TestHabit> = {}
): TestHabit {
  return createHabit({
    trackingMode: 'counter',
    emoji: '🔢',
    ...overrides,
  });
}

/**
 * Create a weekly habit (shorthand)
 */
export function createWeeklyHabit(
  overrides: Partial<TestHabit> = {}
): TestHabit {
  return createHabit({
    trackingFrequency: 'weekly',
    weeklyAggregation: overrides.weeklyAggregation || 'count-days',
    ...overrides,
  });
}

/**
 * Create a daily entry for a habit
 */
export function createEntry(overrides: Partial<TestEntry> = {}): TestEntry {
  const now = new Date().toISOString();
  return {
    id: overrides.id || generateEntryId(),
    habitId: overrides.habitId || 'habit-1',
    date: overrides.date || '2026-01-14',
    targetDose: overrides.targetDose ?? 10,
    actualValue: overrides.actualValue ?? 10,
    createdAt: overrides.createdAt || now,
    updatedAt: overrides.updatedAt || now,
    ...overrides,
  };
}

/**
 * Create multiple entries for a habit over a date range
 */
export function createEntriesForDays(
  habitId: string,
  startDate: string,
  days: number,
  options: {
    targetDose?: number;
    completionRate?: number; // 0-1, how often to complete
    valueGenerator?: (day: number, targetDose: number) => number;
  } = {}
): TestEntry[] {
  const { targetDose = 10, completionRate = 0.8, valueGenerator } = options;
  const entries: TestEntry[] = [];

  for (let i = 0; i < days; i++) {
    const date = addDays(startDate, i);
    const shouldComplete = Math.random() < completionRate;
    const actualValue = valueGenerator
      ? valueGenerator(i, targetDose)
      : shouldComplete
        ? targetDose
        : Math.floor(targetDose * 0.5);

    entries.push(
      createEntry({
        habitId,
        date,
        targetDose,
        actualValue,
      })
    );
  }

  return entries;
}

/**
 * Create app preferences with defaults
 */
export function createPreferences(
  overrides: Partial<TestPreferences> = {}
): TestPreferences {
  return {
    ...DEFAULT_PREFERENCES,
    ...overrides,
    notifications: {
      ...DEFAULT_PREFERENCES.notifications,
      ...overrides.notifications,
    },
  };
}

/**
 * Create complete app data structure
 */
export function createAppData(
  overrides: Partial<TestAppData> = {}
): TestAppData {
  return {
    schemaVersion: overrides.schemaVersion ?? CURRENT_SCHEMA_VERSION,
    habits: overrides.habits || [],
    entries: overrides.entries || [],
    preferences: createPreferences(overrides.preferences),
  };
}

// ============================================================================
// PREDEFINED SCENARIOS
// ============================================================================

/**
 * Empty app with onboarding completed
 */
export function createEmptyAppData(): TestAppData {
  return createAppData({
    habits: [],
    entries: [],
  });
}

/**
 * App with onboarding NOT completed (for onboarding tests)
 */
export function createFreshAppData(): TestAppData {
  return createAppData({
    habits: [],
    entries: [],
    preferences: createPreferences({ onboardingCompleted: false }),
  });
}

/**
 * Single increase habit with no entries
 */
export function createSingleIncreaseHabitData(
  habitOverrides: Partial<TestHabit> = {}
): TestAppData {
  const habit = createIncreaseHabit({
    name: 'Push-ups',
    emoji: '💪',
    startValue: 10,
    unit: 'repetitions',
    targetValue: 50,
    ...habitOverrides,
  });

  return createAppData({ habits: [habit] });
}

/**
 * Single decrease habit with no entries
 */
export function createSingleDecreaseHabitData(
  habitOverrides: Partial<TestHabit> = {}
): TestAppData {
  const habit = createDecreaseHabit({
    name: 'Cigarettes',
    emoji: '🚭',
    startValue: 10,
    unit: 'cigarettes',
    targetValue: 0,
    ...habitOverrides,
  });

  return createAppData({ habits: [habit] });
}

/**
 * Multiple habits of different types
 */
export function createMixedHabitsData(): TestAppData {
  resetCounters();

  return createAppData({
    habits: [
      createIncreaseHabit({
        name: 'Push-ups',
        emoji: '💪',
        startValue: 10,
        unit: 'repetitions',
        targetValue: 50,
      }),
      createDecreaseHabit({
        name: 'Sucre',
        emoji: '🍬',
        startValue: 5,
        unit: 'portions',
        targetValue: 1,
      }),
      createMaintainHabit({
        name: 'Eau',
        emoji: '💧',
        startValue: 8,
        unit: 'verres',
      }),
    ],
  });
}

/**
 * Habit with entries showing progress over time
 */
export function createHabitWithProgressData(
  days = 7
): TestAppData {
  resetCounters();

  const habit = createIncreaseHabit({
    name: 'Push-ups',
    emoji: '💪',
    startValue: 10,
    unit: 'repetitions',
    targetValue: 50,
    createdAt: '2026-01-01',
  });

  const entries = createEntriesForDays(habit.id, '2026-01-08', days, {
    targetDose: 10,
    completionRate: 0.9,
  });

  return createAppData({ habits: [habit], entries });
}

/**
 * Data for weekly review tests
 */
export function createWeeklyReviewDueData(): TestAppData {
  resetCounters();

  const habit = createIncreaseHabit({
    name: 'Push-ups',
    emoji: '💪',
    startValue: 10,
    unit: 'repetitions',
    createdAt: '2026-01-01',
  });

  // Create entries for the past week
  const entries = createEntriesForDays(habit.id, '2026-01-06', 7, {
    targetDose: 10,
    completionRate: 0.8,
  });

  return createAppData({
    habits: [habit],
    entries,
    preferences: createPreferences({
      lastWeeklyReviewDate: '2026-01-05', // 7+ days ago triggers review
    }),
  });
}

/**
 * Data for absence detection tests
 */
export function createAbsenceData(daysAbsent = 3): TestAppData {
  resetCounters();

  const habit = createIncreaseHabit({
    name: 'Push-ups',
    emoji: '💪',
    startValue: 10,
    unit: 'repetitions',
    createdAt: '2026-01-01',
  });

  // Last entry was daysAbsent ago
  const lastEntryDate = addDays('2026-01-14', -daysAbsent);
  const entries = [
    createEntry({
      habitId: habit.id,
      date: lastEntryDate,
      targetDose: 10,
      actualValue: 10,
    }),
  ];

  return createAppData({ habits: [habit], entries });
}

/**
 * Data for habit stacking tests
 */
export function createHabitStackingData(): TestAppData {
  resetCounters();

  const coffeeHabit = createMaintainHabit({
    id: 'habit-coffee',
    name: 'Cafe du matin',
    emoji: '☕',
    startValue: 1,
    unit: 'tasse',
    timeOfDay: 'morning',
  });

  const meditationHabit = createIncreaseHabit({
    id: 'habit-meditation',
    name: 'Meditation',
    emoji: '🧘',
    startValue: 5,
    unit: 'minutes',
    anchorHabitId: 'habit-coffee',
    timeOfDay: 'morning',
    implementationIntention: {
      trigger: 'Apres mon cafe',
      location: 'Salon',
    },
  });

  const journalHabit = createIncreaseHabit({
    id: 'habit-journal',
    name: 'Journal',
    emoji: '📝',
    startValue: 1,
    unit: 'pages',
    anchorHabitId: 'habit-meditation',
    timeOfDay: 'morning',
  });

  const sportHabit = createIncreaseHabit({
    id: 'habit-sport',
    name: 'Sport',
    emoji: '🏋️',
    startValue: 20,
    unit: 'minutes',
    timeOfDay: 'evening',
  });

  return createAppData({
    habits: [coffeeHabit, meditationHabit, journalHabit, sportHabit],
  });
}

/**
 * Data for planned pause tests
 */
export function createPlannedPauseData(): TestAppData {
  resetCounters();

  const habit = createIncreaseHabit({
    name: 'Push-ups',
    emoji: '💪',
    startValue: 10,
    unit: 'repetitions',
    plannedPause: {
      startDate: '2026-01-10',
      endDate: '2026-01-20',
      reason: 'Vacances',
    },
  });

  return createAppData({ habits: [habit] });
}

/**
 * Data for edit tests with anchor habit
 */
export function createEditTestData(): TestAppData {
  resetCounters();

  const anchorHabit = createMaintainHabit({
    id: 'habit-anchor',
    name: 'Cafe matinal',
    emoji: '☕',
    startValue: 1,
    unit: 'tasse',
  });

  const editableHabit = createIncreaseHabit({
    id: 'habit-edit-test',
    name: 'Push-ups test',
    emoji: '💪',
    startValue: 10,
    unit: 'repetitions',
    targetValue: 50,
    trackingMode: 'detailed',
    trackingFrequency: 'daily',
    entryMode: 'replace',
  });

  return createAppData({
    habits: [anchorHabit, editableHabit],
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Add days to a date string
 */
export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Get today's date as YYYY-MM-DD
 */
export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get date N days ago as YYYY-MM-DD
 */
export function getDaysAgo(days: number): string {
  return addDays(getToday(), -days);
}
