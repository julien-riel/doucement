import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatDateFr } from '../../utils'
import './DailyHeader.css'

export interface DailyHeaderProps {
  /** Date courante (YYYY-MM-DD) */
  date: string
  /** Pourcentage de complétion du jour (0-100) */
  completionPercentage: number
}

/**
 * Vérifie si la date est un vendredi, samedi ou dimanche (fin de semaine)
 */
function isEndOfWeek(dateStr: string): boolean {
  const date = new Date(dateStr + 'T12:00:00')
  const day = date.getDay()
  return day === 0 || day === 5 || day === 6 // dimanche, vendredi, samedi
}

/**
 * En-tête de l'écran Aujourd'hui
 * Affiche la date du jour et le pourcentage de complétion global
 */
function DailyHeader({ date, completionPercentage }: DailyHeaderProps) {
  const { t } = useTranslation()
  const formattedDate = formatDateFr(date)
  const displayPercentage = Math.round(completionPercentage)
  const showReviewLink = isEndOfWeek(date)

  return (
    <header className="daily-header">
      <div className="daily-header__date-row">
        <h1 className="daily-header__date">{formattedDate}</h1>
        <div className="daily-header__right">
          {showReviewLink && (
            <Link
              to="/review"
              className="daily-header__review-link"
              aria-label={t('weeklyReview.title')}
            >
              📋
            </Link>
          )}
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
