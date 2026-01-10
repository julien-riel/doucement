import { useMemo } from 'react'
import { randomMessage, WELCOME_BACK, HABIT_NEGLECTED } from '../../constants/messages'
import type { HabitAbsenceInfo } from '../../utils/absence'
import './WelcomeBackMessage.css'

/**
 * Props pour le composant WelcomeBackMessage
 */
export interface WelcomeBackMessageProps {
  /** Nombre de jours depuis la dernière activité globale */
  daysSinceLastActivity: number
  /** Liste des habitudes négligées (optionnel) */
  neglectedHabits?: HabitAbsenceInfo[]
  /** Callback appelé quand l'utilisateur ferme le message */
  onDismiss?: () => void
}

/**
 * WelcomeBackMessage - Message bienveillant de retour après une absence
 *
 * Affiché quand l'utilisateur revient après 2+ jours sans check-in.
 * Le message est toujours positif et encourageant, sans aucune culpabilisation.
 *
 * Basé sur les principes de récupération bienveillante :
 * - Pas de mention du nombre de jours exact (trop culpabilisant)
 * - Focus sur le retour positif, pas sur l'absence
 * - Encouragement à reprendre doucement
 */
function WelcomeBackMessage({
  daysSinceLastActivity,
  neglectedHabits,
  onDismiss,
}: WelcomeBackMessageProps) {
  /**
   * Sélectionne un message aléatoire de bienvenue
   */
  const welcomeMessage = useMemo(() => randomMessage(WELCOME_BACK), [])

  /**
   * Détermine si on doit afficher le détail par habitude
   */
  const showHabitDetails =
    neglectedHabits && neglectedHabits.length > 0 && neglectedHabits.length <= 3

  return (
    <div className="welcome-back" role="alert" aria-live="polite">
      <div className="welcome-back__content">
        {/* Icône */}
        <span className="welcome-back__icon" aria-hidden="true">
          👋
        </span>

        {/* Message principal */}
        <div className="welcome-back__text">
          <p className="welcome-back__title">{welcomeMessage}</p>
          <p className="welcome-back__subtitle">
            {HABIT_NEGLECTED.encouragement}
          </p>
        </div>

        {/* Bouton de fermeture */}
        {onDismiss && (
          <button
            type="button"
            className="welcome-back__dismiss"
            onClick={onDismiss}
            aria-label="Fermer le message"
          >
            ✕
          </button>
        )}
      </div>

      {/* Détail des habitudes négligées (optionnel) */}
      {showHabitDetails && (
        <div className="welcome-back__habits">
          {neglectedHabits.map((info) => (
            <div key={info.habit.id} className="welcome-back__habit">
              <span className="welcome-back__habit-emoji">
                {info.habit.emoji}
              </span>
              <span className="welcome-back__habit-name">
                {info.habit.name}
              </span>
              {info.daysSinceLastEntry > 0 && (
                <span className="welcome-back__habit-days">
                  {info.daysSinceLastEntry === 1
                    ? 'hier'
                    : `${info.daysSinceLastEntry} jours`}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default WelcomeBackMessage
