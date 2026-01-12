import { useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Habit, DailyEntry } from '../../types'
import { StatsPeriod } from '../../types/statistics'
import { getChartData } from '../../services/statistics'
import Card from '../ui/Card'
import './ComparisonChart.css'

export interface ComparisonChartProps {
  /** Liste des habitudes à comparer */
  habits: Habit[]
  /** Toutes les entrées */
  entries: DailyEntry[]
  /** Période sélectionnée */
  period: StatsPeriod
  /** Normaliser les valeurs en % de la cible */
  normalized?: boolean
  /** Date de référence (défaut: aujourd'hui) */
  referenceDate?: string
  /** Hauteur du graphique en pixels */
  height?: number
}

interface ComparisonDataPoint {
  date: string
  dateLabel: string
  [habitId: string]: number | string | null
}

/**
 * Palette de couleurs pour les différentes habitudes
 * Couleurs distinctes et conformes au design system
 */
const HABIT_COLORS = [
  '#F27D16', // Primary orange
  '#22C55E', // Secondary green
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#10B981', // Emerald
  '#3B82F6', // Blue
]

/**
 * Formate une date pour l'affichage sur l'axe X
 */
function formatDateLabel(dateStr: string, period: StatsPeriod): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  if (period === 'week') {
    const labels = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
    return labels[date.getDay()]
  }

  if (period === 'month') {
    return String(day)
  }

  const months = [
    'Jan',
    'Fév',
    'Mar',
    'Avr',
    'Mai',
    'Jun',
    'Jul',
    'Aoû',
    'Sep',
    'Oct',
    'Nov',
    'Déc',
  ]
  return months[month - 1]
}

/**
 * Formate une date pour le tooltip
 */
function formatTooltipDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

/**
 * Tooltip personnalisé
 */
function CustomTooltip({
  active,
  payload,
  label,
  habitMap,
  normalized,
}: {
  active?: boolean
  payload?: Array<{
    value: number
    dataKey: string
    color: string
    name: string
  }>
  label?: string
  habitMap: Map<string, { name: string; emoji: string; unit: string }>
  normalized: boolean
}) {
  if (!active || !payload || !label) {
    return null
  }

  const dateLabel = formatTooltipDate(label)

  return (
    <div className="comparison-chart__tooltip">
      <div className="comparison-chart__tooltip-date">{dateLabel}</div>
      {payload.map((entry) => {
        const habitInfo = habitMap.get(entry.dataKey)
        if (!habitInfo || entry.value === null) return null

        return (
          <div key={entry.dataKey} className="comparison-chart__tooltip-row">
            <span
              className="comparison-chart__tooltip-dot"
              style={{ backgroundColor: entry.color }}
            />
            <span className="comparison-chart__tooltip-name">
              {habitInfo.emoji} {habitInfo.name}:
            </span>
            <span className="comparison-chart__tooltip-value">
              {entry.value}
              {normalized ? '%' : ` ${habitInfo.unit}`}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Composant ComparisonChart
 * Graphique permettant de comparer plusieurs habitudes sur la même période
 *
 * @example
 * <ComparisonChart
 *   habits={selectedHabits}
 *   entries={entries}
 *   period="month"
 *   normalized={true}
 * />
 */
function ComparisonChart({
  habits,
  entries,
  period,
  normalized = false,
  referenceDate,
  height = 280,
}: ComparisonChartProps) {
  const [selectedHabits, setSelectedHabits] = useState<Set<string>>(
    new Set(habits.slice(0, 3).map((h) => h.id))
  )

  // Créer un map des infos d'habitude
  const habitMap = useMemo(() => {
    const map = new Map<string, { name: string; emoji: string; unit: string; color: string }>()
    habits.forEach((h, i) => {
      map.set(h.id, {
        name: h.name,
        emoji: h.emoji,
        unit: h.unit,
        color: HABIT_COLORS[i % HABIT_COLORS.length],
      })
    })
    return map
  }, [habits])

  // Calculer les données pour chaque habitude sélectionnée
  const { chartData, yDomain } = useMemo(() => {
    const selectedHabitsList = habits.filter((h) => selectedHabits.has(h.id))

    if (selectedHabitsList.length === 0) {
      return { chartData: [], yDomain: [0, 100] }
    }

    // Récupérer les données de chaque habitude
    const habitChartData = selectedHabitsList.map((habit) =>
      getChartData(habit, entries, period, referenceDate)
    )

    // Trouver toutes les dates uniques
    const allDates = new Set<string>()
    for (const data of habitChartData) {
      for (const point of data.dataPoints) {
        allDates.add(point.date)
      }
    }

    // Trier les dates
    const sortedDates = Array.from(allDates).sort()

    // Construire les données fusionnées
    let maxY = 0
    const mergedData: ComparisonDataPoint[] = sortedDates.map((date) => {
      const point: ComparisonDataPoint = {
        date,
        dateLabel: formatDateLabel(date, period),
      }

      for (const data of habitChartData) {
        const dataPoint = data.dataPoints.find((dp) => dp.date === date)
        if (dataPoint && dataPoint.value > 0) {
          const value = normalized ? dataPoint.percentage : dataPoint.value
          point[data.habitId] = Math.round(value * 10) / 10
          if (value > maxY) maxY = value
        } else {
          point[data.habitId] = null
        }
      }

      return point
    })

    return {
      chartData: mergedData,
      yDomain: [0, Math.ceil(maxY * 1.1)] as [number, number],
    }
  }, [habits, entries, period, referenceDate, selectedHabits, normalized])

  /**
   * Toggle la sélection d'une habitude
   */
  const toggleHabit = (habitId: string) => {
    setSelectedHabits((prev) => {
      const next = new Set(prev)
      if (next.has(habitId)) {
        next.delete(habitId)
      } else {
        next.add(habitId)
      }
      return next
    })
  }

  // Filtrer les ticks pour éviter le chevauchement
  const xTickCount = period === 'week' ? 7 : period === 'month' ? 10 : 6

  return (
    <Card variant="default" className="comparison-chart" noPadding>
      <div className="comparison-chart__header">
        <h3 className="comparison-chart__title">Comparaison</h3>
        <span className="comparison-chart__subtitle">
          {normalized ? 'Pourcentage de la cible' : 'Valeurs brutes'}
        </span>
      </div>

      {/* Sélecteur d'habitudes */}
      <div className="comparison-chart__selector">
        {habits.map((habit) => {
          const info = habitMap.get(habit.id)
          const isSelected = selectedHabits.has(habit.id)

          return (
            <button
              key={habit.id}
              className={`comparison-chart__habit-button ${
                isSelected ? 'comparison-chart__habit-button--selected' : ''
              }`}
              onClick={() => toggleHabit(habit.id)}
              style={{
                borderColor: isSelected ? info?.color : undefined,
                backgroundColor: isSelected ? `${info?.color}15` : undefined,
              }}
            >
              <span
                className="comparison-chart__habit-dot"
                style={{ backgroundColor: info?.color }}
              />
              <span className="comparison-chart__habit-emoji">{habit.emoji}</span>
              <span className="comparison-chart__habit-name">{habit.name}</span>
            </button>
          )
        })}
      </div>

      {selectedHabits.size === 0 ? (
        <div className="comparison-chart__empty">
          <p>Sélectionnez au moins une habitude pour voir la comparaison</p>
        </div>
      ) : (
        <div
          className="comparison-chart__container"
          role="img"
          aria-label="Graphique de comparaison des habitudes"
        >
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--neutral-200)" vertical={false} />

              <XAxis
                dataKey="date"
                tickFormatter={(value) => formatDateLabel(value, period)}
                tick={{ fontSize: 12, fill: 'var(--neutral-500)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--neutral-200)' }}
                interval={Math.floor(chartData.length / xTickCount)}
              />

              <YAxis
                domain={yDomain}
                tick={{ fontSize: 12, fill: 'var(--neutral-500)' }}
                tickLine={false}
                axisLine={false}
                width={40}
                tickFormatter={(value) => (normalized ? `${value}%` : value)}
              />

              <Tooltip
                content={<CustomTooltip habitMap={habitMap} normalized={normalized} />}
                cursor={{ stroke: 'var(--neutral-300)', strokeDasharray: '3 3' }}
              />

              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => {
                  const info = habitMap.get(value)
                  return info ? `${info.emoji} ${info.name}` : value
                }}
              />

              {habits
                .filter((h) => selectedHabits.has(h.id))
                .map((habit) => {
                  const info = habitMap.get(habit.id)
                  return (
                    <Line
                      key={habit.id}
                      type="monotone"
                      dataKey={habit.id}
                      name={habit.id}
                      stroke={info?.color}
                      strokeWidth={2}
                      dot={{
                        fill: info?.color,
                        strokeWidth: 0,
                        r: 3,
                      }}
                      activeDot={{
                        fill: info?.color,
                        strokeWidth: 2,
                        stroke: 'white',
                        r: 5,
                      }}
                      connectNulls={false}
                    />
                  )
                })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}

export default ComparisonChart
