/**
 * ProgressionSection - Progression settings
 * Handles: progression mode (percentage/absolute), value, period, target value
 * Only shown for increase/decrease habits (not maintain)
 */

import { Input } from '../../../components/ui'
import { useEditHabitContext } from '../EditHabitContext'

export function ProgressionSection() {
  const { form, updateField, habit } = useEditHabitContext()

  // Don't render for maintain habits
  if (form.direction === 'maintain') {
    return null
  }

  return (
    <>
      {/* Progression */}
      <div className="edit-habit__progression-section">
        <p className="edit-habit__field-label">Progression</p>

        {/* Mode de progression */}
        <div className="edit-habit__progression-options">
          <button
            type="button"
            className={`edit-habit__progression-option ${form.progressionMode === 'percentage' ? 'edit-habit__progression-option--selected' : ''}`}
            onClick={() => updateField('progressionMode', 'percentage')}
          >
            En %
          </button>
          <button
            type="button"
            className={`edit-habit__progression-option ${form.progressionMode === 'absolute' ? 'edit-habit__progression-option--selected' : ''}`}
            onClick={() => updateField('progressionMode', 'absolute')}
          >
            En unités
          </button>
        </div>

        {/* Valeur et période de progression */}
        <div className="edit-habit__row">
          <Input
            type="number"
            label={form.progressionMode === 'percentage' ? 'Pourcentage' : 'Unités'}
            placeholder={form.progressionMode === 'percentage' ? '5' : '1'}
            min={1}
            value={form.progressionValue || ''}
            onChange={(e) => updateField('progressionValue', Number(e.target.value))}
            hint={form.progressionMode === 'percentage' ? 'Ex: 5%' : undefined}
          />
          <div className="input-wrapper">
            <label className="input-label">Par</label>
            <div className="edit-habit__progression-options">
              <button
                type="button"
                className={`edit-habit__progression-option ${form.progressionPeriod === 'weekly' ? 'edit-habit__progression-option--selected' : ''}`}
                onClick={() => updateField('progressionPeriod', 'weekly')}
              >
                Semaine
              </button>
              <button
                type="button"
                className={`edit-habit__progression-option ${form.progressionPeriod === 'daily' ? 'edit-habit__progression-option--selected' : ''}`}
                onClick={() => updateField('progressionPeriod', 'daily')}
              >
                Jour
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Objectif final (optionnel) */}
      <Input
        type="number"
        label="Objectif final (optionnel)"
        placeholder="Laisser vide pour continuer indéfiniment"
        min={form.direction === 'increase' ? habit.startValue + 1 : 0}
        max={form.direction === 'decrease' ? habit.startValue - 1 : undefined}
        value={form.targetValue ?? ''}
        onChange={(e) => updateField('targetValue', e.target.value ? Number(e.target.value) : null)}
        hint={
          form.direction === 'increase'
            ? "La dose augmentera jusqu'à atteindre cet objectif"
            : "La dose diminuera jusqu'à atteindre cet objectif"
        }
      />
    </>
  )
}
