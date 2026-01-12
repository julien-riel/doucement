import { useState, useMemo } from 'react'
import { HeatmapCell, getHeatmapColor } from '../../types/statistics'
import { getHeatmapData, parseDate, formatDate, addDays } from '../../services/statistics'
import { Habit, DailyEntry } from '../../types'
import Card from '../ui/Card'
import './HeatmapCalendar.css'

export interface HeatmapCalendarProps {
  /** Habitude à afficher */
  habit: Habit
  /** Entrées de l'habitude */
  entries: DailyEntry[]
  /** Nombre de mois à afficher (défaut: 3) */
  monthsToShow?: number
  /** Date de référence (défaut: aujourd'hui) */
  referenceDate?: string
}

interface WeekData {
  days: HeatmapCell[]
}

interface MonthInfo {
  year: number
  month: number
  label: string
}

/**
 * Jours de la semaine en abrégé
 */
const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

/**
 * Noms des mois
 */
const MONTH_NAMES = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
]

/**
 * Formate une date pour le tooltip
 */
function formatTooltipDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

/**
 * Organise les données en semaines (du lundi au dimanche)
 */
function organizeIntoWeeks(cells: HeatmapCell[]): WeekData[] {
  if (cells.length === 0) return []

  const weeks: WeekData[] = []
  let currentWeek: HeatmapCell[] = []

  // Trouver le premier lundi
  const firstDate = parseDate(cells[0].date)
  const firstDayOfWeek = firstDate.getDay()
  // En France, semaine commence le lundi (1), dimanche = 0 -> 6
  const adjustedDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

  // Ajouter des cellules vides au début si nécessaire
  for (let i = 0; i < adjustedDay; i++) {
    currentWeek.push({
      date: '',
      percentage: -1, // Marquer comme vide
      value: 0,
      target: 0,
    })
  }

  for (const cell of cells) {
    currentWeek.push(cell)

    if (currentWeek.length === 7) {
      weeks.push({ days: currentWeek })
      currentWeek = []
    }
  }

  // Ajouter la dernière semaine incomplète
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({
        date: '',
        percentage: -1,
        value: 0,
        target: 0,
      })
    }
    weeks.push({ days: currentWeek })
  }

  return weeks
}

/**
 * Extrait les mois présents dans les données
 */
function extractMonths(cells: HeatmapCell[]): MonthInfo[] {
  const months: MonthInfo[] = []
  let lastMonth = -1
  let lastYear = -1

  for (const cell of cells) {
    if (!cell.date) continue
    const [year, month] = cell.date.split('-').map(Number)

    if (month !== lastMonth || year !== lastYear) {
      months.push({
        year,
        month,
        label: MONTH_NAMES[month - 1],
      })
      lastMonth = month
      lastYear = year
    }
  }

  return months
}

/**
 * Tooltip pour une cellule du heatmap
 */
function CellTooltip({
  cell,
  unit,
  position,
}: {
  cell: HeatmapCell
  unit: string
  position: { x: number; y: number }
}) {
  return (
    <div
      className="heatmap-calendar__tooltip"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="heatmap-calendar__tooltip-date">{formatTooltipDate(cell.date)}</div>
      <div className="heatmap-calendar__tooltip-value">
        {cell.value} {unit} ({Math.round(cell.percentage)}%)
      </div>
      <div className="heatmap-calendar__tooltip-target">
        Cible : {cell.target} {unit}
      </div>
    </div>
  )
}

/**
 * Composant HeatmapCalendar
 * Calendrier heatmap style GitHub contributions
 *
 * @example
 * <HeatmapCalendar
 *   habit={habit}
 *   entries={entries}
 *   monthsToShow={3}
 * />
 */
function HeatmapCalendar({
  habit,
  entries,
  monthsToShow = 3,
  referenceDate,
}: HeatmapCalendarProps) {
  const [hoveredCell, setHoveredCell] = useState<{
    cell: HeatmapCell
    position: { x: number; y: number }
  } | null>(null)

  const [monthOffset, setMonthOffset] = useState(0)

  // Calculer la date de fin en fonction de l'offset
  const endDate = useMemo(() => {
    if (!referenceDate && monthOffset === 0) return undefined
    const base = referenceDate || formatDate(new Date())
    return addDays(base, -monthOffset * 30)
  }, [referenceDate, monthOffset])

  // Récupérer les données du heatmap
  const heatmapCells = useMemo(
    () => getHeatmapData(habit, entries, monthsToShow, endDate),
    [habit, entries, monthsToShow, endDate]
  )

  // Organiser en semaines et extraire les mois
  const weeks = useMemo(() => organizeIntoWeeks(heatmapCells), [heatmapCells])
  const months = useMemo(() => extractMonths(heatmapCells), [heatmapCells])

  /**
   * Gère le survol d'une cellule
   */
  const handleCellHover = (cell: HeatmapCell, event: React.MouseEvent<HTMLDivElement>) => {
    if (cell.percentage < 0 || !cell.date) return

    const rect = event.currentTarget.getBoundingClientRect()
    const containerRect = event.currentTarget
      .closest('.heatmap-calendar__grid')
      ?.getBoundingClientRect()

    if (containerRect) {
      setHoveredCell({
        cell,
        position: {
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top - 8,
        },
      })
    }
  }

  const handleCellLeave = () => {
    setHoveredCell(null)
  }

  /**
   * Navigation entre les périodes
   */
  const navigatePrevious = () => {
    setMonthOffset((prev) => prev + monthsToShow)
  }

  const navigateNext = () => {
    setMonthOffset((prev) => Math.max(0, prev - monthsToShow))
  }

  // Période affichée
  const periodLabel = useMemo(() => {
    if (months.length === 0) return ''
    const first = months[0]
    const last = months[months.length - 1]
    if (first.year === last.year) {
      return `${first.label} - ${last.label} ${last.year}`
    }
    return `${first.label} ${first.year} - ${last.label} ${last.year}`
  }, [months])

  return (
    <Card variant="default" className="heatmap-calendar">
      <div className="heatmap-calendar__header">
        <div className="heatmap-calendar__title-row">
          <span className="heatmap-calendar__emoji">{habit.emoji}</span>
          <h3 className="heatmap-calendar__title">Calendrier</h3>
        </div>

        <div className="heatmap-calendar__navigation">
          <button
            className="heatmap-calendar__nav-button"
            onClick={navigatePrevious}
            aria-label="Période précédente"
          >
            <svg viewBox="0 0 16 16" width="16" height="16">
              <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
          </button>

          <span className="heatmap-calendar__period">{periodLabel}</span>

          <button
            className="heatmap-calendar__nav-button"
            onClick={navigateNext}
            disabled={monthOffset === 0}
            aria-label="Période suivante"
          >
            <svg viewBox="0 0 16 16" width="16" height="16">
              <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
          </button>
        </div>
      </div>

      <div
        className="heatmap-calendar__container"
        role="img"
        aria-label={`Calendrier de progression pour ${habit.name}`}
      >
        {/* Labels des jours */}
        <div className="heatmap-calendar__weekdays">
          {WEEKDAY_LABELS.map((label, i) => (
            <span key={i} className="heatmap-calendar__weekday">
              {label}
            </span>
          ))}
        </div>

        {/* Grille du heatmap */}
        <div className="heatmap-calendar__grid">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="heatmap-calendar__week">
              {week.days.map((cell, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`heatmap-calendar__cell ${
                    cell.percentage < 0 ? 'heatmap-calendar__cell--empty' : ''
                  }`}
                  style={{
                    backgroundColor:
                      cell.percentage >= 0 ? getHeatmapColor(cell.percentage) : 'transparent',
                  }}
                  onMouseEnter={(e) => handleCellHover(cell, e)}
                  onMouseLeave={handleCellLeave}
                  aria-label={
                    cell.date
                      ? `${formatTooltipDate(cell.date)}: ${cell.value} ${habit.unit}`
                      : undefined
                  }
                />
              ))}
            </div>
          ))}

          {/* Tooltip */}
          {hoveredCell && (
            <CellTooltip
              cell={hoveredCell.cell}
              unit={habit.unit}
              position={hoveredCell.position}
            />
          )}
        </div>
      </div>

      {/* Légende */}
      <div className="heatmap-calendar__legend">
        <span className="heatmap-calendar__legend-label">Moins</span>
        <div className="heatmap-calendar__legend-scale">
          <div className="heatmap-calendar__legend-cell" style={{ backgroundColor: '#F5F5F5' }} />
          <div className="heatmap-calendar__legend-cell" style={{ backgroundColor: '#FEECD0' }} />
          <div className="heatmap-calendar__legend-cell" style={{ backgroundColor: '#FDD9A0' }} />
          <div className="heatmap-calendar__legend-cell" style={{ backgroundColor: '#F8B84E' }} />
          <div className="heatmap-calendar__legend-cell" style={{ backgroundColor: '#22C55E' }} />
          <div className="heatmap-calendar__legend-cell" style={{ backgroundColor: '#16A34A' }} />
        </div>
        <span className="heatmap-calendar__legend-label">Plus</span>
      </div>
    </Card>
  )
}

export default HeatmapCalendar
