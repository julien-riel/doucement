import { TimeOfDay } from '../../types'
import { TIME_OF_DAY_CONFIG } from '../habits/TimeOfDaySection'
import './TimeOfDaySelector.css'

export interface TimeOfDaySelectorProps {
  /** Valeur sélectionnée (null si aucune) */
  value: TimeOfDay | null
  /** Callback de changement */
  onChange: (value: TimeOfDay | null) => void
  /** Label du champ */
  label?: string
  /** Texte d'aide */
  hint?: string
}

/**
 * Labels courts pour les boutons
 */
const TIME_OF_DAY_OPTIONS: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night']

/**
 * Sélecteur de moment de la journée
 * 4 boutons mutuellement exclusifs avec option de désélection
 */
function TimeOfDaySelector({
  value,
  onChange,
  label = 'Moment de la journée',
  hint = 'Quand prévois-tu de faire cette habitude ?',
}: TimeOfDaySelectorProps) {
  const handleClick = (timeOfDay: TimeOfDay) => {
    // Toggle: si déjà sélectionné, désélectionner
    if (value === timeOfDay) {
      onChange(null)
    } else {
      onChange(timeOfDay)
    }
  }

  return (
    <div className="time-of-day-selector">
      {label && <p className="time-of-day-selector__label">{label}</p>}
      {hint && <p className="time-of-day-selector__hint">{hint}</p>}
      <div className="time-of-day-selector__options" role="radiogroup" aria-label={label}>
        {TIME_OF_DAY_OPTIONS.map((timeOfDay) => {
          const config = TIME_OF_DAY_CONFIG[timeOfDay]
          const isSelected = value === timeOfDay
          return (
            <button
              key={timeOfDay}
              type="button"
              className={`time-of-day-selector__option ${isSelected ? 'time-of-day-selector__option--selected' : ''}`}
              onClick={() => handleClick(timeOfDay)}
              aria-pressed={isSelected}
            >
              <span className="time-of-day-selector__emoji" aria-hidden="true">
                {config.emoji}
              </span>
              <span className="time-of-day-selector__option-label">{config.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default TimeOfDaySelector
