import { useTranslation } from 'react-i18next'
import { RecalibrationRecord } from '../../types'
import './RestartTimeline.css'

export interface RestartTimelineProps {
  /** Historique des recalibrations/restarts */
  history: RecalibrationRecord[]
  /** Unité de mesure */
  unit: string
}

/**
 * Timeline chronologique des recalibrations et nouveaux départs
 * Affiche un historique bienveillant des ajustements
 */
function RestartTimeline({ history, unit }: RestartTimelineProps) {
  const { t } = useTranslation()

  if (history.length === 0) {
    return null
  }

  return (
    <div className="restart-timeline">
      <h4 className="restart-timeline__title">{t('restartTimeline.title')}</h4>
      <ul className="restart-timeline__list">
        {[...history].reverse().map((record, index) => {
          const isRestart = record.type === 'restart'
          const icon = isRestart ? '🔄' : '↑'
          const label = isRestart
            ? t('restartTimeline.restart')
            : t('restartTimeline.recalibration')

          return (
            <li key={`${record.date}-${index}`} className="restart-timeline__item">
              <span className="restart-timeline__icon" aria-hidden="true">
                {icon}
              </span>
              <div className="restart-timeline__date">
                {record.date} — {label}
              </div>
              <div className="restart-timeline__change">
                {t('restartTimeline.from', { previous: record.previousStartValue })}{' '}
                {t('restartTimeline.to', { newValue: record.newStartValue, unit })}
              </div>
              {record.reason && (
                <div className="restart-timeline__reason">
                  {t('restartTimeline.reason', { reason: record.reason })}
                </div>
              )}
              {isRestart && (
                <div className="restart-timeline__encouragement">
                  {t('restartTimeline.encouragement')}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default RestartTimeline
