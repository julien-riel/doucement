import { useMemo } from 'react'
import './EncouragingMessage.css'

export type TimeOfDay = 'morning' | 'afternoon' | 'evening'

export interface EncouragingMessageProps {
  /** Moment de la journée (optionnel, calculé automatiquement si non fourni) */
  timeOfDay?: TimeOfDay
}

/**
 * Messages selon le moment de la journée
 * Source: docs/design/design-system-specification.md
 */
const MESSAGES: Record<TimeOfDay, string> = {
  morning: 'Nouvelle journée, nouvelles possibilités',
  afternoon: 'Tu as encore du temps devant toi',
  evening: 'Termine en douceur',
}

/**
 * Emojis associés au moment de la journée
 */
const EMOJIS: Record<TimeOfDay, string> = {
  morning: '🌅',
  afternoon: '☀️',
  evening: '🌙',
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
 */
function EncouragingMessage({ timeOfDay }: EncouragingMessageProps) {
  const currentTimeOfDay = useMemo(() => timeOfDay ?? getTimeOfDay(), [timeOfDay])
  const message = MESSAGES[currentTimeOfDay]
  const emoji = EMOJIS[currentTimeOfDay]

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
