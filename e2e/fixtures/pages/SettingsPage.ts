/**
 * Page Object for the Settings page
 * Encapsulates interactions with settings, import/export, theme, language
 */

import { Page, Locator, expect, Download } from '@playwright/test';
import * as path from 'path';

export class SettingsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly dataSection: Locator;
  readonly exportButton: Locator;
  readonly importButton: Locator;
  readonly themeSection: Locator;
  readonly languageSection: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Paramètres' });
    this.dataSection = page.locator('.settings-section, .data-section').first();
    // Use "Exporter maintenant" / "Export now" - the button that triggers download
    this.exportButton = page.getByRole('button', { name: /Exporter maintenant|Export now/i });
    this.importButton = page.locator('input[type="file"]');
    this.themeSection = page.locator('.theme-section, .settings-section').filter({ hasText: /Thème|Theme/ });
    this.languageSection = page.locator('.language-section, .settings-section').filter({ hasText: /Langue|Language/ });
  }

  /**
   * Navigate to the Settings page
   */
  async goto(): Promise<void> {
    await this.page.goto('/settings');
    await this.page.waitForSelector('.page-settings');
  }

  /**
   * Verify the page is loaded
   */
  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
  }

  // ============================================================================
  // EXPORT FUNCTIONALITY
  // ============================================================================

  /**
   * Export data and return the download
   */
  async exportData(): Promise<Download> {
    const downloadPromise = this.page.waitForEvent('download');
    await this.exportButton.click();
    return downloadPromise;
  }

  /**
   * Export data and save to a path, return the path
   */
  async exportDataToPath(downloadDir: string): Promise<string> {
    const download = await this.exportData();
    const suggestedFilename = download.suggestedFilename();
    const filePath = path.join(downloadDir, suggestedFilename);
    await download.saveAs(filePath);
    return filePath;
  }

  /**
   * Export data and get the JSON content
   */
  async exportDataAsJson(): Promise<unknown> {
    const download = await this.exportData();
    const stream = await download.createReadStream();

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => {
        const content = Buffer.concat(chunks).toString('utf-8');
        try {
          resolve(JSON.parse(content));
        } catch (e) {
          reject(new Error('Invalid JSON in export'));
        }
      });
      stream.on('error', reject);
    });
  }

  // ============================================================================
  // IMPORT FUNCTIONALITY
  // ============================================================================

  /**
   * Import data from a file path
   */
  async importData(filePath: string): Promise<void> {
    // Find the file input
    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
  }

  /**
   * Import data and expect success
   */
  async importDataAndExpectSuccess(filePath: string): Promise<void> {
    await this.importData(filePath);
    // Wait for success message or data to load
    await expect(
      this.page.getByText(/importé|succès|chargé/i)
    ).toBeVisible({ timeout: 5000 });
  }

  /**
   * Import data and expect error
   */
  async importDataAndExpectError(filePath: string): Promise<void> {
    await this.importData(filePath);
    // Wait for error message
    await expect(
      this.page.getByText(/erreur|invalide|échoué/i)
    ).toBeVisible({ timeout: 5000 });
  }

  // ============================================================================
  // THEME
  // ============================================================================

  /**
   * Get current theme
   */
  async getCurrentTheme(): Promise<string> {
    // Check which radio is checked
    const lightRadio = this.page.getByRole('radio', { name: /Clair|Light/i });
    const darkRadio = this.page.getByRole('radio', { name: /Sombre|Dark/i });
    const systemRadio = this.page.getByRole('radio', { name: /Système|System/i });

    if (await lightRadio.isChecked()) return 'light';
    if (await darkRadio.isChecked()) return 'dark';
    if (await systemRadio.isChecked()) return 'system';

    return 'unknown';
  }

  /**
   * Set theme
   */
  async setTheme(theme: 'light' | 'dark' | 'system'): Promise<void> {
    const radioName = {
      light: /Clair|Light/i,
      dark: /Sombre|Dark/i,
      system: /Système|System/i,
    }[theme];

    await this.page.getByRole('radio', { name: radioName }).click();
  }

  /**
   * Expect theme to be set
   */
  async expectTheme(theme: 'light' | 'dark' | 'system'): Promise<void> {
    const currentTheme = await this.getCurrentTheme();
    expect(currentTheme).toBe(theme);
  }

  // ============================================================================
  // LANGUAGE
  // ============================================================================

  /**
   * Set language
   */
  async setLanguage(language: 'fr' | 'en'): Promise<void> {
    const buttonName = {
      fr: /Français/i,
      en: /English/i,
    }[language];

    await this.page.getByRole('button', { name: buttonName }).click();
  }

  /**
   * Expect UI to be in a specific language
   */
  async expectLanguage(language: 'fr' | 'en'): Promise<void> {
    if (language === 'fr') {
      await expect(this.page.getByText('Paramètres')).toBeVisible();
    } else {
      await expect(this.page.getByText('Settings')).toBeVisible();
    }
  }

  // ============================================================================
  // DATA STATS
  // ============================================================================

  /**
   * Get displayed habit count
   */
  async getHabitCount(): Promise<number> {
    const text = await this.page.getByText(/habitude/i).first().textContent();
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Get displayed entry count
   */
  async getEntryCount(): Promise<number> {
    const text = await this.page.getByText(/entrée|entry/i).first().textContent();
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  /**
   * Go back to home
   */
  async goBack(): Promise<void> {
    await this.page.getByRole('button', { name: /Retour|Back/ }).click();
  }
}
