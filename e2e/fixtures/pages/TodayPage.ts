/**
 * Page Object for the Today (home) page
 * Encapsulates interactions with the main habit tracking view
 */

import { Page, Locator, expect } from '@playwright/test';

export class TodayPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly completionStatus: Locator;
  readonly habitCards: Locator;
  readonly createHabitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 2, name: "Aujourd'hui" });
    this.completionStatus = page.getByRole('status', { name: /complété/ });
    this.habitCards = page.locator('.habit-card');
    this.createHabitButton = page.getByRole('link', { name: /Créer|Ajouter/ });
  }

  /**
   * Navigate to the Today page
   */
  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  /**
   * Navigate and wait for a specific habit to be visible
   */
  async gotoAndWaitForHabit(habitName: string): Promise<void> {
    await this.page.goto('/');
    await this.page.waitForSelector(`h3:has-text("${habitName}")`);
  }

  /**
   * Get a habit card by name
   */
  getHabitCard(habitName: string): Locator {
    return this.habitCards.filter({ hasText: habitName });
  }

  /**
   * Get the habit heading
   */
  getHabitHeading(habitName: string): Locator {
    return this.page.getByRole('heading', { name: habitName });
  }

  /**
   * Get completion percentage
   */
  async getCompletionPercentage(): Promise<number> {
    const text = await this.completionStatus.textContent();
    const match = text?.match(/(\d+)%/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Check if a habit is visible
   */
  async isHabitVisible(habitName: string): Promise<boolean> {
    return this.getHabitHeading(habitName).isVisible();
  }

  /**
   * Perform "Fait!" check-in
   */
  async checkInDone(habitName?: string): Promise<void> {
    const container = habitName ? this.getHabitCard(habitName) : this.page;
    await container.getByRole('button', { name: 'Fait !' }).click();
  }

  /**
   * Perform "Un peu" check-in with a specific value
   */
  async checkInPartial(value: number, habitName?: string): Promise<void> {
    const container = habitName ? this.getHabitCard(habitName) : this.page;
    await container.getByRole('button', { name: 'Un peu' }).click();
    await this.page.getByRole('spinbutton').fill(String(value));
    await this.page.getByRole('button', { name: 'Valider' }).click();
  }

  /**
   * Perform "Encore +" check-in with a specific value
   */
  async checkInExceeded(value: number, habitName?: string): Promise<void> {
    const container = habitName ? this.getHabitCard(habitName) : this.page;
    await container.getByRole('button', { name: 'Encore +' }).click();
    await this.page.getByRole('spinbutton').fill(String(value));
    await this.page.getByRole('button', { name: 'Valider' }).click();
  }

  /**
   * Cancel an in-progress check-in
   */
  async cancelCheckIn(): Promise<void> {
    await this.page.getByRole('button', { name: 'Annuler' }).click();
  }

  /**
   * Verify the page is loaded
   */
  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.completionStatus).toBeVisible();
  }

  /**
   * Verify a habit has "Complété" status
   */
  async expectHabitCompleted(habitName: string): Promise<void> {
    const card = this.getHabitCard(habitName);
    await expect(card.getByText('Complété')).toBeVisible();
  }

  /**
   * Verify completion percentage
   */
  async expectCompletionPercentage(percentage: number): Promise<void> {
    await expect(this.completionStatus).toContainText(`${percentage}%`);
  }

  /**
   * Get check-in buttons for a habit
   */
  getCheckInButtons(habitName: string): {
    unPeu: Locator;
    fait: Locator;
    encorePlus: Locator;
  } {
    const card = this.getHabitCard(habitName);
    return {
      unPeu: card.getByRole('button', { name: 'Un peu' }),
      fait: card.getByRole('button', { name: 'Fait !' }),
      encorePlus: card.getByRole('button', { name: 'Encore +' }),
    };
  }

  /**
   * Navigate to habits list
   */
  async goToHabitsList(): Promise<void> {
    await this.page.getByRole('link', { name: 'Habitudes' }).click();
    await expect(this.page).toHaveURL('/habits');
  }

  /**
   * Navigate to settings
   */
  async goToSettings(): Promise<void> {
    await this.page.getByRole('link', { name: 'Paramètres' }).click();
    await expect(this.page).toHaveURL('/settings');
  }

  /**
   * Navigate to statistics
   */
  async goToStatistics(): Promise<void> {
    await this.page.getByRole('link', { name: 'Statistiques' }).click();
    await expect(this.page).toHaveURL('/statistics');
  }
}
