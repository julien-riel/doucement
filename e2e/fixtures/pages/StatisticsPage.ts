/**
 * Page Object for the Statistics page
 * Encapsulates interactions with charts, period selection, and habit selection
 */

import { Page, Locator, expect } from '@playwright/test'

type StatsPeriod = 'week' | 'month' | 'quarter' | 'year' | 'all'

export class StatisticsPage {
  readonly page: Page
  readonly heading: Locator
  readonly periodSelector: Locator
  readonly habitSelector: Locator
  readonly statCards: Locator
  readonly progressionChart: Locator
  readonly heatmapCalendar: Locator
  readonly comparisonChart: Locator
  readonly projectionSection: Locator
  readonly exportMenu: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'Mes statistiques' })
    this.periodSelector = page.getByRole('tablist', { name: /période d'affichage/i })
    this.habitSelector = page.getByLabel('Habitude :')
    this.statCards = page.locator('.stat-card')
    this.progressionChart = page.getByRole('region', { name: /graphique de progression/i })
    this.heatmapCalendar = page.getByRole('region', { name: /calendrier de progression/i })
    this.comparisonChart = page.getByRole('region', { name: /comparaison des habitudes/i })
    this.projectionSection = page.getByRole('region', { name: /projections/i })
    this.exportMenu = page.locator('.export-menu')
  }

  /**
   * Navigate to the statistics page
   */
  async goto(): Promise<void> {
    await this.page.goto('/statistics')
  }

  /**
   * Verify the page is loaded with stats visible
   */
  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible()
    await expect(this.periodSelector).toBeVisible()
  }

  /**
   * Verify the page shows empty state (no habits)
   */
  async expectEmptyState(): Promise<void> {
    await expect(this.page.getByText('Pas encore de statistiques')).toBeVisible()
  }

  /**
   * Verify the page shows not enough data state
   */
  async expectNotEnoughDataState(): Promise<void> {
    await expect(this.page.getByText('Continue encore quelques jours')).toBeVisible()
  }

  // ============================================================================
  // CELEBRATION MODAL
  // ============================================================================

  /**
   * Close celebration modal if visible
   * This is important because the statistics page can trigger milestone celebrations
   * @param waitFor - if true, wait briefly for modal to potentially appear
   */
  async closeCelebrationModalIfVisible(waitFor = true): Promise<void> {
    const celebrationModal = this.page.locator(
      '[role="dialog"][aria-modal="true"].celebration-overlay'
    )

    // Wait briefly for potential modal appearance after navigation/render
    if (waitFor) {
      await celebrationModal.waitFor({ state: 'visible', timeout: 1500 }).catch(() => {})
    }

    if (await celebrationModal.isVisible().catch(() => false)) {
      await this.page.getByRole('button', { name: 'Continuer' }).click()
      await celebrationModal.waitFor({ state: 'hidden' }).catch(() => {})
    }
  }

  /**
   * Expect celebration modal to be visible
   */
  async expectCelebrationModal(): Promise<void> {
    const celebrationModal = this.page.locator(
      '[role="dialog"][aria-modal="true"].celebration-overlay'
    )
    await expect(celebrationModal).toBeVisible()
  }

  /**
   * Get the celebration modal text content
   */
  async getCelebrationMessage(): Promise<string | null> {
    const modal = this.page.locator('.celebration-overlay')
    return modal.textContent()
  }

  // ============================================================================
  // PERIOD SELECTOR
  // ============================================================================

  /**
   * Get period tab
   */
  getPeriodTab(period: StatsPeriod): Locator {
    const labels: Record<StatsPeriod, string> = {
      week: 'Semaine',
      month: 'Mois',
      quarter: 'Trimestre',
      year: 'Année',
      all: 'Tout',
    }
    return this.page.getByRole('tab', { name: labels[period] })
  }

  /**
   * Select a period
   * Closes any blocking celebration modal before clicking
   */
  async selectPeriod(period: StatsPeriod): Promise<void> {
    // Ensure no modal is blocking the click
    await this.closeCelebrationModalIfVisible(false)
    await this.getPeriodTab(period).click()
  }

  /**
   * Verify a period is selected
   */
  async expectPeriodSelected(period: StatsPeriod): Promise<void> {
    await expect(this.getPeriodTab(period)).toHaveAttribute('aria-selected', 'true')
  }

  // ============================================================================
  // HABIT SELECTOR
  // ============================================================================

  /**
   * Select a habit by ID
   */
  async selectHabitById(habitId: string): Promise<void> {
    await this.habitSelector.selectOption(habitId)
  }

  /**
   * Select a habit by label (emoji + name)
   */
  async selectHabitByLabel(label: string): Promise<void> {
    await this.habitSelector.selectOption({ label })
  }

  /**
   * Get current selected habit ID
   */
  async getSelectedHabitId(): Promise<string> {
    return this.habitSelector.inputValue()
  }

  /**
   * Verify habit is selected
   */
  async expectHabitSelected(habitId: string): Promise<void> {
    await expect(this.habitSelector).toHaveValue(habitId)
  }

  // ============================================================================
  // STAT CARDS
  // ============================================================================

  /**
   * Get stat card by label
   */
  getStatCard(label: string): Locator {
    return this.statCards.filter({ hasText: label })
  }

  /**
   * Get the value from a stat card
   */
  async getStatValue(label: string): Promise<string | null> {
    const card = this.getStatCard(label)
    const valueElement = card.locator('.stat-card__value')
    return valueElement.textContent()
  }

  /**
   * Expect stat card to show a specific value
   */
  async expectStatValue(label: string, value: string | number): Promise<void> {
    const card = this.getStatCard(label)
    await expect(card.locator('.stat-card__value')).toContainText(String(value))
  }

  /**
   * Expect average stat to be visible
   */
  async expectAverageStat(): Promise<void> {
    await expect(this.getStatCard('Moyenne')).toBeVisible()
  }

  /**
   * Expect active days stat to be visible
   */
  async expectActiveDaysStat(): Promise<void> {
    await expect(this.getStatCard('Jours actifs')).toBeVisible()
  }

  /**
   * Expect habits count stat to be visible
   */
  async expectHabitsCountStat(): Promise<void> {
    await expect(this.page.locator('.stat-card__label').filter({ hasText: 'Habitudes' })).toBeVisible()
  }

  /**
   * Expect streak stat to be visible
   */
  async expectStreakStat(): Promise<void> {
    await expect(this.getStatCard('Série')).toBeVisible()
  }

  // ============================================================================
  // CHARTS
  // ============================================================================

  /**
   * Verify progression chart is visible
   */
  async expectProgressionChartVisible(): Promise<void> {
    await expect(this.progressionChart).toBeVisible()
  }

  /**
   * Verify heatmap calendar is visible
   */
  async expectHeatmapVisible(): Promise<void> {
    await expect(this.heatmapCalendar).toBeVisible()
  }

  /**
   * Verify comparison chart is visible
   */
  async expectComparisonChartVisible(): Promise<void> {
    await expect(this.comparisonChart).toBeVisible()
  }

  /**
   * Verify projection section is visible
   */
  async expectProjectionVisible(): Promise<void> {
    await expect(this.projectionSection).toBeVisible()
    await expect(this.page.getByText("Progression vers l'objectif")).toBeVisible()
  }

  // ============================================================================
  // EXPORT
  // ============================================================================

  /**
   * Click export menu
   */
  async clickExportMenu(): Promise<void> {
    await this.exportMenu.click()
  }

  /**
   * Export as PNG
   */
  async exportAsPng(): Promise<void> {
    await this.clickExportMenu()
    await this.page.getByRole('button', { name: /PNG/i }).click()
  }

  /**
   * Export as CSV
   */
  async exportAsCsv(): Promise<void> {
    await this.clickExportMenu()
    await this.page.getByRole('button', { name: /CSV/i }).click()
  }

  // ============================================================================
  // ACCESSIBILITY
  // ============================================================================

  /**
   * Verify accessibility labels are present
   */
  async expectAccessibilityLabels(): Promise<void> {
    await expect(this.page.getByRole('region', { name: 'Résumé statistique' })).toBeVisible()
    await expect(this.progressionChart).toBeVisible()
    await expect(this.heatmapCalendar).toBeVisible()
  }

  /**
   * Verify period selector uses accessible tabs
   */
  async expectAccessiblePeriodSelector(): Promise<void> {
    await expect(this.periodSelector).toBeVisible()
    const weekTab = this.getPeriodTab('week')
    await expect(weekTab).toHaveRole('tab')
  }
}
