/**
 * Helper functions for E2E test setup
 * Centralizes localStorage initialization and common setup patterns
 */

import { Page } from '@playwright/test';
import { TestAppData } from './test-data';

// ============================================================================
// LOCALSTORAGE SETUP
// ============================================================================

/**
 * Setup localStorage with app data before page load
 * This must be called BEFORE page.goto()
 *
 * @example
 * await setupLocalStorage(page, createSingleIncreaseHabitData());
 * await page.goto('/');
 */
export async function setupLocalStorage(
  page: Page,
  data: TestAppData,
  language: 'fr' | 'en' = 'fr'
): Promise<void> {
  await page.addInitScript(
    ({ data, language }) => {
      localStorage.clear();
      localStorage.setItem('doucement-language', language);
      localStorage.setItem('doucement_data', JSON.stringify(data));
    },
    { data, language }
  );
}

/**
 * Setup localStorage for onboarding tests (fresh state)
 */
export async function setupFreshLocalStorage(
  page: Page,
  language: 'fr' | 'en' = 'fr'
): Promise<void> {
  await page.addInitScript(
    ({ language }) => {
      localStorage.clear();
      localStorage.setItem('doucement-language', language);
    },
    { language }
  );
}

/**
 * Setup localStorage with custom data from JSON file
 */
export async function setupFromTestFile(
  page: Page,
  filename: string,
  language: 'fr' | 'en' = 'fr'
): Promise<TestAppData> {
  const testDataResponse = await page.request.get(
    `http://localhost:4173/test-data/${filename}`
  );
  const testData = await testDataResponse.json();

  await setupLocalStorage(page, testData, language);
  return testData;
}

// ============================================================================
// COMMON NAVIGATION HELPERS
// ============================================================================

/**
 * Navigate to page and wait for it to load
 */
export async function gotoAndWait(
  page: Page,
  path: string,
  waitSelector?: string
): Promise<void> {
  await page.goto(path);
  if (waitSelector) {
    await page.waitForSelector(waitSelector);
  }
}

/**
 * Navigate to Today page and wait for habits to load
 */
export async function gotoToday(
  page: Page,
  habitName?: string
): Promise<void> {
  await page.goto('/');
  if (habitName) {
    await page.waitForSelector(`h3:has-text("${habitName}")`);
  }
}

/**
 * Navigate to habit edit page
 */
export async function gotoHabitEdit(
  page: Page,
  habitId: string
): Promise<void> {
  await page.goto(`/habits/${habitId}/edit`);
  await page.waitForSelector('text=Modifier l\'habitude');
}

/**
 * Navigate to habit detail page
 */
export async function gotoHabitDetail(
  page: Page,
  habitId: string
): Promise<void> {
  await page.goto(`/habits/${habitId}`);
}

// ============================================================================
// MODAL HELPERS
// ============================================================================

/**
 * Close celebration modal if visible
 */
export async function closeCelebrationModalIfVisible(
  page: Page
): Promise<void> {
  const celebrationModal = page.locator(
    '[role="dialog"][aria-modal="true"].celebration-overlay'
  );

  if (await celebrationModal.isVisible().catch(() => false)) {
    await page.getByRole('button', { name: 'Continuer' }).click();
    // Wait for modal to close
    await celebrationModal.waitFor({ state: 'hidden' }).catch(() => {});
  }
}

/**
 * Close welcome back message if visible
 */
export async function closeWelcomeBackIfVisible(page: Page): Promise<void> {
  const welcomeBack = page.locator('.welcome-back');

  if (await welcomeBack.isVisible().catch(() => false)) {
    const closeButton = welcomeBack.getByRole('button', { name: /fermer|ok/i });
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click();
    }
  }
}

/**
 * Close any blocking modal (celebration, welcome back, etc.)
 */
export async function closeBlockingModals(page: Page): Promise<void> {
  await closeCelebrationModalIfVisible(page);
  await closeWelcomeBackIfVisible(page);
}

// ============================================================================
// HABIT CREATION WIZARD HELPERS
// ============================================================================

export interface WizardHabitOptions {
  name: string;
  emoji?: string;
  unit: string;
  startValue: number;
  direction?: 'increase' | 'decrease' | 'maintain';
  trackingMode?: 'simple' | 'detailed' | 'counter';
  skipFirstCheckIn?: boolean;
}

/**
 * Complete the habit creation wizard
 * Starts from /create page
 */
export async function completeHabitWizard(
  page: Page,
  options: WizardHabitOptions
): Promise<void> {
  const {
    name,
    unit,
    startValue,
    direction = 'increase',
    skipFirstCheckIn = true,
  } = options;

  // Step 1: Choose (skip suggestions, go custom)
  await page.getByRole('button', { name: /Créer une habitude personnalisée/ }).click();

  // Step 2: Type selection
  const directionButton = {
    increase: /Augmenter/,
    decrease: /Réduire/,
    maintain: /Maintenir/,
  }[direction];
  await page.getByRole('button', { name: directionButton }).click();
  await page.getByRole('button', { name: 'Continuer' }).click();

  // Step 3: Details
  await page.getByRole('textbox', { name: 'Nom de l\'habitude' }).fill(name);
  await page.getByRole('textbox', { name: 'Unité' }).fill(unit);
  await page.getByRole('spinbutton', { name: 'Dose de départ' }).fill(String(startValue));
  await page.getByRole('button', { name: 'Continuer' }).click();

  // Step 4: Intentions (skip)
  await page.getByRole('button', { name: 'Continuer' }).click();

  // Step 5: Identity (skip)
  await page.getByRole('button', { name: 'Aperçu' }).click();

  // Step 6: Confirm
  await page.getByRole('button', { name: 'Créer l\'habitude' }).click();

  // Step 7: First check-in
  await page.waitForSelector('text=Première victoire ?');
  if (skipFirstCheckIn) {
    await page.getByRole('button', { name: 'Non, je commence demain' }).click();
  } else {
    await page.getByRole('button', { name: 'Oui, c\'est fait !' }).click();
  }
}

// ============================================================================
// CHECK-IN HELPERS
// ============================================================================

/**
 * Perform a "Fait!" check-in on a habit
 */
export async function checkInDone(page: Page, habitName?: string): Promise<void> {
  if (habitName) {
    const habitCard = page.locator('.habit-card', { hasText: habitName });
    await habitCard.getByRole('button', { name: 'Fait !' }).click();
  } else {
    await page.getByRole('button', { name: 'Fait !' }).first().click();
  }
}

/**
 * Perform a partial check-in with specific value
 */
export async function checkInPartial(
  page: Page,
  value: number,
  habitName?: string
): Promise<void> {
  if (habitName) {
    const habitCard = page.locator('.habit-card', { hasText: habitName });
    await habitCard.getByRole('button', { name: 'Un peu' }).click();
  } else {
    await page.getByRole('button', { name: 'Un peu' }).first().click();
  }

  await page.getByRole('spinbutton').fill(String(value));
  await page.getByRole('button', { name: 'Valider' }).click();
}

/**
 * Perform an "Encore +" check-in with specific value
 */
export async function checkInExceeded(
  page: Page,
  value: number,
  habitName?: string
): Promise<void> {
  if (habitName) {
    const habitCard = page.locator('.habit-card', { hasText: habitName });
    await habitCard.getByRole('button', { name: 'Encore +' }).click();
  } else {
    await page.getByRole('button', { name: 'Encore +' }).first().click();
  }

  await page.getByRole('spinbutton').fill(String(value));
  await page.getByRole('button', { name: 'Valider' }).click();
}

// ============================================================================
// FORM HELPERS
// ============================================================================

/**
 * Fill and submit a form field
 */
export async function fillField(
  page: Page,
  label: string | RegExp,
  value: string
): Promise<void> {
  await page.getByRole('textbox', { name: label }).fill(value);
}

/**
 * Select an option in a dropdown
 */
export async function selectOption(
  page: Page,
  label: string | RegExp,
  value: string
): Promise<void> {
  await page.getByLabel(label).selectOption(value);
}

// ============================================================================
// PERSISTENCE TEST HELPERS
// ============================================================================

/**
 * Setup localStorage for persistence tests
 * Unlike setupLocalStorage, this does NOT use addInitScript,
 * so subsequent page.reload() calls will preserve the localStorage state.
 *
 * Usage:
 * 1. Call setupLocalStorageForPersistence(page, data)
 * 2. This will set localStorage and navigate to the specified path
 * 3. After this, any changes made by the app will persist across reload()
 *
 * @example
 * await setupLocalStorageForPersistence(page, testData);
 * // Now the page is loaded and any further reload() will preserve state
 */
export async function setupLocalStorageForPersistence(
  page: Page,
  data: TestAppData,
  options: {
    language?: 'fr' | 'en';
    path?: string;
    waitSelector?: string;
  } = {}
): Promise<void> {
  const { language = 'fr', path = '/', waitSelector } = options;

  // Navigate to any page first to establish the origin for localStorage
  // Using about:blank won't work since localStorage is origin-based
  await page.goto(path, { waitUntil: 'commit' });

  // Set localStorage via page.evaluate (NOT addInitScript)
  // This happens before the page fully loads
  await page.evaluate(
    ({ data, language }) => {
      localStorage.clear();
      localStorage.setItem('doucement-language', language);
      localStorage.setItem('doucement_data', JSON.stringify(data));
    },
    { data, language }
  );

  // Navigate again to let the app read the localStorage data properly
  // This is more reliable than reload because it ensures we go to the right path
  await page.goto(path);

  // Wait for content if specified
  if (waitSelector) {
    await page.waitForSelector(waitSelector);
  }
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

/**
 * Get completion percentage from the page
 */
export async function getCompletionPercentage(page: Page): Promise<number> {
  const statusText = await page
    .getByRole('status', { name: /complété/ })
    .textContent();
  const match = statusText?.match(/(\d+)%/);
  return match ? parseInt(match[1]) : 0;
}

/**
 * Check if a habit is visible on the Today page
 */
export async function isHabitVisible(
  page: Page,
  habitName: string
): Promise<boolean> {
  return page.getByRole('heading', { name: habitName }).isVisible();
}
