/**
 * StepDetails - Step for entering habit details (name, unit, progression, etc.)
 */

import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useCreateHabitContext } from '../CreateHabitContext'
import { Input, EmojiPicker, TimeOfDaySelector } from '../../../components/ui'
import { CATEGORY_EMOJIS } from '../../../constants/suggestedHabits'
import { TrackingMode } from '../../../types'
import { DEFAULT_MOOD_SLIDER_CONFIG } from '../../../utils/slider'
import { SliderConfigSection } from './SliderConfigSection'

/**
 * Icons for each tracking mode
 */
const TRACKING_MODE_ICONS: Record<TrackingMode, string> = {
  simple: '✓',
  detailed: '📊',
  counter: '🔢',
  stopwatch: '⏱️',
  timer: '⏳',
  slider: '🎚️',
}

/**
 * Step for entering habit details
 */
export function StepDetails() {
  const { t } = useTranslation()
  const { form, updateForm, selectedCategory } = useCreateHabitContext()

  // Emoji suggestions based on selected category
  const suggestedEmojis = selectedCategory
    ? CATEGORY_EMOJIS[selectedCategory]
    : ['💪', '🏃', '📚', '🧘', '💧', '😴', '🎯', '✨']

  /**
   * Handle tracking mode change
   * Initializes sliderConfig with default values when switching to slider mode
   */
  const handleTrackingModeChange = useCallback(
    (mode: TrackingMode) => {
      // Initialize sliderConfig with default BEFORE changing mode to avoid race condition
      // This ensures sliderConfig is set when SliderConfigSection renders
      if (mode === 'slider' && !form.sliderConfig) {
        updateForm('sliderConfig', DEFAULT_MOOD_SLIDER_CONFIG)
      }
      updateForm('trackingMode', mode)
    },
    [form.sliderConfig, updateForm]
  )

  return (
    <div className="create-habit__content step-details">
      <div className="step-details__form">
        {/* Emoji */}
        <EmojiPicker
          label={t('createHabit.form.emoji')}
          value={form.emoji}
          onChange={(emoji) => updateForm('emoji', emoji)}
          suggestedEmojis={suggestedEmojis}
        />

        {/* Name */}
        <Input
          label={t('createHabit.form.name')}
          placeholder={t('createHabit.form.namePlaceholder')}
          value={form.name}
          onChange={(e) => updateForm('name', e.target.value)}
        />

        {/* Start value and unit */}
        <div className="step-details__row">
          <Input
            type="number"
            label={t('createHabit.form.startDose')}
            placeholder="10"
            min={1}
            value={form.startValue || ''}
            onChange={(e) => updateForm('startValue', Number(e.target.value))}
          />
          <Input
            label={t('createHabit.form.unit')}
            placeholder={t('createHabit.form.unitPlaceholder')}
            value={form.unit}
            onChange={(e) => updateForm('unit', e.target.value)}
          />
        </div>

        {/* Progression (except for maintain) */}
        {form.direction !== 'maintain' && (
          <div className="step-details__progression-section">
            <p className="step-details__progression-title">{t('createHabit.form.progression')}</p>

            {/* Progression mode */}
            <div className="step-details__progression-options">
              <button
                type="button"
                className={`step-details__progression-option ${form.progressionMode === 'percentage' ? 'step-details__progression-option--selected' : ''}`}
                onClick={() => updateForm('progressionMode', 'percentage')}
              >
                {t('createHabit.form.inPercent')}
              </button>
              <button
                type="button"
                className={`step-details__progression-option ${form.progressionMode === 'absolute' ? 'step-details__progression-option--selected' : ''}`}
                onClick={() => updateForm('progressionMode', 'absolute')}
              >
                {t('createHabit.form.inUnits')}
              </button>
            </div>

            {/* Progression value and period */}
            <div className="step-details__row">
              <Input
                type="number"
                label={
                  form.progressionMode === 'percentage'
                    ? t('createHabit.form.percentage')
                    : t('createHabit.form.units')
                }
                placeholder={form.progressionMode === 'percentage' ? '5' : '1'}
                min={1}
                value={form.progressionValue || ''}
                onChange={(e) => updateForm('progressionValue', Number(e.target.value))}
                hint={form.progressionMode === 'percentage' ? 'Ex: 5%' : undefined}
              />
              <div className="input-wrapper">
                <label className="input-label">{t('createHabit.form.per')}</label>
                <div className="step-details__progression-options">
                  <button
                    type="button"
                    className={`step-details__progression-option ${form.progressionPeriod === 'weekly' ? 'step-details__progression-option--selected' : ''}`}
                    onClick={() => updateForm('progressionPeriod', 'weekly')}
                  >
                    {t('createHabit.form.week')}
                  </button>
                  <button
                    type="button"
                    className={`step-details__progression-option ${form.progressionPeriod === 'daily' ? 'step-details__progression-option--selected' : ''}`}
                    onClick={() => updateForm('progressionPeriod', 'daily')}
                  >
                    {t('createHabit.form.day')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tracking mode */}
        <div className="step-details__tracking-mode-section">
          <p className="step-details__tracking-mode-title">{t('createHabit.trackingMode.title')}</p>
          <p className="step-details__tracking-mode-hint">{t('createHabit.trackingMode.hint')}</p>
          <div className="step-details__tracking-mode-options step-details__tracking-mode-options--grid">
            <button
              type="button"
              className={`step-details__tracking-mode-option ${form.trackingMode === 'simple' ? 'step-details__tracking-mode-option--selected' : ''}`}
              onClick={() => handleTrackingModeChange('simple')}
              aria-pressed={form.trackingMode === 'simple'}
            >
              <span className="step-details__tracking-mode-icon">{TRACKING_MODE_ICONS.simple}</span>
              <span className="step-details__tracking-mode-label">
                {t('createHabit.trackingMode.simple')}
              </span>
              <span className="step-details__tracking-mode-desc">
                {t('createHabit.trackingMode.simpleDesc')}
              </span>
            </button>
            <button
              type="button"
              className={`step-details__tracking-mode-option ${form.trackingMode === 'detailed' ? 'step-details__tracking-mode-option--selected' : ''}`}
              onClick={() => handleTrackingModeChange('detailed')}
              aria-pressed={form.trackingMode === 'detailed'}
            >
              <span className="step-details__tracking-mode-icon">
                {TRACKING_MODE_ICONS.detailed}
              </span>
              <span className="step-details__tracking-mode-label">
                {t('createHabit.trackingMode.detailed')}
              </span>
              <span className="step-details__tracking-mode-desc">
                {t('createHabit.trackingMode.detailedDesc')}
              </span>
            </button>
            <button
              type="button"
              className={`step-details__tracking-mode-option ${form.trackingMode === 'counter' ? 'step-details__tracking-mode-option--selected' : ''}`}
              onClick={() => handleTrackingModeChange('counter')}
              aria-pressed={form.trackingMode === 'counter'}
            >
              <span className="step-details__tracking-mode-icon">
                {TRACKING_MODE_ICONS.counter}
              </span>
              <span className="step-details__tracking-mode-label">
                {t('createHabit.trackingMode.counter')}
              </span>
              <span className="step-details__tracking-mode-desc">
                {t('createHabit.trackingMode.counterDesc')}
              </span>
            </button>
            <button
              type="button"
              className={`step-details__tracking-mode-option ${form.trackingMode === 'stopwatch' ? 'step-details__tracking-mode-option--selected' : ''}`}
              onClick={() => handleTrackingModeChange('stopwatch')}
              aria-pressed={form.trackingMode === 'stopwatch'}
            >
              <span className="step-details__tracking-mode-icon">
                {TRACKING_MODE_ICONS.stopwatch}
              </span>
              <span className="step-details__tracking-mode-label">
                {t('createHabit.trackingMode.stopwatch')}
              </span>
              <span className="step-details__tracking-mode-desc">
                {t('createHabit.trackingMode.stopwatchDesc')}
              </span>
            </button>
            <button
              type="button"
              className={`step-details__tracking-mode-option ${form.trackingMode === 'timer' ? 'step-details__tracking-mode-option--selected' : ''}`}
              onClick={() => handleTrackingModeChange('timer')}
              aria-pressed={form.trackingMode === 'timer'}
            >
              <span className="step-details__tracking-mode-icon">{TRACKING_MODE_ICONS.timer}</span>
              <span className="step-details__tracking-mode-label">
                {t('createHabit.trackingMode.timer')}
              </span>
              <span className="step-details__tracking-mode-desc">
                {t('createHabit.trackingMode.timerDesc')}
              </span>
            </button>
            <button
              type="button"
              className={`step-details__tracking-mode-option ${form.trackingMode === 'slider' ? 'step-details__tracking-mode-option--selected' : ''}`}
              onClick={() => handleTrackingModeChange('slider')}
              aria-pressed={form.trackingMode === 'slider'}
            >
              <span className="step-details__tracking-mode-icon">{TRACKING_MODE_ICONS.slider}</span>
              <span className="step-details__tracking-mode-label">
                {t('createHabit.trackingMode.slider')}
              </span>
              <span className="step-details__tracking-mode-desc">
                {t('createHabit.trackingMode.sliderDesc')}
              </span>
            </button>
          </div>
          {form.trackingMode === 'counter' && (
            <p className="step-details__tracking-mode-counter-hint">
              {t('createHabit.trackingMode.counterHint')}
            </p>
          )}
          {form.trackingMode === 'stopwatch' && (
            <p className="step-details__tracking-mode-counter-hint">
              {t('createHabit.trackingMode.stopwatchHint')}
            </p>
          )}
          {form.trackingMode === 'timer' && (
            <p className="step-details__tracking-mode-counter-hint">
              {t('createHabit.trackingMode.timerHint')}
            </p>
          )}
          {form.trackingMode === 'slider' && (
            <p className="step-details__tracking-mode-counter-hint">
              {t('createHabit.trackingMode.sliderHint')}
            </p>
          )}
        </div>

        {/* Slider configuration - only for slider mode */}
        {form.trackingMode === 'slider' && (
          <SliderConfigSection form={form} updateForm={updateForm} />
        )}

        {/* Entry mode - for detailed, stopwatch, timer (cumulative possible) */}
        {(form.trackingMode === 'detailed' ||
          form.trackingMode === 'stopwatch' ||
          form.trackingMode === 'timer') && (
          <div className="step-details__entry-mode-section">
            <p className="step-details__entry-mode-title">{t('createHabit.entryMode.title')}</p>
            <p className="step-details__entry-mode-hint">{t('createHabit.entryMode.hint')}</p>
            <div className="step-details__entry-mode-options">
              <button
                type="button"
                className={`step-details__entry-mode-option ${form.entryMode === 'replace' ? 'step-details__entry-mode-option--selected' : ''}`}
                onClick={() => updateForm('entryMode', 'replace')}
                aria-pressed={form.entryMode === 'replace'}
              >
                <span className="step-details__entry-mode-label">
                  {t('createHabit.entryMode.replace')}
                </span>
                <span className="step-details__entry-mode-desc">
                  {t('createHabit.entryMode.replaceDesc')}
                </span>
              </button>
              <button
                type="button"
                className={`step-details__entry-mode-option ${form.entryMode === 'cumulative' ? 'step-details__entry-mode-option--selected' : ''}`}
                onClick={() => updateForm('entryMode', 'cumulative')}
                aria-pressed={form.entryMode === 'cumulative'}
              >
                <span className="step-details__entry-mode-label">
                  {t('createHabit.entryMode.cumulative')}
                </span>
                <span className="step-details__entry-mode-desc">
                  {t('createHabit.entryMode.cumulativeDesc')}
                </span>
              </button>
            </div>
            {form.entryMode === 'cumulative' && (
              <p className="step-details__entry-mode-cumulative-hint">
                {t('createHabit.entryMode.cumulativeHint')}
              </p>
            )}
          </div>
        )}

        {/* Weekly aggregation mode - only for weekly habits */}
        {form.trackingFrequency === 'weekly' && (
          <div className="step-details__weekly-aggregation-section">
            <p className="step-details__weekly-aggregation-title">
              {t('createHabit.weeklyAggregation.title')}
            </p>
            <p className="step-details__weekly-aggregation-hint">
              {t('createHabit.weeklyAggregation.hint')}
            </p>
            <div className="step-details__weekly-aggregation-options">
              <button
                type="button"
                className={`step-details__weekly-aggregation-option ${form.weeklyAggregation === 'count-days' ? 'step-details__weekly-aggregation-option--selected' : ''}`}
                onClick={() => updateForm('weeklyAggregation', 'count-days')}
                aria-pressed={form.weeklyAggregation === 'count-days'}
              >
                <span className="step-details__weekly-aggregation-label">
                  {t('createHabit.weeklyAggregation.countDays')}
                </span>
                <span className="step-details__weekly-aggregation-desc">
                  {t('createHabit.weeklyAggregation.countDaysDesc')}
                </span>
              </button>
              <button
                type="button"
                className={`step-details__weekly-aggregation-option ${form.weeklyAggregation === 'sum-units' ? 'step-details__weekly-aggregation-option--selected' : ''}`}
                onClick={() => updateForm('weeklyAggregation', 'sum-units')}
                aria-pressed={form.weeklyAggregation === 'sum-units'}
              >
                <span className="step-details__weekly-aggregation-label">
                  {t('createHabit.weeklyAggregation.sumUnits')}
                </span>
                <span className="step-details__weekly-aggregation-desc">
                  {t('createHabit.weeklyAggregation.sumUnitsDesc')}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Time of day */}
        <TimeOfDaySelector
          value={form.timeOfDay}
          onChange={(value) => updateForm('timeOfDay', value)}
        />
      </div>
    </div>
  )
}
