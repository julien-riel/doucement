import { useMemo, useState, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { useAppData } from '../hooks'
import { ErrorBanner } from '../components/ui'
import {
  DailyHeader,
  EncouragingMessage,
  HabitCard,
  EmptyState,
  WelcomeBackMessage,
} from '../components/habits'
import {
  calculateTargetDose,
  calculateDailyCompletionPercentage,
  getCompletionStatus,
  calculateWeeklyProgress,
} from '../services/progression'
import { detectGlobalAbsence, getNeglectedHabits, buildHabitChains, isHabitPaused } from '../utils'
import { CompletionStatus } from '../types'
import './Today.css'

/**
 * Retourne la date actuelle au format YYYY-MM-DD
 */
function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Écran Aujourd'hui
 * Vue principale avec les doses du jour
 */
function Today() {
  const {
    activeHabits,
    isLoading,
    error,
    data,
    getEntriesForDate,
    addEntry,
    retryLoad,
    resetData,
    clearError,
  } = useAppData()

  const [welcomeDismissed, setWelcomeDismissed] = useState(false)
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

      // Créer un pseudo-entry pour calculer le statut
      let status: CompletionStatus = 'pending'
      if (entry) {
        status = getCompletionStatus(entry, habit.direction)
      }

      // Récupérer le nom de l'habitude d'ancrage si habit stacking
      const anchorHabitName = habit.anchorHabitId
        ? activeHabits.find((h) => h.id === habit.anchorHabitId)?.name
        : undefined

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
        anchorHabitName,
        weeklyProgress,
      }
    })
  }, [habitsForToday, todayEntries, today, activeHabits, data.entries])

  // Organiser les habitudes en chaînes (habit stacking)
  const habitChains = useMemo(
    () => buildHabitChains(habitData, habitsForToday),
    [habitData, habitsForToday]
  )

  // Calculer le pourcentage global de complétion
  const completionPercentage = useMemo(
    () => calculateDailyCompletionPercentage(todayEntries, habitsForToday, today),
    [todayEntries, habitsForToday, today]
  )

  // Détecter l'absence
  const absenceInfo = useMemo(() => detectGlobalAbsence(data.entries), [data.entries])

  // Obtenir les habitudes négligées
  const neglectedHabits = useMemo(
    () => getNeglectedHabits(activeHabits, data.entries),
    [activeHabits, data.entries]
  )

  // Détermine si on doit afficher le message de bienvenue
  const showWelcomeMessage = !welcomeDismissed && absenceInfo.isAbsent && habitsForToday.length > 0

  // Callback pour fermer le message de bienvenue
  const handleDismissWelcome = useCallback(() => {
    setWelcomeDismissed(true)
  }, [])

  // Gérer le check-in d'une habitude
  const handleCheckIn = (habitId: string, value: number) => {
    const habit = habitsForToday.find((h) => h.id === habitId)
    if (!habit) return

    const targetDose = calculateTargetDose(habit, today)

    addEntry({
      habitId,
      date: today,
      targetDose,
      actualValue: value,
    })
  }

  if (isLoading) {
    return (
      <div className="page page-today page-today--loading">
        <p>Chargement...</p>
      </div>
    )
  }

  // Redirection vers l'onboarding si pas encore complété
  if (!data.preferences.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />
  }

  // Affichage d'erreur avec options de récupération
  if (error) {
    return (
      <div className="page page-today page-today--error">
        <ErrorBanner error={error} onRetry={retryLoad} onReset={resetData} onDismiss={clearError} />
      </div>
    )
  }

  // État vide: aucune habitude créée
  if (habitsForToday.length === 0) {
    return (
      <div className="page page-today page-today--empty">
        <EmptyState variant="today" />
      </div>
    )
  }

  return (
    <div className="page page-today">
      <DailyHeader date={today} completionPercentage={completionPercentage} />

      {/* Message de bienvenue après une absence */}
      {showWelcomeMessage ? (
        <WelcomeBackMessage
          daysSinceLastActivity={absenceInfo.daysSinceLastEntry}
          neglectedHabits={neglectedHabits}
          onDismiss={handleDismissWelcome}
        />
      ) : (
        <EncouragingMessage />
      )}

      <section className="today__habits" aria-label="Tes doses du jour">
        <h3 className="today__section-title">Tes doses du jour</h3>
        {habitChains.map((chain) => (
          <div
            key={chain[0].habit.id}
            className={`today__habit-chain ${chain.length > 1 ? 'today__habit-chain--connected' : ''}`}
          >
            {chain.map(
              (
                { habit, targetDose, currentValue, status, anchorHabitName, weeklyProgress },
                idx
              ) => (
                <div
                  key={habit.id}
                  className={`today__habit-wrapper ${idx > 0 ? 'today__habit-wrapper--chained' : ''}`}
                >
                  <HabitCard
                    habit={habit}
                    targetDose={targetDose}
                    currentValue={currentValue}
                    status={status}
                    onCheckIn={handleCheckIn}
                    anchorHabitName={anchorHabitName}
                    weeklyProgress={weeklyProgress}
                  />
                </div>
              )
            )}
          </div>
        ))}
      </section>
    </div>
  )
}

export default Today
