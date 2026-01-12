import { TrendDirection, StatCardData } from '../../types/statistics'
import Card from '../ui/Card'
import './StatCard.css'

export interface StatCardProps extends StatCardData {
  /** Classe CSS additionnelle */
  className?: string
}

/**
 * Icône de flèche pour la tendance
 */
function TrendIcon({ direction }: { direction: TrendDirection }) {
  if (direction === 'up') {
    return (
      <svg
        className="stat-card__trend-icon stat-card__trend-icon--up"
        viewBox="0 0 16 16"
        aria-hidden="true"
      >
        <path d="M8 3L14 9L12.5 10.5L9 7V13H7V7L3.5 10.5L2 9L8 3Z" fill="currentColor" />
      </svg>
    )
  }

  if (direction === 'down') {
    return (
      <svg
        className="stat-card__trend-icon stat-card__trend-icon--down"
        viewBox="0 0 16 16"
        aria-hidden="true"
      >
        <path d="M8 13L2 7L3.5 5.5L7 9V3H9V9L12.5 5.5L14 7L8 13Z" fill="currentColor" />
      </svg>
    )
  }

  return (
    <svg
      className="stat-card__trend-icon stat-card__trend-icon--stable"
      viewBox="0 0 16 16"
      aria-hidden="true"
    >
      <path d="M2 7H10L7 4L8.5 2.5L14 8L8.5 13.5L7 12L10 9H2V7Z" fill="currentColor" />
    </svg>
  )
}

/**
 * Composant StatCard
 * Carte affichant une métrique clé avec valeur et tendance
 *
 * @example
 * <StatCard
 *   label="Moyenne"
 *   value={87}
 *   unit="%"
 *   trend="up"
 *   trendValue="+5%"
 * />
 */
/**
 * Retourne le texte de tendance pour l'accessibilité
 */
function getTrendLabel(trend: TrendDirection, trendValue?: string): string {
  const trendLabels: Record<TrendDirection, string> = {
    up: 'en hausse',
    down: 'en baisse',
    stable: 'stable',
  }
  const baseLabel = trendLabels[trend]
  return trendValue ? `${baseLabel} de ${trendValue}` : baseLabel
}

function StatCard({ label, value, unit, trend, trendValue, className = '' }: StatCardProps) {
  const classNames = ['stat-card', className].filter(Boolean).join(' ')

  // Construire le label accessible complet
  const accessibleLabel = trend
    ? `${label}: ${value}${unit || ''}, ${getTrendLabel(trend, trendValue)}`
    : `${label}: ${value}${unit || ''}`

  return (
    <Card variant="default" className={classNames} aria-label={accessibleLabel} role="group">
      <div className="stat-card__content">
        <div className="stat-card__value-row">
          <span className="stat-card__value" aria-hidden="true">
            {value}
          </span>
          {unit && (
            <span className="stat-card__unit" aria-hidden="true">
              {unit}
            </span>
          )}
        </div>

        <div className="stat-card__label" aria-hidden="true">
          {label}
        </div>

        {trend && (
          <div className={`stat-card__trend stat-card__trend--${trend}`} aria-hidden="true">
            <TrendIcon direction={trend} />
            {trendValue && <span className="stat-card__trend-value">{trendValue}</span>}
          </div>
        )}
      </div>
    </Card>
  )
}

export default StatCard
