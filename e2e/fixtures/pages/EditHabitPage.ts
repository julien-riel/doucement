/**
 * Page Object for the Edit Habit page
 * Encapsulates interactions with the habit editing form
 */

import { Page, Locator, expect } from '@playwright/test';

export class EditHabitPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly nameInput: Locator;
  readonly descriptionInput: Locator;
  readonly emojiPicker: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: "Modifier l'habitude" });
    this.nameInput = page.getByRole('textbox', { name: "Nom de l'habitude" });
    this.descriptionInput = page.getByRole('textbox', { name: /Description/ });
    this.emojiPicker = page.locator('.emoji-picker__trigger');
    this.saveButton = page.getByRole('button', { name: 'Enregistrer' });
    this.cancelButton = page.locator('.edit-habit__footer').getByRole('button', { name: 'Annuler' });
    this.backButton = page.getByRole('button', { name: 'Annuler et retourner' });
  }

  /**
   * Navigate to the edit page for a habit
   */
  async goto(habitId: string): Promise<void> {
    await this.page.goto(`/habits/${habitId}/edit`);
    await this.page.waitForSelector("text=Modifier l'habitude");
  }

  /**
   * Verify the page is loaded
   */
  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.nameInput).toBeVisible();
  }

  // ============================================================================
  // BASIC FIELDS
  // ============================================================================

  /**
   * Get the current name
   */
  async getName(): Promise<string> {
    return this.nameInput.inputValue();
  }

  /**
   * Set the habit name
   */
  async setName(name: string): Promise<void> {
    await this.nameInput.clear();
    await this.nameInput.fill(name);
  }

  /**
   * Set the description
   */
  async setDescription(description: string): Promise<void> {
    await this.descriptionInput.fill(description);
  }

  /**
   * Get current emoji
   */
  async getEmoji(): Promise<string> {
    return this.page.locator('.emoji-picker__current').textContent() || '';
  }

  /**
   * Change emoji by selecting the nth option
   */
  async selectEmoji(index: number): Promise<void> {
    await this.emojiPicker.click();
    await expect(this.page.locator('.emoji-picker__dropdown')).toBeVisible();
    const emojiButtons = this.page.locator('.emoji-picker__dropdown button.epr-emoji');
    await emojiButtons.nth(index).click();
    await expect(this.page.locator('.emoji-picker__dropdown')).not.toBeVisible();
  }

  // ============================================================================
  // TRACKING OPTIONS
  // ============================================================================

  /**
   * Get tracking frequency option
   */
  getFrequencyOption(frequency: 'daily' | 'weekly'): Locator {
    const label = frequency === 'daily' ? 'Quotidien' : 'Hebdomadaire';
    return this.page.locator('.edit-habit__frequency-option').filter({ hasText: label });
  }

  /**
   * Set tracking frequency
   */
  async setFrequency(frequency: 'daily' | 'weekly'): Promise<void> {
    await this.getFrequencyOption(frequency).click();
  }

  /**
   * Expect frequency to be selected
   */
  async expectFrequency(frequency: 'daily' | 'weekly'): Promise<void> {
    await expect(this.getFrequencyOption(frequency)).toHaveAttribute('aria-pressed', 'true');
  }

  /**
   * Get tracking mode option
   */
  getTrackingModeOption(mode: 'simple' | 'detailed'): Locator {
    const label = mode === 'simple' ? 'Simple' : 'Détaillé';
    return this.page.locator('.edit-habit__tracking-mode-option').filter({ hasText: label });
  }

  /**
   * Set tracking mode
   */
  async setTrackingMode(mode: 'simple' | 'detailed'): Promise<void> {
    await this.getTrackingModeOption(mode).click();
  }

  /**
   * Expect tracking mode to be selected
   */
  async expectTrackingMode(mode: 'simple' | 'detailed'): Promise<void> {
    await expect(this.getTrackingModeOption(mode)).toHaveAttribute('aria-pressed', 'true');
  }

  /**
   * Get entry mode option
   */
  getEntryModeOption(mode: 'replace' | 'cumulative'): Locator {
    const label = mode === 'replace' ? 'Remplacer' : 'Cumuler';
    return this.page.locator('.edit-habit__entry-mode-option').filter({ hasText: label });
  }

  /**
   * Set entry mode
   */
  async setEntryMode(mode: 'replace' | 'cumulative'): Promise<void> {
    await this.getEntryModeOption(mode).click();
  }

  /**
   * Expect entry mode to be selected
   */
  async expectEntryMode(mode: 'replace' | 'cumulative'): Promise<void> {
    await expect(this.getEntryModeOption(mode)).toHaveAttribute('aria-pressed', 'true');
  }

  // ============================================================================
  // IDENTITY STATEMENT
  // ============================================================================

  /**
   * Get identity input
   */
  get identityInput(): Locator {
    return this.page.getByRole('textbox', { name: /Je deviens quelqu'un qui/ });
  }

  /**
   * Set identity statement
   */
  async setIdentityStatement(statement: string): Promise<void> {
    await this.identityInput.fill(statement);
  }

  /**
   * Select identity suggestion by index
   */
  async selectIdentitySuggestion(index: number): Promise<void> {
    const suggestion = this.page.locator('.edit-habit__identity-suggestion').nth(index);
    await suggestion.click();
  }

  /**
   * Expect identity preview to show specific text
   */
  async expectIdentityPreview(text: string): Promise<void> {
    await expect(this.page.getByText(`« Je deviens quelqu'un qui ${text} »`)).toBeVisible();
  }

  // ============================================================================
  // HABIT STACKING
  // ============================================================================

  /**
   * Check if habit stacking section is visible
   */
  async isHabitStackingVisible(): Promise<boolean> {
    return this.page.getByText("Enchaînement d'habitudes").isVisible();
  }

  /**
   * Get anchor habit selector
   */
  get anchorSelector(): Locator {
    return this.page.locator('.edit-habit__select');
  }

  /**
   * Select anchor habit
   */
  async selectAnchorHabit(habitId: string): Promise<void> {
    await this.anchorSelector.selectOption(habitId);
  }

  /**
   * Get available anchor options
   */
  async getAnchorOptions(): Promise<string[]> {
    return this.anchorSelector.locator('option').allTextContents();
  }

  // ============================================================================
  // PROGRESSION
  // ============================================================================

  /**
   * Check if progression section is visible
   */
  async isProgressionVisible(): Promise<boolean> {
    return this.page.locator('.edit-habit__progression-section').isVisible();
  }

  /**
   * Set progression value
   */
  async setProgressionValue(value: number): Promise<void> {
    const input = this.page.locator('.edit-habit__progression-section').getByRole('spinbutton');
    await input.clear();
    await input.fill(String(value));
  }

  /**
   * Set progression mode
   */
  async setProgressionMode(mode: 'absolute' | 'percentage'): Promise<void> {
    const buttonName = mode === 'absolute' ? 'Unités' : 'En %';
    await this.page.locator('.edit-habit__progression-section').getByRole('button', { name: buttonName }).click();
  }

  // ============================================================================
  // ACTIONS
  // ============================================================================

  /**
   * Save changes
   */
  async save(): Promise<void> {
    await this.saveButton.click();
  }

  /**
   * Save and expect success
   */
  async saveAndExpectSuccess(): Promise<void> {
    await this.save();
    await expect(this.page.getByText('Modification enregistrée.')).toBeVisible();
  }

  /**
   * Cancel editing
   */
  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  /**
   * Go back
   */
  async goBack(): Promise<void> {
    await this.backButton.click();
  }

  /**
   * Expect save button to be enabled
   */
  async expectSaveEnabled(): Promise<void> {
    await expect(this.saveButton).toBeEnabled();
  }

  /**
   * Expect save button to be disabled
   */
  async expectSaveDisabled(): Promise<void> {
    await expect(this.saveButton).toBeDisabled();
  }
}
