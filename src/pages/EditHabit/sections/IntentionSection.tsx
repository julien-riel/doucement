/**
 * IntentionSection - Implementation intention settings
 * Handles: trigger, location, time, anchor habit (habit stacking)
 */

import { Input } from '../../../components/ui'
import type { Habit } from '../../../types'
import { useEditHabitContext } from '../EditHabitContext'

export function IntentionSection() {
  const { form, updateField, availableAnchorHabits } = useEditHabitContext()

  return (
    <>
      {/* Implementation Intention - Quand et Où */}
      <div className="edit-habit__intention-section">
        <p className="edit-habit__field-label">Intention de mise en œuvre (optionnel)</p>
        <p className="edit-habit__field-hint">
          Définir quand et où tu pratiques cette habitude augmente tes chances de réussite.
        </p>

        <Input
          label="Déclencheur"
          placeholder="Ex: Après mon café du matin"
          value={form.implementationIntention.trigger ?? ''}
          onChange={(e) =>
            updateField('implementationIntention', {
              ...form.implementationIntention,
              trigger: e.target.value,
            })
          }
          hint="Quel événement déclenche cette habitude ?"
        />

        <Input
          label="Lieu"
          placeholder="Ex: Dans le salon"
          value={form.implementationIntention.location ?? ''}
          onChange={(e) =>
            updateField('implementationIntention', {
              ...form.implementationIntention,
              location: e.target.value,
            })
          }
          hint="Où pratiques-tu cette habitude ?"
        />

        <Input
          type="time"
          label="Heure prévue"
          value={form.implementationIntention.time ?? ''}
          onChange={(e) =>
            updateField('implementationIntention', {
              ...form.implementationIntention,
              time: e.target.value,
            })
          }
          hint="À quelle heure (optionnel)"
        />
      </div>

      {/* Habit Stacking - Lien avec une autre habitude (sauf pour decrease) */}
      {form.direction !== 'decrease' && availableAnchorHabits.length > 0 && (
        <div className="edit-habit__stacking-section">
          <p className="edit-habit__field-label">Enchaînement d'habitudes (optionnel)</p>
          <p className="edit-habit__field-hint">
            Lier cette habitude à une autre pour créer une routine.
          </p>

          <div className="input-wrapper">
            <label className="input-label">Après quelle habitude ?</label>
            <select
              className="edit-habit__select"
              value={form.anchorHabitId ?? ''}
              onChange={(e) => updateField('anchorHabitId', e.target.value || undefined)}
            >
              <option value="">Aucune (habitude indépendante)</option>
              {availableAnchorHabits.map((h: Habit) => (
                <option key={h.id} value={h.id}>
                  {h.emoji} {h.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </>
  )
}
