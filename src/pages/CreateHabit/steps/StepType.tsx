/**
 * StepType - Step for selecting habit direction (increase/decrease/maintain)
 */

import { useTranslation } from 'react-i18next'
import { useCreateHabitContext } from '../CreateHabitContext'
import { HABIT_TYPE_ICONS } from '../types'
import type { HabitDirection } from '../../../types'

/**
 * Step for selecting the habit type/direction
 */
export function StepType() {
  const { t } = useTranslation()
  const { form, updateForm } = useCreateHabitContext()

  const directions: HabitDirection[] = ['increase', 'decrease', 'maintain']

  return (
    <div className="create-habit__content step-type">
      <div className="step-type__options">
        {directions.map((direction) => (
          <button
            key={direction}
            type="button"
            className={`step-type__option ${form.direction === direction ? 'step-type__option--selected' : ''}`}
            onClick={() => updateForm('direction', direction)}
            aria-pressed={form.direction === direction}
          >
            <span className="step-type__option-icon" aria-hidden="true">
              {HABIT_TYPE_ICONS[direction]}
            </span>
            <div className="step-type__option-content">
              <p className="step-type__option-title">{t(`habits.type.${direction}`)}</p>
              <p className="step-type__option-description">
                {t(`habits.typeDescriptions.${direction}`)}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
