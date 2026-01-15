/**
 * DirectionSection - Habit direction selector
 * Handles: increase, decrease, maintain type selection
 */

import { useEditHabitContext } from '../EditHabitContext'

export function DirectionSection() {
  const { form, updateField, originalDirection } = useEditHabitContext()

  return (
    <div className="edit-habit__direction-section">
      <p className="edit-habit__field-label">Type d'habitude</p>
      <div className="edit-habit__direction-options">
        <button
          type="button"
          className={`edit-habit__direction-option ${form.direction === 'increase' ? 'edit-habit__direction-option--selected' : ''}`}
          onClick={() => updateField('direction', 'increase')}
          aria-pressed={form.direction === 'increase'}
        >
          <span className="edit-habit__direction-icon">📈</span>
          <span className="edit-habit__direction-label">Augmenter</span>
        </button>
        <button
          type="button"
          className={`edit-habit__direction-option ${form.direction === 'decrease' ? 'edit-habit__direction-option--selected' : ''}`}
          onClick={() => updateField('direction', 'decrease')}
          aria-pressed={form.direction === 'decrease'}
        >
          <span className="edit-habit__direction-icon">📉</span>
          <span className="edit-habit__direction-label">Réduire</span>
        </button>
        <button
          type="button"
          className={`edit-habit__direction-option ${form.direction === 'maintain' ? 'edit-habit__direction-option--selected' : ''}`}
          onClick={() => updateField('direction', 'maintain')}
          aria-pressed={form.direction === 'maintain'}
        >
          <span className="edit-habit__direction-icon">⚖️</span>
          <span className="edit-habit__direction-label">Maintenir</span>
        </button>
      </div>
      {/* Message si changement de type */}
      {form.direction !== originalDirection && (
        <div className="edit-habit__direction-warning">
          <p className="edit-habit__direction-warning-text">
            {form.direction === 'maintain'
              ? 'En passant en mode "Maintenir", la progression sera désactivée. La dose restera fixe.'
              : `Tu passes de "${originalDirection === 'increase' ? 'Augmenter' : originalDirection === 'decrease' ? 'Réduire' : 'Maintenir'}" à "${form.direction === 'increase' ? 'Augmenter' : 'Réduire'}". La progression sera adaptée.`}
          </p>
        </div>
      )}
    </div>
  )
}
