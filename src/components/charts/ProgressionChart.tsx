import { useMemo } from 'react'
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts'
import { ChartData, StatsPeriod, DataPoint } from '../../types/statistics'
import { linearRegression, addDays } from '../../services/statistics'
import Card from '../ui/Card'
import './ProgressionChart.css'

export interface ProgressionChartProps {
  /** Données du graphique */
  data: ChartData
  /** Afficher la projection future */
  showProjection?: boolean
  /** Période sélectionnée */
  period: StatsPeriod
  /** Hauteur du graphique en pixels */
  height?: number
}

interface ChartDataPoint {
  date: string
  dateLabel: string
  value: number | null
  target: number
  trendValue?: number
  projectedValue?: number
}

/**
 * Formate une date pour l'affichage sur l'axe X
 */
function formatDateLabel(dateStr: string, period: StatsPeriod): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  if (period === 'week') {
    // Jour abrégé : L, M, M, J, V, S, D
    const labels = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
    return labels[date.getDay()]
  }

  if (period === 'month') {
    // Jour du mois
    return String(day)
  }

  // Pour year et all : mois abrégé
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
 * Calcule la ligne de tendance et les projections
 */
function calculateTrendAndProjection(
  dataPoints: DataPoint[],
  projectionDays: number = 14
): {
  trendLine: Array<{ x: number; y: number }>
  projectionPoints: Array<{ date: string; value: number }>
} {
  // Filtrer les points avec des valeurs > 0 pour la régression
  const validPoints = dataPoints.map((dp, i) => ({ x: i, y: dp.value })).filter((p) => p.y > 0)

  if (validPoints.length < 2) {
    return { trendLine: [], projectionPoints: [] }
  }

  const { slope, intercept } = linearRegression(validPoints)

  // Ligne de tendance sur les données existantes
  const trendLine = dataPoints.map((_, i) => ({
    x: i,
    y: Math.max(0, slope * i + intercept),
  }))

  // Projections futures
  const lastDate = dataPoints[dataPoints.length - 1].date
  const projectionPoints: Array<{ date: string; value: number }> = []
  const startX = dataPoints.length

  for (let i = 1; i <= projectionDays; i++) {
    const projectedValue = Math.max(0, slope * (startX + i - 1) + intercept)
    projectionPoints.push({
      date: addDays(lastDate, i),
      value: Math.round(projectedValue * 10) / 10,
    })
  }

  return { trendLine, projectionPoints }
}

/**
 * Tooltip personnalisé
 */
function CustomTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string; color: string }>
  label?: string
  unit: string
}) {
  if (!active || !payload || !label) {
    return null
  }

  const dateLabel = formatTooltipDate(label)
  const valueEntry = payload.find((p) => p.dataKey === 'value')
  const targetEntry = payload.find((p) => p.dataKey === 'target')
  const projectedEntry = payload.find((p) => p.dataKey === 'projectedValue')

  return (
    <div className="progression-chart__tooltip">
      <div className="progression-chart__tooltip-date">{dateLabel}</div>
      {valueEntry && valueEntry.value !== null && (
        <div className="progression-chart__tooltip-row progression-chart__tooltip-row--value">
          <span className="progression-chart__tooltip-dot" style={{ backgroundColor: '#F27D16' }} />
          <span>
            Réalisé : {valueEntry.value} {unit}
          </span>
        </div>
      )}
      {targetEntry && (
        <div className="progression-chart__tooltip-row progression-chart__tooltip-row--target">
          <span className="progression-chart__tooltip-dot" style={{ backgroundColor: '#22C55E' }} />
          <span>
            Cible : {targetEntry.value} {unit}
          </span>
        </div>
      )}
      {projectedEntry && projectedEntry.value !== null && (
        <div className="progression-chart__tooltip-row progression-chart__tooltip-row--projected">
          <span
            className="progression-chart__tooltip-dot"
            style={{ backgroundColor: '#FFB870', opacity: 0.7 }}
          />
          <span>
            Projection : {projectedEntry.value} {unit}
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * Composant ProgressionChart
 * Graphique en courbe montrant l'évolution d'une habitude avec ligne de tendance
 * et projection future
 *
 * @example
 * <ProgressionChart
 *   data={chartData}
 *   showProjection={true}
 *   period="month"
 * />
 */
function ProgressionChart({
  data,
  showProjection = true,
  period,
  height = 250,
}: ProgressionChartProps) {
  const { chartData, yDomain } = useMemo(() => {
    const { trendLine, projectionPoints } = calculateTrendAndProjection(
      data.dataPoints,
      showProjection ? 14 : 0
    )

    // Préparer les données pour Recharts
    const historicalData: ChartDataPoint[] = data.dataPoints.map((dp, i) => ({
      date: dp.date,
      dateLabel: formatDateLabel(dp.date, period),
      value: dp.value > 0 ? dp.value : null,
      target: dp.target,
      trendValue: trendLine[i]?.y,
      projectedValue: undefined,
    }))

    // Ajouter les points de projection
    const projectionData: ChartDataPoint[] = showProjection
      ? projectionPoints.map((pp) => ({
          date: pp.date,
          dateLabel: formatDateLabel(pp.date, period),
          value: null,
          target: data.dataPoints[data.dataPoints.length - 1]?.target || 0,
          trendValue: undefined,
          projectedValue: pp.value,
        }))
      : []

    const allData = [...historicalData, ...projectionData]

    // Calculer le domaine Y
    let maxY = 0
    for (const point of allData) {
      if (point.value && point.value > maxY) maxY = point.value
      if (point.target > maxY) maxY = point.target
      if (point.projectedValue && point.projectedValue > maxY) maxY = point.projectedValue
    }
    if (data.finalTarget && data.finalTarget > maxY) maxY = data.finalTarget

    return {
      chartData: allData,
      yDomain: [0, Math.ceil(maxY * 1.1)],
    }
  }, [data, showProjection, period])

  // Filtrer les ticks pour éviter le chevauchement
  const xTickCount = period === 'week' ? 7 : period === 'month' ? 10 : 6

  return (
    <Card variant="default" className="progression-chart" noPadding>
      <div className="progression-chart__header">
        <div className="progression-chart__title-row">
          <span className="progression-chart__emoji">{data.habitEmoji}</span>
          <h3 className="progression-chart__title">{data.habitName}</h3>
        </div>
        <div className="progression-chart__legend">
          <span className="progression-chart__legend-item">
            <span
              className="progression-chart__legend-dot"
              style={{ backgroundColor: '#F27D16' }}
            />
            Réalisé
          </span>
          <span className="progression-chart__legend-item">
            <span
              className="progression-chart__legend-dot"
              style={{ backgroundColor: '#22C55E' }}
            />
            Cible
          </span>
          {showProjection && (
            <span className="progression-chart__legend-item">
              <span
                className="progression-chart__legend-dot"
                style={{ backgroundColor: '#FFB870', opacity: 0.7 }}
              />
              Projection
            </span>
          )}
        </div>
      </div>

      <div
        className="progression-chart__container"
        role="img"
        aria-label={`Graphique de progression pour ${data.habitName}`}
      >
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
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
            />

            <Tooltip
              content={<CustomTooltip unit={data.unit} />}
              cursor={{ stroke: 'var(--neutral-300)', strokeDasharray: '3 3' }}
            />

            {/* Ligne cible finale (si définie) */}
            {data.finalTarget && (
              <ReferenceLine
                y={data.finalTarget}
                stroke="var(--secondary-500)"
                strokeDasharray="5 5"
                label={{
                  value: `Objectif: ${data.finalTarget}`,
                  position: 'right',
                  fill: 'var(--secondary-600)',
                  fontSize: 11,
                }}
              />
            )}

            {/* Zone de projection (fond) */}
            {showProjection && (
              <Area
                type="monotone"
                dataKey="projectedValue"
                stroke="none"
                fill="var(--primary-200)"
                fillOpacity={0.3}
                connectNulls={false}
              />
            )}

            {/* Ligne de projection */}
            {showProjection && (
              <Line
                type="monotone"
                dataKey="projectedValue"
                stroke="var(--primary-300)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                connectNulls={false}
              />
            )}

            {/* Ligne de tendance */}
            <Line
              type="monotone"
              dataKey="trendValue"
              stroke="var(--neutral-400)"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              connectNulls
            />

            {/* Ligne cible quotidienne */}
            <Line
              type="monotone"
              dataKey="target"
              stroke="var(--secondary-400)"
              strokeWidth={2}
              dot={false}
              connectNulls
            />

            {/* Ligne valeur réalisée (principale) */}
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--primary-500)"
              strokeWidth={3}
              dot={{
                fill: 'var(--primary-500)',
                strokeWidth: 0,
                r: 4,
              }}
              activeDot={{
                fill: 'var(--primary-600)',
                strokeWidth: 2,
                stroke: 'white',
                r: 6,
              }}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export default ProgressionChart
