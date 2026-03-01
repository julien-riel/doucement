/**
 * E2E Tests for Export Reminder Banner
 * Tests the monthly export reminder that appears in Today view
 */
import { test, expect } from './base-test';
import {
  setupLocalStorage,
  createAppData,
  createIncreaseHabit,
  createEntriesForDays,
  addDays,
} from './fixtures';

const TODAY = '2026-03-01';
const SIXTY_DAYS_AGO = addDays(TODAY, -60);
const TWENTY_DAYS_AGO = addDays(TODAY, -20);

function createHabitWithOldEntries(lastExportReminder?: string | null) {
  const habit = createIncreaseHabit({
    id: 'habit-export',
    name: 'Push-ups',
    startValue: 10,
    unit: 'reps',
    createdAt: SIXTY_DAYS_AGO,
  });

  const entries = createEntriesForDays('habit-export', SIXTY_DAYS_AGO, 60, {
    targetDose: 10,
    completionRate: 1,
    valueGenerator: () => 10,
  });

  return createAppData({
    habits: [habit],
    entries,
    preferences: {
      onboardingCompleted: true,
      lastWeeklyReviewDate: null,
      notifications: {
        enabled: false,
        morningReminder: { enabled: true, time: '08:00' },
        eveningReminder: { enabled: false, time: '20:00' },
        weeklyReviewReminder: { enabled: false, time: '10:00' },
      },
      lastExportReminder: lastExportReminder,
    },
  });
}

test.describe('Export Reminder Banner', () => {
  test('shows banner when no export reminder date and entries older than 30 days', async ({
    page,
  }) => {
    const testData = createHabitWithOldEntries(undefined);
    await setupLocalStorage(page, testData);
    await page.goto('/');

    await expect(page.locator('.export-reminder')).toBeVisible();
    await expect(page.locator('.export-reminder__message')).toContainText(
      'sauvegarder tes données'
    );
  });

  test('does not show banner when export reminder was recent', async ({ page }) => {
    const testData = createHabitWithOldEntries(TWENTY_DAYS_AGO);
    await setupLocalStorage(page, testData);
    await page.goto('/');

    await expect(page.locator('.export-reminder')).not.toBeVisible();
  });

  test('shows banner when export reminder is older than 30 days', async ({ page }) => {
    const testData = createHabitWithOldEntries(SIXTY_DAYS_AGO);
    await setupLocalStorage(page, testData);
    await page.goto('/');

    await expect(page.locator('.export-reminder')).toBeVisible();
  });

  test('clicking "Later" hides the banner', async ({ page }) => {
    const testData = createHabitWithOldEntries(undefined);
    await setupLocalStorage(page, testData);
    await page.goto('/');

    await expect(page.locator('.export-reminder')).toBeVisible();

    await page.getByRole('button', { name: 'Plus tard' }).click();

    await expect(page.locator('.export-reminder')).not.toBeVisible();
  });

  test('clicking "Later" updates lastExportReminder in localStorage', async ({ page }) => {
    const testData = createHabitWithOldEntries(undefined);
    await setupLocalStorage(page, testData);
    await page.goto('/');

    await page.getByRole('button', { name: 'Plus tard' }).click();

    // Wait a moment for localStorage to be updated
    await page.waitForTimeout(600);

    const storedData = await page.evaluate(() => {
      const raw = localStorage.getItem('doucement_data');
      return raw ? JSON.parse(raw) : null;
    });

    expect(storedData.preferences.lastExportReminder).toBeTruthy();
  });

  test('does not show banner with no habits', async ({ page }) => {
    const testData = createAppData({
      habits: [],
      entries: [],
    });
    await setupLocalStorage(page, testData);
    await page.goto('/');

    await expect(page.locator('.export-reminder')).not.toBeVisible();
  });

  test('does not show banner when entries are recent (less than 30 days)', async ({ page }) => {
    const habit = createIncreaseHabit({
      id: 'habit-recent',
      name: 'Meditation',
      startValue: 5,
      unit: 'min',
      createdAt: TWENTY_DAYS_AGO,
    });

    const entries = createEntriesForDays('habit-recent', TWENTY_DAYS_AGO, 20, {
      targetDose: 5,
      completionRate: 1,
      valueGenerator: () => 5,
    });

    const testData = createAppData({
      habits: [habit],
      entries,
    });
    await setupLocalStorage(page, testData);
    await page.goto('/');

    await expect(page.locator('.export-reminder')).not.toBeVisible();
  });

  test('banner is internationalized in French', async ({ page }) => {
    const testData = createHabitWithOldEntries(undefined);
    await setupLocalStorage(page, testData, 'fr');
    await page.goto('/');

    await expect(page.locator('.export-reminder__message')).toContainText(
      'sauvegarder tes données'
    );
    await expect(page.getByRole('button', { name: 'Exporter' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Plus tard' })).toBeVisible();
  });

  test('banner is internationalized in English', async ({ page }) => {
    const testData = createHabitWithOldEntries(undefined);
    await setupLocalStorage(page, testData, 'en');
    await page.goto('/');

    await expect(page.locator('.export-reminder__message')).toContainText(
      'back up your data'
    );
    await expect(page.getByRole('button', { name: 'Export' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Later' })).toBeVisible();
  });
});
