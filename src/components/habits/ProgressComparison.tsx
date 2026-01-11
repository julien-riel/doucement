/**
 * ProgressComparison Component
 * Affiche la comparaison "D'où je viens → Aujourd'hui" pour visualiser l'effet composé
 * Phase 11 - Visualisation de l'Effet Composé
 */

import { useMemo } from 'react'
import { Card } from '../ui'
import { calculateCompoundEffectMetrics } from '../../services/progression'
import { COMPOUND_EFFECT } from '../../constants/messages'
import type { Habit } from '../../types'
import './ProgressComparison.css'

interface ProgressComparisonProps {
  /** Habitude à afficher */
  habit: Habit
  /** Date de référence pour le calcul (YYYY-MM-DD) */
  referenceDate: string
}

/**
 * Formate le pourcentage de changement pour l'affichage
 */
function formatPercentageChange(percentage: number, direction: Habit['direction']): string {
  // Pour decrease, on inverse le signe pour montrer une progression positive
  const displayPercentage = direction === 'decrease' ? -percentage : percentage
  const sign = displayPercentage > 0 ? '+' : ''
  return `${sign}${Math.abs(Math.round(displayPercentage))}%`
}

/**
 * Composant affichant la comparaison de progression (effet composé)
 * Design: "Jour 1: X → Aujourd'hui: Y" avec pourcentage de progression
 */
function ProgressComparison({ habit, referenceDate }: ProgressComparisonProps) {
  const metrics = useMemo(() => {
    return calculateCompoundEffectMetrics(habit, referenceDate)
  }, [habit, referenceDate])

  // Ne pas afficher si pas encore de progression (jour 0 ou 1)
  if (metrics.daysElapsed < 1 || metrics.absoluteChange === 0) {
    return null
  }

  const hasProgression = Math.abs(metrics.percentageChange) > 0
  const isPositiveChange =
    (habit.direction === 'increase' && metrics.absoluteChange > 0) ||
    (habit.direction === 'decrease' && metrics.absoluteChange < 0)

  return (
    <Card variant="default" className="progress-comparison">
      <h3 className="progress-comparison__title">{COMPOUND_EFFECT.sectionTitle}</h3>

      <div className="progress-comparison__values">
        <div className="progress-comparison__value-group">
          <span className="progress-comparison__label">{COMPOUND_EFFECT.startLabel}</span>
          <span className="progress-comparison__value">{metrics.startDose}</span>
          <span className="progress-comparison__unit">{habit.unit}</span>
        </div>

        <span className="progress-comparison__arrow" aria-hidden="true">
          {COMPOUND_EFFECT.progressArrow}
        </span>

        <div className="progress-comparison__value-group progress-comparison__value-group--current">
          <span className="progress-comparison__label">{COMPOUND_EFFECT.currentLabel}</span>
          <span className="progress-comparison__value">{metrics.currentDose}</span>
          <span className="progress-comparison__unit">{habit.unit}</span>
        </div>
      </div>

      {hasProgression && (
        <div
          className={`progress-comparison__percentage ${
            isPositiveChange ? 'progress-comparison__percentage--positive' : ''
          }`}
        >
          {formatPercentageChange(metrics.percentageChange, habit.direction)}
        </div>
      )}

      <p className="progress-comparison__days">{COMPOUND_EFFECT.daysLabel(metrics.daysElapsed)}</p>
    </Card>
  )
}

export default ProgressComparison
