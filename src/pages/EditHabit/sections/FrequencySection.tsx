/**
 * FrequencySection - Tracking frequency selector
 * Handles: daily vs weekly tracking + weekly aggregation mode
 */

import { WEEKLY_AGGREGATION } from '../../../constants/messages'
import { useEditHabitContext } from '../EditHabitContext'

export function FrequencySection() {
  const { form, updateField } = useEditHabitContext()

  return (
    <>
      {/* Fréquence de suivi */}
      <div className="edit-habit__frequency-section">
        <p className="edit-habit__field-label">Fréquence de suivi</p>
        <div className="edit-habit__frequency-options">
          <button
            type="button"
            className={`edit-habit__frequency-option ${form.trackingFrequency === 'daily' ? 'edit-habit__frequency-option--selected' : ''}`}
            onClick={() => updateField('trackingFrequency', 'daily')}
            aria-pressed={form.trackingFrequency === 'daily'}
          >
            <span className="edit-habit__frequency-label">Quotidien</span>
            <span className="edit-habit__frequency-desc">Dose par jour</span>
          </button>
          <button
            type="button"
            className={`edit-habit__frequency-option ${form.trackingFrequency === 'weekly' ? 'edit-habit__frequency-option--selected' : ''}`}
            onClick={() => updateField('trackingFrequency', 'weekly')}
            aria-pressed={form.trackingFrequency === 'weekly'}
          >
            <span className="edit-habit__frequency-label">Hebdomadaire</span>
            <span className="edit-habit__frequency-desc">X fois par semaine</span>
          </button>
        </div>
      </div>

      {/* Mode d'agrégation hebdomadaire - seulement pour les habitudes weekly */}
      {form.trackingFrequency === 'weekly' && (
        <div className="edit-habit__weekly-aggregation-section">
          <p className="edit-habit__field-label">{WEEKLY_AGGREGATION.sectionTitle}</p>
          <p className="edit-habit__field-hint">{WEEKLY_AGGREGATION.sectionHint}</p>
          <div className="edit-habit__weekly-aggregation-options">
            <button
              type="button"
              className={`edit-habit__weekly-aggregation-option ${form.weeklyAggregation === 'count-days' ? 'edit-habit__weekly-aggregation-option--selected' : ''}`}
              onClick={() => updateField('weeklyAggregation', 'count-days')}
              aria-pressed={form.weeklyAggregation === 'count-days'}
            >
              <span className="edit-habit__weekly-aggregation-label">
                {WEEKLY_AGGREGATION.countDaysLabel}
              </span>
              <span className="edit-habit__weekly-aggregation-desc">
                {WEEKLY_AGGREGATION.countDaysDescription}
              </span>
            </button>
            <button
              type="button"
              className={`edit-habit__weekly-aggregation-option ${form.weeklyAggregation === 'sum-units' ? 'edit-habit__weekly-aggregation-option--selected' : ''}`}
              onClick={() => updateField('weeklyAggregation', 'sum-units')}
              aria-pressed={form.weeklyAggregation === 'sum-units'}
            >
              <span className="edit-habit__weekly-aggregation-label">
                {WEEKLY_AGGREGATION.sumUnitsLabel}
              </span>
              <span className="edit-habit__weekly-aggregation-desc">
                {WEEKLY_AGGREGATION.sumUnitsDescription}
              </span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
