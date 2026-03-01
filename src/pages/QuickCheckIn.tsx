import { useMemo, useCallback } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppData } from '../hooks'
import {
  calculateTargetDose,
  getCompletionStatus,
  calculateWeeklyProgress,
} from '../services/progression'
import { isHabitPaused, getCurrentDate } from '../utils'
import { CompletionStatus } from '../types'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import SimpleCheckIn from '../components/habits/SimpleCheckIn'
import CheckInButtons from '../components/habits/CheckInButtons'
import CounterButtons from '../components/habits/CounterButtons'
import SliderCheckIn from '../components/habits/SliderCheckIn'
import StopwatchCheckIn from '../components/habits/StopwatchCheckIn'
import TimerCheckIn from '../components/habits/TimerCheckIn'
import CumulativeCheckIn from '../components/habits/CumulativeCheckIn'
import './QuickCheckIn.css'

/**
 * Page de check-in rapide
 * Interface ultra-minimaliste accessible via le shortcut PWA
 * Affiche uniquement les habitudes du jour avec check-in en un tap
 */
function QuickCheckIn() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const {
    activeHabits,
    isLoading,
    data,
    getEntriesForDate,
    addEntry,
    addCounterOperation,
    undoLastOperation,
  } = useAppData()

  const today = getCurrentDate()
  const todayEntries = useMemo(() => getEntriesForDate(today), [getEntriesForDate, today])

  // Filtrer les habitudes actives créées avant aujourd'hui et non en pause
  const habitsForToday = useMemo(
    () => activeHabits.filter((h) => h.createdAt <= today && !isHabitPaused(h, today)),
    [activeHabits, today]
  )

  // Calculer les doses cibles et statuts pour chaque habitude
  const habitData = useMemo(() => {
    return habitsForToday.map((habit) => {
      const targetDose = calculateTargetDose(habit, today)
      const entry = todayEntries.find((e) => e.habitId === habit.id)
      const currentValue = entry?.actualValue
      const operations = entry?.operations

      let status: CompletionStatus = 'pending'
      if (entry) {
        status = getCompletionStatus(entry, habit.direction)
      }

      // Calculer la progression hebdomadaire si l'habitude est weekly
      let weeklyProgress: { completedDays: number; weeklyTarget: number } | undefined
      if (habit.trackingFrequency === 'weekly') {
        const progress = calculateWeeklyProgress(habit, data.entries, today)
        weeklyProgress = {
          completedDays: progress.completedDays,
          weeklyTarget: progress.weeklyTarget,
        }
      }

      return {
        habit,
        targetDose,
        currentValue,
        status,
        weeklyProgress,
        operations,
      }
    })
  }, [habitsForToday, todayEntries, today, data.entries])

  // Compter les habitudes complétées
  const completedCount = habitData.filter(
    (h) => h.status === 'completed' || h.status === 'exceeded'
  ).length
  const totalCount = habitData.length

  // Gérer le check-in d'une habitude
  const handleCheckIn = useCallback(
    (habitId: string, value: number) => {
      const habitInfo = habitData.find((h) => h.habit.id === habitId)
      if (!habitInfo) return

      addEntry({
        habitId,
        date: today,
        targetDose: habitInfo.targetDose,
        actualValue: value,
      })
    },
    [habitData, addEntry, today]
  )

  // Gérer l'ajout d'une opération compteur (+1)
  const handleCounterAdd = useCallback(
    (habitId: string, value?: number) => {
      addCounterOperation(habitId, today, 'add', value)
    },
    [addCounterOperation, today]
  )

  // Gérer la soustraction d'une opération compteur (-1)
  const handleCounterSubtract = useCallback(
    (habitId: string, value?: number) => {
      addCounterOperation(habitId, today, 'subtract', value)
    },
    [addCounterOperation, today]
  )

  // Gérer l'annulation de la dernière opération compteur
  const handleCounterUndo = useCallback(
    (habitId: string) => {
      undoLastOperation(habitId, today)
    },
    [undoLastOperation, today]
  )

  // Fermer et retourner à l'accueil
  const handleClose = useCallback(() => {
    navigate('/')
  }, [navigate])

  if (isLoading) {
    return (
      <div className="quick-checkin quick-checkin--loading">
        <p>{t('common.loading')}</p>
      </div>
    )
  }

  // Redirection vers l'onboarding si pas encore complété
  if (!data.preferences.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />
  }

  // État vide: aucune habitude pour aujourd'hui
  if (habitsForToday.length === 0) {
    return (
      <div className="quick-checkin quick-checkin--empty">
        <header className="quick-checkin__header">
          <h1 className="quick-checkin__title">{t('quickCheckIn.title')}</h1>
          <Button variant="ghost" onClick={handleClose} aria-label={t('common.close')}>
            ×
          </Button>
        </header>
        <div className="quick-checkin__empty-state">
          <p>{t('quickCheckIn.noHabits')}</p>
          <Button variant="primary" onClick={() => navigate('/create')}>
            {t('quickCheckIn.createHabit')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="quick-checkin">
      <header className="quick-checkin__header">
        <div className="quick-checkin__header-content">
          <h1 className="quick-checkin__title">{t('quickCheckIn.title')}</h1>
          <span className="quick-checkin__progress">
            {completedCount}/{totalCount}
          </span>
        </div>
        <Button
          variant="ghost"
          onClick={handleClose}
          aria-label={t('common.close')}
          className="quick-checkin__close"
        >
          ×
        </Button>
      </header>

      <main className="quick-checkin__list">
        {habitData.map(
          ({ habit, targetDose, currentValue, status, weeklyProgress, operations }) => {
            const isWeekly = habit.trackingFrequency === 'weekly'
            const isCompleted = status === 'completed' || status === 'exceeded'

            // Convertir en secondes pour stopwatch/timer si l'unité est en minutes
            const isTimeBasedMinutes =
              (habit.trackingMode === 'stopwatch' || habit.trackingMode === 'timer') &&
              (habit.unit === 'minutes' || habit.unit === 'min')
            const timerTargetDoseInSeconds = isTimeBasedMinutes ? targetDose * 60 : targetDose

            return (
              <Card
                key={habit.id}
                variant={isCompleted ? 'elevated' : 'default'}
                className={`quick-checkin__card quick-checkin__card--${status}`}
              >
                <div className="quick-checkin__card-header">
                  <div className="quick-checkin__card-info">
                    <span className="quick-checkin__emoji" aria-hidden="true">
                      {habit.emoji}
                    </span>
                    <span className="quick-checkin__name">{habit.name}</span>
                  </div>
                  <div className="quick-checkin__dose">
                    {isWeekly && weeklyProgress ? (
                      <span>
                        {weeklyProgress.completedDays}/{weeklyProgress.weeklyTarget}
                      </span>
                    ) : (
                      <span>
                        {targetDose} {habit.unit}
                      </span>
                    )}
                  </div>
                </div>
                <div className="quick-checkin__actions">
                  {isWeekly ? (
                    <SimpleCheckIn
                      targetDose={1}
                      currentValue={currentValue}
                      onCheckIn={(value) => handleCheckIn(habit.id, value)}
                    />
                  ) : habit.trackingMode === 'stopwatch' ? (
                    <StopwatchCheckIn
                      habitId={habit.id}
                      date={today}
                      targetDose={timerTargetDoseInSeconds}
                      unit={
                        habit.unit === 'minutes' || habit.unit === 'min' ? 'minutes' : 'seconds'
                      }
                      currentValue={currentValue}
                      onCheckIn={(value) => handleCheckIn(habit.id, value)}
                      notifyOnTarget={habit.notifyOnTarget}
                    />
                  ) : habit.trackingMode === 'timer' ? (
                    <TimerCheckIn
                      habitId={habit.id}
                      date={today}
                      targetDose={timerTargetDoseInSeconds}
                      unit={
                        habit.unit === 'minutes' || habit.unit === 'min' ? 'minutes' : 'seconds'
                      }
                      currentValue={currentValue}
                      onCheckIn={(value) => handleCheckIn(habit.id, value)}
                      notifyOnTarget={habit.notifyOnTarget}
                    />
                  ) : habit.trackingMode === 'slider' ? (
                    <SliderCheckIn
                      config={habit.sliderConfig}
                      currentValue={currentValue}
                      onCheckIn={(value) => handleCheckIn(habit.id, value)}
                    />
                  ) : habit.trackingMode === 'counter' ? (
                    <CounterButtons
                      targetDose={targetDose}
                      unit={habit.unit}
                      currentValue={currentValue}
                      operations={operations}
                      onAdd={(value) => handleCounterAdd(habit.id, value)}
                      onSubtract={(value) => handleCounterSubtract(habit.id, value)}
                      onUndo={() => handleCounterUndo(habit.id)}
                      direction={habit.direction}
                    />
                  ) : habit.entryMode === 'cumulative' ? (
                    <CumulativeCheckIn
                      targetDose={targetDose}
                      unit={habit.unit}
                      onAdd={(value) => handleCheckIn(habit.id, value)}
                    />
                  ) : habit.trackingMode === 'simple' ? (
                    <SimpleCheckIn
                      targetDose={targetDose}
                      currentValue={currentValue}
                      onCheckIn={(value) => handleCheckIn(habit.id, value)}
                    />
                  ) : (
                    <CheckInButtons
                      targetDose={targetDose}
                      unit={habit.unit}
                      currentValue={currentValue}
                      onCheckIn={(value) => handleCheckIn(habit.id, value)}
                      direction={habit.direction}
                    />
                  )}
                </div>
              </Card>
            )
          }
        )}
      </main>

      {completedCount === totalCount && totalCount > 0 && (
        <footer className="quick-checkin__footer">
          <p className="quick-checkin__success">{t('quickCheckIn.allDone')}</p>
          <Button variant="success" onClick={handleClose}>
            {t('common.close')}
          </Button>
        </footer>
      )}
    </div>
  )
}

export default QuickCheckIn
