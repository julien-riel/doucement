import { useState, useEffect } from 'react'
import { Habit, CompletionStatus } from '../../types'
import { HABIT_STACKING } from '../../constants/messages'
import { buildIntentionText, WeeklyProgressInfo } from '../../utils/habitDisplay'
import Card from '../ui/Card'
import CheckInButtons from './CheckInButtons'
import SimpleCheckIn from './SimpleCheckIn'
import './HabitCard.css'

export interface HabitCardProps {
  /** Habitude à afficher */
  habit: Habit
  /** Dose cible calculée pour aujourd'hui */
  targetDose: number
  /** Valeur actuelle enregistrée (si existante) */
  currentValue?: number
  /** Statut de complétion */
  status: CompletionStatus
  /** Callback quand une valeur est enregistrée */
  onCheckIn: (habitId: string, value: number) => void
  /** Nom de l'habitude d'ancrage (si habit stacking) */
  anchorHabitName?: string
  /** Progression hebdomadaire (pour les habitudes weekly) */
  weeklyProgress?: WeeklyProgressInfo
}

/**
 * Messages de progression selon la direction de l'habitude
 */
function getProgressionMessage(habit: Habit, targetDose: number): string | null {
  if (habit.direction === 'maintain') {
    return null
  }

  const diff = Math.abs(targetDose - habit.startValue)
  if (diff === 0) {
    return null
  }

  if (habit.direction === 'increase') {
    return `Tu en étais à ${habit.startValue}. +${diff} aujourd'hui !`
  }
  return `Objectif : -${diff} depuis le début`
}

/**
 * Détermine la variante de carte selon le statut
 */
function getCardVariant(status: CompletionStatus): 'default' | 'elevated' | 'highlight' {
  switch (status) {
    case 'completed':
    case 'exceeded':
      return 'elevated'
    case 'partial':
      return 'highlight'
    default:
      return 'default'
  }
}

/**
 * Carte d'habitude pour l'écran Aujourd'hui
 * Affiche l'habitude, sa dose cible et les boutons de check-in
 */
function HabitCard({
  habit,
  targetDose,
  currentValue,
  status,
  onCheckIn,
  anchorHabitName,
  weeklyProgress,
}: HabitCardProps) {
  const [celebrating, setCelebrating] = useState(false)
  const progressionMessage = getProgressionMessage(habit, targetDose)
  const cardVariant = getCardVariant(status)
  const intentionText = buildIntentionText(habit)
  const isWeekly = habit.trackingFrequency === 'weekly'

  // Animation de célébration quand on passe à completed/exceeded
  useEffect(() => {
    if (status === 'completed' || status === 'exceeded') {
      setCelebrating(true)
      const timer = setTimeout(() => setCelebrating(false), 500)
      return () => clearTimeout(timer)
    }
  }, [status])

  const handleCheckIn = (value: number) => {
    onCheckIn(habit.id, value)
  }

  return (
    <Card
      variant={cardVariant}
      className={`habit-card habit-card--${status} ${celebrating ? 'habit-card--celebrating' : ''}`}
    >
      <div className="habit-card__header">
        <div className="habit-card__info">
          <span className="habit-card__emoji" aria-hidden="true">
            {habit.emoji}
          </span>
          <div className="habit-card__text">
            <h3 className="habit-card__name">{habit.name}</h3>
            {habit.description && <p className="habit-card__description">{habit.description}</p>}
          </div>
        </div>
        <div className="habit-card__dose">
          {isWeekly && weeklyProgress ? (
            <>
              <span className="habit-card__dose-value">
                {weeklyProgress.completedDays}/{weeklyProgress.weeklyTarget}
              </span>
              <span className="habit-card__dose-unit">cette semaine</span>
            </>
          ) : (
            <>
              <span className="habit-card__dose-value">{targetDose}</span>
              <span className="habit-card__dose-unit">{habit.unit}</span>
            </>
          )}
        </div>
      </div>

      {/* Implementation Intention et Habit Stacking */}
      {(intentionText || anchorHabitName) && (
        <div className="habit-card__intention">
          {anchorHabitName && (
            <p className="habit-card__anchor">
              <span className="habit-card__anchor-label">{HABIT_STACKING.afterLabel}</span>
              {anchorHabitName}
            </p>
          )}
          {intentionText && <p className="habit-card__when-where">{intentionText}</p>}
        </div>
      )}

      {progressionMessage && <p className="habit-card__progression">{progressionMessage}</p>}

      {/* Affichage du statut pour les habitudes quotidiennes non-weekly */}
      {!isWeekly && currentValue !== undefined && currentValue > 0 && (
        <div className="habit-card__status">
          <span className="habit-card__status-value">
            {currentValue} / {targetDose} {habit.unit}
          </span>
          {status === 'exceeded' && <span className="habit-card__status-badge">Dépassé !</span>}
          {status === 'completed' && <span className="habit-card__status-badge">Complété</span>}
        </div>
      )}

      {/* Boutons de check-in */}
      {isWeekly ? (
        // Les habitudes hebdomadaires utilisent toujours un check-in simple (binaire)
        <SimpleCheckIn targetDose={1} currentValue={currentValue} onCheckIn={handleCheckIn} />
      ) : habit.trackingMode === 'simple' ? (
        <SimpleCheckIn
          targetDose={targetDose}
          currentValue={currentValue}
          onCheckIn={handleCheckIn}
        />
      ) : (
        <CheckInButtons
          targetDose={targetDose}
          unit={habit.unit}
          currentValue={currentValue}
          onCheckIn={handleCheckIn}
          direction={habit.direction}
        />
      )}
    </Card>
  )
}

export default HabitCard
