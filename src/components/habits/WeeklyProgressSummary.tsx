/**
 * WeeklyProgressSummary Component
 * Affiche un résumé de la progression de toutes les habitudes depuis le début
 * Utilisé dans WeeklyReview pour montrer l'effet composé global
 * Phase 11 - Visualisation de l'Effet Composé
 */

import { useMemo } from 'react'
import { Card } from '../ui'
import { calculateCompoundEffectMetrics, CompoundEffectMetrics } from '../../services/progression'
import { COMPOUND_EFFECT } from '../../constants/messages'
import type { Habit } from '../../types'
import './WeeklyProgressSummary.css'

interface WeeklyProgressSummaryProps {
  /** Liste des habitudes actives */
  habits: Habit[]
  /** Date de référence pour le calcul (YYYY-MM-DD) */
  referenceDate: string
}

interface HabitProgressItem {
  habit: Habit
  metrics: CompoundEffectMetrics
}

/**
 * Formate le changement pour l'affichage
 */
function formatChange(
  absoluteChange: number,
  percentageChange: number,
  unit: string,
  direction: Habit['direction']
): string {
  // Pour decrease, on montre la réduction comme positive
  const displayAbsolute = direction === 'decrease' ? -absoluteChange : absoluteChange
  const sign = displayAbsolute > 0 ? '+' : ''
  return `${sign}${displayAbsolute} ${unit} (${sign}${Math.round(percentageChange)}%)`
}

/**
 * Composant affichant le résumé de progression de toutes les habitudes
 * pour la revue hebdomadaire
 */
function WeeklyProgressSummary({ habits, referenceDate }: WeeklyProgressSummaryProps) {
  // Calculer les métriques pour chaque habitude avec progression
  const progressItems = useMemo((): HabitProgressItem[] => {
    return habits
      .filter((h) => h.direction !== 'maintain') // Exclure les habitudes statiques
      .map((habit) => ({
        habit,
        metrics: calculateCompoundEffectMetrics(habit, referenceDate),
      }))
      .filter((item) => item.metrics.daysElapsed >= 7) // Au moins une semaine
      .filter((item) => item.metrics.absoluteChange !== 0) // Avec progression réelle
  }, [habits, referenceDate])

  // Ne rien afficher si pas d'habitudes avec progression significative
  if (progressItems.length === 0) {
    return null
  }

  return (
    <div className="weekly-progress-summary">
      <h2 className="weekly-progress-summary__title">{COMPOUND_EFFECT.sectionTitle}</h2>
      <p className="weekly-progress-summary__subtitle">
        Voici ta progression depuis le début de chaque habitude.
      </p>

      <div className="weekly-progress-summary__list">
        {progressItems.map(({ habit, metrics }) => {
          const isPositive =
            (habit.direction === 'increase' && metrics.absoluteChange > 0) ||
            (habit.direction === 'decrease' && metrics.absoluteChange < 0)

          return (
            <Card key={habit.id} variant="default" className="weekly-progress-summary__item">
              <div className="weekly-progress-summary__item-header">
                <span className="weekly-progress-summary__emoji" aria-hidden="true">
                  {habit.emoji}
                </span>
                <span className="weekly-progress-summary__name">{habit.name}</span>
              </div>

              <div className="weekly-progress-summary__values">
                <div className="weekly-progress-summary__value-start">
                  <span className="weekly-progress-summary__label">
                    {COMPOUND_EFFECT.startLabel}
                  </span>
                  <span className="weekly-progress-summary__value">
                    {metrics.startDose} {habit.unit}
                  </span>
                </div>
                <span className="weekly-progress-summary__arrow" aria-hidden="true">
                  →
                </span>
                <div className="weekly-progress-summary__value-current">
                  <span className="weekly-progress-summary__label">
                    {COMPOUND_EFFECT.currentLabel}
                  </span>
                  <span className="weekly-progress-summary__value">
                    {metrics.currentDose} {habit.unit}
                  </span>
                </div>
              </div>

              <div
                className={`weekly-progress-summary__change ${
                  isPositive ? 'weekly-progress-summary__change--positive' : ''
                }`}
              >
                {formatChange(
                  metrics.absoluteChange,
                  metrics.percentageChange,
                  habit.unit,
                  habit.direction
                )}
              </div>

              <p className="weekly-progress-summary__days">
                {COMPOUND_EFFECT.daysLabel(metrics.daysElapsed)}
              </p>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default WeeklyProgressSummary
