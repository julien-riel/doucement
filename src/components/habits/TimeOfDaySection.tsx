import { ReactNode } from 'react'
import { TimeOfDay } from '../../types'
import './TimeOfDaySection.css'

/**
 * Configuration des labels et emojis pour chaque moment de la journée
 */
export const TIME_OF_DAY_CONFIG: Record<
  TimeOfDay,
  {
    emoji: string
    label: string
  }
> = {
  morning: {
    emoji: '🌅',
    label: 'Matin',
  },
  afternoon: {
    emoji: '☀️',
    label: 'Après-midi',
  },
  evening: {
    emoji: '🌙',
    label: 'Soir',
  },
  night: {
    emoji: '🌃',
    label: 'Nuit',
  },
}

export interface TimeOfDaySectionProps {
  /** Moment de la journée (null pour les habitudes sans moment défini) */
  timeOfDay: TimeOfDay | null
  /** Contenu à afficher (HabitCards) */
  children: ReactNode
  /** Label personnalisé pour la section "non défini" */
  undefinedLabel?: string
}

/**
 * Section regroupant les habitudes par moment de la journée
 * Affiche un titre avec emoji et label, suivi des habitudes
 */
function TimeOfDaySection({
  timeOfDay,
  children,
  undefinedLabel = 'Autre',
}: TimeOfDaySectionProps) {
  const config = timeOfDay ? TIME_OF_DAY_CONFIG[timeOfDay] : null

  return (
    <section className="time-of-day-section">
      <h2 className="time-of-day-section__header">
        {config ? (
          <>
            <span className="time-of-day-section__emoji" aria-hidden="true">
              {config.emoji}
            </span>
            <span className="time-of-day-section__label">{config.label}</span>
          </>
        ) : (
          <span className="time-of-day-section__label">{undefinedLabel}</span>
        )}
      </h2>
      <div className="time-of-day-section__content">{children}</div>
    </section>
  )
}

export default TimeOfDaySection
