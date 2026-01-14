import { test as base } from '@playwright/test';

/**
 * Base test fixture that sets French as the default language.
 * All E2E tests should import { test, expect } from this file instead of @playwright/test
 *
 * For test data and setup helpers, import from './fixtures':
 * @example
 * import { test, expect } from './base-test';
 * import { setupLocalStorage, createSingleIncreaseHabitData, TodayPage } from './fixtures';
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // Set French as the default language before any page navigation
    await page.addInitScript(() => {
      localStorage.setItem('doucement-language', 'fr');
    });
    await use(page);
  },
});

export { expect } from '@playwright/test';
