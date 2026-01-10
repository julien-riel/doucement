import { useMemo } from 'react'
import { getEncouragingMessage, TIME_OF_DAY_EMOJIS } from '../../constants/messages'
import './EncouragingMessage.css'

export type TimeOfDay = 'morning' | 'afternoon' | 'evening'

export interface EncouragingMessageProps {
  /** Moment de la journée (optionnel, calculé automatiquement si non fourni) */
  timeOfDay?: TimeOfDay
}

/**
 * Détermine le moment de la journée selon l'heure
 */
function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

/**
 * Composant d'encouragement affiché en haut de l'écran Aujourd'hui
 * Le message change selon le moment de la journée
 * Messages tirés de constants/messages.ts (source: docs/comm/banque-messages.md)
 */
function EncouragingMessage({ timeOfDay }: EncouragingMessageProps) {
  const currentTimeOfDay = useMemo(() => timeOfDay ?? getTimeOfDay(), [timeOfDay])
  const message = useMemo(() => getEncouragingMessage(currentTimeOfDay), [currentTimeOfDay])
  const emoji = TIME_OF_DAY_EMOJIS[currentTimeOfDay]

  return (
    <div className="encouraging-message" role="status" aria-live="polite">
      <span className="encouraging-message__emoji" aria-hidden="true">
        {emoji}
      </span>
      <p className="encouraging-message__text">{message}</p>
    </div>
  )
}

export default EncouragingMessage
