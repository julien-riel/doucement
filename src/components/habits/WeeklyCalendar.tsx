import { useMemo } from 'react'
import { DailyEntry, CompletionStatus } from '../../types'
import { getCompletionStatus } from '../../services/progression'
import './WeeklyCalendar.css'

export interface WeeklyCalendarProps {
  /** Entrées de la semaine */
  entries: DailyEntry[]
  /** Date de référence (YYYY-MM-DD) */
  referenceDate: string
}

interface DayData {
  date: string
  dayName: string
  dayNumber: number
  status: CompletionStatus | 'empty'
}

/**
 * Noms des jours (abrégés)
 */
const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

/**
 * Génère les 7 derniers jours à partir de la date de référence
 */
function getLast7Days(referenceDate: string): DayData[] {
  const days: DayData[] = []
  const ref = new Date(referenceDate)

  for (let i = 6; i >= 0; i--) {
    const date = new Date(ref)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    days.push({
      date: dateStr,
      dayName: DAY_NAMES[date.getDay()],
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
function WeeklyCalendar({ entries, referenceDate }: WeeklyCalendarProps) {
  const days = useMemo(() => {
    const baseDays = getLast7Days(referenceDate)

    return baseDays.map((day) => {
      const entry = entries.find((e) => e.date === day.date)
      if (entry) {
        return { ...day, status: getCompletionStatus(entry) }
      }
      return day
    })
  }, [entries, referenceDate])

  return (
    <div className="weekly-calendar" role="group" aria-label="Activité de la semaine">
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

/**
 * Retourne le label accessible selon le statut
 */
function getStatusLabel(status: CompletionStatus | 'empty'): string {
  switch (status) {
    case 'exceeded':
      return 'Dépassé'
    case 'completed':
      return 'Complété'
    case 'partial':
      return 'Partiel'
    case 'pending':
      return 'En attente'
    case 'empty':
    default:
      return 'Pas d\'activité'
  }
}

export default WeeklyCalendar
