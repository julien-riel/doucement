import { useMemo, useState, useCallback, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAppData, useDateWatch, useCelebrations } from '../hooks'
import { ErrorBanner } from '../components/ui'
import {
  DailyHeader,
  EncouragingMessage,
  HabitCard,
  EmptyState,
  WelcomeBackMessage,
} from '../components/habits'
import TimeOfDaySection from '../components/habits/TimeOfDaySection'
import {
  calculateTargetDose,
  calculateDailyCompletionPercentage,
  getCompletionStatus,
  calculateWeeklyProgress,
} from '../services/progression'
import {
  detectGlobalAbsence,
  getNeglectedHabits,
  isHabitPaused,
  groupHabitsByTimeOfDay,
} from '../utils'
import { NEW_DAY_MESSAGES, NEW_DAY_EMOJI, randomMessage } from '../constants/messages'
import { CompletionStatus } from '../types'
import CelebrationModal from '../components/CelebrationModal'
import './Today.css'

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
    addCounterOperation,
    undoLastOperation,
    updatePreferences,
    retryLoad,
    resetData,
    clearError,
  } = useAppData()

  // Hook de célébrations
  const {
    currentMilestone,
    currentHabit,
    isModalOpen,
    checkMilestonesAfterCheckIn,
    showCelebration,
    closeCelebration,
  } = useCelebrations({
    initialMilestones: data.preferences.milestones,
    onMilestonesUpdate: (milestones) => updatePreferences({ milestones }),
  })

  const [welcomeDismissed, setWelcomeDismissed] = useState(false)
  const [newDayToast, setNewDayToast] = useState<string | null>(null)

  // Callback appelé quand la date change (à minuit)
  const handleDateChange = useCallback(() => {
    // Affiche un toast de nouvelle journée
    setNewDayToast(randomMessage(NEW_DAY_MESSAGES))
  }, [])

  // Utilise useDateWatch pour détecter automatiquement le changement de jour à minuit
  // Le composant se re-render automatiquement quand la date change
  const today = useDateWatch(handleDateChange)
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
        operations,
      }
    })
  }, [habitsForToday, todayEntries, today, activeHabits, data.entries])

  // Regrouper les habitudes par moment de la journée
  const habitsByTimeOfDay = useMemo(() => groupHabitsByTimeOfDay(habitData), [habitData])

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

  // Auto-fermer le toast de nouvelle journée après 4 secondes
  useEffect(() => {
    if (newDayToast) {
      const timer = setTimeout(() => {
        setNewDayToast(null)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [newDayToast])

  // Callback pour fermer le message de bienvenue
  const handleDismissWelcome = useCallback(() => {
    setWelcomeDismissed(true)
  }, [])

  // Gérer le check-in d'une habitude
  const handleCheckIn = (habitId: string, value: number) => {
    const habit = habitsForToday.find((h) => h.id === habitId)
    if (!habit) return

    const targetDose = calculateTargetDose(habit, today)

    // Récupérer la valeur précédente pour détecter les nouveaux jalons
    const existingEntry = todayEntries.find((e) => e.habitId === habitId)
    const previousValue = existingEntry?.actualValue ?? 0

    addEntry({
      habitId,
      date: today,
      targetDose,
      actualValue: value,
    })

    // Vérifier si un nouveau jalon a été atteint
    const newMilestone = checkMilestonesAfterCheckIn(habit, previousValue, value)
    if (newMilestone) {
      // Afficher la célébration
      showCelebration(newMilestone, habit)
    }
  }

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

  // Gérer l'annulation de la dernière saisie cumulative
  const handleCumulativeUndo = useCallback(
    (habitId: string) => {
      undoLastOperation(habitId, today)
    },
    [undoLastOperation, today]
  )

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
      {/* Toast de nouvelle journée */}
      {newDayToast && (
        <div className="today__new-day-toast" role="status" aria-live="polite">
          <span className="today__new-day-toast-emoji">{NEW_DAY_EMOJI}</span>
          <span className="today__new-day-toast-text">{newDayToast}</span>
        </div>
      )}

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
        {habitsByTimeOfDay.map((group) => (
          <TimeOfDaySection key={group.timeOfDay ?? 'undefined'} timeOfDay={group.timeOfDay}>
            {group.items.map(
              ({
                habit,
                targetDose,
                currentValue,
                status,
                anchorHabitName,
                weeklyProgress,
                operations,
              }) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  targetDose={targetDose}
                  currentValue={currentValue}
                  status={status}
                  onCheckIn={handleCheckIn}
                  anchorHabitName={anchorHabitName}
                  weeklyProgress={weeklyProgress}
                  operations={operations}
                  onCounterAdd={handleCounterAdd}
                  onCounterSubtract={handleCounterSubtract}
                  onCounterUndo={handleCounterUndo}
                  onCumulativeUndo={handleCumulativeUndo}
                />
              )
            )}
          </TimeOfDaySection>
        ))}
      </section>

      {/* Modale de célébration */}
      {currentMilestone && currentHabit && (
        <CelebrationModal
          isOpen={isModalOpen}
          onClose={closeCelebration}
          milestone={currentMilestone}
          habitName={currentHabit.name}
          habitEmoji={currentHabit.emoji}
        />
      )}
    </div>
  )
}

export default Today
