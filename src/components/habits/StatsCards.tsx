import { HabitStats } from '../../services/progression'
import Card from '../ui/Card'
import './StatsCards.css'

export interface StatsCardsProps {
  /** Statistiques calculées */
  stats: HabitStats
  /** Unité de l'habitude */
  unit: string
}

/**
 * Cartes statistiques pour l'écran détail d'habitude
 * Affiche: jours actifs, % moyen, progression
 */
function StatsCards({ stats, unit }: StatsCardsProps) {
  const { activeDays, totalDays, averageCompletion, completedDays, totalProgression } = stats

  // Formater la progression avec signe
  const progressionText =
    totalProgression > 0
      ? `+${totalProgression}`
      : totalProgression < 0
        ? `${totalProgression}`
        : '0'

  return (
    <div className="stats-cards">
      <Card variant="default" className="stats-cards__card">
        <div className="stats-cards__value">{activeDays}</div>
        <div className="stats-cards__label">jours actifs</div>
        <div className="stats-cards__sublabel">sur {totalDays} jours</div>
      </Card>

      <Card variant="default" className="stats-cards__card">
        <div className="stats-cards__value">{Math.round(averageCompletion)}%</div>
        <div className="stats-cards__label">moyenne</div>
        <div className="stats-cards__sublabel">{completedDays} jours réussis</div>
      </Card>

      <Card variant="default" className="stats-cards__card">
        <div className="stats-cards__value stats-cards__value--progression">{progressionText}</div>
        <div className="stats-cards__label">{unit}</div>
        <div className="stats-cards__sublabel">progression</div>
      </Card>
    </div>
  )
}

export default StatsCards
