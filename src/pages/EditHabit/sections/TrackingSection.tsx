/**
 * TrackingSection - Tracking mode and entry mode
 * Handles: simple/detailed/counter modes + replace/cumulative entry modes
 */

import { TRACKING_MODE, ENTRY_MODE } from '../../../constants/messages'
import { useEditHabitContext } from '../EditHabitContext'

export function TrackingSection() {
  const { form, updateField } = useEditHabitContext()

  return (
    <>
      {/* Mode de suivi */}
      <div className="edit-habit__tracking-mode-section">
        <p className="edit-habit__field-label">{TRACKING_MODE.sectionTitle}</p>
        <p className="edit-habit__field-hint">{TRACKING_MODE.sectionHint}</p>
        <div className="edit-habit__tracking-mode-options">
          <button
            type="button"
            className={`edit-habit__tracking-mode-option ${form.trackingMode === 'simple' ? 'edit-habit__tracking-mode-option--selected' : ''}`}
            onClick={() => updateField('trackingMode', 'simple')}
            aria-pressed={form.trackingMode === 'simple'}
          >
            <span className="edit-habit__tracking-mode-label">{TRACKING_MODE.simpleLabel}</span>
            <span className="edit-habit__tracking-mode-desc">
              {TRACKING_MODE.simpleDescription}
            </span>
          </button>
          <button
            type="button"
            className={`edit-habit__tracking-mode-option ${form.trackingMode === 'detailed' ? 'edit-habit__tracking-mode-option--selected' : ''}`}
            onClick={() => updateField('trackingMode', 'detailed')}
            aria-pressed={form.trackingMode === 'detailed'}
          >
            <span className="edit-habit__tracking-mode-label">{TRACKING_MODE.detailedLabel}</span>
            <span className="edit-habit__tracking-mode-desc">
              {TRACKING_MODE.detailedDescription}
            </span>
          </button>
          <button
            type="button"
            className={`edit-habit__tracking-mode-option ${form.trackingMode === 'counter' ? 'edit-habit__tracking-mode-option--selected' : ''}`}
            onClick={() => updateField('trackingMode', 'counter')}
            aria-pressed={form.trackingMode === 'counter'}
          >
            <span className="edit-habit__tracking-mode-label">{TRACKING_MODE.counterLabel}</span>
            <span className="edit-habit__tracking-mode-desc">
              {TRACKING_MODE.counterDescription}
            </span>
          </button>
        </div>
        {form.trackingMode === 'counter' && (
          <p className="edit-habit__tracking-mode-counter-hint">{TRACKING_MODE.counterHint}</p>
        )}
      </div>

      {/* Mode de saisie - seulement pour detailed (counter utilise toujours +1/-1) */}
      {form.trackingMode === 'detailed' && (
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
