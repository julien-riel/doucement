/**
 * Doucement - Section de projections
 * Affiche les projections futures : date estimée d'atteinte de la cible,
 * comparaison rythme actuel vs rythme nécessaire, et message encourageant
 */

import { Habit } from '../../types'
import { ProjectionData } from '../../types/statistics'
import Card from '../ui/Card'
import './ProjectionSection.css'

export interface ProjectionSectionProps {
  /** Données de projection */
  projection: ProjectionData
  /** Habitude concernée */
  habit: Habit
}

/**
 * Retourne un message encourageant adapté au contexte de progression
 */
function getEncouragingMessage(
  projection: ProjectionData,
  habit: Habit
): { emoji: string; message: string } {
  const { progressPercentage, currentWeeklyRate, daysRemaining } = projection
  const isIncrease = habit.direction === 'increase'

  // Objectif atteint
  if (progressPercentage >= 100) {
    return {
      emoji: '🎉',
      message: 'Objectif atteint ! Tu peux être fier·e de toi.',
    }
  }

  // Progression rapide (moins de 30 jours restants)
  if (daysRemaining !== null && daysRemaining <= 30) {
    return {
      emoji: '✨',
      message: "L'arrivée est proche ! Continue sur cette lancée.",
    }
  }

  // Bonne progression
  if (
    (isIncrease && currentWeeklyRate > 0) ||
    (!isIncrease && habit.direction === 'decrease' && currentWeeklyRate < 0)
  ) {
    if (progressPercentage >= 75) {
      return {
        emoji: '🌳',
        message: 'Trois quarts du chemin parcouru. Tu y es presque !',
      }
    }
    if (progressPercentage >= 50) {
      return {
        emoji: '🌿',
        message: 'Mi-parcours atteint. Tu es sur la bonne voie.',
      }
    }
    if (progressPercentage >= 25) {
      return {
        emoji: '🌱',
        message: 'Beau départ ! Chaque jour te rapproche de ton objectif.',
      }
    }
    return {
      emoji: '✨',
      message: 'Tu avances dans la bonne direction. Continue comme ça.',
    }
  }

  // Stagnation ou régression
  return {
    emoji: '💪',
    message: "Chaque petit pas compte. L'important, c'est de continuer.",
  }
}

/**
 * Formate une date pour l'affichage (ex: "15 mars 2026")
 */
function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Calcule le rythme nécessaire pour atteindre l'objectif dans un délai donné
 */
function calculateRequiredRate(
  currentValue: number,
  targetValue: number,
  weeksRemaining: number
): number {
  if (weeksRemaining <= 0) return 0
  return (targetValue - currentValue) / weeksRemaining
}

/**
 * Composant ProjectionSection
 * Affiche une section dédiée aux projections futures
 */
function ProjectionSection({ projection, habit }: ProjectionSectionProps) {
  const {
    currentValue,
    targetValue,
    progressPercentage,
    currentWeeklyRate,
    estimatedCompletionDate,
    daysRemaining,
    projectionIn30Days,
    projectionIn90Days,
  } = projection

  const encouragement = getEncouragingMessage(projection, habit)
  const hasValidProjection = estimatedCompletionDate && daysRemaining !== null && daysRemaining > 0

  // Calculer le rythme requis pour finir en 12 semaines
  const requiredRateFor12Weeks = calculateRequiredRate(currentValue, targetValue, 12)

  return (
    <section className="projection-section" aria-label="Projections">
      <h2 className="projection-section__title">🎯 Projections</h2>

      <Card variant="highlight" className="projection-section__card">
        {/* Message encourageant */}
        <div className="projection-section__encouragement">
          <span className="projection-section__emoji" aria-hidden="true">
            {encouragement.emoji}
          </span>
          <p className="projection-section__message">{encouragement.message}</p>
        </div>

        {/* Estimation de la date d'atteinte */}
        {hasValidProjection && (
          <div className="projection-section__estimate">
            <p className="projection-section__estimate-text">
              Au rythme actuel, tu atteindras ta cible de{' '}
              <strong>
                {targetValue} {habit.unit}
              </strong>{' '}
              vers le <strong>{formatDate(estimatedCompletionDate)}</strong>
            </p>
            <p className="projection-section__days-remaining">
              Soit dans environ <strong>{daysRemaining} jours</strong>
            </p>
          </div>
        )}

        {/* Comparaison des rythmes */}
        <div className="projection-section__rates">
          <div className="projection-section__rate">
            <span className="projection-section__rate-label">Rythme actuel</span>
            <span className="projection-section__rate-value projection-section__rate-value--current">
              {currentWeeklyRate > 0 ? '+' : ''}
              {currentWeeklyRate.toFixed(1)} {habit.unit}/sem
            </span>
          </div>

          {habit.targetValue !== undefined && progressPercentage < 100 && (
            <div className="projection-section__rate">
              <span className="projection-section__rate-label">Pour finir en 12 sem.</span>
              <span className="projection-section__rate-value projection-section__rate-value--required">
                {requiredRateFor12Weeks > 0 ? '+' : ''}
                {requiredRateFor12Weeks.toFixed(1)} {habit.unit}/sem
              </span>
            </div>
          )}
        </div>

        {/* Progression actuelle */}
        <div className="projection-section__progress">
          <div className="projection-section__progress-header">
            <span>Progression vers l'objectif</span>
            <span className="projection-section__progress-percentage">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div
            className="projection-section__progress-bar"
            role="progressbar"
            aria-valuenow={Math.round(progressPercentage)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="projection-section__progress-fill"
              style={{ width: `${Math.min(100, progressPercentage)}%` }}
            />
            {/* Marqueurs de jalons */}
            <div className="projection-section__markers" aria-hidden="true">
              <span
                className={`projection-section__marker ${progressPercentage >= 25 ? 'projection-section__marker--reached' : ''}`}
              />
              <span
                className={`projection-section__marker ${progressPercentage >= 50 ? 'projection-section__marker--reached' : ''}`}
              />
              <span
                className={`projection-section__marker ${progressPercentage >= 75 ? 'projection-section__marker--reached' : ''}`}
              />
            </div>
          </div>
          <div className="projection-section__progress-labels" aria-hidden="true">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Projections à 30 et 90 jours */}
        {progressPercentage < 100 && (
          <div className="projection-section__forecasts">
            <div className="projection-section__forecast">
              <span className="projection-section__forecast-label">Dans 30 jours</span>
              <span className="projection-section__forecast-value">
                ~{projectionIn30Days.toFixed(0)} {habit.unit}
              </span>
            </div>
            <div className="projection-section__forecast">
              <span className="projection-section__forecast-label">Dans 90 jours</span>
              <span className="projection-section__forecast-value">
                ~{projectionIn90Days.toFixed(0)} {habit.unit}
              </span>
            </div>
          </div>
        )}
      </Card>
    </section>
  )
}

export default ProjectionSection
