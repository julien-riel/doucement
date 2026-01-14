/**
 * E2E Test Fixtures Index
 * Centralizes all fixtures, helpers, and page objects
 *
 * @example
 * import {
 *   // Data factories
 *   createAppData,
 *   createIncreaseHabit,
 *   createSingleIncreaseHabitData,
 *
 *   // Setup helpers
 *   setupLocalStorage,
 *   closeCelebrationModalIfVisible,
 *
 *   // Page Objects
 *   TodayPage,
 *   SettingsPage,
 * } from './fixtures';
 */

// Test data factories
export {
  // Types
  type TestHabit,
  type TestEntry,
  type TestPreferences,
  type TestAppData,

  // Utility functions
  resetCounters,
  generateHabitId,
  generateEntryId,
  addDays,
  getToday,
  getDaysAgo,

  // Habit factories
  createHabit,
  createIncreaseHabit,
  createDecreaseHabit,
  createMaintainHabit,
  createCounterHabit,
  createWeeklyHabit,

  // Entry factories
  createEntry,
  createEntriesForDays,

  // App data factories
  createPreferences,
  createAppData,

  // Predefined scenarios
  createEmptyAppData,
  createFreshAppData,
  createSingleIncreaseHabitData,
  createSingleDecreaseHabitData,
  createMixedHabitsData,
  createHabitWithProgressData,
  createWeeklyReviewDueData,
  createAbsenceData,
  createHabitStackingData,
  createPlannedPauseData,
  createEditTestData,
} from './test-data';

// Setup helpers
export {
  // LocalStorage
  setupLocalStorage,
  setupFreshLocalStorage,
  setupFromTestFile,
  setupLocalStorageForPersistence,

  // Navigation
  gotoAndWait,
  gotoToday,
  gotoHabitEdit,
  gotoHabitDetail,

  // Modals
  closeCelebrationModalIfVisible,
  closeWelcomeBackIfVisible,
  closeBlockingModals,

  // Wizard
  completeHabitWizard,
  type WizardHabitOptions,

  // Check-in
  checkInDone,
  checkInPartial,
  checkInExceeded,

  // Forms
  fillField,
  selectOption,

  // Assertions
  getCompletionPercentage,
  isHabitVisible,
} from './setup'

// Page Objects
export {
  TodayPage,
  SettingsPage,
  EditHabitPage,
  CreateHabitPage,
  StatisticsPage,
  WeeklyReviewPage,
} from './pages'
