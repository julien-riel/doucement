/**
 * StepConfirm - Final confirmation step showing habit summary
 */

import { useTranslation } from 'react-i18next'
import { useCreateHabitContext } from '../CreateHabitContext'
import { useAppData } from '../../../hooks'
import { randomMessage } from '../../../constants/messages'

/**
 * Step for confirming habit creation
 */
export function StepConfirm() {
  const { t } = useTranslation()
  const { form, progressionSummary } = useCreateHabitContext()
  const { activeHabits } = useAppData()

  const habitCreatedMessages = t('habitCreated', { returnObjects: true }) as string[]

  return (
    <div className="create-habit__content step-confirm">
      <div className="step-confirm__summary">
        <div className="step-confirm__header">
          <span className="step-confirm__emoji">{form.emoji}</span>
          <h3 className="step-confirm__name">{form.name}</h3>
        </div>

        <div className="step-confirm__details">
          <div className="step-confirm__detail">
            <span className="step-confirm__detail-label">{t('createHabit.summary.type')}</span>
            <span className="step-confirm__detail-value">
              {form.direction && t(`habits.type.${form.direction}`)}
            </span>
          </div>
          <div className="step-confirm__detail">
            <span className="step-confirm__detail-label">{t('createHabit.summary.startDose')}</span>
            <span className="step-confirm__detail-value">
              {form.startValue} {form.unit}
            </span>
          </div>
          <div className="step-confirm__detail">
            <span className="step-confirm__detail-label">
              {t('createHabit.summary.progression')}
            </span>
            <span className="step-confirm__detail-value">{progressionSummary}</span>
          </div>
          {(form.implementationIntention.trigger || form.implementationIntention.location) && (
            <div className="step-confirm__detail">
              <span className="step-confirm__detail-label">{t('createHabit.summary.plan')}</span>
              <span className="step-confirm__detail-value step-confirm__detail-value--small">
                {form.implementationIntention.trigger && (
                  <>{form.implementationIntention.trigger}</>
                )}
                {form.implementationIntention.location && (
                  <> → {form.implementationIntention.location}</>
                )}
                {form.implementationIntention.time && <> ({form.implementationIntention.time})</>}
              </span>
            </div>
          )}
          {form.anchorHabitId && (
            <div className="step-confirm__detail">
              <span className="step-confirm__detail-label">
                {t('createHabit.summary.linkedAfter')}
              </span>
              <span className="step-confirm__detail-value step-confirm__detail-value--small">
                {(() => {
                  const anchorHabit = activeHabits.find((h) => h.id === form.anchorHabitId)
                  return anchorHabit
                    ? `${anchorHabit.emoji} ${anchorHabit.name}`
                    : t('habits.notFound')
                })()}
              </span>
            </div>
          )}
          {form.identityStatement && (
            <div className="step-confirm__detail">
              <span className="step-confirm__detail-label">
                {t('createHabit.summary.identity')}
              </span>
              <span className="step-confirm__detail-value step-confirm__detail-value--small step-confirm__detail-value--identity">
                {t('identity.reminder.prefix')} {form.identityStatement}
              </span>
            </div>
          )}
          {form.entryMode === 'cumulative' && (
            <div className="step-confirm__detail">
              <span className="step-confirm__detail-label">
                {t('createHabit.summary.entryMode')}
              </span>
              <span className="step-confirm__detail-value">
                {t('createHabit.entryMode.cumulative')}
              </span>
            </div>
          )}
          {form.timeOfDay && (
            <div className="step-confirm__detail">
              <span className="step-confirm__detail-label">
                {t('createHabit.summary.timeOfDay')}
              </span>
              <span className="step-confirm__detail-value">
                {t(`habits.timeOfDayEmojis.${form.timeOfDay}`)}{' '}
                {t(`habits.timeOfDay.${form.timeOfDay}`)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="step-confirm__message">
        <p className="step-confirm__message-text">{randomMessage(habitCreatedMessages)}</p>
      </div>
    </div>
  )
}
