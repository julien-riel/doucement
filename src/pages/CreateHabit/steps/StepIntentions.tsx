/**
 * StepIntentions - Step for implementation intentions and habit stacking
 */

import { useTranslation } from 'react-i18next'
import { useCreateHabitContext } from '../CreateHabitContext'
import { useAppData } from '../../../hooks'
import { StepIntentions as IntentionsForm, HabitAnchorSelector } from '../../../components/habits'
import type { ImplementationIntention } from '../../../types'

/**
 * Step for setting implementation intentions and habit stacking
 */
export function StepIntentions() {
  const { t } = useTranslation()
  const { form, updateForm } = useCreateHabitContext()
  const { activeHabits } = useAppData()

  const handleIntentionChange = (intention: ImplementationIntention) => {
    updateForm('implementationIntention', intention)
  }

  const handleAnchorChange = (anchorId: string | undefined) => {
    updateForm('anchorHabitId', anchorId)
  }

  return (
    <div className="create-habit__content step-intentions-combined">
      <IntentionsForm
        intention={form.implementationIntention}
        onIntentionChange={handleIntentionChange}
      />

      {/* Habit Stacking - only for increase and maintain */}
      {form.direction !== 'decrease' && (
        <>
          {/* Separator */}
          <div className="step-intentions-combined__separator">
            <span className="step-intentions-combined__separator-text">{t('common.or')}</span>
          </div>

          <HabitAnchorSelector
            habits={activeHabits}
            selectedAnchorId={form.anchorHabitId}
            onAnchorChange={handleAnchorChange}
          />
        </>
      )}
    </div>
  )
}
