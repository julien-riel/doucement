/**
 * ShareableProgressCard Component
 * Carte visuelle exportable pour partager sa progression
 * Phase 13 - Export Visuel Partageable
 */

import { useMemo, forwardRef } from 'react'
import { calculateCompoundEffectMetrics, calculateHabitStats } from '../../services/progression'
import { addDays } from '../../utils'
import type { Habit, DailyEntry } from '../../types'
import './ShareableProgressCard.css'

export interface ShareableProgressCardProps {
  /** Habitude à afficher */
  habit: Habit
  /** Entrées de l'habitude */
  entries: DailyEntry[]
  /** Date de référence (YYYY-MM-DD) */
  referenceDate: string
  /** Template de design */
  template?: 'default' | 'minimal' | 'detailed'
}

/**
 * Calcule le nombre de jours actifs
 */
function countActiveDays(entries: DailyEntry[], habitId: string): number {
  return entries.filter((e) => e.habitId === habitId && e.actualValue > 0).length
}

/**
 * Formate le pourcentage de changement
 */
function formatPercentageChange(percentage: number, direction: Habit['direction']): string {
  const displayPercentage = direction === 'decrease' ? -percentage : percentage
  const sign = displayPercentage > 0 ? '+' : ''
  return `${sign}${Math.abs(Math.round(displayPercentage))}%`
}

/**
 * Composant de carte partageable pour la progression d'une habitude
 * Utilise forwardRef pour permettre l'accès au DOM pour l'export en image
 */
const ShareableProgressCard = forwardRef<HTMLDivElement, ShareableProgressCardProps>(
  ({ habit, entries, referenceDate, template = 'default' }, ref) => {
    const metrics = useMemo(
      () => calculateCompoundEffectMetrics(habit, referenceDate),
      [habit, referenceDate]
    )

    const habitEntries = useMemo(
      () => entries.filter((e) => e.habitId === habit.id),
      [entries, habit.id]
    )

    const activeDays = useMemo(() => countActiveDays(entries, habit.id), [entries, habit.id])

    const stats = useMemo(() => {
      // Calculer les stats sur les 30 derniers jours
      const endDate = referenceDate
      const startDateStr = addDays(referenceDate, -30)
      return calculateHabitStats(habit, habitEntries, startDateStr, endDate)
    }, [habit, habitEntries, referenceDate])

    const hasProgression = metrics.daysElapsed > 0 && Math.abs(metrics.absoluteChange) > 0

    return (
      <div
        ref={ref}
        className={`shareable-card shareable-card--${template}`}
        aria-label={`Carte de progression pour ${habit.name}`}
      >
        {/* Header avec emoji et nom */}
        <div className="shareable-card__header">
          <span className="shareable-card__emoji" aria-hidden="true">
            {habit.emoji}
          </span>
          <h2 className="shareable-card__name">{habit.name}</h2>
        </div>

        {/* Tagline */}
        <p className="shareable-card__tagline">{metrics.daysElapsed} jours sur ma trajectoire</p>

        {/* Progression principale */}
        {hasProgression && (
          <div className="shareable-card__progression">
            <div className="shareable-card__value-group">
              <span className="shareable-card__label">Jour 1</span>
              <span className="shareable-card__value">{metrics.startDose}</span>
            </div>

            <span className="shareable-card__arrow" aria-hidden="true">
              →
            </span>

            <div className="shareable-card__value-group shareable-card__value-group--current">
              <span className="shareable-card__label">Maintenant</span>
              <span className="shareable-card__value">{metrics.currentDose}</span>
            </div>
          </div>
        )}

        {/* Badge de pourcentage */}
        {hasProgression && (
          <div className="shareable-card__percentage">
            {formatPercentageChange(metrics.percentageChange, habit.direction)}
          </div>
        )}

        {/* Barre décorative */}
        <div className="shareable-card__divider" aria-hidden="true" />

        {/* Statistiques */}
        <div className="shareable-card__stats">
          <div className="shareable-card__stat">
            <span className="shareable-card__stat-value">{activeDays}</span>
            <span className="shareable-card__stat-label">jours actifs</span>
          </div>
          {template === 'detailed' && (
            <>
              <div className="shareable-card__stat">
                <span className="shareable-card__stat-value">
                  {Math.round(stats.averageCompletion)}%
                </span>
                <span className="shareable-card__stat-label">moyenne</span>
              </div>
              <div className="shareable-card__stat">
                <span className="shareable-card__stat-value">{stats.completedDays}</span>
                <span className="shareable-card__stat-label">complétés</span>
              </div>
            </>
          )}
        </div>

        {/* Branding discret */}
        <div className="shareable-card__branding">
          <span className="shareable-card__brand-name">doucement</span>
        </div>
      </div>
    )
  }
)

ShareableProgressCard.displayName = 'ShareableProgressCard'

export default ShareableProgressCard
