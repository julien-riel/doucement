import { Link } from 'react-router-dom'
import { formatDateFr } from '../../utils'
import './DailyHeader.css'

export interface DailyHeaderProps {
  /** Date courante (YYYY-MM-DD) */
  date: string
  /** Pourcentage de complétion du jour (0-100) */
  completionPercentage: number
}

/**
 * En-tête de l'écran Aujourd'hui
 * Affiche la date du jour et le pourcentage de complétion global
 */
function DailyHeader({ date, completionPercentage }: DailyHeaderProps) {
  const formattedDate = formatDateFr(date)
  const displayPercentage = Math.round(completionPercentage)

  return (
    <header className="daily-header">
      <div className="daily-header__date-row">
        <h1 className="daily-header__date">{formattedDate}</h1>
        <div className="daily-header__right">
          <span
            className="daily-header__percentage"
            role="status"
            aria-label={`${displayPercentage}% complété`}
          >
            {displayPercentage}%
          </span>
          <Link to="/settings" className="daily-header__settings" aria-label="Paramètres">
            ⚙️
          </Link>
        </div>
      </div>
      <div
        className="daily-header__progress-bar"
        role="progressbar"
        aria-valuenow={displayPercentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="daily-header__progress-fill"
          style={{ '--progress': `${displayPercentage}%` } as React.CSSProperties}
        />
      </div>
      <h2 className="daily-header__title">Aujourd'hui</h2>
    </header>
  )
}

export default DailyHeader
