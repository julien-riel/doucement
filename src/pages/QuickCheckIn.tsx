import { useMemo, useCallback } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAppData } from '../hooks'
import {
  calculateTargetDose,
  getCompletionStatus,
  calculateWeeklyProgress,
} from '../services/progression'
import { isHabitPaused } from '../utils'
import { CompletionStatus } from '../types'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import SimpleCheckIn from '../components/habits/SimpleCheckIn'
import './QuickCheckIn.css'

/**
 * Retourne la date actuelle au format YYYY-MM-DD
 */
function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Page de check-in rapide
 * Interface ultra-minimaliste accessible via le shortcut PWA
 * Affiche uniquement les habitudes du jour avec check-in en un tap
 */
function QuickCheckIn() {
  const navigate = useNavigate()
  const { activeHabits, isLoading, data, getEntriesForDate, addEntry } = useAppData()

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

  // Fermer et retourner à l'accueil
  const handleClose = useCallback(() => {
    navigate('/')
  }, [navigate])

  if (isLoading) {
    return (
      <div className="quick-checkin quick-checkin--loading">
        <p>Chargement...</p>
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
          <h1 className="quick-checkin__title">Check-in rapide</h1>
          <Button variant="ghost" onClick={handleClose} aria-label="Fermer">
            ×
          </Button>
        </header>
        <div className="quick-checkin__empty-state">
          <p>Aucune habitude pour aujourd'hui</p>
          <Button variant="primary" onClick={() => navigate('/create')}>
            Créer une habitude
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="quick-checkin">
      <header className="quick-checkin__header">
        <div className="quick-checkin__header-content">
          <h1 className="quick-checkin__title">Check-in rapide</h1>
          <span className="quick-checkin__progress">
            {completedCount}/{totalCount}
          </span>
        </div>
        <Button
          variant="ghost"
          onClick={handleClose}
          aria-label="Fermer"
          className="quick-checkin__close"
        >
          ×
        </Button>
      </header>

      <main className="quick-checkin__list">
        {habitData.map(({ habit, targetDose, currentValue, status, weeklyProgress }) => {
          const isWeekly = habit.trackingFrequency === 'weekly'
          const isCompleted = status === 'completed' || status === 'exceeded'

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
                <SimpleCheckIn
                  targetDose={isWeekly ? 1 : targetDose}
                  currentValue={currentValue}
                  onCheckIn={(value) => handleCheckIn(habit.id, value)}
                />
              </div>
            </Card>
          )
        })}
      </main>

      {completedCount === totalCount && totalCount > 0 && (
        <footer className="quick-checkin__footer">
          <p className="quick-checkin__success">Toutes les habitudes sont enregistrées !</p>
          <Button variant="success" onClick={handleClose}>
            Fermer
          </Button>
        </footer>
      )}
    </div>
  )
}

export default QuickCheckIn
