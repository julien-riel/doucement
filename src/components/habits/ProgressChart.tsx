import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Habit, DailyEntry } from '../../types'
import { calculateTargetDose } from '../../services/progression'
import { getCurrentDate, addDays } from '../../utils'
import Card from '../ui/Card'
import './ProgressChart.css'

export interface ProgressChartProps {
  /** Habitude à afficher */
  habit: Habit
  /** Entrées de l'habitude */
  entries: DailyEntry[]
  /** Date de référence (par défaut aujourd'hui) */
  referenceDate?: string
  /** Nombre de jours à afficher (par défaut 7) */
  daysToShow?: number
}

interface DayData {
  date: string
  dayLabel: string
  targetDose: number
  actualValue: number | null
}

/**
 * Génère les N derniers jours à partir d'une date de référence
 */
function getLastNDays(referenceDate: string, n: number): string[] {
  const dates: string[] = []

  for (let i = n - 1; i >= 0; i--) {
    dates.push(addDays(referenceDate, -i))
  }

  return dates
}

/**
 * Formate une date en jour abrégé
 */
function formatDayLabel(dateStr: string, dayLabels: string[]): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const dayOfWeek = date.getDay()
  return dayLabels[dayOfWeek]
}

/**
 * Composant ProgressChart
 * Graphique dose cible vs réalisé sur la période
 */
function ProgressChart({ habit, entries, referenceDate, daysToShow = 7 }: ProgressChartProps) {
  const { t } = useTranslation()
  const today = referenceDate || getCurrentDate()
  const dayLabels = t('habitDetail.chart.dayLabels', { returnObjects: true }) as string[]

  const chartData = useMemo<DayData[]>(() => {
    const dates = getLastNDays(today, daysToShow)

    return dates.map((date) => {
      const targetDose = calculateTargetDose(habit, date)
      const entry = entries.find((e) => e.date === date)

      return {
        date,
        dayLabel: formatDayLabel(date, dayLabels),
        targetDose,
        actualValue: entry ? entry.actualValue : null,
      }
    })
  }, [habit, entries, today, daysToShow, dayLabels])

  // Calcul de la valeur max pour l'échelle
  const maxValue = useMemo(() => {
    let max = 0
    for (const day of chartData) {
      if (day.targetDose > max) max = day.targetDose
      if (day.actualValue !== null && day.actualValue > max) max = day.actualValue
    }
    return max > 0 ? max : 1
  }, [chartData])

  // Dimensions du graphique
  const chartHeight = 120
  const barWidth = 28
  const barGap = 8
  const chartWidth = (barWidth * 2 + barGap) * daysToShow + barGap * (daysToShow - 1)

  /**
   * Calcule la hauteur d'une barre en pixels
   */
  const getBarHeight = (value: number): number => {
    const minHeight = 4
    const maxHeight = chartHeight - 20 // Laisser de l'espace pour les labels
    const height = (value / maxValue) * maxHeight
    return Math.max(height, minHeight)
  }

  return (
    <Card variant="default" className="progress-chart">
      <div className="progress-chart__header">
        <h3 className="progress-chart__title">{t('habitDetail.chart.title')}</h3>
        <div className="progress-chart__legend">
          <span className="progress-chart__legend-item progress-chart__legend-item--target">
            <span className="progress-chart__legend-dot"></span>
            {t('habitDetail.chart.target')}
          </span>
          <span className="progress-chart__legend-item progress-chart__legend-item--actual">
            <span className="progress-chart__legend-dot"></span>
            {t('habitDetail.chart.achieved')}
          </span>
        </div>
      </div>

      <div className="progress-chart__container">
        <svg
          className="progress-chart__svg"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="xMidYMax meet"
          role="img"
          aria-label={t('habitDetail.chart.ariaLabel', { days: daysToShow })}
        >
          {chartData.map((day, index) => {
            const groupX = index * (barWidth * 2 + barGap * 2)
            const targetHeight = getBarHeight(day.targetDose)
            const actualHeight = day.actualValue !== null ? getBarHeight(day.actualValue) : 0

            return (
              <g key={day.date} className="progress-chart__day-group">
                {/* Barre cible */}
                <rect
                  className="progress-chart__bar progress-chart__bar--target"
                  x={groupX}
                  y={chartHeight - targetHeight}
                  width={barWidth}
                  height={targetHeight}
                  rx={4}
                />

                {/* Barre réalisée */}
                {day.actualValue !== null && (
                  <rect
                    className="progress-chart__bar progress-chart__bar--actual"
                    x={groupX + barWidth + barGap}
                    y={chartHeight - actualHeight}
                    width={barWidth}
                    height={actualHeight}
                    rx={4}
                  />
                )}

                {/* Barre vide si pas de données */}
                {day.actualValue === null && (
                  <rect
                    className="progress-chart__bar progress-chart__bar--empty"
                    x={groupX + barWidth + barGap}
                    y={chartHeight - 4}
                    width={barWidth}
                    height={4}
                    rx={2}
                  />
                )}
              </g>
            )
          })}
        </svg>

        {/* Labels des jours */}
        <div className="progress-chart__labels">
          {chartData.map((day) => (
            <span key={day.date} className="progress-chart__day-label" aria-label={day.date}>
              {day.dayLabel}
            </span>
          ))}
        </div>
      </div>

      {/* Valeur max affichée */}
      <div className="progress-chart__scale">
        <span className="progress-chart__scale-value">
          {t('habitDetail.chart.max')}: {maxValue} {habit.unit}
        </span>
      </div>
    </Card>
  )
}

export default ProgressChart
