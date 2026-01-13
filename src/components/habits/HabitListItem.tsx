import { useTranslation } from 'react-i18next'
import { Habit, DailyEntry } from '../../types'
import { calculateHabitStats } from '../../services/progression'
import { getCurrentDate, addDays } from '../../utils'
import Card from '../ui/Card'
import './HabitListItem.css'

export interface HabitListItemProps {
  /** Habitude à afficher */
  habit: Habit
  /** Entrées de l'habitude */
  entries: DailyEntry[]
  /** Callback au clic sur l'item */
  onClick: (habitId: string) => void
}

/**
 * Calcule les 7 derniers jours pour les stats
 */
function getLast7Days(): { startDate: string; endDate: string } {
  const today = getCurrentDate()
  return {
    startDate: addDays(today, -6),
    endDate: today,
  }
}

/**
 * Item de liste d'habitude avec stats rapides
 * Affiche le nom, l'emoji, et les statistiques des 7 derniers jours
 */
function HabitListItem({ habit, entries, onClick }: HabitListItemProps) {
  const { t } = useTranslation()
  const { startDate, endDate } = getLast7Days()
  const stats = calculateHabitStats(habit, entries, startDate, endDate)

  const handleClick = () => {
    onClick(habit.id)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick(habit.id)
    }
  }

  const directionLabel = t(`habits.type.${habit.direction}`)

  return (
    <Card
      variant="default"
      className={`habit-list-item ${habit.archivedAt ? 'habit-list-item--archived' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={t('habitList.viewDetails', { name: habit.name })}
    >
      <div className="habit-list-item__content">
        <div className="habit-list-item__main">
          <span className="habit-list-item__emoji" aria-hidden="true">
            {habit.emoji}
          </span>
          <div className="habit-list-item__info">
            <h3 className="habit-list-item__name">{habit.name}</h3>
            <p className="habit-list-item__meta">
              {directionLabel} · {habit.startValue} {habit.unit}
            </p>
          </div>
        </div>

        <div className="habit-list-item__stats">
          <div className="habit-list-item__stat">
            <span className="habit-list-item__stat-value">{stats.activeDays}</span>
            <span className="habit-list-item__stat-label">{t('habitList.activeDays')}</span>
          </div>
          <div className="habit-list-item__stat">
            <span className="habit-list-item__stat-value">
              {Math.round(stats.averageCompletion)}%
            </span>
            <span className="habit-list-item__stat-label">{t('habitList.average')}</span>
          </div>
        </div>

        <div className="habit-list-item__arrow" aria-hidden="true">
          →
        </div>
      </div>
    </Card>
  )
}

export default HabitListItem
