import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Habit, CompletionStatus, CounterOperation } from '../../types'
import { randomMessage } from '../../constants/messages'
import { buildIntentionText, WeeklyProgressInfo } from '../../utils/habitDisplay'
import Card from '../ui/Card'
import CheckInButtons from './CheckInButtons'
import CounterButtons from './CounterButtons'
import SimpleCheckIn from './SimpleCheckIn'
import CumulativeHistory from './CumulativeHistory'
import CumulativeCheckIn from './CumulativeCheckIn'
import StopwatchCheckIn from './StopwatchCheckIn'
import TimerCheckIn from './TimerCheckIn'
import SliderCheckIn from './SliderCheckIn'
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
  /** Opérations compteur pour cette journée (si trackingMode='counter') */
  operations?: CounterOperation[]
  /** Callback pour ajouter une opération compteur */
  onCounterAdd?: (habitId: string, value?: number) => void
  /** Callback pour soustraire une opération compteur */
  onCounterSubtract?: (habitId: string, value?: number) => void
  /** Callback pour annuler la dernière opération compteur */
  onCounterUndo?: (habitId: string) => void
  /** Callback pour annuler la dernière saisie cumulative */
  onCumulativeUndo?: (habitId: string) => void
  /** Date courante (format YYYY-MM-DD) - requis pour stopwatch/timer */
  date?: string
}

/**
 * Messages de progression selon la direction de l'habitude
 */
function getProgressionMessage(
  habit: Habit,
  targetDose: number,
  t: (key: string, options?: Record<string, unknown>) => string
): string | null {
  if (habit.direction === 'maintain') {
    return null
  }

  const diff = Math.abs(targetDose - habit.startValue)
  if (diff === 0) {
    return null
  }

  if (habit.direction === 'increase') {
    return t('habitCard.progressionIncrease', { startValue: habit.startValue, diff })
  }
  return t('habitCard.progressionDecrease', { diff })
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
 * Génère les classes CSS pour le feedback visuel
 * Pour les habitudes decrease, le feedback est inversé: moins = mieux
 */
function getHabitCardClasses(
  status: CompletionStatus,
  direction: Habit['direction'],
  celebrating: boolean
): string {
  const baseClasses = ['habit-card', `habit-card--${status}`]

  // Pour les habitudes decrease avec statut exceeded/completed,
  // on ajoute une classe pour inverser le feedback visuel
  if (direction === 'decrease' && (status === 'exceeded' || status === 'completed')) {
    baseClasses.push('habit-card--decrease-success')
  }

  if (celebrating) {
    baseClasses.push('habit-card--celebrating')
  }

  return baseClasses.join(' ')
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
  operations,
  onCounterAdd,
  onCounterSubtract,
  onCounterUndo,
  onCumulativeUndo,
  date,
}: HabitCardProps) {
  const { t } = useTranslation()
  const [celebrating, setCelebrating] = useState(false)
  const progressionMessage = getProgressionMessage(habit, targetDose, t)
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

  const cardClasses = getHabitCardClasses(status, habit.direction, celebrating)

  return (
    <Card variant={cardVariant} className={cardClasses}>
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
              <span className="habit-card__dose-unit">{t('habits.thisWeek')}</span>
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
              <span className="habit-card__anchor-label">{t('habitStacking.afterLabel')}</span>
              {anchorHabitName}
            </p>
          )}
          {intentionText && <p className="habit-card__when-where">{intentionText}</p>}
        </div>
      )}

      {progressionMessage && <p className="habit-card__progression">{progressionMessage}</p>}

      {/* Affichage du statut pour les habitudes quotidiennes non-weekly */}
      {!isWeekly && currentValue !== undefined && currentValue > 0 && (
        <div
          className={`habit-card__status ${habit.direction === 'decrease' && status === 'exceeded' ? 'habit-card__status--decrease-success' : ''}`}
        >
          <span className="habit-card__status-value">
            {currentValue} / {targetDose} {habit.unit}
            {habit.entryMode === 'cumulative' && (
              <span className="habit-card__cumulative-indicator"> {t('checkIn.cumulative')}</span>
            )}
          </span>
          {/* Pour les habitudes decrease: exceeded = on a fait MOINS que la cible = victoire */}
          {status === 'exceeded' && habit.direction === 'decrease' && (
            <span className="habit-card__status-badge habit-card__status-badge--decrease-success">
              {t('decreaseMessages.successBadge')}
            </span>
          )}
          {/* Pour les habitudes increase: exceeded = on a fait PLUS que la cible */}
          {status === 'exceeded' && habit.direction !== 'decrease' && (
            <span className="habit-card__status-badge">{t('checkIn.exceeded')}</span>
          )}
          {status === 'completed' && (
            <span className="habit-card__status-badge">{t('checkIn.completed')}</span>
          )}
        </div>
      )}

      {/* Message spécial pour les habitudes decrease avec valeur = 0 (grande victoire !) */}
      {!isWeekly &&
        habit.direction === 'decrease' &&
        currentValue !== undefined &&
        currentValue === 0 && (
          <div className="habit-card__status habit-card__status--zero-victory">
            <span className="habit-card__status-value habit-card__status-value--zero">
              {randomMessage(t('decreaseMessages.zero', { returnObjects: true }) as string[])}
            </span>
            <span className="habit-card__status-badge habit-card__status-badge--zero">
              {t('decreaseMessages.zeroBadge')}
            </span>
          </div>
        )}

      {/* Historique des saisies cumulatives avec bouton d'annulation */}
      {!isWeekly &&
        habit.entryMode === 'cumulative' &&
        operations &&
        operations.length > 0 &&
        onCumulativeUndo && (
          <CumulativeHistory
            operations={operations}
            unit={habit.unit}
            onUndo={() => onCumulativeUndo(habit.id)}
          />
        )}

      {/* Boutons de check-in */}
      {isWeekly ? (
        // Les habitudes hebdomadaires utilisent toujours un check-in simple (binaire)
        <SimpleCheckIn targetDose={1} currentValue={currentValue} onCheckIn={handleCheckIn} />
      ) : habit.trackingMode === 'stopwatch' && date ? (
        // Mode chronomètre
        <StopwatchCheckIn
          habitId={habit.id}
          date={date}
          targetDose={targetDose}
          unit={habit.unit === 'minutes' || habit.unit === 'min' ? 'minutes' : 'seconds'}
          currentValue={currentValue}
          onCheckIn={handleCheckIn}
          notifyOnTarget={habit.notifyOnTarget}
        />
      ) : habit.trackingMode === 'timer' && date ? (
        // Mode minuterie (compte à rebours)
        <TimerCheckIn
          habitId={habit.id}
          date={date}
          targetDose={targetDose}
          unit={habit.unit === 'minutes' || habit.unit === 'min' ? 'minutes' : 'seconds'}
          currentValue={currentValue}
          onCheckIn={handleCheckIn}
          notifyOnTarget={habit.notifyOnTarget}
        />
      ) : habit.trackingMode === 'slider' ? (
        // Mode slider avec emoji dynamique
        <SliderCheckIn
          config={habit.sliderConfig}
          currentValue={currentValue}
          onCheckIn={handleCheckIn}
        />
      ) : habit.trackingMode === 'counter' && onCounterAdd && onCounterSubtract && onCounterUndo ? (
        // Mode compteur avec boutons +1/-1
        <CounterButtons
          targetDose={targetDose}
          unit={habit.unit}
          currentValue={currentValue}
          operations={operations}
          onAdd={(value) => onCounterAdd(habit.id, value)}
          onSubtract={(value) => onCounterSubtract(habit.id, value)}
          onUndo={() => onCounterUndo(habit.id)}
          direction={habit.direction}
        />
      ) : habit.entryMode === 'cumulative' ? (
        // Mode cumulative avec champ de saisie et bouton Ajouter
        <CumulativeCheckIn targetDose={targetDose} unit={habit.unit} onAdd={handleCheckIn} />
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
