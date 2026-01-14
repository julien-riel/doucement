/**
 * Page Object for the Weekly Review page
 * Encapsulates interactions with the weekly summary, stats, and reflection
 */

import { Page, Locator, expect } from '@playwright/test'

export class WeeklyReviewPage {
  readonly page: Page
  readonly heading: Locator
  readonly subtitle: Locator
  readonly encouragementMessage: Locator
  readonly globalStats: Locator
  readonly weekCalendar: Locator
  readonly habitCards: Locator
  readonly patternsSection: Locator
  readonly reflectionSection: Locator
  readonly continueButton: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'Ta semaine en résumé' })
    this.subtitle = page.locator('.weekly-review__subtitle')
    this.encouragementMessage = page.locator('.weekly-review__message')
    this.globalStats = page.locator('.weekly-review__global-stats')
    this.weekCalendar = page.locator('.weekly-review__calendar-wrapper')
    this.habitCards = page.locator('.weekly-review__habit-card')
    this.patternsSection = page.locator('.pattern-insights')
    this.reflectionSection = page.locator('.weekly-reflection')
    this.continueButton = page.getByRole('button', { name: 'Continuer' })
  }

  /**
   * Navigate to the weekly review page
   */
  async goto(): Promise<void> {
    await this.page.goto('/review')
  }

  /**
   * Verify the page is loaded
   */
  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible()
    await expect(this.subtitle).toBeVisible()
  }

  /**
   * Verify the page shows empty state (no habits)
   */
  async expectEmptyState(): Promise<void> {
    await expect(this.page.getByText("Pas encore d'habitudes")).toBeVisible()
    await expect(this.page.getByRole('button', { name: 'Créer une habitude' })).toBeVisible()
  }

  // ============================================================================
  // DATE RANGE
  // ============================================================================

  /**
   * Get the date range text
   */
  async getDateRange(): Promise<string | null> {
    return this.subtitle.textContent()
  }

  /**
   * Verify date range is displayed
   */
  async expectDateRangeVisible(): Promise<void> {
    await expect(this.subtitle).toBeVisible()
    const text = await this.subtitle.textContent()
    // Format: "X - Y mois"
    expect(text).toMatch(/\d+\s*-\s*\d+\s+\w+/)
  }

  // ============================================================================
  // ENCOURAGEMENT MESSAGE
  // ============================================================================

  /**
   * Verify encouragement message is visible
   */
  async expectEncouragementVisible(): Promise<void> {
    await expect(this.encouragementMessage).toBeVisible()
    await expect(this.page.getByText('🌱')).toBeVisible()
  }

  /**
   * Get the encouragement message text
   */
  async getEncouragementMessage(): Promise<string | null> {
    return this.page.locator('.weekly-review__message-text').textContent()
  }

  // ============================================================================
  // IDENTITY REMINDERS
  // ============================================================================

  /**
   * Verify identity reminders section is visible
   */
  async expectIdentityRemindersVisible(): Promise<void> {
    const identityCards = this.page.locator('.weekly-review__identity-card')
    await expect(identityCards.first()).toBeVisible()
  }

  /**
   * Get all identity reminder texts
   */
  async getIdentityReminders(): Promise<string[]> {
    const cards = this.page.locator('.weekly-review__identity-text')
    const count = await cards.count()
    const texts: string[] = []
    for (let i = 0; i < count; i++) {
      const text = await cards.nth(i).textContent()
      if (text) texts.push(text)
    }
    return texts
  }

  // ============================================================================
  // GLOBAL STATS
  // ============================================================================

  /**
   * Verify global stats are visible
   */
  async expectGlobalStatsVisible(): Promise<void> {
    await expect(this.globalStats).toBeVisible()
  }

  /**
   * Get completion percentage
   */
  async getCompletionPercentage(): Promise<number> {
    const mainStat = this.page.locator(
      '.weekly-review__stat-card--main .weekly-review__stat-value'
    )
    const text = await mainStat.textContent()
    const match = text?.match(/(\d+)/)
    return match ? parseInt(match[1]) : 0
  }

  /**
   * Get active days count
   */
  async getActiveDays(): Promise<number> {
    const statCard = this.page
      .locator('.weekly-review__stat-card')
      .filter({ hasText: 'jours actifs' })
    const value = await statCard.locator('.weekly-review__stat-value').textContent()
    return value ? parseInt(value) : 0
  }

  /**
   * Get completed days count
   */
  async getCompletedDays(): Promise<number> {
    const statCard = this.page
      .locator('.weekly-review__stat-card')
      .filter({ hasText: 'jours réussis' })
    const value = await statCard.locator('.weekly-review__stat-value').textContent()
    return value ? parseInt(value) : 0
  }

  /**
   * Expect completion percentage
   */
  async expectCompletionPercentage(percentage: number): Promise<void> {
    const mainStat = this.page.locator(
      '.weekly-review__stat-card--main .weekly-review__stat-value'
    )
    await expect(mainStat).toContainText(`${percentage}%`)
  }

  // ============================================================================
  // WEEK CALENDAR
  // ============================================================================

  /**
   * Verify week calendar is visible with 7 days
   */
  async expectWeekCalendarVisible(): Promise<void> {
    await expect(this.weekCalendar).toBeVisible()
    const days = this.page.locator('.weekly-review__day')
    await expect(days).toHaveCount(7)
  }

  /**
   * Get day element by index (0 = Monday)
   */
  getDayElement(index: number): Locator {
    return this.page.locator('.weekly-review__day').nth(index)
  }

  /**
   * Get day status (empty, partial, completed) by index
   */
  async getDayStatus(index: number): Promise<'empty' | 'partial' | 'completed'> {
    const day = this.getDayElement(index)
    const className = await day.getAttribute('class')
    if (className?.includes('--completed')) return 'completed'
    if (className?.includes('--partial')) return 'partial'
    return 'empty'
  }

  /**
   * Get all day indicators
   */
  async getDayIndicators(): Promise<string[]> {
    const indicators = this.page.locator('.weekly-review__day-indicator')
    const count = await indicators.count()
    const results: string[] = []
    for (let i = 0; i < count; i++) {
      const text = await indicators.nth(i).textContent()
      if (text) results.push(text.trim())
    }
    return results
  }

  // ============================================================================
  // HABIT STATS
  // ============================================================================

  /**
   * Verify habit stats section is visible
   */
  async expectHabitStatsVisible(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'Par habitude' })).toBeVisible()
    await expect(this.habitCards.first()).toBeVisible()
  }

  /**
   * Get habit card by name
   */
  getHabitCard(habitName: string): Locator {
    return this.habitCards.filter({ hasText: habitName })
  }

  /**
   * Get habit card count
   */
  async getHabitCardCount(): Promise<number> {
    return this.habitCards.count()
  }

  /**
   * Click on a habit card to navigate to detail
   */
  async clickHabitCard(habitName: string): Promise<void> {
    await this.getHabitCard(habitName).click()
  }

  /**
   * Click on the first habit card
   */
  async clickFirstHabitCard(): Promise<void> {
    await this.habitCards.first().click()
  }

  /**
   * Get habit average completion
   */
  async getHabitAverage(habitName: string): Promise<number> {
    const card = this.getHabitCard(habitName)
    const avgStat = card.locator('.weekly-review__habit-stat').filter({ hasText: 'moyenne' })
    const value = await avgStat.locator('.weekly-review__habit-stat-value').textContent()
    const match = value?.match(/(\d+)/)
    return match ? parseInt(match[1]) : 0
  }

  // ============================================================================
  // PATTERNS SECTION
  // ============================================================================

  /**
   * Verify patterns section is visible
   */
  async expectPatternsVisible(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'Tes patterns' })).toBeVisible()
    await expect(this.patternsSection).toBeVisible()
  }

  // ============================================================================
  // REFLECTION SECTION
  // ============================================================================

  /**
   * Verify reflection section is visible
   */
  async expectReflectionVisible(): Promise<void> {
    await expect(this.reflectionSection).toBeVisible()
  }

  /**
   * Get reflection textarea
   */
  get reflectionTextarea(): Locator {
    return this.page.getByRole('textbox')
  }

  /**
   * Fill in the reflection
   */
  async fillReflection(text: string): Promise<void> {
    await this.reflectionTextarea.fill(text)
  }

  /**
   * Save the reflection
   */
  async saveReflection(): Promise<void> {
    await this.page.getByRole('button', { name: /Enregistrer/i }).click()
  }

  /**
   * Fill and save a reflection
   */
  async submitReflection(text: string): Promise<void> {
    await this.fillReflection(text)
    await this.saveReflection()
  }

  /**
   * Skip the reflection
   */
  async skipReflection(): Promise<void> {
    await this.page.getByRole('button', { name: /Passer/i }).click()
  }

  /**
   * Verify reflection section is hidden (after skip or save)
   */
  async expectReflectionHidden(): Promise<void> {
    await expect(this.reflectionSection).not.toBeVisible()
  }

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  /**
   * Click continue button to go back to home
   */
  async clickContinue(): Promise<void> {
    await this.continueButton.click()
  }

  /**
   * Click continue and verify redirect to home
   */
  async continueToHome(): Promise<void> {
    await this.clickContinue()
    await expect(this.page).toHaveURL('/')
  }

  /**
   * Click create habit button (from empty state)
   */
  async clickCreateHabit(): Promise<void> {
    await this.page.getByRole('button', { name: 'Créer une habitude' }).click()
  }

  // ============================================================================
  // PROGRESS SUMMARY SECTION
  // ============================================================================

  /**
   * Verify progress summary section is visible
   */
  async expectProgressSummaryVisible(): Promise<void> {
    const progressSection = this.page.locator('.weekly-progress-summary')
    await expect(progressSection).toBeVisible()
  }
}
