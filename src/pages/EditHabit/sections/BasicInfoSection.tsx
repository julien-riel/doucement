/**
 * BasicInfoSection - Basic habit information
 * Handles: emoji, name, unit, description, time of day
 */

import { EmojiPicker, Input, TimeOfDaySelector } from '../../../components/ui'
import { useEditHabitContext } from '../EditHabitContext'

export function BasicInfoSection() {
  const { form, updateField } = useEditHabitContext()

  return (
    <>
      {/* Emoji */}
      <EmojiPicker
        label="Emoji"
        value={form.emoji}
        onChange={(value) => updateField('emoji', value)}
      />

      {/* Nom */}
      <Input
        label="Nom de l'habitude"
        placeholder="Ex: Push-ups, Méditation, Lecture..."
        value={form.name}
        onChange={(e) => updateField('name', e.target.value)}
      />

      {/* Unité */}
      <Input
        label="Unité"
        placeholder="répétitions, minutes..."
        value={form.unit}
        onChange={(e) => updateField('unit', e.target.value)}
      />

      {/* Description (optionnel) */}
      <div className="edit-habit__description-section">
        <Input
          label="Description (optionnel)"
          placeholder="Décris cette habitude en quelques mots..."
          value={form.description}
          onChange={(e) => updateField('description', e.target.value)}
          hint="Une note personnelle pour te rappeler pourquoi cette habitude compte."
        />
      </div>

      {/* Moment de la journée */}
      <TimeOfDaySelector
        value={form.timeOfDay}
        onChange={(value) => updateField('timeOfDay', value)}
      />
    </>
  )
}
