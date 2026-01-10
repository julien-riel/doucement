import { useMemo } from 'react'
import { useAppData } from '../hooks'
import { ErrorBanner } from '../components/ui'
import {
  DailyHeader,
  EncouragingMessage,
  HabitCard,
  EmptyState,
} from '../components/habits'
import {
  calculateTargetDose,
  calculateDailyCompletionPercentage,
  getCompletionStatus,
} from '../services/progression'
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
    getEntriesForDate,
    addEntry,
    retryLoad,
    resetData,
    clearError,
  } = useAppData()

  const today = getCurrentDate()
  const todayEntries = useMemo(
    () => getEntriesForDate(today),
    [getEntriesForDate, today]
  )

  // Filtrer les habitudes actives créées avant aujourd'hui
  const habitsForToday = useMemo(
    () => activeHabits.filter((h) => h.createdAt <= today),
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

      return {
        habit,
        targetDose,
        currentValue,
        status,
      }
    })
  }, [habitsForToday, todayEntries, today])

  // Calculer le pourcentage global de complétion
  const completionPercentage = useMemo(
    () => calculateDailyCompletionPercentage(todayEntries, habitsForToday, today),
    [todayEntries, habitsForToday, today]
  )

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

  // Affichage d'erreur avec options de récupération
  if (error) {
    return (
      <div className="page page-today page-today--error">
        <ErrorBanner
          error={error}
          onRetry={retryLoad}
          onReset={resetData}
          onDismiss={clearError}
        />
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
      <EncouragingMessage />

      <section className="today__habits" aria-label="Tes doses du jour">
        <h3 className="today__section-title">Tes doses du jour</h3>
        {habitData.map(({ habit, targetDose, currentValue, status }) => (
          <HabitCard
            key={habit.id}
            habit={habit}
            targetDose={targetDose}
            currentValue={currentValue}
            status={status}
            onCheckIn={handleCheckIn}
          />
        ))}
      </section>
    </div>
  )
}

export default Today
