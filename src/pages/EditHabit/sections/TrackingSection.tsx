/**
 * TrackingSection - Tracking mode and entry mode
 * Handles: simple/detailed/counter/stopwatch/timer/slider modes + replace/cumulative entry modes
 */

import { useCallback } from 'react'
import { TRACKING_MODE, ENTRY_MODE } from '../../../constants/messages'
import { useEditHabitContext } from '../EditHabitContext'
import { TrackingMode } from '../../../types'
import { DEFAULT_MOOD_SLIDER_CONFIG } from '../../../utils/slider'

/**
 * Icons for each tracking mode
 */
const TRACKING_MODE_ICONS: Record<string, string> = {
  simple: '✓',
  detailed: '📊',
  counter: '🔢',
  stopwatch: '⏱️',
  timer: '⏳',
  slider: '🎚️',
}

export function TrackingSection() {
  const { form, updateField } = useEditHabitContext()

  /**
   * Handle tracking mode change
   * Initializes sliderConfig with default values when switching to slider mode
   */
  const handleTrackingModeChange = useCallback(
    (mode: TrackingMode) => {
      updateField('trackingMode', mode)

      // Initialize sliderConfig with default when switching to slider mode
      if (mode === 'slider' && !form.sliderConfig) {
        updateField('sliderConfig', DEFAULT_MOOD_SLIDER_CONFIG)
      }
    },
    [form.sliderConfig, updateField]
  )

  return (
    <>
      {/* Mode de suivi */}
      <div className="edit-habit__tracking-mode-section">
        <p className="edit-habit__field-label">{TRACKING_MODE.sectionTitle}</p>
        <p className="edit-habit__field-hint">{TRACKING_MODE.sectionHint}</p>
        <div className="edit-habit__tracking-mode-options edit-habit__tracking-mode-options--grid">
          <button
            type="button"
            className={`edit-habit__tracking-mode-option ${form.trackingMode === 'simple' ? 'edit-habit__tracking-mode-option--selected' : ''}`}
            onClick={() => handleTrackingModeChange('simple')}
            aria-pressed={form.trackingMode === 'simple'}
          >
            <span className="edit-habit__tracking-mode-icon">{TRACKING_MODE_ICONS.simple}</span>
            <span className="edit-habit__tracking-mode-label">{TRACKING_MODE.simpleLabel}</span>
            <span className="edit-habit__tracking-mode-desc">
              {TRACKING_MODE.simpleDescription}
            </span>
          </button>
          <button
            type="button"
            className={`edit-habit__tracking-mode-option ${form.trackingMode === 'detailed' ? 'edit-habit__tracking-mode-option--selected' : ''}`}
            onClick={() => handleTrackingModeChange('detailed')}
            aria-pressed={form.trackingMode === 'detailed'}
          >
            <span className="edit-habit__tracking-mode-icon">{TRACKING_MODE_ICONS.detailed}</span>
            <span className="edit-habit__tracking-mode-label">{TRACKING_MODE.detailedLabel}</span>
            <span className="edit-habit__tracking-mode-desc">
              {TRACKING_MODE.detailedDescription}
            </span>
          </button>
          <button
            type="button"
            className={`edit-habit__tracking-mode-option ${form.trackingMode === 'counter' ? 'edit-habit__tracking-mode-option--selected' : ''}`}
            onClick={() => handleTrackingModeChange('counter')}
            aria-pressed={form.trackingMode === 'counter'}
          >
            <span className="edit-habit__tracking-mode-icon">{TRACKING_MODE_ICONS.counter}</span>
            <span className="edit-habit__tracking-mode-label">{TRACKING_MODE.counterLabel}</span>
            <span className="edit-habit__tracking-mode-desc">
              {TRACKING_MODE.counterDescription}
            </span>
          </button>
          <button
            type="button"
            className={`edit-habit__tracking-mode-option ${form.trackingMode === 'stopwatch' ? 'edit-habit__tracking-mode-option--selected' : ''}`}
            onClick={() => handleTrackingModeChange('stopwatch')}
            aria-pressed={form.trackingMode === 'stopwatch'}
          >
            <span className="edit-habit__tracking-mode-icon">{TRACKING_MODE_ICONS.stopwatch}</span>
            <span className="edit-habit__tracking-mode-label">{TRACKING_MODE.stopwatchLabel}</span>
            <span className="edit-habit__tracking-mode-desc">
              {TRACKING_MODE.stopwatchDescription}
            </span>
          </button>
          <button
            type="button"
            className={`edit-habit__tracking-mode-option ${form.trackingMode === 'timer' ? 'edit-habit__tracking-mode-option--selected' : ''}`}
            onClick={() => handleTrackingModeChange('timer')}
            aria-pressed={form.trackingMode === 'timer'}
          >
            <span className="edit-habit__tracking-mode-icon">{TRACKING_MODE_ICONS.timer}</span>
            <span className="edit-habit__tracking-mode-label">{TRACKING_MODE.timerLabel}</span>
            <span className="edit-habit__tracking-mode-desc">{TRACKING_MODE.timerDescription}</span>
          </button>
          <button
            type="button"
            className={`edit-habit__tracking-mode-option ${form.trackingMode === 'slider' ? 'edit-habit__tracking-mode-option--selected' : ''}`}
            onClick={() => handleTrackingModeChange('slider')}
            aria-pressed={form.trackingMode === 'slider'}
          >
            <span className="edit-habit__tracking-mode-icon">{TRACKING_MODE_ICONS.slider}</span>
            <span className="edit-habit__tracking-mode-label">{TRACKING_MODE.sliderLabel}</span>
            <span className="edit-habit__tracking-mode-desc">
              {TRACKING_MODE.sliderDescription}
            </span>
          </button>
        </div>
        {form.trackingMode === 'counter' && (
          <p className="edit-habit__tracking-mode-counter-hint">{TRACKING_MODE.counterHint}</p>
        )}
        {form.trackingMode === 'stopwatch' && (
          <p className="edit-habit__tracking-mode-counter-hint">{TRACKING_MODE.stopwatchHint}</p>
        )}
        {form.trackingMode === 'timer' && (
          <p className="edit-habit__tracking-mode-counter-hint">{TRACKING_MODE.timerHint}</p>
        )}
        {form.trackingMode === 'slider' && (
          <p className="edit-habit__tracking-mode-counter-hint">{TRACKING_MODE.sliderHint}</p>
        )}
      </div>

      {/* Mode de saisie - pour detailed, stopwatch, timer (cumulative possible) */}
      {(form.trackingMode === 'detailed' ||
        form.trackingMode === 'stopwatch' ||
        form.trackingMode === 'timer') && (
        <div className="edit-habit__entry-mode-section">
          <p className="edit-habit__field-label">{ENTRY_MODE.sectionTitle}</p>
          <p className="edit-habit__field-hint">{ENTRY_MODE.sectionHint}</p>
          <div className="edit-habit__entry-mode-options">
            <button
              type="button"
              className={`edit-habit__entry-mode-option ${form.entryMode === 'replace' ? 'edit-habit__entry-mode-option--selected' : ''}`}
              onClick={() => updateField('entryMode', 'replace')}
              aria-pressed={form.entryMode === 'replace'}
            >
              <span className="edit-habit__entry-mode-label">{ENTRY_MODE.replaceLabel}</span>
              <span className="edit-habit__entry-mode-desc">{ENTRY_MODE.replaceDescription}</span>
            </button>
            <button
              type="button"
              className={`edit-habit__entry-mode-option ${form.entryMode === 'cumulative' ? 'edit-habit__entry-mode-option--selected' : ''}`}
              onClick={() => updateField('entryMode', 'cumulative')}
              aria-pressed={form.entryMode === 'cumulative'}
            >
              <span className="edit-habit__entry-mode-label">{ENTRY_MODE.cumulativeLabel}</span>
              <span className="edit-habit__entry-mode-desc">
                {ENTRY_MODE.cumulativeDescription}
              </span>
            </button>
          </div>
          {form.entryMode === 'cumulative' && (
            <p className="edit-habit__entry-mode-cumulative-hint">{ENTRY_MODE.cumulativeHint}</p>
          )}
        </div>
      )}
    </>
  )
}
