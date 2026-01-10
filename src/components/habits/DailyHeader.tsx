import './DailyHeader.css'

export interface DailyHeaderProps {
  /** Date courante (YYYY-MM-DD) */
  date: string
  /** Pourcentage de complétion du jour (0-100) */
  completionPercentage: number
}

/**
 * Formate une date en français
 * @param dateStr Date au format YYYY-MM-DD
 * @returns Date formatée (ex: "Vendredi 10 janvier")
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

/**
 * En-tête de l'écran Aujourd'hui
 * Affiche la date du jour et le pourcentage de complétion global
 */
function DailyHeader({ date, completionPercentage }: DailyHeaderProps) {
  const formattedDate = formatDate(date)
  const displayPercentage = Math.round(completionPercentage)

  return (
    <header className="daily-header">
      <div className="daily-header__date-row">
        <h1 className="daily-header__date">{formattedDate}</h1>
        <span
          className="daily-header__percentage"
          role="status"
          aria-label={`${displayPercentage}% complété`}
        >
          {displayPercentage}%
        </span>
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
