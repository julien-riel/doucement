/**
 * Page Object for the Create Habit wizard
 * Encapsulates interactions with the 7-step habit creation wizard
 * (Choose → Type → Details → Intentions → Identity → Confirm → First Check-in)
 */

import { Page, Locator, expect } from '@playwright/test'

type HabitDirection = 'increase' | 'decrease' | 'maintain'
type ProgressionMode = 'percentage' | 'absolute'
type ProgressionPeriod = 'daily' | 'weekly'
type TrackingMode = 'simple' | 'detailed' | 'counter'
type EntryMode = 'replace' | 'cumulative'
type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'

export class CreateHabitPage {
  readonly page: Page
  readonly heading: Locator
  readonly backButton: Locator
  readonly continueButton: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'Nouvelle habitude' })
    this.backButton = page.getByRole('button', { name: 'Retour' })
    this.continueButton = page.getByRole('button', { name: 'Continuer' })
  }

  /**
   * Navigate to the create habit page
   */
  async goto(): Promise<void> {
    await this.page.goto('/create')
    await this.page.waitForSelector('text=Nouvelle habitude')
  }

  /**
   * Verify the page is loaded
   */
  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible()
  }

  // ============================================================================
  // STEP: CHOOSE (Suggestions vs Custom)
  // ============================================================================

  /**
   * Verify we're on the choose step
   */
  async expectChooseStep(): Promise<void> {
    await expect(
      this.page.getByText('Choisis une habitude à fort impact ou crée la tienne')
    ).toBeVisible()
  }

  /**
   * Get all suggested habit cards
   */
  getSuggestedHabitCards(): Locator {
    return this.page.locator('.suggested-habit-card')
  }

  /**
   * Select a suggested habit by clicking on it
   */
  async selectSuggestedHabit(index: number): Promise<void> {
    await this.getSuggestedHabitCards().nth(index).click()
  }

  /**
   * Select a suggested habit by name
   */
  async selectSuggestedHabitByName(name: string): Promise<void> {
    await this.page.locator('.suggested-habit-card').filter({ hasText: name }).click()
  }

  /**
   * Click on "Create custom habit" button
   */
  async clickCreateCustomHabit(): Promise<void> {
    await this.page.getByRole('button', { name: /Créer une habitude personnalisée/ }).click()
  }

  /**
   * Filter suggestions by category
   */
  async filterByCategory(categoryEmoji: string): Promise<void> {
    await this.page.getByRole('button', { name: categoryEmoji }).click()
  }

  /**
   * Show all top suggestions
   */
  async showTop6(): Promise<void> {
    await this.page.getByRole('button', { name: 'Top 6' }).click()
  }

  // ============================================================================
  // STEP: TYPE
  // ============================================================================

  /**
   * Verify we're on the type step
   */
  async expectTypeStep(): Promise<void> {
    await expect(
      this.page.getByText('Quel type d\'habitude souhaitez-vous créer ?')
    ).toBeVisible()
  }

  /**
   * Get type option button
   */
  getTypeOption(direction: HabitDirection): Locator {
    const labels: Record<HabitDirection, string> = {
      increase: 'Augmenter',
      decrease: 'Réduire',
      maintain: 'Maintenir',
    }
    return this.page.getByRole('button', { name: new RegExp(labels[direction]) })
  }

  /**
   * Select habit direction type
   */
  async selectType(direction: HabitDirection): Promise<void> {
    await this.getTypeOption(direction).click()
  }

  /**
   * Verify a type is selected
   */
  async expectTypeSelected(direction: HabitDirection): Promise<void> {
    await expect(this.getTypeOption(direction)).toHaveAttribute('aria-pressed', 'true')
  }

  // ============================================================================
  // STEP: DETAILS
  // ============================================================================

  /**
   * Verify we're on the details step
   */
  async expectDetailsStep(): Promise<void> {
    await expect(this.page.getByText('Décrivez votre habitude')).toBeVisible()
  }

  /**
   * Get the name input
   */
  get nameInput(): Locator {
    return this.page.getByRole('textbox', { name: "Nom de l'habitude" })
  }

  /**
   * Get the unit input
   */
  get unitInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Unité' })
  }

  /**
   * Get the start value input
   */
  get startValueInput(): Locator {
    return this.page.getByRole('spinbutton', { name: 'Dose de départ' })
  }

  /**
   * Set habit name
   */
  async setName(name: string): Promise<void> {
    await this.nameInput.fill(name)
  }

  /**
   * Set habit unit
   */
  async setUnit(unit: string): Promise<void> {
    await this.unitInput.fill(unit)
  }

  /**
   * Set start value
   */
  async setStartValue(value: number): Promise<void> {
    await this.startValueInput.fill(String(value))
  }

  /**
   * Get current emoji
   */
  async getEmoji(): Promise<string> {
    return (await this.page.locator('.emoji-picker__current').textContent()) || ''
  }

  /**
   * Change emoji by opening picker and selecting nth emoji
   */
  async selectEmoji(index: number): Promise<void> {
    await this.page.locator('.emoji-picker__trigger').click()
    await expect(this.page.locator('.emoji-picker__dropdown')).toBeVisible()
    const emojiButtons = this.page.locator('.emoji-picker__dropdown button.epr-emoji')
    await emojiButtons.nth(index).click()
    await expect(this.page.locator('.emoji-picker__dropdown')).not.toBeVisible()
  }

  /**
   * Set progression mode
   */
  async setProgressionMode(mode: ProgressionMode): Promise<void> {
    const label = mode === 'percentage' ? 'En %' : 'En unités'
    await this.page.getByRole('button', { name: label }).click()
  }

  /**
   * Set progression value
   */
  async setProgressionValue(value: number): Promise<void> {
    const input = this.page.getByRole('spinbutton', { name: /Pourcentage|Unités/ })
    await input.fill(String(value))
  }

  /**
   * Set progression period
   */
  async setProgressionPeriod(period: ProgressionPeriod): Promise<void> {
    const label = period === 'weekly' ? 'Semaine' : 'Jour'
    await this.page
      .locator('.step-details__progression-section')
      .getByRole('button', { name: label })
      .click()
  }

  /**
   * Set tracking mode (simple, detailed, counter)
   */
  async setTrackingMode(mode: TrackingMode): Promise<void> {
    const labels: Record<TrackingMode, string> = {
      simple: 'Simple',
      detailed: 'Détaillé',
      counter: 'Compteur',
    }
    await this.page
      .locator('.step-details__tracking-mode-option')
      .filter({ hasText: labels[mode] })
      .click()
  }

  /**
   * Set entry mode (only available when trackingMode is 'detailed')
   */
  async setEntryMode(mode: EntryMode): Promise<void> {
    const labels: Record<EntryMode, string> = {
      replace: 'Remplacer',
      cumulative: 'Cumuler',
    }
    await this.page
      .locator('.step-details__entry-mode-option')
      .filter({ hasText: labels[mode] })
      .click()
  }

  /**
   * Set time of day
   */
  async setTimeOfDay(timeOfDay: TimeOfDay): Promise<void> {
    await this.page.locator('.time-of-day-selector__option').filter({ hasText: timeOfDay }).click()
  }

  // ============================================================================
  // STEP: INTENTIONS
  // ============================================================================

  /**
   * Verify we're on the intentions step
   */
  async expectIntentionsStep(): Promise<void> {
    await expect(this.page.getByText('Quand et où ?')).toBeVisible()
  }

  /**
   * Get the trigger input
   */
  get triggerInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Après quoi ?' })
  }

  /**
   * Get the location input
   */
  get locationInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Où ?' })
  }

  /**
   * Get the time input
   */
  get timeInput(): Locator {
    return this.page.getByRole('textbox', { name: 'À quelle heure ?' })
  }

  /**
   * Set implementation intention trigger
   */
  async setTrigger(trigger: string): Promise<void> {
    await this.triggerInput.fill(trigger)
  }

  /**
   * Select a suggested trigger
   */
  async selectSuggestedTrigger(text: string): Promise<void> {
    await this.page.getByRole('button', { name: text }).click()
  }

  /**
   * Set location
   */
  async setLocation(location: string): Promise<void> {
    await this.locationInput.fill(location)
  }

  /**
   * Set time
   */
  async setTime(time: string): Promise<void> {
    await this.timeInput.fill(time)
  }

  /**
   * Select an anchor habit for habit stacking
   */
  async selectAnchorHabit(habitId: string): Promise<void> {
    await this.page.locator('.habit-anchor-selector select').selectOption(habitId)
  }

  // ============================================================================
  // STEP: IDENTITY
  // ============================================================================

  /**
   * Verify we're on the identity step
   */
  async expectIdentityStep(): Promise<void> {
    await expect(this.page.getByText('Qui voulez-vous devenir ?')).toBeVisible()
  }

  /**
   * Get the identity input
   */
  get identityInput(): Locator {
    return this.page.getByRole('textbox', { name: /Je deviens quelqu'un qui/ })
  }

  /**
   * Set identity statement
   */
  async setIdentity(statement: string): Promise<void> {
    await this.identityInput.fill(statement)
  }

  /**
   * Get the preview button
   */
  get previewButton(): Locator {
    return this.page.getByRole('button', { name: 'Aperçu' })
  }

  /**
   * Click preview to go to confirmation step
   */
  async clickPreview(): Promise<void> {
    await this.previewButton.click()
  }

  // ============================================================================
  // STEP: CONFIRM
  // ============================================================================

  /**
   * Verify we're on the confirmation step
   */
  async expectConfirmStep(): Promise<void> {
    await expect(this.page.getByText('Vérifiez et confirmez')).toBeVisible()
  }

  /**
   * Get the create button
   */
  get createButton(): Locator {
    return this.page.getByRole('button', { name: "Créer l'habitude" })
  }

  /**
   * Click create to create the habit
   */
  async clickCreate(): Promise<void> {
    await this.createButton.click()
  }

  /**
   * Verify habit summary in confirmation
   */
  async expectSummary(options: {
    name?: string
    type?: HabitDirection
    startValue?: number
    unit?: string
    progression?: string
  }): Promise<void> {
    const typeLabels: Record<HabitDirection, string> = {
      increase: 'Augmenter',
      decrease: 'Réduire',
      maintain: 'Maintenir',
    }

    if (options.name) {
      await expect(this.page.getByRole('heading', { name: options.name })).toBeVisible()
    }
    if (options.type) {
      await expect(this.page.getByText(typeLabels[options.type])).toBeVisible()
    }
    if (options.startValue && options.unit) {
      // Use exact match to avoid matching "8 verres Par jour" when looking for "8 verres"
      await expect(
        this.page.locator('.step-confirm__summary').getByText(`${options.startValue} ${options.unit}`, { exact: true })
      ).toBeVisible()
    }
    if (options.progression) {
      await expect(this.page.getByText(options.progression)).toBeVisible()
    }
  }

  // ============================================================================
  // STEP: FIRST CHECK-IN
  // ============================================================================

  /**
   * Verify we're on the first check-in step
   */
  async expectFirstCheckInStep(): Promise<void> {
    await expect(this.page.getByText('Première victoire ?')).toBeVisible()
  }

  /**
   * Skip first check-in (start tomorrow)
   */
  async skipFirstCheckIn(): Promise<void> {
    await this.page.getByRole('button', { name: 'Non, je commence demain' }).click()
  }

  /**
   * Complete first check-in with target value
   */
  async completeFirstCheckIn(): Promise<void> {
    await this.page.getByRole('button', { name: /Oui|Fait/ }).click()
  }

  // ============================================================================
  // NAVIGATION HELPERS
  // ============================================================================

  /**
   * Click continue button
   */
  async clickContinue(): Promise<void> {
    await this.continueButton.click()
  }

  /**
   * Click back button
   */
  async clickBack(): Promise<void> {
    await this.backButton.click()
  }

  /**
   * Expect continue button to be enabled
   */
  async expectContinueEnabled(): Promise<void> {
    await expect(this.continueButton).toBeEnabled()
  }

  /**
   * Expect continue button to be disabled
   */
  async expectContinueDisabled(): Promise<void> {
    await expect(this.continueButton).toBeDisabled()
  }

  // ============================================================================
  // COMPLETE FLOW HELPERS
  // ============================================================================

  /**
   * Create a simple increase habit with minimal options
   */
  async createSimpleHabit(options: {
    name: string
    unit: string
    startValue?: number
    skipFirstCheckIn?: boolean
  }): Promise<void> {
    // Choose step: go to custom
    await this.clickCreateCustomHabit()

    // Type step: select increase
    await this.selectType('increase')
    await this.clickContinue()

    // Details step
    await this.setName(options.name)
    await this.setUnit(options.unit)
    if (options.startValue) {
      await this.setStartValue(options.startValue)
    }
    await this.clickContinue()

    // Intentions step: skip
    await this.clickContinue()

    // Identity step: go to preview
    await this.clickPreview()

    // Confirm step: create
    await this.clickCreate()

    // First check-in
    if (options.skipFirstCheckIn !== false) {
      await this.skipFirstCheckIn()
    }
  }

  /**
   * Create a habit with full options
   */
  async createHabitWithOptions(options: {
    direction: HabitDirection
    name: string
    emoji?: number // index in picker
    unit: string
    startValue?: number
    progressionMode?: ProgressionMode
    progressionValue?: number
    progressionPeriod?: ProgressionPeriod
    trackingMode?: TrackingMode
    entryMode?: EntryMode
    trigger?: string
    location?: string
    identity?: string
    skipFirstCheckIn?: boolean
  }): Promise<void> {
    // Choose step: go to custom
    await this.clickCreateCustomHabit()

    // Type step
    await this.selectType(options.direction)
    await this.clickContinue()

    // Details step
    if (options.emoji !== undefined) {
      await this.selectEmoji(options.emoji)
    }
    await this.setName(options.name)
    await this.setUnit(options.unit)
    if (options.startValue) {
      await this.setStartValue(options.startValue)
    }
    if (options.progressionMode) {
      await this.setProgressionMode(options.progressionMode)
    }
    if (options.progressionValue) {
      await this.setProgressionValue(options.progressionValue)
    }
    if (options.progressionPeriod) {
      await this.setProgressionPeriod(options.progressionPeriod)
    }
    if (options.trackingMode) {
      await this.setTrackingMode(options.trackingMode)
    }
    if (options.entryMode && options.trackingMode === 'detailed') {
      await this.setEntryMode(options.entryMode)
    }
    await this.clickContinue()

    // Intentions step
    if (options.trigger) {
      await this.setTrigger(options.trigger)
    }
    if (options.location) {
      await this.setLocation(options.location)
    }
    await this.clickContinue()

    // Identity step
    if (options.identity) {
      await this.setIdentity(options.identity)
    }
    await this.clickPreview()

    // Confirm step
    await this.clickCreate()

    // First check-in
    if (options.skipFirstCheckIn !== false) {
      await this.skipFirstCheckIn()
    }
  }
}
