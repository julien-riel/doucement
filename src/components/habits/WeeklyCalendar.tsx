import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { DailyEntry, CompletionStatus, HabitDirection } from '../../types'
import { getCompletionStatus } from '../../services/progression'
import { addDays } from '../../utils'
import './WeeklyCalendar.css'

export interface WeeklyCalendarProps {
  /** Entrées de la semaine */
  entries: DailyEntry[]
  /** Date de référence (YYYY-MM-DD) */
  referenceDate: string
  /** Direction de l'habitude (pour le calcul correct du statut) */
  direction?: HabitDirection
}

interface DayData {
  date: string
  dayName: string
  dayNumber: number
  status: CompletionStatus | 'empty'
}

/**
 * Génère les 7 derniers jours à partir de la date de référence
 */
function getLast7Days(referenceDate: string, dayNames: string[]): DayData[] {
  const days: DayData[] = []

  for (let i = 6; i >= 0; i--) {
    const dateStr = addDays(referenceDate, -i)
    // Parse la date en local pour obtenir le bon jour de semaine
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)

    days.push({
      date: dateStr,
      dayName: dayNames[date.getDay()],
      dayNumber: date.getDate(),
      status: 'empty',
    })
  }

  return days
}

/**
 * Calendrier hebdomadaire avec états visuels
 * Affiche les 7 derniers jours avec indicateur de complétion
 */
function WeeklyCalendar({ entries, referenceDate, direction }: WeeklyCalendarProps) {
  const { t } = useTranslation()
  const dayNames = t('habitDetail.weeklyCalendar.dayNames', { returnObjects: true }) as string[]

  const days = useMemo(() => {
    const baseDays = getLast7Days(referenceDate, dayNames)

    return baseDays.map((day) => {
      const entry = entries.find((e) => e.date === day.date)
      if (entry) {
        return { ...day, status: getCompletionStatus(entry, direction) }
      }
      return day
    })
  }, [entries, referenceDate, direction, dayNames])

  const getStatusLabel = (status: CompletionStatus | 'empty'): string => {
    return t(`habitDetail.weeklyCalendar.status.${status}`)
  }

  return (
    <div
      className="weekly-calendar"
      role="group"
      aria-label={t('habitDetail.weeklyCalendar.ariaLabel')}
    >
      {days.map((day) => (
        <div
          key={day.date}
          className={`weekly-calendar__day weekly-calendar__day--${day.status}`}
          aria-label={`${day.dayName} ${day.dayNumber}: ${getStatusLabel(day.status)}`}
        >
          <span className="weekly-calendar__day-name">{day.dayName}</span>
          <span className="weekly-calendar__day-number">{day.dayNumber}</span>
          <span className="weekly-calendar__indicator" aria-hidden="true">
            {getStatusIcon(day.status)}
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * Retourne l'icône selon le statut
 */
function getStatusIcon(status: CompletionStatus | 'empty'): string {
  switch (status) {
    case 'exceeded':
      return '★'
    case 'completed':
      return '●'
    case 'partial':
      return '◐'
    case 'pending':
      return '○'
    case 'empty':
    default:
      return '·'
  }
}

export default WeeklyCalendar
